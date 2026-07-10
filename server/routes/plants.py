"""
NatureVeda Plant Routes
Plant search + AI image identification.

Defensive by design: identify() can never let an unhandled exception crash
the connection (which shows up on the frontend as "couldn't reach the
service" rather than a real error message). Every failure path returns
valid JSON with a clear message instead.
"""

import os
import random
import shutil
import tempfile
import traceback
from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

from fastapi import APIRouter, UploadFile, File, HTTPException, Query

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PLANTS_CSV = BASE_DIR / "ml" / "datasets" / "plants" / "metadata" / "plants.csv"
MODEL_PATH = BASE_DIR / "ml" / "models" / "plant_classifier" / "model.keras"
CLASS_NAMES_PATH = BASE_DIR / "ml" / "models" / "plant_classifier" / "class_names.txt"
PLANT_IMAGES_DIR = BASE_DIR / "ml" / "datasets" / "plants" / "images"

# Below this confidence, we don't claim a confident identification --
# we still return the best guess but flag it clearly so the frontend
# can show "not confident" messaging instead of asserting a wrong name.
CONFIDENCE_THRESHOLD = 40.0

_model = None
_class_names = None
_model_load_error = None

# Force standalone Keras 3 (the version the model was actually saved with)
# instead of the legacy tf_keras package. Must be set before tensorflow
# is imported anywhere in the process.
os.environ["TF_USE_LEGACY_KERAS"] = "0"


def load_model():
    """
    Lazily loads the trained model once. If loading fails for any reason
    (missing file, version mismatch, corrupt file), the error is captured
    once and every subsequent call returns (None, None, <short error>)
    instead of retrying and re-crashing on every request.
    """
    global _model, _class_names, _model_load_error

    if _model is not None:
        return _model, _class_names, None

    if _model_load_error is not None:
        return None, None, _model_load_error

    if not MODEL_PATH.exists():
        _model_load_error = "Model file not found. Run train_plant_classifier.py first."
        return None, None, _model_load_error

    try:
        import tensorflow as tf
        print("MODEL PATH:", MODEL_PATH)
        print("MODEL EXISTS:", MODEL_PATH.exists())
        print("TensorFlow:", tf.__version__)

        import keras
        print("Standalone Keras:", keras.__version__)

        # Load with standalone keras (matches how the model was saved),
        # NOT tf.keras.models.load_model -- that can route through the
        # legacy tf_keras package and fail to deserialize.
        _model = keras.models.load_model(str(MODEL_PATH))
        print("MODEL LOADED SUCCESSFULLY")

        with open(CLASS_NAMES_PATH, "r") as f:
            _class_names = [x.strip() for x in f.readlines() if x.strip()]

        print(f"Loaded plant classifier with {len(_class_names)} classes")
        return _model, _class_names, None

    except Exception as e:
        # Keep this short -- full tracebacks from Keras deserialization
        # errors can be enormous and flood the terminal.
        short_error = f"{type(e).__name__}: {str(e)[:200]}"
        print("MODEL LOAD ERROR:", short_error)
        _model_load_error = short_error
        _model = None
        return None, None, short_error


def get_reference_image_url(plant_name: str) -> Optional[str]:
    """
    Picks one representative training image for this plant and returns
    a URL path the frontend can load directly (served via the static
    mount set up in main.py -- see /plant-images/<class>/<file>).
    """
    folder = PLANT_IMAGES_DIR / plant_name
    if not folder.exists():
        return None

    images = [
        f for f in os.listdir(folder)
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
    ]
    if not images:
        return None

    chosen = random.choice(images)
    return f"/plant-images/{plant_name}/{chosen}"


@router.get("/")
def get_plants(
    search: Optional[str] = None,
    dosha: Optional[str] = None,
):
    if not PLANTS_CSV.exists():
        raise HTTPException(500, "plants.csv not found")

    df = pd.read_csv(PLANTS_CSV)

    if search:
        s = search.lower()
        df = df[df["name"].astype(str).str.lower().str.contains(s)]

    if dosha and dosha.lower() != "all":
        df = df[df["dosha_effect"].astype(str).str.lower() == dosha.lower()]

    records = df.to_dict(orient="records")
    for record in records:
        record["image"] = get_reference_image_url(record["name"])

    return {"count": len(records), "plants": records}


@router.get("/{plant_name}")
def plant_detail(plant_name: str):
    df = pd.read_csv(PLANTS_CSV)
    result = df[df["name"].str.lower() == plant_name.lower()]
    if result.empty:
        return {"error": "Plant not found"}
    record = result.iloc[0].to_dict()
    record["image"] = get_reference_image_url(record["name"])
    return record


@router.post("/identify")
async def identify(file: UploadFile = File(...)):
    model, classes, load_error = load_model()

    if model is None:
        # Always a valid 200 response with a clear message -- never a
        # crash, so the frontend shows the real reason instead of a
        # generic network error.
        return {
            "success": False,
            "error": "model_missing",
            "message": (
                f"AI model not available yet: {load_error}"
                if load_error
                else "AI model not available yet. Run training first."
            ),
        }

    image_path = None
    try:
        import tensorflow as tf

        suffix = Path(file.filename).suffix or ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
            shutil.copyfileobj(file.file, temp)
            image_path = temp.name

        # NOTE: do NOT call preprocess_input() here. train_plant_classifier.py
        # bakes MobileNetV2's preprocess_input into the model itself (right
        # after the augmentation layer), so the model expects raw pixel
        # values in [0, 255]. Calling preprocess_input() again here would
        # double-apply it and produce near-random predictions.
        img = tf.keras.utils.load_img(image_path, target_size=(224, 224))
        img = tf.keras.utils.img_to_array(img)
        img = np.expand_dims(img, axis=0)

        prediction = model.predict(img, verbose=0)[0]
        best_idx = int(np.argmax(prediction))
        best_name = classes[best_idx]
        best_confidence = round(float(prediction[best_idx]) * 100, 2)

        df = pd.read_csv(PLANTS_CSV)
        info = df[df["name"].str.lower() == best_name.lower()]

        result = {
            "plant": best_name,
            "confidence": best_confidence,
            "details": info.iloc[0].to_dict() if not info.empty else None,
            "image": get_reference_image_url(best_name),
            "confident": best_confidence >= CONFIDENCE_THRESHOLD,
        }

        return {"success": True, "result": result}

    except Exception as e:
        short_error = f"{type(e).__name__}: {str(e)[:200]}"
        print("IDENTIFY ERROR:", short_error)
        # Return valid JSON instead of raising -- an uncaught HTTPException
        # here is still a valid HTTP response, but any exception that
        # escapes this block entirely would drop the connection and show
        # as "couldn't reach the service" on the frontend.
        return {
            "success": False,
            "error": "identify_failed",
            "message": f"Couldn't process this image: {short_error}",
        }

    finally:
        if image_path and os.path.exists(image_path):
            os.remove(image_path)