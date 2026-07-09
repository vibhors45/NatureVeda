# NatureVeda

AI-powered AYUSH and Homeopathy wellness platform — identify medicinal plants by photo, discover your unique dosha constitution, and get personalized traditional remedy guidance for symptoms and health reports.

## Project Structure

```
NatureVeda/
├── apps/
│   ├── web/                 # Next.js web app
│   └── mobile/              # React Native (Expo) app
├── server/                  # FastAPI backend
│   ├── routes/               # API endpoints
│   ├── services/              # ML inference, OCR, embedding logic
│   └── models/                # DB schema / ORM models
├── ml/
│   ├── datasets/
│   │   ├── plants/
│   │   │   ├── images/         # plant photos, one folder per species
│   │   │   └── metadata/       # plants.csv
│   │   ├── symptoms/           # symptom_remedy_pairs.csv
│   │   ├── homeopathy/         # homeopathy_remedies.csv
│   │   ├── reports/sample_reports/  # dummy lab report samples
│   │   └── wellness_plans/     # dosha-based diet/routine templates
│   ├── models/                # trained model files (generated after training)
│   └── scripts/                # training + preprocessing scripts
└── docs/
```

## Tech Stack
- **Web**: Next.js
- **Mobile**: React Native + Expo
- **Backend**: FastAPI (Python)
- **Database + Auth + Storage**: Supabase (Postgres, Google/email/phone auth, file storage)
- **Plant ID model**: TensorFlow/Keras, transfer learning on MobileNetV2/EfficientNetB0
- **Symptom matching**: Sentence-Transformers (embedding similarity)
- **Report OCR**: Tesseract via pytesseract

## Getting Started
See `docs/SETUP.md` for full setup instructions.

No paid API keys are required to run the core prototype. Supabase requires a free account (self-service, no cost) for its project URL and anon key.
