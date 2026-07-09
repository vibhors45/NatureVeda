import { useEffect, useState } from "react";
import NavBar from "../components/NavBar";

export default function PlantExplorer() {
  const [plants, setPlants] = useState([]);
  const [search, setSearch] = useState("");
  const [doshaFilter, setDoshaFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data/plants.json")
      .then((r) => r.json())
      .then((data) => {
        setPlants(data);
        setLoading(false);
      });
  }, []);

  const doshaOptions = ["All", "Vata", "Pitta", "Kapha", "Tridoshic"];

  const filtered = plants.filter((plant) => {
    const matchesSearch =
      search.trim() === "" ||
      plant.name.toLowerCase().includes(search.toLowerCase()) ||
      plant.sanskrit_name.toLowerCase().includes(search.toLowerCase()) ||
      plant.scientific_name.toLowerCase().includes(search.toLowerCase()) ||
      plant.key_benefits.toLowerCase().includes(search.toLowerCase());

    const matchesDosha =
      doshaFilter === "All" || plant.dosha_effect === doshaFilter;

    return matchesSearch && matchesDosha;
  });

  if (loading) {
    return <div className="page-container" style={styles.page}>Loading plant database...</div>;
  }

  return (
    <div>
      <NavBar />
      <div className="page-container" style={styles.page}>
      <div style={styles.header}>
        <p style={styles.eyebrow}>Botanical Wisdom</p>
        <h1 style={styles.h1}>Explore Medicinal Plants</h1>
        <p style={styles.subtext}>
          Dive into our database of AYUSH-approved medicinal plants —
          {" "}{plants.length} species and counting.
        </p>
      </div>

      <div style={styles.searchBar}>
        <input
          type="text"
          placeholder="Search plants by name, benefits, or Sanskrit name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      <div style={styles.filterRow}>
        {doshaOptions.map((option) => (
          <button
            key={option}
            onClick={() => setDoshaFilter(option)}
            style={{
              ...styles.filterPill,
              ...(doshaFilter === option ? styles.filterPillActive : {}),
            }}
          >
            {option}
          </button>
        ))}
      </div>

      <p style={styles.resultCount}>
        {filtered.length} plant{filtered.length !== 1 ? "s" : ""} found
      </p>

      <div className="card-grid" style={styles.grid}>
        {filtered.map((plant) => (
          <PlantCard key={plant.name} plant={plant} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p style={styles.emptyState}>
          No plants match your search. Try a different term or filter.
        </p>
      )}
      </div>
    </div>
  );
}

function PlantCard({ plant }) {
  const benefits = plant.key_benefits.split(",").map((b) => b.trim());

  return (
    <div style={styles.card}>
      <div style={styles.cardTags}>
        <span style={styles.tag}>{plant.dosha_effect}</span>
        <span style={styles.tagOutline}>{plant.virya}</span>
      </div>

      <h3 style={styles.cardTitle}>{plant.name}</h3>
      <p style={styles.sanskritName}>
        {plant.sanskrit_name} ({plant.scientific_name})
      </p>

      <div style={styles.benefitTags}>
        {benefits.slice(0, 3).map((b) => (
          <span key={b} style={styles.benefitTag}>
            {b}
          </span>
        ))}
      </div>

      <div style={styles.cardDetails}>
        <p>
          <strong>Preparation:</strong> {plant.preparation}
        </p>
        <p>
          <strong>Dosage:</strong> {plant.dosage}
        </p>
        <p style={styles.safetyNote}>
          <strong>Safety:</strong> {plant.safety_notes}
        </p>
      </div>

      <div style={styles.cardFooter}>
        <span style={styles.difficultyBadge}>{plant.difficulty_level}</span>
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
  header: { textAlign: "center", marginBottom: 32 },
  eyebrow: {
    textTransform: "uppercase",
    fontSize: 13,
    letterSpacing: 1,
    color: "#D97742",
    fontWeight: 600,
  },
  h1: {
    fontFamily: "Georgia, serif",
    fontSize: 36,
    margin: "8px 0",
  },
  subtext: { color: "#6B6B5E", fontSize: 15 },
  searchBar: { marginBottom: 16 },
  searchInput: {
    width: "100%",
    padding: "14px 18px",
    borderRadius: 12,
    border: "1px solid #E4E0D5",
    fontSize: 15,
  },
  filterRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 8,
  },
  filterPill: {
    padding: "8px 16px",
    borderRadius: 999,
    border: "1px solid #E4E0D5",
    backgroundColor: "#FAFAF7",
    cursor: "pointer",
    fontSize: 14,
  },
  filterPillActive: {
    backgroundColor: "#4B7A51",
    color: "#fff",
    borderColor: "#4B7A51",
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
  cardTags: { display: "flex", gap: 6, marginBottom: 10 },
  tag: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    backgroundColor: "#EEF3EC",
    color: "#4B7A51",
  },
  tagOutline: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #E4E0D5",
    color: "#6B6B5E",
  },
  cardTitle: {
    fontFamily: "Georgia, serif",
    fontSize: 22,
    margin: "0 0 4px 0",
  },
  sanskritName: { color: "#6B6B5E", fontSize: 13, marginBottom: 12 },
  benefitTags: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 },
  benefitTag: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    backgroundColor: "#FCEFE3",
    color: "#D97742",
  },
  cardDetails: { fontSize: 13, lineHeight: 1.6, color: "#3D3D33" },
  safetyNote: { color: "#946200", fontSize: 12, marginTop: 6 },
  cardFooter: { marginTop: 14 },
  difficultyBadge: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    backgroundColor: "#F0F0EA",
    color: "#6B6B5E",
  },
  emptyState: { textAlign: "center", color: "#6B6B5E", marginTop: 40 },
};
