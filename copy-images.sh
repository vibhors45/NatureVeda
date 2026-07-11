#!/bin/bash
SRC_DIR="ml/datasets/plants/images"
DEST_DIR="apps/web/public/plant-images"

mkdir -p "$DEST_DIR"

for folder in "$SRC_DIR"/*/; do
  plant_name=$(basename "$folder")
  slug=$(echo "$plant_name" | tr '[:upper:]' '[:lower:]' | tr -s ' ' '_')

  first_image=$(find "$folder" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | sort | head -n 1)

  if [ -z "$first_image" ]; then
    echo "⚠️  No image found for: $plant_name"
    continue
  fi

  ext="${first_image##*.}"
  ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

  cp "$first_image" "$DEST_DIR/${slug}.${ext_lower}"
  echo "✅ $plant_name -> ${slug}.${ext_lower}"
done

echo "Done! Images copied to $DEST_DIR"