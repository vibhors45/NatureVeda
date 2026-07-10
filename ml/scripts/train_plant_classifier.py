"""
Trains a plant leaf classifier using transfer learning on MobileNetV2.
No API key or paid service required -- runs fully locally or on a free
Google Colab GPU runtime.

Improvements over the first version:
  - Data augmentation (helps a LOT when some classes have <20 images)
  - Class weights (corrects the heavy imbalance -- e.g. Dill: 2 images
    vs Drumstick Leaves: 87 images)
  - Two-phase training: first train just the classifier head (frozen
    base), then unfreeze the top of MobileNetV2 and fine-tune at a low
    learning rate. This is what actually lets the model learn plant-
    specific features instead of relying only on generic ImageNet
    features.

Expects images organized as:
    ml/datasets/plants/images/<species_folder>/*.jpg

Run:
    python train_plant_classifier.py
"""

import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from sklearn.utils.class_weight import compute_class_weight

IMAGES_DIR = "../datasets/plants/images"
IMG_SIZE = (224, 224)
BATCH_SIZE = 16
INITIAL_EPOCHS = 15      # phase 1: train the classifier head only
FINE_TUNE_EPOCHS = 15    # phase 2: fine-tune the top of MobileNetV2
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


def compute_class_weights(train_ds, num_classes):
    """
    Some classes have 2 images, others have 87. Without correction the
    model just learns to guess the biggest classes whenever it's unsure.
    This computes an inverse-frequency weight per class so rare classes
    count more during training.
    """
    all_labels = []
    for _, labels in train_ds.unbatch():
        all_labels.append(labels.numpy())
    all_labels = np.array(all_labels)

    weights = compute_class_weight(
        class_weight="balanced",
        classes=np.arange(num_classes),
        y=all_labels,
    )
    return dict(enumerate(weights))


def build_augmentation():
    """
    Randomly perturbs training images each epoch (flip/rotate/zoom/
    contrast) so the same small set of source images produces many
    different-looking training examples. Critical here since several
    classes only have a handful of source photos.
    """
    return tf.keras.Sequential([
        layers.RandomFlip("horizontal"),
        layers.RandomRotation(0.15),
        layers.RandomZoom(0.15),
        layers.RandomContrast(0.15),
        layers.RandomTranslation(0.1, 0.1),
    ], name="augmentation")


def build_model(num_classes: int):
    base_model = MobileNetV2(
        input_shape=IMG_SIZE + (3,),
        include_top=False,
        weights="imagenet",
    )
    base_model.trainable = False  # frozen for phase 1

    augmentation = build_augmentation()

    inputs = tf.keras.Input(shape=IMG_SIZE + (3,))
    x = augmentation(inputs)
    x = preprocess_input(x)
    x = base_model(x, training=False)
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.3)(x)
    outputs = layers.Dense(num_classes, activation="softmax")(x)

    model = models.Model(inputs, outputs)
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model, base_model


def main():
    train_ds, val_ds = build_datasets()
    class_names = train_ds.class_names
    num_classes = len(class_names)
    print(f"Found {num_classes} species: {class_names}")

    class_weight_dict = compute_class_weights(train_ds, num_classes)
    print("Class weights computed (imbalance correction applied)")

    autotune = tf.data.AUTOTUNE
    train_ds = train_ds.cache().shuffle(1000).prefetch(buffer_size=autotune)
    val_ds = val_ds.cache().prefetch(buffer_size=autotune)

    model, base_model = build_model(num_classes=num_classes)
    model.summary()

    # ---------- Phase 1: train classifier head only ----------
    print("\n=== Phase 1: training classifier head (base frozen) ===\n")
    model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=INITIAL_EPOCHS,
        class_weight=class_weight_dict,
    )

    # ---------- Phase 2: fine-tune top layers of MobileNetV2 ----------
    print("\n=== Phase 2: fine-tuning top layers of MobileNetV2 ===\n")
    base_model.trainable = True

    # Freeze everything except roughly the last 30 layers -- fine-tuning
    # the whole backbone with this little data would overfit badly.
    fine_tune_at = len(base_model.layers) - 30
    for layer in base_model.layers[:fine_tune_at]:
        layer.trainable = False

    # Much lower learning rate for fine-tuning -- large updates here
    # would wreck the pretrained ImageNet features.
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=1e-5),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )

    history_fine = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=INITIAL_EPOCHS + FINE_TUNE_EPOCHS,
        initial_epoch=INITIAL_EPOCHS,
        class_weight=class_weight_dict,
    )

    final_val_acc = history_fine.history["val_accuracy"][-1]
    print(f"\nFinal validation accuracy: {final_val_acc:.2%}")

    import os
    os.makedirs("../models/plant_classifier", exist_ok=True)
    model.save(OUTPUT_MODEL_PATH)

    with open("../models/plant_classifier/class_names.txt", "w") as f:
        f.write("\n".join(class_names))

    print(f"Model saved to {OUTPUT_MODEL_PATH}")


if __name__ == "__main__":
    main()