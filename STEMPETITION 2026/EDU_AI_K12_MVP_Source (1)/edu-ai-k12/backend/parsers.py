"""Safely extract supported educational files; no untrusted macro execution."""
from io import BytesIO
from zipfile import ZipFile, BadZipFile
from pathlib import Path
from PIL import Image, UnidentifiedImageError
from fastapi import HTTPException
from .config import MAX_UPLOAD_BYTES

SUPPORTED = {
 '.txt': 'text/plain', '.csv': 'text/csv',
 '.pdf': 'application/pdf',
 '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
 '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
 '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
 '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
}
IMAGE_TYPES = {'image/png','image/jpeg','image/webp'}
MAX_TEXT_CHARS = 45_000

def extract(filename: str, content: bytes):
    suffix = Path(filename).suffix.lower()
    if suffix not in SUPPORTED:
        raise HTTPException(415, 'Định dạng chưa hỗ trợ. Dùng PDF, DOCX, PPTX, XLSX, TXT, CSV hoặc ảnh JPG/PNG/WEBP.')
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(413, 'Tệp vượt quá giới hạn 8 MB.')
    if not content:
        raise HTTPException(400, 'Tệp rỗng.')
    mime = SUPPORTED[suffix]
    try:
        if mime in IMAGE_TYPES:
            with Image.open(BytesIO(content)) as im:
                im.verify()
            return mime, None
        if suffix == '.pdf':
            if not content.startswith(b'%PDF-'):
                raise ValueError('Chữ ký PDF không hợp lệ')
            from pypdf import PdfReader
            reader = PdfReader(BytesIO(content), strict=False)
            if len(reader.pages) > 80:
                raise ValueError('Tài liệu vượt quá 80 trang')
            pages = [(page.extract_text() or '') for page in reader.pages]
            text = '\n\n'.join(f'[Trang {n+1}]\n{p}' for n,p in enumerate(pages))
        elif suffix in {'.txt','.csv'}:
            text = content.decode('utf-8-sig')
        else:
            with ZipFile(BytesIO(content)) as z:
                infos = z.infolist()
                if len(infos) > 1000 or sum(i.file_size for i in infos) > 35*1024*1024:
                    raise ValueError('Tệp nén Office quá lớn sau giải nén')
                if not any(i.filename == '[Content_Types].xml' for i in infos):
                    raise ValueError('Tệp Office không đúng cấu trúc')
            if suffix == '.docx':
                from docx import Document
                doc = Document(BytesIO(content))
                text = '\n'.join([p.text for p in doc.paragraphs] +
                                 [' | '.join(c.text for c in row.cells) for table in doc.tables for row in table.rows])
            elif suffix == '.pptx':
                from pptx import Presentation
                prs = Presentation(BytesIO(content))
                text = '\n'.join(f'[Slide {i+1}] '+ '\n'.join(shape.text for shape in slide.shapes if shape.has_text_frame)
                                 for i,slide in enumerate(prs.slides))
            else:
                from openpyxl import load_workbook
                wb = load_workbook(BytesIO(content), data_only=True, read_only=True)
                lines = []
                for sheet in wb.worksheets[:12]:
                    lines.append(f'[Trang tính {sheet.title}]')
                    for row in sheet.iter_rows(max_row=300, max_col=30, values_only=True):
                        lines.append(' | '.join('' if x is None else str(x)[:200] for x in row))
                wb.close()
                text = '\n'.join(lines)
    except (ValueError, BadZipFile, UnidentifiedImageError, UnicodeDecodeError, OSError, IndexError) as ex:
        raise HTTPException(422, f'Không thể đọc tệp: {str(ex)[:160]}')
    except Exception as ex:
        # Third-party file readers can have their own exception classes.
        raise HTTPException(422, f'Tệp có cấu trúc không hợp lệ hoặc bị hỏng ({type(ex).__name__}).')
    if not text.strip():
        if suffix == '.pdf':
            # A scanned PDF can be passed as native PDF to Gemini Vision.
            return mime, None
        raise HTTPException(422, 'Không tìm thấy văn bản có thể đọc. Hãy tải tệp có nội dung rõ ràng.')
    return mime, text[:MAX_TEXT_CHARS]
