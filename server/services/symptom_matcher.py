"""
Symptom -> remedy matching service.

Uses a free, local sentence-embedding model (no API key required) to compare
a user's free-text symptom description against the curated symptom_remedy_pairs.csv
reference set, and returns the closest matching remedies.

This is intentionally a similarity-search approach rather than a trained
classifier, since the reference dataset (~97 rows) is too small to fine-tune
a classifier reliably. As the dataset grows, this can be upgraded.
"""

import pandas as pd
from sentence_transformers import SentenceTransformer, util

# Free, small, multilingual-capable model — good starting point for
# Hindi/Hinglish/English mixed input. Downloads once, then runs locally.
MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

EMERGENCY_MESSAGE = (
    "This sounds like it could be a medical emergency. Please seek immediate "
    "medical attention or contact local emergency services. This app cannot "
    "provide guidance for this situation."
)


class SymptomMatcher:
    def __init__(self, csv_path: str):
        self.df = pd.read_csv(csv_path)
        self.model = SentenceTransformer(MODEL_NAME)

        # Pre-compute embeddings for all reference symptom texts once at startup.
        self.reference_texts = self.df["symptom_text"].tolist()
        self.reference_embeddings = self.model.encode(
            self.reference_texts, convert_to_tensor=True
        )

    def match(self, user_text: str, top_k: int = 3) -> dict:
        """
        Given free-text symptom input, return the top_k closest matches
        from the reference dataset, or an emergency flag if the closest
        match is tagged as an emergency.
        """
        query_embedding = self.model.encode(user_text, convert_to_tensor=True)
        scores = util.cos_sim(query_embedding, self.reference_embeddings)[0]

        top_results = scores.topk(k=min(top_k, len(self.reference_texts)))

        matches = []
        for score, idx in zip(top_results.values, top_results.indices):
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
                    "confidence": float(score),
                }
            )

        return {
            "emergency": False,
            "matches": matches,
            "disclaimer": (
                "This is traditional wellness guidance, not a medical diagnosis. "
                "Consult a doctor for persistent or severe symptoms."
            ),
        }


# Example usage (run directly for a quick manual test):
if __name__ == "__main__":
    matcher = SymptomMatcher("../../ml/datasets/symptoms/symptom_remedy_pairs.csv")
    result = matcher.match("mujhe dizziness ho rahi hai")
    print(result)
