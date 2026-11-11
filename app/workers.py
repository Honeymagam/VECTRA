"""Worker entry points; invoke process_document from a Celery task in deployments with Redis enabled."""
from .database import SessionLocal
from .models.core import Document
from .services import process_document
from .extraction import extract_document
def process_document_job(document_id:int,data:bytes,file_type:str):
    db=SessionLocal()
    try:
        doc=db.get(Document,document_id)
        if not doc: raise ValueError('Document not found')
        process_document(db,doc,extract_document(data,file_type))
    finally: db.close()
