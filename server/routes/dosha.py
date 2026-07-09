"""
Dosha assessment routes.

Serves the 20-question quiz and, given a set of answers, computes the
dosha breakdown and returns the matching wellness plan.
"""

from fastapi import APIRouter
from pydantic import BaseModel
import pandas as pd
import json
from collections import Counter

router = APIRouter()

QUESTIONS_CSV = "../ml/datasets/wellness_plans/dosha_assessment_questions.csv"
WELLNESS_PLANS_JSON = "../ml/datasets/wellness_plans/dosha_wellness_plans.json"


@router.get("/questions")
def get_questions():
    """
    Returns the 20 questions, each with its 3 dosha-tagged options,
    grouped by question_id so the frontend can render one question at a time.
    """
    df = pd.read_csv(QUESTIONS_CSV)
    questions = []
    for qid, group in df.groupby("question_id"):
        questions.append(
            {
                "question_id": int(qid),
                "category": group.iloc[0]["category"],
                "question_text": group.iloc[0]["question_text"],
                "options": [
                    {"option_text": row["option_text"], "dosha_tag": row["dosha_tag"]}
                    for _, row in group.iterrows()
                ],
            }
        )
    questions.sort(key=lambda q: q["question_id"])
    return {"questions": questions}


class AssessmentSubmission(BaseModel):
    # List of dosha tags, one per answered question, e.g. ["Vata", "Pitta", ...]
    answers: list[str]


@router.post("/submit")
def submit_assessment(submission: AssessmentSubmission):
    """
    Scores the submitted answers and returns the dosha breakdown plus
    the matching wellness plan (diet, routine, exercise, seasonal notes).
    """
    counts = Counter(submission.answers)
    total = sum(counts.values()) or 1

    percentages = {
        dosha: round((counts.get(dosha, 0) / total) * 100, 1)
        for dosha in ["Vata", "Pitta", "Kapha"]
    }

    sorted_doshas = sorted(percentages.items(), key=lambda x: x[1], reverse=True)
    primary_dosha, primary_pct = sorted_doshas[0]
    secondary_dosha, secondary_pct = sorted_doshas[1]

    # If second-highest is within 15 percentage points of the top, it's a
    # dual-dosha constitution rather than a single dominant one.
    is_dual = (primary_pct - secondary_pct) <= 15
    is_tridoshic = max(percentages.values()) - min(percentages.values()) <= 10

    with open(WELLNESS_PLANS_JSON) as f:
        wellness_plans = json.load(f)

    if is_tridoshic:
        constitution_label = "Tridoshic (balanced across all three doshas)"
        plan_doshas = ["Vata", "Pitta", "Kapha"]
    elif is_dual:
        constitution_label = f"{primary_dosha}-{secondary_dosha}"
        plan_doshas = [primary_dosha, secondary_dosha]
    else:
        constitution_label = primary_dosha
        plan_doshas = [primary_dosha]

    return {
        "percentages": percentages,
        "constitution_label": constitution_label,
        "primary_dosha": primary_dosha,
        "wellness_plans": {d: wellness_plans[d] for d in plan_doshas},
    }
