import { useState } from "react";
import NavBar from "../components/NavBar";
import PlantImage from "../components/PlantImage";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export default function PlantScanner() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function handleFileChange(e) {
    const selected = e.target.files[0];
    if (!selected) return;
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setResult(null);
    setError(null);
  }

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/api/plants/identify`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(
        "Couldn't reach the scanner service. Make sure the backend server " +
          "is running at " + API_BASE + "."
      );
    } finally {
      setLoading(false);
    }
  }

  const prediction = result && result.success ? result.result : null;

  return (
    <div>
      <NavBar />
      <div className="page-container" style={styles.page}>
        <p style={styles.eyebrow}>AI Powered</p>
        <h1 style={styles.h1}>Scan Your Plant</h1>
        <p style={styles.subtext}>
          Upload a clear photo of a leaf or plant to identify its species
          and Ayurvedic properties.
        </p>

        <div style={styles.uploadBox}>
          {preview ? (
            <img src={preview} alt="preview" style={styles.previewImg} />
          ) : (
            <p style={styles.uploadHint}>No image selected yet</p>
          )}

          {/* capture="environment" opens the native camera on mobile;
              on desktop this just falls back to a normal file picker. */}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            style={styles.fileInput}
          />

          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            style={styles.submitButton}
          >
            {loading ? "Identifying..." : "Identify Plant"}
          </button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {result && (result.error === "model_missing" || result.error === "identify_failed") && (
          <div style={styles.infoBox}>{result.message}</div>
        )}

        {prediction && (
          <div style={styles.resultsWrap}>
            {!prediction.confident && (
              <p style={styles.lowConfidenceWarning}>
                This is an uncertain match — treat as a possibility, not a
                confirmed identification.
              </p>
            )}

            <div style={styles.predictionCard}>
              <PlantImage
                name={prediction.plant}
                imageUrl={prediction.image}
                style={styles.predictionImage}
              />

              <div style={styles.predictionHeader}>
                <h3 style={styles.predictionName}>{prediction.plant}</h3>
                <span style={styles.confidenceTag}>
                  {prediction.confidence}%
                </span>
              </div>

              {prediction.details && (
                <p style={styles.predictionBenefits}>
                  {prediction.details.key_benefits}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 560,
    margin: "0 auto",
    padding: "60px 24px",
    fontFamily: "sans-serif",
    color: "#2B2B24",
    textAlign: "center",
  },
  eyebrow: {
    textTransform: "uppercase",
    fontSize: 13,
    letterSpacing: 1,
    color: "#D97742",
    fontWeight: 600,
  },
  h1: { fontFamily: "Georgia, serif", fontSize: 32, margin: "8px 0" },
  subtext: { color: "#6B6B5E", fontSize: 15, marginBottom: 24 },
  uploadBox: {
    border: "1px dashed #C9C4B4",
    borderRadius: 16,
    padding: 32,
    marginBottom: 20,
  },
  previewImg: {
    maxWidth: "100%",
    maxHeight: 260,
    borderRadius: 10,
    marginBottom: 16,
  },
  uploadHint: { color: "#8A8A7C", marginBottom: 16 },
  fileInput: { display: "block", margin: "0 auto 16px" },
  submitButton: {
    padding: "12px 24px",
    borderRadius: 10,
    border: "none",
    backgroundColor: "#4B7A51",
    color: "#fff",
    fontSize: 15,
    cursor: "pointer",
  },
  errorBox: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#FDECEC",
    color: "#A33A3A",
    fontSize: 14,
  },
  infoBox: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: "#FCEFE3",
    color: "#946200",
    fontSize: 14,
    textAlign: "left",
  },
  resultsWrap: { textAlign: "left" },
  lowConfidenceWarning: {
    fontSize: 13,
    color: "#946200",
    marginBottom: 12,
    fontStyle: "italic",
  },
  predictionCard: {
    border: "1px solid #EEEBE2",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  predictionImage: {
    marginBottom: 14,
  },
  predictionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  predictionName: { fontFamily: "Georgia, serif", fontSize: 18, margin: 0 },
  confidenceTag: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    backgroundColor: "#EEF3EC",
    color: "#4B7A51",
  },
  predictionBenefits: { fontSize: 13, color: "#6B6B5E", marginTop: 6 },
};