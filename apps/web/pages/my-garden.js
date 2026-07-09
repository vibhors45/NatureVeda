import { useState } from "react";
import NavBar from "../components/NavBar";

// Sample starting state — stored in browser state only for now, since
// there's no backend table for a user's garden yet. Structured to make
// swapping in a real Supabase-backed fetch/save straightforward later.
const initialGarden = [
  { id: 1, name: "Tulsi", status: "Growing", addedDate: "2026-06-01", careNote: "Water today" },
  { id: 2, name: "Ashwagandha", status: "Planning", addedDate: "2026-06-10", careNote: "Full sun" },
];

const STATUS_OPTIONS = ["Planning", "Growing", "Harvested"];

export default function MyGarden() {
  const [garden, setGarden] = useState(initialGarden);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPlantName, setNewPlantName] = useState("");

  function addPlant(e) {
    e.preventDefault();
    if (!newPlantName.trim()) return;

    setGarden([
      ...garden,
      {
        id: Date.now(),
        name: newPlantName.trim(),
        status: "Planning",
        addedDate: new Date().toISOString().split("T")[0],
        careNote: "Set up care schedule",
      },
    ]);
    setNewPlantName("");
    setShowAddForm(false);
  }

  function cycleStatus(id) {
    setGarden(
      garden.map((plant) => {
        if (plant.id !== id) return plant;
        const currentIndex = STATUS_OPTIONS.indexOf(plant.status);
        const nextStatus =
          STATUS_OPTIONS[(currentIndex + 1) % STATUS_OPTIONS.length];
        return { ...plant, status: nextStatus };
      })
    );
  }

  function removePlant(id) {
    setGarden(garden.filter((plant) => plant.id !== id));
  }

  return (
    <div>
      <NavBar />
      <div className="page-container" style={styles.page}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>Track Your Journey</p>
            <h1 style={styles.h1}>My Herbal Garden</h1>
            <p style={styles.subtext}>
              Keep track of the plants you're growing, planning, or have
              already harvested.
            </p>
          </div>
          <button
            style={styles.addButton}
            onClick={() => setShowAddForm(!showAddForm)}
          >
            + Add Plant
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={addPlant} style={styles.addForm}>
            <input
              type="text"
              placeholder="Plant name, e.g. Neem"
              value={newPlantName}
              onChange={(e) => setNewPlantName(e.target.value)}
              style={styles.addInput}
            />
            <button type="submit" style={styles.saveButton}>
              Save
            </button>
          </form>
        )}

        {garden.length === 0 && (
          <p style={styles.emptyState}>
            Your garden is empty — add your first plant to get started.
          </p>
        )}

        <div className="card-grid" style={styles.grid}>
          {garden.map((plant) => (
            <div key={plant.id} style={styles.card}>
              <span style={styles.statusTag(plant.status)}>
                {plant.status}
              </span>
              <h3 style={styles.cardTitle}>{plant.name}</h3>
              <p style={styles.addedDate}>Added {plant.addedDate}</p>
              <p style={styles.careNote}>{plant.careNote}</p>

              <div style={styles.cardActions}>
                <button
                  style={styles.updateButton}
                  onClick={() => cycleStatus(plant.id)}
                >
                  Update Status
                </button>
                <button
                  style={styles.removeButton}
                  onClick={() => removePlant(plant.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1000,
    margin: "0 auto",
    padding: "60px 24px",
    fontFamily: "sans-serif",
    color: "#2B2B24",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  eyebrow: {
    textTransform: "uppercase",
    fontSize: 13,
    letterSpacing: 1,
    color: "#4B7A51",
    fontWeight: 600,
  },
  h1: { fontFamily: "Georgia, serif", fontSize: 32, margin: "8px 0" },
  subtext: { color: "#6B6B5E", fontSize: 15, maxWidth: 420 },
  addButton: {
    padding: "12px 22px",
    borderRadius: 10,
    border: "none",
    backgroundColor: "#4B7A51",
    color: "#fff",
    fontSize: 14,
    cursor: "pointer",
    height: "fit-content",
  },
  addForm: { display: "flex", gap: 10, marginBottom: 24, flexWrap: "wrap" },
  addInput: {
    flex: 1,
    minWidth: 200,
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #E4E0D5",
    fontSize: 14,
  },
  saveButton: {
    padding: "10px 20px",
    borderRadius: 10,
    border: "none",
    backgroundColor: "#D97742",
    color: "#fff",
    fontSize: 14,
    cursor: "pointer",
  },
  emptyState: { color: "#8A8A7C", fontSize: 14 },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: 18,
  },
  card: {
    border: "1px solid #EEEBE2",
    borderRadius: 16,
    padding: 20,
  },
  statusTag: (status) => ({
    display: "inline-block",
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    marginBottom: 10,
    backgroundColor:
      status === "Growing" ? "#EEF3EC" : status === "Harvested" ? "#E8ECF5" : "#FCEFE3",
    color:
      status === "Growing" ? "#4B7A51" : status === "Harvested" ? "#3E5A9E" : "#D97742",
  }),
  cardTitle: { fontFamily: "Georgia, serif", fontSize: 20, margin: "0 0 4px 0" },
  addedDate: { fontSize: 12, color: "#8A8A7C", marginBottom: 6 },
  careNote: { fontSize: 13, color: "#3D3D33", marginBottom: 14 },
  cardActions: { display: "flex", gap: 8 },
  updateButton: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #4B7A51",
    backgroundColor: "transparent",
    color: "#4B7A51",
    fontSize: 13,
    cursor: "pointer",
  },
  removeButton: {
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid #E4E0D5",
    backgroundColor: "transparent",
    color: "#8A8A7C",
    fontSize: 13,
    cursor: "pointer",
  },
};
