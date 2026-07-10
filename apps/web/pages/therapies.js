import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";

export default function Therapies() {
  const [therapies, setTherapies] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/data/symptom_remedy_pairs.json").then((r) => r.json()),
      fetch("/data/plants.json").then((r) => r.json()),
    ]).then(([symptomPairs, plants]) => {
      // Build a unique list of therapies, each linked to its plant's
      // full preparation/dosage/safety details.
      const seen = new Set();
      const uniqueTherapies = [];

      symptomPairs.forEach((pair) => {
        if (!pair.recommended_therapy || seen.has(pair.recommended_therapy)) return;
        seen.add(pair.recommended_therapy);

        const plant = plants.find(
          (p) => p.name.toLowerCase() === (pair.recommended_plant || "").toLowerCase()
        );

        uniqueTherapies.push({
          therapyName: pair.recommended_therapy,
          plantName: pair.recommended_plant,
          doshaImbalance: pair.dosha_imbalance,
          plant,
        });
      });

      setTherapies(uniqueTherapies);
      setLoading(false);
    });
  }, []);

  const filtered = therapies.filter((t) => {
    if (search.trim() === "") return true;
    const s = search.toLowerCase();
    return (
      t.therapyName.toLowerCase().includes(s) ||
      (t.plantName || "").toLowerCase().includes(s)
    );
  });

  if (loading) {
    return (
      <div>
        <NavBar />
        <p style={{ textAlign: "center", padding: 60 }}>Loading therapies...</p>
      </div>
    );
  }

  return (
    <div>
      <NavBar />
      <div className="page-container" style={styles.page}>
        <div style={styles.header}>
          <p style={styles.eyebrow}>Natural Healing</p>
          <h1 style={styles.h1}>Personalized Therapies</h1>
          <p style={styles.subtext}>
            Evidence-informed herbal therapies rooted in Ayurvedic
            tradition, each with clear preparation, dosage, and safety
            guidance.
          </p>
        </div>

        <input
          type="text"
          placeholder="Search therapies by name or plant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />

        <p style={styles.resultCount}>
          {filtered.length} therap{filtered.length !== 1 ? "ies" : "y"} found
        </p>

        <div className="card-grid" style={styles.grid}>
          {filtered.map((t, i) => (
            <div key={i} style={styles.card}>
              {t.doshaImbalance && (
                <span style={styles.doshaTag}>{t.doshaImbalance}</span>
              )}
              <h3 style={styles.cardTitle}>{t.therapyName}</h3>
              <p style={styles.plantLine}>Using {t.plantName}</p>

              {t.plant ? (
                <div style={styles.details}>
                  <p>
                    <strong>Preparation:</strong> {t.plant.preparation}
                  </p>
                  <p>
                    <strong>Dosage:</strong> {t.plant.dosage}
                  </p>
                  <p>
                    <strong>Duration:</strong> {t.plant.duration}
                  </p>
                  <p style={styles.safetyNote}>
                    <strong>Safety:</strong> {t.plant.safety_notes}
                  </p>
                </div>
              ) : (
                <p style={styles.noDetails}>
                  Detailed preparation info not available for this plant yet.
                </p>
              )}
            </div>
          ))}
        </div>
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
    color: "#4B7A51",
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
  },
  card: {
    border: "1px solid #EEEBE2",
    borderRadius: 16,
    padding: 20,
    backgroundColor: "#fff",
  },
  doshaTag: {
    display: "inline-block",
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    backgroundColor: "#EEF3EC",
    color: "#4B7A51",
    marginBottom: 10,
  },
  cardTitle: { fontFamily: "Georgia, serif", fontSize: 19, margin: "0 0 4px 0" },
  plantLine: { fontSize: 13, color: "#8A8A7C", marginBottom: 12 },
  details: { fontSize: 13, color: "#3D3D33", lineHeight: 1.7 },
  safetyNote: { color: "#946200" },
  noDetails: { fontSize: 13, color: "#8A8A7C", fontStyle: "italic" },
};
