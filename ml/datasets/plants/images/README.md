Place plant image folders here, one per species, lowercase with underscores,
matching the `name` column in `../metadata/plants.csv`. For example:

    images/
    ├── tulsi/
    │   ├── tulsi_001.jpg
    │   ├── tulsi_002.jpg
    ├── neem/
    ├── ashwagandha/

Images are intentionally excluded from git (see .gitignore) since they're
too large for a repository — keep them locally or in cloud storage, and
only commit this folder structure/README.

Use `ml/scripts/match_image_folders_to_metadata.py` to check that any
downloaded dataset's folder names line up correctly with plants.csv before
renaming/moving images here.
