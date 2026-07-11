"""
Copies one representative image per plant species into a small
'images_lite' folder that's light enough to commit to git and deploy.
The full training dataset (ml/datasets/plants/images/) stays local-only
for training -- this lite folder is just for displaying reference
photos in the deployed app.
"""

import os
import shutil

SOURCE_DIR = "../datasets/plants/images"
DEST_DIR = "../datasets/plants/images_lite"

os.makedirs(DEST_DIR, exist_ok=True)

count = 0
for species in os.listdir(SOURCE_DIR):
    species_path = os.path.join(SOURCE_DIR, species)
    if not os.path.isdir(species_path):
        continue

    images = [
        f for f in os.listdir(species_path)
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp"))
    ]
    if not images:
        continue

    dest_species_dir = os.path.join(DEST_DIR, species)
    os.makedirs(dest_species_dir, exist_ok=True)

    chosen = images[0]
    shutil.copy(
        os.path.join(species_path, chosen),
        os.path.join(dest_species_dir, chosen),
    )
    count += 1

print(f"Copied 1 image each for {count} species into {DEST_DIR}")
