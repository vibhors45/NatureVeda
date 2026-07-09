"""
Matches downloaded plant image folder names (e.g. from the Mendeley dataset,
often named by scientific name like "Ocimum_sanctum") against the `name` and
`scientific_name` columns in plants.csv, and reports matches, near-misses,
and gaps.

This avoids guessing the exact folder names in advance — just point it at
whatever you've actually downloaded and extracted.

Run:
    python match_image_folders_to_metadata.py /path/to/extracted/image/dataset
"""

import sys
import os
import re
import pandas as pd

PLANTS_CSV = "../datasets/plants/metadata/plants.csv"


def normalize(text: str) -> str:
    """Lowercase, strip underscores/spaces/punctuation for fuzzy comparison."""
    text = text.lower()
    text = re.sub(r"[^a-z]", "", text)
    return text


def main(images_root: str):
    plants = pd.read_csv(PLANTS_CSV)

    # Build normalized lookup keys from both common name and scientific name
    plant_lookup = {}
    for _, row in plants.iterrows():
        plant_lookup[normalize(row["name"])] = row["name"]
        # scientific_name may be a two-word binomial; also index just the genus
        sci = str(row["scientific_name"])
        plant_lookup[normalize(sci)] = row["name"]
        genus = sci.split()[0] if sci else ""
        if genus:
            plant_lookup[normalize(genus)] = row["name"]

    folder_names = [
        f for f in os.listdir(images_root)
        if os.path.isdir(os.path.join(images_root, f))
    ]

    matched = []
    unmatched_folders = []

    for folder in folder_names:
        key = normalize(folder)
        if key in plant_lookup:
            matched.append((folder, plant_lookup[key]))
        else:
            # try partial match: does the folder name contain or get contained
            # by any known plant key?
            found = None
            for lookup_key, plant_name in plant_lookup.items():
                if lookup_key and (lookup_key in key or key in lookup_key):
                    found = plant_name
                    break
            if found:
                matched.append((folder, found))
            else:
                unmatched_folders.append(folder)

    matched_plant_names = {m[1] for m in matched}
    missing_plants = [
        row["name"] for _, row in plants.iterrows()
        if row["name"] not in matched_plant_names
    ]

    print(f"\n{len(matched)} folder(s) matched to plants.csv entries:\n")
    for folder, plant_name in matched:
        print(f"  {folder}  ->  {plant_name}")

    print(f"\n{len(unmatched_folders)} folder(s) in the dataset with no match "
          f"in plants.csv (extra species, not yet in your metadata):\n")
    for folder in unmatched_folders:
        print(f"  {folder}")

    print(f"\n{len(missing_plants)} plant(s) in plants.csv with NO image folder "
          f"found (need your own photos or another source):\n")
    for name in missing_plants:
        print(f"  {name}")

    print(
        "\nNext step: rename matched folders to the lowercase, underscore "
        "form of the 'name' column (e.g. 'Tulsi' -> 'tulsi') so they align "
        "with the training script's expected folder structure."
    )


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python match_image_folders_to_metadata.py <path_to_extracted_dataset>")
        sys.exit(1)
    main(sys.argv[1])
