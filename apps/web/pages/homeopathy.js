import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";

export default function HomeopathyRemedies() {
  const [remedies, setRemedies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/homeopathy_remedies.json")
      .then((r) => r.json())
      .then((data) => {
        setRemedies(data);
        setLoading(false);
      });
  }, []);

  const filtered = remedies.filter((r) => {
    if (search.trim() === "") return true;
    const s = search.toLowerCase();
    return (
      r.remedy_name.toLowerCase().includes(s) ||
      r.key_symptoms_indicated.toLowerCase().includes(s) ||
      r.source_substance.toLowerCase().includes(s)
    );
  });

  if (loading) {
    return (
      <div>
        <NavBar />
        <p style={{ textAlign: "center", padding: 60 }}>Loading remedies...</p>
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <div className="page-container" style={styles.page}>
        <div style={styles.header}>
          <p style={styles.eyebrow}>Homeopathic Wisdom</p>
          <h1 style={styles.h1}>Materia Medica</h1>
          <p style={styles.subtext}>
            Explore {remedies.length} classical homeopathic remedies, drawn
            from established public-domain references such as Boericke's
            Materia Medica.
          </p>
        </div>

        <input
          type="text"
          placeholder="Search by remedy name, symptoms, or source..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />

        <p style={styles.resultCount}>
          {filtered.length} remed{filtered.length !== 1 ? "ies" : "y"} found
        </p>

        <div style={styles.grid}>
          {filtered.map((r) => (
            <div key={r.remedy_name} style={styles.card}>
              <h3 style={styles.cardTitle}>{r.remedy_name}</h3>
              <p style={styles.source}>{r.source_substance}</p>
              <p style={styles.symptoms}>{r.key_symptoms_indicated}</p>
              <div style={styles.footer}>
                <span style={styles.potencyTag}>{r.potency_common}</span>
              </div>
              <p style={styles.usageNote}>{r.usage_notes}</p>
            </div>
          ))}
        </div>

        <p style={styles.disclaimer}>
          Homeopathic remedy information is provided for educational
          purposes and traditional reference only. It is not a substitute
          for professional medical advice — consult a qualified homeopathic
          practitioner before use.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "60px 24px",
    fontFamily: "sans-serif",
    color: "#2B2B24",
  },
  header: { textAlign: "center", marginBottom: 28 },
  eyebrow: {
    textTransform: "uppercase",
    fontSize: 13,
    letterSpacing: 1,
    color: "#D97742",
    fontWeight: 600,
  },
  h1: { fontFamily: "Georgia, serif", fontSize: 36, margin: "8px 0" },
  subtext: { color: "#6B6B5E", fontSize: 15, maxWidth: 560, margin: "0 auto" },
  searchInput: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 12,
    border: "1px solid #E4E0D5",
    fontSize: 15,
    marginBottom: 8,
    boxSizing: "border-box",
  },
  resultCount: { color: "#6B6B5E", fontSize: 13, marginBottom: 20 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
    gap: 20,
    marginBottom: 40,
  },
  card: {
    border: "1px solid #EEEBE2",
    borderRadius: 16,
    padding: 20,
    backgroundColor: "#fff",
  },
  cardTitle: { fontFamily: "Georgia, serif", fontSize: 20, margin: "0 0 4px 0" },
  source: { fontSize: 13, color: "#6B6B5E", marginBottom: 10, fontStyle: "italic" },
  symptoms: { fontSize: 14, color: "#3D3D33", marginBottom: 12, lineHeight: 1.5 },
  footer: { marginBottom: 10 },
  potencyTag: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    backgroundColor: "#FCEFE3",
    color: "#D97742",
  },
  usageNote: { fontSize: 12, color: "#8A8A7C", lineHeight: 1.5 },
  disclaimer: {
    textAlign: "center",
    color: "#8A8A7C",
    fontSize: 12,
    maxWidth: 600,
    margin: "0 auto",
  },
};
