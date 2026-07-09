# NatureVeda — Setup Guide

## 1. Supabase (Auth + Database + Storage)

1. Go to supabase.com, create a free account, create a new project.
2. From Project Settings > API, copy:
   - Project URL
   - anon public key
   - service_role key (keep this one secret, backend-only)
3. Add these to `apps/web/.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```
4. Add the same URL/anon key, plus the service_role key, to `server/.env`
   (see `server/.env.example`).

### Enabling sign-in methods
- **Email**: enabled by default in Supabase Auth, no extra setup.
- **Google**: In Supabase Dashboard > Authentication > Providers > Google,
  enable it and add your Google OAuth Client ID/Secret (create these free
  in Google Cloud Console under "APIs & Services > Credentials").
- **Phone (OTP/SMS)**: Supabase requires a connected SMS provider (e.g.
  Twilio) for phone auth to actually send OTP codes. **This is the one
  piece that is not free** — Twilio charges per SMS sent (though it does
  offer a small free trial credit). If cost is a concern right now, you
  can launch with Google + Email only, and add phone sign-in once you're
  ready to take on that cost, without changing any other code — the
  phone auth functions in `supabaseClient.js` are already written and
  will work as soon as a provider is connected.

## 2. Backend (FastAPI)

```
cd server
python -m venv venv
source venv/bin/activate   # or venv\Scripts\activate on Windows
pip install -r requirements.txt
cp .env.example .env       # then fill in your Supabase keys
uvicorn main:app --reload
```

Runs at http://localhost:8000 — visit /health to confirm it's running.

## 3. Web app (Next.js)

```
cd apps/web
npm install
npm run dev
```

Runs at http://localhost:3000

## 4. ML setup

### Plant classifier training
```
cd ml/scripts
pip install tensorflow pillow numpy
python train_plant_classifier.py
```
Requires images already organized under `ml/datasets/plants/images/<species>/`.
Use `match_image_folders_to_metadata.py` first to check your downloaded
dataset's folder names line up with `plants.csv`.

### Symptom matcher
Runs via `server/services/symptom_matcher.py` — no separate training step,
it uses pretrained sentence embeddings directly against `symptom_remedy_pairs.csv`.

### Report parser
Runs via `server/services/report_parser.py` — uses Tesseract OCR, which
must be installed separately on your system (not just the Python wrapper):
- Mac: `brew install tesseract`
- Ubuntu/Debian: `sudo apt install tesseract-ocr`
- Windows: install from the official Tesseract GitHub releases page

## What costs money vs. what's free

| Component | Cost |
|---|---|
| Supabase (free tier) | Free |
| Google OAuth | Free |
| Email auth | Free |
| Phone/SMS auth (Twilio) | Paid per SMS (small free trial credit available) |
| TensorFlow / plant model training | Free (local or free Colab GPU) |
| Sentence-Transformers | Free |
| Tesseract OCR | Free |
| Hosting (Vercel for web, free tier) | Free for small projects |

No component requires a paid API key to get a working prototype running,
except phone/SMS sign-in specifically.
