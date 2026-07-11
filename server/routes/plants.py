"""
NatureVeda Plant Routes
Plant search + AI image identification.

Uses TensorFlow Lite for inference instead of the full Keras model --
much lower memory footprint, which matters on free-tier hosting (512MB).

Defensive by design: identify() can never let an unhandled exception crash
the connection (which shows up on the frontend as "couldn't reach the
service" rather than a real error message). Every failure path returns
valid JSON with a clear message instead.
"""

import os
import random
import shutil
import tempfile
from pathlib import Path
from typing import Optional
from urllib.parse import quote

import numpy as np
import pandas as pd

from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PLANTS_CSV = BASE_DIR / "ml" / "datasets" / "plants" / "metadata" / "plants.csv"
MODEL_PATH = BASE_DIR / "ml" / "models" / "plant_classifier" / "model.tflite"
CLASS_NAMES_PATH = BASE_DIR / "ml" / "models" / "plant_classifier" / "class_names.txt"
PLANT_IMAGES_DIR = BASE_DIR / "ml" / "datasets" / "plants" / "images_lite"

CONFIDENCE_THRESHOLD = 40.0

_interpreter = None
_input_details = None
_output_details = None
_class_names = None
_model_load_error = None


def load_model():
    """
    Lazily loads the TFLite interpreter once. If loading fails for any
    reason, the error is captured once and every subsequent call returns
    the cached error instead of retrying and re-crashing on every request.
    """
    global _interpreter, _input_details, _output_details, _class_names, _model_load_error

    if _interpreter is not None:
        return _interpreter, _class_names, None

    if _model_load_error is not None:
        return None, None, _model_load_error

    if not MODEL_PATH.exists():
        _model_load_error = (
            "Model file not found. Run convert_to_tflite.py after training first."
        )
        return None, None, _model_load_error

    try:
        # tflite-runtime is a much lighter install than full tensorflow --
        # falls back to tensorflow's built-in interpreter if that's what's
        # available in this environment (e.g. local dev).
        try:
            import tflite_runtime.interpreter as tflite
            Interpreter = tflite.Interpreter
        except ImportError:
            import tensorflow as tf
            Interpreter = tf.lite.Interpreter

        interpreter = Interpreter(model_path=str(MODEL_PATH))
        interpreter.allocate_tensors()

        _input_details = interpreter.get_input_details()
        _output_details = interpreter.get_output_details()
        _interpreter = interpreter

        with open(CLASS_NAMES_PATH, "r") as f:
            _class_names = [x.strip() for x in f.readlines() if x.strip()]

        print(f"Loaded TFLite plant classifier with {len(_class_names)} classes")
        return _interpreter, _class_names, None

    except Exception as e:
        short_error = f"{type(e).__name__}: {str(e)[:200]}"
        print("MODEL LOAD ERROR:", short_error)
        _model_load_error = short_error
        _interpreter = None
        return None, None, short_error


def get_reference_image_url(plant_name: str) -> Optional[str]:
    """
    Picks one representative training image for this plant and returns
    a URL path the frontend can load directly (served via the static
    mount set up in main.py -- see /plant-images/<class>/<file>).
    Each path segment is percent-encoded since dataset filenames often
    contain spaces or unicode characters that aren't valid raw in a URL.
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
    return f"/plant-images/{quote(plant_name)}/{quote(chosen)}"


@router.get("/")
def get_plants(search: Optional[str] = None, dosha: Optional[str] = None):
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
    interpreter, classes, load_error = load_model()

    if interpreter is None:
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
        from PIL import Image

        suffix = Path(file.filename).suffix or ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
            shutil.copyfileobj(file.file, temp)
            image_path = temp.name

        # Same preprocessing contract as before: raw pixel values in
        # [0, 255], no manual normalization -- preprocess_input is baked
        # into the model graph itself (see train_plant_classifier.py).
        img = Image.open(image_path).convert("RGB").resize((224, 224))
        img_array = np.array(img, dtype=np.float32)
        img_array = np.expand_dims(img_array, axis=0)

        interpreter.set_tensor(_input_details[0]["index"], img_array)
        interpreter.invoke()
        prediction = interpreter.get_tensor(_output_details[0]["index"])[0]

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
        return {
            "success": False,
            "error": "identify_failed",
            "message": f"Couldn't process this image: {short_error}",
        }

    finally:
        if image_path and os.path.exists(image_path):
            os.remove(image_path)