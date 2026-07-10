import { useState, useEffect } from "react";
import Link from "next/link";
import NavBar from "../components/NavBar";

const STORAGE_KEY = "natureveda_garden";

// Honest empty-state dashboard: no fabricated activity or points, since
// there's no backend tracking real usage yet. Real garden data is read
// from the same localStorage key My Garden writes to, so the two pages
// stay in sync instead of showing two different, disconnected lists.
export default function Dashboard() {
  const [tab, setTab] = useState("overview");
  const [garden, setGarden] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setGarden(JSON.parse(saved));
      } catch (e) {
        setGarden([]);
      }
    }
  }, []);

  const plantsGrowing = garden.filter((p) => p.status === "Growing").length;

  return (
    <div>
      <NavBar />
      <div className="page-container" style={styles.page}>
        <p style={styles.eyebrow}>Welcome Back</p>
        <h1 style={styles.h1}>Wellness Dashboard</h1>
        <p style={styles.subtext}>
          Track your herbal journey, manage therapies, and monitor your
          garden.
        </p>

        <div style={styles.statsGrid}>
          <StatCard label="Plants in Garden" value={garden.length} />
          <StatCard label="Currently Growing" value={plantsGrowing} />
          <StatCard label="Explore Plants" value="61" hint="in database" />
          <StatCard label="Therapies" value="89" hint="available" />
        </div>

        <div style={styles.tabRow}>
          {["overview", "garden"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                ...styles.tabButton,
                ...(tab === t ? styles.tabButtonActive : {}),
              }}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Get Started</h3>
            <p style={styles.emptyText}>
              Your wellness journey starts here. Try one of these:
            </p>
            <div style={styles.quickLinks}>
              <Link href="/dosha-assessment" style={styles.quickLink}>
                Take your Dosha Assessment →
              </Link>
              <Link href="/scanner" style={styles.quickLink}>
                Scan a plant →
              </Link>
              <Link href="/symptom-checker" style={styles.quickLink}>
                Check a symptom →
              </Link>
              <Link href="/my-garden" style={styles.quickLink}>
                Start your garden →
              </Link>
            </div>
          </div>
        )}

        {tab === "garden" && (
          <div style={styles.card}>
            <div style={styles.gardenHeader}>
              <h3 style={styles.cardTitle}>My Herbal Garden</h3>
              <Link href="/my-garden" style={styles.manageLink}>
                Manage Garden →
              </Link>
            </div>
            {garden.length === 0 ? (
              <p style={styles.emptyText}>
                No plants added yet.{" "}
                <Link href="/my-garden" style={styles.inlineLink}>
                  Add your first plant
                </Link>
                .
              </p>
            ) : (
              garden.map((plant) => (
                <div key={plant.id} style={styles.gardenRow}>
                  <span>{plant.name}</span>
                  <span style={styles.statusTag}>{plant.status}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, hint }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statLabel}>{label}</p>
      <p style={styles.statValue}>{value}</p>
      {hint && <p style={styles.statHint}>{hint}</p>}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 900,
    margin: "0 auto",
    padding: "60px 24px",
    fontFamily: "sans-serif",
    color: "#2B2B24",
  },
  eyebrow: {
    textTransform: "uppercase",
    fontSize: 13,
    letterSpacing: 1,
    color: "#4B7A51",
    fontWeight: 600,
  },
  h1: { fontFamily: "Georgia, serif", fontSize: 34, margin: "8px 0" },
  subtext: { color: "#6B6B5E", fontSize: 15, marginBottom: 28 },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 16,
    marginBottom: 28,
  },
  statCard: { border: "1px solid #EEEBE2", borderRadius: 14, padding: 18 },
  statLabel: { fontSize: 13, color: "#6B6B5E", margin: 0 },
  statValue: { fontFamily: "Georgia, serif", fontSize: 28, margin: "4px 0 0 0" },
  statHint: { fontSize: 11, color: "#8A8A7C", margin: "2px 0 0 0" },
  tabRow: { display: "flex", gap: 8, marginBottom: 20 },
  tabButton: {
    padding: "8px 18px",
    borderRadius: 999,
    border: "1px solid #E4E0D5",
    backgroundColor: "#FAFAF7",
    cursor: "pointer",
    fontSize: 14,
  },
  tabButtonActive: { backgroundColor: "#4B7A51", color: "#fff", borderColor: "#4B7A51" },
  card: { border: "1px solid #EEEBE2", borderRadius: 16, padding: 24 },
  cardTitle: { fontFamily: "Georgia, serif", fontSize: 20, marginBottom: 8 },
  emptyText: { color: "#6B6B5E", fontSize: 14, marginBottom: 16 },
  quickLinks: { display: "flex", flexDirection: "column", gap: 10 },
  quickLink: {
    color: "#4B7A51",
    textDecoration: "none",
    fontSize: 15,
    fontWeight: 600,
  },
  inlineLink: { color: "#4B7A51" },
  gardenHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  manageLink: { color: "#4B7A51", textDecoration: "none", fontSize: 13 },
  gardenRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #F0EEE6",
  },
  statusTag: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    backgroundColor: "#EEF3EC",
    color: "#4B7A51",
  },
};
