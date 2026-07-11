import threading
import re

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

EMERGENCY_MESSAGE = (
    "This sounds like it could be a medical emergency. Please seek immediate "
    "medical attention or contact local emergency services. This app cannot "
    "provide guidance for this situation."
)

# Minimum similarity score for a match to be considered meaningful at all.
# Without this, a near-zero-similarity row can still land in the top-k slice
# and get treated as a real match (this is what caused the false-emergency bug).
MIN_CONFIDENCE = 0.12

# Common word-form variants TF-IDF won't connect on its own (no stemming).
WORD_VARIANTS = {
    "dizzy": "dizziness",
    "dizzier": "dizziness",
    "vomiting": "vomit",
    "vomited": "vomit",
    "nauseous": "nausea",
    "nauseated": "nausea",
    "coughing": "cough",
    "aching": "ache",
    "aches": "ache",
}


def _normalize(text: str) -> str:
    text = text.lower()
    words = re.findall(r"[a-zA-Z]+", text)
    words = [WORD_VARIANTS.get(w, w) for w in words]
    return " ".join(words)


class SymptomMatcher:
    def __init__(self, csv_path: str):
        self.df = pd.read_csv(csv_path)
        self.reference_texts = self.df["symptom_text"].tolist()
        self._normalized_refs = [_normalize(t) for t in self.reference_texts]
        self._vectorizer = None
        self._reference_matrix = None
        self._lock = threading.Lock()

    def _ensure_fitted(self):
        if self._vectorizer is None:
            with self._lock:
                if self._vectorizer is None:
                    self._vectorizer = TfidfVectorizer()
                    self._reference_matrix = self._vectorizer.fit_transform(
                        self._normalized_refs
                    )

    def match(self, user_text: str, top_k: int = 3):
        self._ensure_fitted()

        query_vec = self._vectorizer.transform([_normalize(user_text)])
        scores = cosine_similarity(query_vec, self._reference_matrix)[0]

        top_k = min(top_k, len(self.reference_texts))
        top_indices = scores.argsort()[::-1][:top_k]

        matches = []
        for idx in top_indices:
            score = float(scores[idx])
            if score < MIN_CONFIDENCE:
                continue

            row = self.df.iloc[int(idx)]
            if row["severity_flag"] == "emergency":
                return {
                    "emergency": True,
                    "message": EMERGENCY_MESSAGE,
                }
            matches.append(
                {
                    "matched_symptom": row["symptom_text"],
                    "dosha_imbalance": row["dosha_imbalance"],
                    "recommended_plant": row["recommended_plant"],
                    "recommended_therapy": row["recommended_therapy"],
                    "severity_flag": row["severity_flag"],
                    "confidence": score,
                }
            )

        return {
            "emergency": False,
            "matches": matches,
            "disclaimer": (
                "This is traditional wellness guidance, "
                "not a medical diagnosis."
            ),
        }
