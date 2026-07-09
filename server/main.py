"""
NatureVeda backend — FastAPI entrypoint.

Run locally:
    pip install -r requirements.txt
    uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="NatureVeda API",
    description="AI-powered AYUSH and Homeopathy wellness platform backend.",
    version="0.1.0",
)

# Allow the web/mobile apps to call this API during development.
# Tighten allow_origins before going to production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"status": "ok", "service": "NatureVeda API"}


@app.get("/health")
def health_check():
    return {"status": "healthy"}


from routes import plants, symptoms, dosha, reports

app.include_router(plants.router, prefix="/api/plants", tags=["plants"])
app.include_router(symptoms.router, prefix="/api/symptoms", tags=["symptoms"])
app.include_router(dosha.router, prefix="/api/dosha", tags=["dosha"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
