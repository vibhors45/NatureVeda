import { useState } from "react";
import NavBar from "../components/NavBar";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export default function ReportScanner() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  function handleFileChange(e) {
    setFile(e.target.files[0]);
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
      const res = await fetch(`${API_BASE}/api/reports/scan`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(
        "Couldn't reach the report scanning service. Make sure the backend " +
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
        <p style={styles.eyebrow}>Report Analysis</p>
        <h1 style={styles.h1}>Scan Your Health Report</h1>
        <p style={styles.subtext}>
          Upload a PDF, PNG, or JPEG lab report to see which values fall
          outside their reference range.
        </p>

        <div style={styles.uploadBox}>
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            style={styles.fileInput}
          />
          <button
            onClick={handleSubmit}
            disabled={!file || loading}
            style={styles.submitButton}
          >
            {loading ? "Scanning..." : "Scan Report"}
          </button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        {result && result.error && (
          <div style={styles.errorBox}>{result.error}</div>
        )}

        {result && result.parsed_rows && (
          <div style={styles.resultsWrap}>
            <p style={styles.disclaimer}>{result.disclaimer}</p>

            {result.parsed_rows.length === 0 && (
              <p style={styles.emptyState}>
                No recognizable test rows were found in this report. Try a
                clearer scan, or a different file format.
              </p>
            )}

            {result.parsed_rows.map((row, i) => (
              <div
                key={i}
                style={{
                  ...styles.rowCard,
                  ...(row.flag === "high" || row.flag === "low"
                    ? styles.rowCardFlagged
                    : {}),
                }}
              >
                <div style={styles.rowHeader}>
                  <span style={styles.testName}>{row.test_name}</span>
                  <span style={styles.flagTag(row.flag)}>{row.flag}</span>
                </div>
                <p style={styles.rowDetail}>
                  {row.result} {row.unit} — reference: {row.reference_range}
                </p>
                {row.suggested_plants && row.suggested_plants.length > 0 && (
                  <div style={styles.suggestionBox}>
                    <p style={styles.suggestionLabel}>Traditional guidance:</p>
                    {row.suggested_plants.map((p, j) => (
                      <div key={j} style={styles.suggestionItem}>
                        <strong>{p.name}</strong> — {p.preparation}{" "}
                        <span style={styles.dosageText}>({p.dosage})</span>
                      </div>
                    ))}
                  </div>
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
    maxWidth: 620,
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
    textAlign: "left",
  },
  resultsWrap: { textAlign: "left" },
  disclaimer: {
    fontSize: 13,
    color: "#6B6B5E",
    fontStyle: "italic",
    marginBottom: 16,
  },
  emptyState: { color: "#8A8A7C", fontSize: 14 },
  rowCard: {
    border: "1px solid #EEEBE2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  rowCardFlagged: {
    borderColor: "#F0C37A",
    backgroundColor: "#FCF7EE",
  },
  rowHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  testName: { fontWeight: 600, fontSize: 14 },
  flagTag: (flag) => ({
    fontSize: 12,
    padding: "2px 10px",
    borderRadius: 999,
    backgroundColor:
      flag === "high" || flag === "low" ? "#F0C37A" : "#EEF3EC",
    color: flag === "high" || flag === "low" ? "#6B4A00" : "#4B7A51",
  }),
  rowDetail: { fontSize: 13, color: "#6B6B5E" },
  suggestionBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: "1px solid #F0EEE6",
  },
  suggestionLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#946200",
    marginBottom: 4,
  },
  suggestionItem: { fontSize: 13, color: "#3D3D33", marginBottom: 4 },
  dosageText: { color: "#8A8A7C" },
};
