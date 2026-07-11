"""
Health report scanning routes -- accepts an uploaded report image and
returns parsed, flagged values with a clear non-diagnostic disclaimer,
plus relevant Ayurvedic plant AND homeopathic remedy suggestions for any
flagged (high/low) values.
"""

import shutil
import tempfile
import os
from pathlib import Path

import pandas as pd
from fastapi import APIRouter, UploadFile, File
from services.report_parser import extract_text_from_image, parse_report_text

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PLANTS_CSV = BASE_DIR / "ml" / "datasets" / "plants" / "metadata" / "plants.csv"
HOMEOPATHY_CSV = BASE_DIR / "ml" / "datasets" / "homeopathy" / "homeopathy_remedies.csv"

ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg", ".docx"}

TEST_KEYWORD_MAP = {
    "cholesterol": "cholesterol",
    "ldl": "cholesterol",
    "hdl": "heart",
    "triglyceride": "metabolism",
    "glucose": "blood sugar",
    "sugar": "blood sugar",
    "hba1c": "blood sugar",
    "tsh": "energy",
    "thyroid": "energy",
    "hemoglobin": "immunity",
    "wbc": "immunity",
    "vitamin d": "immunity",
    "vitamin b12": "energy",
}

HOMEOPATHY_KEYWORD_MAP = {
    "cholesterol": "heart",
    "ldl": "heart",
    "hdl": "heart",
    "triglyceride": "digestion",
    "glucose": "fatigue",
    "sugar": "fatigue",
    "hba1c": "fatigue",
    "tsh": "fatigue",
    "thyroid": "fatigue",
    "hemoglobin": "weakness",
    "wbc": "fever",
    "vitamin d": "weakness",
    "vitamin b12": "fatigue",
}


def _suggest_plants_for_row(test_name: str, plants_df: pd.DataFrame):
    test_lower = test_name.lower()
    search_term = None
    for keyword, term in TEST_KEYWORD_MAP.items():
        if keyword in test_lower:
            search_term = term
            break

    if not search_term:
        return []

    matches = plants_df[
        plants_df["key_benefits"].str.lower().str.contains(search_term, na=False)
    ]
    return matches.head(2)[["name", "key_benefits", "preparation", "dosage"]].to_dict(
        orient="records"
    )


def _suggest_homeopathy_for_row(test_name: str, homeopathy_df: pd.DataFrame):
    test_lower = test_name.lower()
    search_term = None
    for keyword, term in HOMEOPATHY_KEYWORD_MAP.items():
        if keyword in test_lower:
            search_term = term
            break

    if not search_term:
        return []

    matches = homeopathy_df[
        homeopathy_df["key_symptoms_indicated"]
        .str.lower()
        .str.contains(search_term, na=False)
    ]
    return matches.head(2)[
        ["remedy_name", "key_symptoms_indicated", "potency_common", "usage_notes"]
    ].to_dict(orient="records")


@router.post("/scan")
async def scan_report(file: UploadFile = File(...)):
    """
    Accepts a PDF, PNG, JPEG, or DOCX health report upload, OCRs it via a
    hosted OCR API, and returns structured, flagged values along with
    relevant Ayurvedic plant and homeopathic remedy suggestions for any
    out-of-range results.
    """
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        return {
            "error": f"Unsupported file type '{ext}'. Allowed: "
                     f"{', '.join(sorted(ALLOWED_EXTENSIONS))}"
        }

    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        if ext in {".png", ".jpg", ".jpeg", ".pdf"}:
            raw_text = extract_text_from_image(tmp_path)
        else:
            return {"error": "DOCX parsing not yet implemented in this starter version."}

        result = parse_report_text(raw_text)

        if result.get("parsed_rows"):
            plants_df = pd.read_csv(PLANTS_CSV)
            homeopathy_df = pd.read_csv(HOMEOPATHY_CSV)
            for row in result["parsed_rows"]:
                if row["flag"] in ("high", "low"):
                    row["suggested_plants"] = _suggest_plants_for_row(
                        row["test_name"], plants_df
                    )
                    row["suggested_homeopathy"] = _suggest_homeopathy_for_row(
                        row["test_name"], homeopathy_df
                    )
                else:
                    row["suggested_plants"] = []
                    row["suggested_homeopathy"] = []

        return result

    except Exception as e:
        short_error = f"{type(e).__name__}: {str(e)[:200]}"
        print("REPORT SCAN ERROR:", short_error)
        return {
            "error": "scan_failed",
            "message": f"Couldn't process this report: {short_error}",
        }

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)
