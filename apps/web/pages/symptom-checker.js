import { useState } from "react";
import NavBar from "../components/NavBar";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export default function SymptomChecker() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/symptoms/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input }),
      });

      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(
        "Couldn't reach the symptom checker service. Make sure the backend " +
          "server is running at " + API_BASE + "."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <NavBar />
      <div className="page-container" style={styles.page}>
      <div style={styles.header}>
        <p style={styles.eyebrow}>Symptom Guidance</p>
        <h1 style={styles.h1}>How are you feeling?</h1>
        <p style={styles.subtext}>
          Describe what you're experiencing in your own words — English,
          Hindi, or Hinglish all work.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. mujhe dizziness ho rahi hai, or I have a mild headache and feel tired"
          style={styles.textarea}
          rows={3}
        />
        <button type="submit" style={styles.submitButton} disabled={loading}>
          {loading ? "Checking..." : "Get Guidance"}
        </button>
      </form>

      {error && <div style={styles.errorBox}>{error}</div>}

      {result && result.emergency && (
        <div style={styles.emergencyBox}>
          <strong>⚠ {result.message}</strong>
        </div>
      )}

      {result && !result.emergency && (
        <div style={styles.resultsWrap}>
          <p style={styles.disclaimer}>{result.disclaimer}</p>

          {result.matches.map((match, i) => (
            <div key={i} style={styles.matchCard}>
              <div style={styles.matchHeader}>
                <span style={styles.doshaTag}>{match.dosha_imbalance}</span>
                <span style={styles.confidence}>
                  {Math.round(match.confidence * 100)}% match
                </span>
              </div>
              <p style={styles.matchedSymptom}>
                Closest match: "{match.matched_symptom}"
              </p>
              <h3 style={styles.remedyName}>{match.recommended_plant}</h3>
              <p style={styles.therapyName}>{match.recommended_therapy}</p>

              {match.plant_details && (
                <div style={styles.remedyDetails}>
                  <p>
                    <strong>How to prepare:</strong>{" "}
                    {match.plant_details.preparation}
                  </p>
                  <p>
                    <strong>Dosage:</strong> {match.plant_details.dosage}
                  </p>
                  <p style={styles.safetyNote}>
                    <strong>Safety:</strong>{" "}
                    {match.plant_details.safety_notes}
                  </p>
                </div>
              )}

              {match.severity_flag === "medium" && (
                <p style={styles.mediumFlag}>
                  This may need closer attention — consider consulting a
                  doctor if it persists or worsens.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 640,
    margin: "0 auto",
    padding: "60px 24px",
    fontFamily: "sans-serif",
    color: "#2B2B24",
  },
  header: { textAlign: "center", marginBottom: 32 },
  eyebrow: {
    textTransform: "uppercase",
    fontSize: 13,
    letterSpacing: 1,
    color: "#D97742",
    fontWeight: 600,
  },
  h1: { fontFamily: "Georgia, serif", fontSize: 32, margin: "8px 0" },
  subtext: { color: "#6B6B5E", fontSize: 15 },
  form: { marginBottom: 24 },
  textarea: {
    width: "100%",
    padding: 16,
    borderRadius: 12,
    border: "1px solid #E4E0D5",
    fontSize: 15,
    fontFamily: "sans-serif",
    resize: "vertical",
    marginBottom: 12,
    boxSizing: "border-box",
  },
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
  emergencyBox: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: "#FDECEC",
    color: "#A33A3A",
    fontSize: 15,
    lineHeight: 1.6,
  },
  resultsWrap: { marginTop: 8 },
  disclaimer: {
    fontSize: 13,
    color: "#6B6B5E",
    marginBottom: 16,
    fontStyle: "italic",
  },
  matchCard: {
    border: "1px solid #EEEBE2",
    borderRadius: 14,
    padding: 20,
    marginBottom: 14,
  },
  matchHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  doshaTag: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    backgroundColor: "#EEF3EC",
    color: "#4B7A51",
  },
  confidence: { fontSize: 12, color: "#6B6B5E" },
  matchedSymptom: {
    fontSize: 13,
    color: "#6B6B5E",
    fontStyle: "italic",
    marginBottom: 8,
  },
  remedyName: {
    fontFamily: "Georgia, serif",
    fontSize: 20,
    margin: "0 0 4px 0",
  },
  therapyName: { fontSize: 14, color: "#3D3D33" },
  remedyDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid #F0EEE6",
    fontSize: 13,
    color: "#3D3D33",
    lineHeight: 1.6,
  },
  safetyNote: { color: "#946200" },
  mediumFlag: {
    marginTop: 10,
    fontSize: 13,
    color: "#946200",
    backgroundColor: "#FCEFE3",
    padding: "8px 12px",
    borderRadius: 8,
  },
};
