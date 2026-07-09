"""
Symptom checker routes — exposes the free-text symptom matcher as an API.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from services.symptom_matcher import SymptomMatcher

router = APIRouter()

SYMPTOM_CSV = "../ml/datasets/symptoms/symptom_remedy_pairs.csv"

# Loaded once at startup — embedding the reference set is the slow part,
# so we don't want to redo it on every request.
matcher = SymptomMatcher(SYMPTOM_CSV)


class SymptomQuery(BaseModel):
    text: str


@router.post("/check")
def check_symptom(query: SymptomQuery):
    """
    Accepts free-text symptom input (English, Hindi, or Hinglish) and
    returns the closest matching traditional remedies, or an emergency
    flag if the input matches a severe/emergency pattern.
    """
    return matcher.match(query.text)
