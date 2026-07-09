"""
Plant explorer routes -- serves plants.csv as searchable, filterable JSON,
plus an image-based identification endpoint.
"""

import os
import shutil
import tempfile
from typing import Optional

import pandas as pd
from fastapi import APIRouter, Query, UploadFile, File

router = APIRouter()

PLANTS_CSV = "../ml/datasets/plants/metadata/plants.csv"
MODEL_PATH = "../ml/models/plant_classifier/model.keras"
CLASS_NAMES_PATH = "../ml/models/plant_classifier/class_names.txt"

_model = None
_class_names = None


def _load_model_if_available():
    global _model, _class_names
    if _model is not None:
        return _model, _class_names
    if not os.path.exists(MODEL_PATH):
        return None, None
    import tensorflow as tf
    _model = tf.keras.models.load_model(MODEL_PATH)
    with open(CLASS_NAMES_PATH) as f:
        _class_names = [line.strip() for line in f if line.strip()]
    return _model, _class_names


@router.get("/")
def get_plants(
    search: Optional[str] = Query(None, description="Search by name or benefits"),
    dosha: Optional[str] = Query(None, description="Filter by dosha_effect, e.g. Pitta"),
):
    df = pd.read_csv(PLANTS_CSV)
    if search:
        search_lower = search.lower()
        mask = (
            df["name"].str.lower().str.contains(search_lower)
            | df["key_benefits"].str.lower().str.contains(search_lower)
            | df["sanskrit_name"].str.lower().str.contains(search_lower, na=False)
        )
        df = df[mask]
    if dosha and dosha.lower() != "all":
        df = df[df["dosha_effect"].str.lower() == dosha.lower()]
    return {"plants": df.to_dict(orient="records"), "count": len(df)}


@router.get("/{plant_name}")
def get_plant_detail(plant_name: str):
    df = pd.read_csv(PLANTS_CSV)
    match = df[df["name"].str.lower() == plant_name.lower()]
    if match.empty:
        return {"error": "Plant not found"}
    return match.iloc[0].to_dict()


@router.post("/identify")
async def identify_plant(file: UploadFile = File(...)):
    model, class_names = _load_model_if_available()

    if model is None:
        return {
            "error": "not_trained",
            "message": (
                "The plant identification model hasn't been trained yet. "
                "Run ml/scripts/train_plant_classifier.py once your image "
                "dataset is in place, then restart the server."
            ),
        }

    import tensorflow as tf
    import numpy as np

    ext = os.path.splitext(file.filename)[1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        img = tf.keras.utils.load_img(tmp_path, target_size=(224, 224))
        img_array = tf.keras.utils.img_to_array(img)
        img_array = np.expand_dims(img_array, axis=0)

        predictions = model.predict(img_array)[0]
        top_indices = predictions.argsort()[-3:][::-1]

        results = []
        df = pd.read_csv(PLANTS_CSV)

        for idx in top_indices:
            species_folder_name = class_names[idx]
            confidence = float(predictions[idx])
            match = df[df["name"].str.lower() == species_folder_name.lower()]
            plant_info = match.iloc[0].to_dict() if not match.empty else None
            results.append({
                "predicted_name": species_folder_name,
                "confidence": confidence,
                "plant_details": plant_info,
            })

        top_confidence = results[0]["confidence"] if results else 0
        low_confidence = top_confidence < 0.7

        return {
            "predictions": results,
            "low_confidence_warning": low_confidence,
            "message": (
                "This is an uncertain match -- treat as a possibility, not "
                "a confirmed identification."
                if low_confidence else None
            ),
        }
    finally:
        os.remove(tmp_path)
