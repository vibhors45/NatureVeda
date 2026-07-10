"""
Symptom checker routes -- exposes the free-text symptom matcher as an API.
Enriched with full plant details (preparation, dosage, safety) so results
show actionable guidance, not just a plant/therapy name.
"""

from pathlib import Path

import pandas as pd
from fastapi import APIRouter
from pydantic import BaseModel

from services.symptom_matcher import SymptomMatcher

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SYMPTOM_CSV = BASE_DIR / "ml" / "datasets" / "symptoms" / "symptom_remedy_pairs.csv"
PLANTS_CSV = BASE_DIR / "ml" / "datasets" / "plants" / "metadata" / "plants.csv"

matcher = SymptomMatcher(str(SYMPTOM_CSV))


class SymptomQuery(BaseModel):
    text: str


def _enrich_with_plant_details(matches):
    """Attach full plant info (preparation, dosage, safety) to each match."""
    if not matches:
        return matches
    plants_df = pd.read_csv(PLANTS_CSV)
    for match in matches:
        plant_name = match.get("recommended_plant", "")
        info = plants_df[plants_df["name"].str.lower() == str(plant_name).lower()]
        match["plant_details"] = info.iloc[0].to_dict() if not info.empty else None
    return matches


@router.post("/check")
def check_symptom(query: SymptomQuery):
    """
    Accepts free-text symptom input (English, Hindi, or Hinglish) and
    returns the closest matching traditional remedies -- including full
    plant preparation/dosage/safety details -- or an emergency flag.
    """
    result = matcher.match(query.text)

    if not result.get("emergency") and result.get("matches"):
        result["matches"] = _enrich_with_plant_details(result["matches"])

    return result
