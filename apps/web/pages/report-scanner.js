import { useState } from "react";
import NavBar from "../components/NavBar";
import PlantImage from "../components/PlantImage";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export default function ReportScanner() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [expandedKey, setExpandedKey] = useState(null);

  function handleFileChange(e) {
    setFile(e.target.files[0]);
    setResult(null);
    setError(null);
    setExpandedKey(null);
  }

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setExpandedKey(null);

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

  function toggleExpanded(key) {
    setExpandedKey((current) => (current === key ? null : key));
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
        <p style={styles.hint}>
          Works best with clear, printed or clearly-scanned lab reports that
          use a Test / Result / Unit / Reference Range table layout — e.g.
          CBC, lipid profile, thyroid panel, blood sugar, or liver/kidney
          function reports. Blurry photos or handwritten reports may not
          parse well.
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
                    <p style={styles.suggestionLabel}>Ayurvedic Guidance</p>
                    <div style={styles.plantCardRow}>
                      {row.suggested_plants.map((p, j) => {
                        const key = `${i}-${j}`;
                        const isOpen = expandedKey === key;
                        return (
                          <div key={key} style={styles.plantCardWrap}>
                            <button
                              onClick={() => toggleExpanded(key)}
                              style={styles.plantCard}
                            >
                              <PlantImage
                                name={p.name}
                                imageUrl={p.image}
                                style={styles.plantThumb}
                              />
                              <span style={styles.plantCardName}>{p.name}</span>
                              <span style={styles.plantCardHint}>
                                {isOpen ? "Tap to close" : "Tap for full remedy"}
                              </span>
                            </button>

                            {isOpen && (
                              <div style={styles.plantExpanded}>
                                <p>
                                  <strong>Preparation:</strong> {p.preparation}
                                </p>
                                <p>
                                  <strong>Dosage:</strong> {p.dosage}
                                </p>
                                {p.duration && (
                                  <p>
                                    <strong>Duration:</strong> {p.duration}
                                  </p>
                                )}
                                {p.safety_notes && (
                                  <p style={styles.safetyNote}>
                                    <strong>Safety:</strong> {p.safety_notes}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {row.suggested_homeopathy && row.suggested_homeopathy.length > 0 && (
                  <div style={styles.homeopathyBox}>
                    <p style={styles.homeopathyLabel}>Homeopathic Options</p>
                    {row.suggested_homeopathy.map((remedy, j) => (
                      <div key={j} style={styles.homeopathyItem}>
                        <div style={styles.homeopathyItemHeader}>
                          <strong>{remedy.remedy_name}</strong>
                          <span style={styles.potencyTag}>
                            {remedy.potency_common}
                          </span>
                        </div>
                        <p style={styles.homeopathyIndication}>
                          {remedy.key_symptoms_indicated}
                        </p>
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
  subtext: { color: "#6B6B5E", fontSize: 15, marginBottom: 8 },
  hint: {
    color: "#8A8A7C",
    fontSize: 12.5,
    marginBottom: 24,
    lineHeight: 1.5,
  },
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
    marginBottom: 8,
  },
  plantCardRow: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  plantCardWrap: { width: 120 },
  plantCard: {
    width: "100%",
    border: "1px solid #EEEBE2",
    borderRadius: 12,
    padding: 8,
    backgroundColor: "#fff",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    font: "inherit",
  },
  plantThumb: { width: "100%", height: 72, borderRadius: 8, marginBottom: 2 },
  plantCardName: {
    fontSize: 12.5,
    fontWeight: 600,
    color: "#2B2B24",
    textAlign: "center",
  },
  plantCardHint: {
    fontSize: 10.5,
    color: "#8A8A7C",
  },
  plantExpanded: {
    marginTop: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FCF7EE",
    border: "1px solid #F0EBD8",
    fontSize: 12.5,
    color: "#3D3D33",
    lineHeight: 1.5,
    width: 260,
  },
  safetyNote: { color: "#946200" },
  homeopathyBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTop: "1px solid #F0EEE6",
  },
  homeopathyLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#4B7A51",
    marginBottom: 6,
  },
  homeopathyItem: {
    backgroundColor: "#EEF3EC",
    border: "1px solid #D9E5D6",
    borderRadius: 10,
    padding: "8px 10px",
    marginBottom: 6,
  },
  homeopathyItemHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    fontSize: 13,
    color: "#3D3D33",
  },
  potencyTag: {
    fontSize: 11,
    padding: "2px 8px",
    borderRadius: 999,
    backgroundColor: "#FCEFE3",
    color: "#D97742",
  },
  homeopathyIndication: {
    fontSize: 12.5,
    color: "#6B6B5E",
    margin: "4px 0 0 0",
  },
};