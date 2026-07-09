"""
Health report scanning routes — accepts an uploaded report image and
returns parsed, flagged values with a clear non-diagnostic disclaimer.
"""

import shutil
import tempfile
import os

from fastapi import APIRouter, UploadFile, File
from services.report_parser import extract_text_from_image, parse_report_text

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".docx"}


@router.post("/scan")
async def scan_report(file: UploadFile = File(...)):
    """
    Accepts a PDF, PNG, JPEG, or DOCX health report upload, OCRs it
    (for image types), and returns structured, flagged values.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return {
            "error": f"Unsupported file type '{ext}'. Allowed: "
                     f"{', '.join(sorted(ALLOWED_EXTENSIONS))}"
        }

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        if ext in {".png", ".jpg", ".jpeg"}:
            raw_text = extract_text_from_image(tmp_path)
        elif ext == ".pdf":
            # PDF handling: convert pages to images first, then OCR each.
            # (pdf2image + poppler required — see docs/SETUP.md)
            from pdf2image import convert_from_path
            pages = convert_from_path(tmp_path)
            raw_text = ""
            for page in pages:
                page_path = tmp_path + "_page.png"
                page.save(page_path)
                raw_text += extract_text_from_image(page_path) + "\n"
                os.remove(page_path)
        else:
            return {"error": "DOCX parsing not yet implemented in this starter version."}

        result = parse_report_text(raw_text)
        return result

    finally:
        os.remove(tmp_path)
