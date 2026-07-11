import threading

import pandas as pd

MODEL_NAME = "paraphrase-multilingual-MiniLM-L12-v2"

EMERGENCY_MESSAGE = (
    "This sounds like it could be a medical emergency. Please seek immediate "
    "medical attention or contact local emergency services. This app cannot "
    "provide guidance for this situation."
)

# Lazy-loaded globals
_model = None
_util = None
_model_lock = threading.Lock()


def get_model():
    global _model, _util

    if _model is None:
        with _model_lock:
            if _model is None:
                from sentence_transformers import SentenceTransformer, util

                _model = SentenceTransformer(MODEL_NAME)
                _util = util

    return _model, _util


class SymptomMatcher:
    def __init__(self, csv_path: str):
        self.df = pd.read_csv(csv_path)

        self.reference_texts = self.df["symptom_text"].tolist()

        self.reference_embeddings = None

    def _ensure_embeddings(self):
        if self.reference_embeddings is None:
            model, _ = get_model()

            self.reference_embeddings = model.encode(
                self.reference_texts,
                convert_to_tensor=True,
                show_progress_bar=False,
            )

    def match(self, user_text: str, top_k: int = 3):
        self._ensure_embeddings()

        model, util = get_model()

        query_embedding = model.encode(
            user_text,
            convert_to_tensor=True,
            show_progress_bar=False,
        )

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
                "This is traditional wellness guidance, "
                "not a medical diagnosis."
            ),
        }
