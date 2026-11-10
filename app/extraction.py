"""Document extraction with an OCR fallback for scanned PDFs."""
from dataclasses import dataclass
from io import BytesIO
import fitz
from docx import Document as DocxDocument

@dataclass
class ExtractedPage:
    text:str
    page:int|None

def extract_document(data:bytes,file_type:str)->list[ExtractedPage]:
    if file_type=='txt': return [ExtractedPage(data.decode('utf-8'),None)]
    if file_type=='docx': return [ExtractedPage('\n'.join(p.text for p in DocxDocument(BytesIO(data)).paragraphs),None)]
    if file_type!='pdf': raise ValueError('Unsupported document type')
    pdf=fitz.open(stream=data,filetype='pdf'); pages=[]
    for index,page in enumerate(pdf):
        text=page.get_text().strip()
        if not text:
            try:
                import pytesseract
                from PIL import Image
                pix=page.get_pixmap(matrix=fitz.Matrix(2,2),alpha=False)
                text=pytesseract.image_to_string(Image.open(BytesIO(pix.tobytes('png')))).strip()
            except ImportError as error:
                raise ValueError('Scanned PDF requires the configured OCR dependency') from error
        pages.append(ExtractedPage(text,index+1))
    return pages
