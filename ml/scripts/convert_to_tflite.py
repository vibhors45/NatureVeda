"""
Converts the trained plant classifier from .keras to .tflite -- WITHOUT
quantization, so accuracy is identical to the original model. This only
changes the runtime format (much lighter to load in memory), not the
model's weights or precision.

Run from ml/scripts/:
    python convert_to_tflite.py
"""

import os

os.environ["TF_USE_LEGACY_KERAS"] = "0"

import tensorflow as tf

MODEL_PATH = "../models/plant_classifier/model.keras"
OUTPUT_PATH = "../models/plant_classifier/model.tflite"

print("Loading Keras model...")
import keras
model = keras.models.load_model(MODEL_PATH)

print("Converting to TFLite (no quantization -- full accuracy preserved)...")
converter = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()

with open(OUTPUT_PATH, "wb") as f:
    f.write(tflite_model)

size_mb = os.path.getsize(OUTPUT_PATH) / (1024 * 1024)
print(f"Saved {OUTPUT_PATH} ({size_mb:.1f} MB)")
