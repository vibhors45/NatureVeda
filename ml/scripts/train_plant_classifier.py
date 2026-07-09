"""
Trains a plant leaf classifier using transfer learning on MobileNetV2.

No API key or paid service required — runs fully locally or on a free
Google Colab GPU runtime.

Expects images organized as:
    ml/datasets/plants/images/<species_folder>/*.jpg

Run:
    python train_plant_classifier.py
"""

import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

IMAGES_DIR = "../datasets/plants/images"
IMG_SIZE = (224, 224)
BATCH_SIZE = 16
EPOCHS = 15
OUTPUT_MODEL_PATH = "../models/plant_classifier/model.keras"


def build_datasets():
    train_ds = tf.keras.utils.image_dataset_from_directory(
        IMAGES_DIR,
        validation_split=0.2,
        subset="training",
        seed=42,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
    )
    val_ds = tf.keras.utils.image_dataset_from_directory(
        IMAGES_DIR,
        validation_split=0.2,
        subset="validation",
        seed=42,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
    )
    return train_ds, val_ds


def build_model(num_classes: int):
    base_model = MobileNetV2(
        input_shape=IMG_SIZE + (3,),
        include_top=False,
        weights="imagenet",  # free pretrained weights, downloaded automatically
    )
    base_model.trainable = False  # freeze base for initial training

    inputs = tf.keras.Input(shape=IMG_SIZE + (3,))
    x = preprocess_input(inputs)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = models.Model(inputs, outputs)
    model.compile(
        optimizer="adam",
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def main():
    train_ds, val_ds = build_datasets()
    class_names = train_ds.class_names
    print(f"Found {len(class_names)} species: {class_names}")

    # Improve pipeline performance
    autotune = tf.data.AUTOTUNE
    train_ds = train_ds.cache().shuffle(1000).prefetch(buffer_size=autotune)
    val_ds = val_ds.cache().prefetch(buffer_size=autotune)

    model = build_model(num_classes=len(class_names))
    model.summary()

    model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS)

    import os
    os.makedirs("../models/plant_classifier", exist_ok=True)
    model.save(OUTPUT_MODEL_PATH)

    # Save class name mapping alongside the model — needed at inference time
    # to turn a predicted index back into a species name.
    with open("../models/plant_classifier/class_names.txt", "w") as f:
        f.write("\n".join(class_names))

    print(f"Model saved to {OUTPUT_MODEL_PATH}")


if __name__ == "__main__":
    main()
