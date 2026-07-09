import { useState } from "react";
import NavBar from "../components/NavBar";

// NOTE: This dashboard uses local sample state for now since there's no
// backend persistence layer yet for user activity/garden/points. Once
// Supabase tables exist for these, replace the sampleData below with
// real fetches. Structure is built to make that swap straightforward.
const sampleData = {
  ecoPoints: 450,
  plantsScanned: 6,
  therapiesActive: 2,
  dayStreak: 3,
  weeklyGoals: [
    { label: "Therapy Compliance", percent: 70 },
    { label: "Community Helper", percent: 20 },
    { label: "Plant Research", percent: 45 },
  ],
  recentActivity: [
    { text: "Scanned Neem Plant", time: "2 hours ago", points: 50 },
    { text: "Completed Tulsi Therapy", time: "Yesterday", points: 100 },
    { text: "Took Dosha Assessment", time: "3 days ago", points: 150 },
  ],
  myGarden: [
    { name: "Tulsi", status: "Growing" },
    { name: "Ashwagandha", status: "Planning" },
  ],
};

export default function Dashboard() {
  const [tab, setTab] = useState("overview");

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
          <StatCard label="EcoPoints" value={sampleData.ecoPoints} />
          <StatCard label="Plants Scanned" value={sampleData.plantsScanned} />
          <StatCard label="Active Therapies" value={sampleData.therapiesActive} />
          <StatCard label="Day Streak" value={sampleData.dayStreak} />
        </div>

        <div style={styles.tabRow}>
          {["overview", "garden", "activity"].map((t) => (
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
            <h3 style={styles.cardTitle}>Weekly Goals</h3>
            {sampleData.weeklyGoals.map((goal) => (
              <div key={goal.label} style={{ marginBottom: 14 }}>
                <div style={styles.goalLabelRow}>
                  <span>{goal.label}</span>
                  <span>{goal.percent}%</span>
                </div>
                <div style={styles.barTrack}>
                  <div
                    style={{ ...styles.barFill, width: `${goal.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "garden" && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>My Herbal Garden</h3>
            {sampleData.myGarden.map((plant) => (
              <div key={plant.name} style={styles.gardenRow}>
                <span>{plant.name}</span>
                <span style={styles.statusTag}>{plant.status}</span>
              </div>
            ))}
          </div>
        )}

        {tab === "activity" && (
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>Recent Activity</h3>
            {sampleData.recentActivity.map((item, i) => (
              <div key={i} style={styles.activityRow}>
                <div>
                  <p style={{ margin: 0 }}>{item.text}</p>
                  <p style={styles.activityTime}>{item.time}</p>
                </div>
                <span style={styles.pointsTag}>+{item.points} pts</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div style={styles.statCard}>
      <p style={styles.statLabel}>{label}</p>
      <p style={styles.statValue}>{value}</p>
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
  statCard: {
    border: "1px solid #EEEBE2",
    borderRadius: 14,
    padding: 18,
  },
  statLabel: { fontSize: 13, color: "#6B6B5E", margin: 0 },
  statValue: {
    fontFamily: "Georgia, serif",
    fontSize: 28,
    margin: "4px 0 0 0",
  },
  tabRow: { display: "flex", gap: 8, marginBottom: 20 },
  tabButton: {
    padding: "8px 18px",
    borderRadius: 999,
    border: "1px solid #E4E0D5",
    backgroundColor: "#FAFAF7",
    cursor: "pointer",
    fontSize: 14,
  },
  tabButtonActive: {
    backgroundColor: "#4B7A51",
    color: "#fff",
    borderColor: "#4B7A51",
  },
  card: {
    border: "1px solid #EEEBE2",
    borderRadius: 16,
    padding: 24,
  },
  cardTitle: { fontFamily: "Georgia, serif", fontSize: 20, marginBottom: 16 },
  goalLabelRow: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 14,
    marginBottom: 4,
  },
  barTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "#EEEBE2",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: { height: "100%", backgroundColor: "#4B7A51" },
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
  activityRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #F0EEE6",
  },
  activityTime: { fontSize: 12, color: "#8A8A7C", margin: "2px 0 0 0" },
  pointsTag: {
    fontSize: 12,
    padding: "4px 10px",
    borderRadius: 999,
    backgroundColor: "#FCEFE3",
    color: "#D97742",
  },
};
