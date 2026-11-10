"""Background document indexing jobs."""
import csv
import io
import logging
from pathlib import Path

from celery import Celery
from sqlalchemy import delete, select

from .config import get_settings
from .database import SessionLocal
from .models.core import Concept, Document, DocumentChunk, DocumentStatus
from .services import chunks, embedder, process_document

settings = get_settings()
celery_app = Celery("vectra", broker=settings.redis_url, backend=settings.redis_url)
celery_app.conf.update(
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    task_track_started=True,
    broker_connection_retry_on_startup=True,
)
log = logging.getLogger("vectra.ingestion")


class ChunkWriter:
    def __init__(self, db, document_id: int, concepts: list[str], size: int = 900, overlap: int = 120):
        self.db = db
        self.document_id = document_id
        self.concepts = concepts
        self.size = size
        self.step = size - overlap
        self.words: list[str] = []
        self.index = 0
        self.batch_size = 0

    def feed(self, text: str) -> None:
        self.words.extend(text.split())
        while len(self.words) >= self.size:
            self._emit(self.words[:self.size])
            del self.words[:self.step]

    def _emit(self, words: list[str]) -> None:
        content = " ".join(words)
        topic = next((name for name in self.concepts if name.casefold() in content.casefold()), None)
        self.db.add(DocumentChunk(
            document_id=self.document_id,
            chunk_text=content,
            topic=topic,
            chunk_index=self.index,
            embedding=embedder.embed(content),
            metadata_json={},
        ))
        self.index += 1
        self.batch_size += 1
        if self.batch_size >= 250:
            self.db.commit()
            self.batch_size = 0

    def finish(self) -> int:
        if self.words:
            self._emit(self.words)
            self.words.clear()
        self.db.commit()
        return self.index


def _index_csv(db, document: Document, path: Path) -> int:
    concepts = list(db.scalars(select(Concept.name)).all())
    writer = ChunkWriter(db, document.id, concepts)
    with path.open("r", encoding="utf-8-sig", newline="") as source:
        sample = source.read(8192)
        source.seek(0)
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
        except csv.Error:
            dialect = csv.excel
        reader = csv.reader(source, dialect)
        headers = next(reader, None)
        if not headers or not any(cell.strip() for cell in headers):
            raise ValueError("CSV file must contain a header row.")
        names = [cell.strip() or f"Column {index + 1}" for index, cell in enumerate(headers)]
        writer.feed("Columns: " + "; ".join(names))
        row_count = 0
        for row_number, row in enumerate(reader, 1):
            values = [f"{names[index]}: {value.strip()}" for index, value in enumerate(row) if index < len(names) and value.strip()]
            if values:
                writer.feed(f"Row {row_number}: " + "; ".join(values))
                row_count += 1
        if row_count == 0:
            raise ValueError("CSV file does not contain any data rows.")
    return writer.finish()


@celery_app.task(name="vectra.process_document", acks_late=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 2})
def process_document_task(document_id: int) -> None:
    db = SessionLocal()
    try:
        document = db.get(Document, document_id)
        if document is None or document.status == DocumentStatus.COMPLETED:
            return
        path = settings.upload_dir / f"{document.id}.{document.file_type}"
        if not path.is_file():
            raise FileNotFoundError("Stored upload was not found.")

        # A retry starts cleanly after any earlier batch commits.
        db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document.id))
        document.status = DocumentStatus.PROCESSING
        document.extracted_text = None
        db.commit()

        if document.file_type == "csv":
            _index_csv(db, document, path)
        else:
            content = path.read_bytes()
            if document.file_type == "pdf":
                import fitz
                pdf = fitz.open(stream=content, filetype="pdf")
                if pdf.needs_pass:
                    raise ValueError("PDF is password-protected.")
                text = "\n".join(page.get_text() for page in pdf)
                if not text.strip():
                    raise ValueError("PDF contains no selectable text.")
            elif document.file_type == "docx":
                from docx import Document as DocxDocument
                text = "\n".join(paragraph.text for paragraph in DocxDocument(io.BytesIO(content)).paragraphs)
            else:
                text = content.decode("utf-8")
            process_document(db, document, text)

        document.status = DocumentStatus.COMPLETED
        db.commit()
    except Exception as error:
        db.rollback()
        document = db.get(Document, document_id)
        if document is not None:
            db.execute(delete(DocumentChunk).where(DocumentChunk.document_id == document.id))
            document.status = DocumentStatus.FAILED
            db.commit()
        log.exception("Document indexing failed for document %s (%s)", document_id, type(error).__name__)
        raise
    finally:
        db.close()
