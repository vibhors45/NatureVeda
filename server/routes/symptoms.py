"""
Symptom checker routes -- exposes the free-text symptom matcher as an API.
Enriched with full plant details (preparation, dosage, safety) so results
show actionable guidance, not just a plant/therapy name -- and now also
enriched with relevant homeopathic remedy suggestions alongside the
Ayurvedic plant recommendation, matching the same pattern used in the
report scanner.
"""

import re
from pathlib import Path

import pandas as pd
from fastapi import APIRouter
from pydantic import BaseModel

from services.symptom_matcher import SymptomMatcher

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
SYMPTOM_CSV = BASE_DIR / "ml" / "datasets" / "symptoms" / "symptom_remedy_pairs.csv"
PLANTS_CSV = BASE_DIR / "ml" / "datasets" / "plants" / "metadata" / "plants.csv"
HOMEOPATHY_CSV = BASE_DIR / "ml" / "datasets" / "homeopathy" / "homeopathy_remedies.csv"

matcher = SymptomMatcher(str(SYMPTOM_CSV))

# Words too common to be useful as a matching signal between the matched
# symptom text and a homeopathic remedy's indicated symptoms.
STOPWORDS = {
    "a", "an", "the", "of", "in", "on", "with", "and", "or", "to", "from",
    "is", "are", "at", "by", "for", "worse", "better",
}


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


def _words(text: str):
    return {
        w for w in re.findall(r"[a-zA-Z]+", str(text).lower())
        if w not in STOPWORDS and len(w) > 2
    }


def _suggest_homeopathy_for_match(matched_symptom: str, homeopathy_df: pd.DataFrame, top_k: int = 2):
    """
    Find homeopathic remedies whose indicated symptoms share the most
    keywords with the matched symptom text -- same spirit as the
    keyword-based matching in reports.py, but general-purpose since
    symptom phrasing is free-form rather than a fixed set of lab test
    names.
    """
    query_words = _words(matched_symptom)
    if not query_words:
        return []

    scored = homeopathy_df.copy()
    scored["_score"] = scored["key_symptoms_indicated"].apply(
        lambda text: len(query_words & _words(text))
    )
    scored = scored[scored["_score"] > 0].sort_values("_score", ascending=False)

    return scored.head(top_k)[
        ["remedy_name", "key_symptoms_indicated", "potency_common", "usage_notes"]
    ].to_dict(orient="records")


def _enrich_with_homeopathy(matches):
    """Attach relevant homeopathic remedy suggestions to each match."""
    if not matches:
        return matches
    homeopathy_df = pd.read_csv(HOMEOPATHY_CSV)
    for match in matches:
        match["suggested_homeopathy"] = _suggest_homeopathy_for_match(
            match.get("matched_symptom", ""), homeopathy_df
        )
    return matches


@router.post("/check")
def check_symptom(query: SymptomQuery):
    """
    Accepts free-text symptom input (English, Hindi, or Hinglish) and
    returns the closest matching traditional remedies -- including full
    plant preparation/dosage/safety details and relevant homeopathic
    remedy suggestions -- or an emergency flag.
    """
    result = matcher.match(query.text)

    if not result.get("emergency") and result.get("matches"):
        result["matches"] = _enrich_with_plant_details(result["matches"])
        result["matches"] = _enrich_with_homeopathy(result["matches"])

    return result