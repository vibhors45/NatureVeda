import NavBar from "../components/NavBar";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <NavBar />

      <div style={styles.heroOuter}>
        <div style={styles.heroGlassCard}>
          <p style={styles.eyebrow}>AYUSH · HOMEOPATHY · POWERED BY AI</p>
          <h1 style={styles.h1}>NatureVeda</h1>

          <p style={styles.shloka}>
            "स्वस्थस्य स्वास्थ्य रक्षणम्"
          </p>
          <p style={styles.shlokaTranslation}>
            "Protecting the health of the healthy" — Charaka Samhita
          </p>

          <p style={styles.subtext}>
            Bridging ancient Ayurvedic and Homeopathic wisdom with modern AI —
            identify medicinal plants, discover your unique dosha
            constitution, and get personalized traditional wellness guidance.
          </p>

          <div style={styles.ctaRow}>
            <Link href="/dosha-assessment" style={styles.primaryButton}>
              Take Free Dosha Assessment
            </Link>
            <Link href="/plants" style={styles.secondaryButton}>
              Explore Plants
            </Link>
          </div>
        </div>
      </div>

      <div style={styles.cardsGrid}>
        <FeatureCard
          title="Plant Explorer"
          description="Browse a curated database of AYUSH-approved medicinal plants with dosha, taste, and safety details."
          href="/plants"
          linkLabel="Explore Plants →"
        />
        <FeatureCard
          title="Symptom Guidance"
          description="Describe how you're feeling, in English, Hindi, or Hinglish, and get traditional remedy suggestions."
          href="/symptom-checker"
          linkLabel="Check Symptoms →"
        />
        <FeatureCard
          title="Dosha Assessment"
          description="A 20-question guided assessment to uncover your unique constitution and a personalized wellness plan."
          href="/dosha-assessment"
          linkLabel="Take Assessment →"
        />
        <FeatureCard
          title="Therapies"
          description="Evidence-informed herbal therapies with clear preparation, dosage, and safety guidance."
          href="/therapies"
          linkLabel="Browse Therapies →"
        />
        <FeatureCard
          title="Plant Scanner"
          description="Upload a photo of a leaf or plant to identify its species and Ayurvedic properties instantly."
          href="/scanner"
          linkLabel="Scan a Plant →"
        />
      </div>

      <p style={styles.disclaimer}>
        NatureVeda provides traditional wellness guidance rooted in
        Ayurveda and Homeopathy. It is not a substitute for professional
        medical advice, diagnosis, or treatment.
      </p>
    </div>
  );
}

function FeatureCard({ title, description, href, linkLabel }) {
  return (
    <div style={styles.card}>
      <h3 style={styles.cardTitle}>{title}</h3>
      <p style={styles.cardDescription}>{description}</p>
      <Link href={href} style={styles.cardLink}>
        {linkLabel}
      </Link>
    </div>
  );
}

const styles = {
  heroOuter: {
    padding: "60px 24px",
    background:
      "linear-gradient(135deg, #E8E2D0 0%, #D9E3D3 45%, #F0DCC0 100%)",
    display: "flex",
    justifyContent: "center",
  },
  heroGlassCard: {
    maxWidth: 680,
    width: "100%",
    textAlign: "center",
    padding: "48px 40px",
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(255, 255, 255, 0.6)",
    boxShadow: "0 8px 32px rgba(75, 122, 81, 0.12)",
    fontFamily: "sans-serif",
  },
  shloka: {
    fontFamily: "Georgia, serif",
    fontSize: 22,
    color: "#4B7A51",
    margin: "16px 0 4px 0",
  },
  shlokaTranslation: {
    fontSize: 13,
    color: "#8A8A7C",
    fontStyle: "italic",
    marginBottom: 20,
  },
  eyebrow: {
    textTransform: "uppercase",
    fontSize: 13,
    letterSpacing: 1.5,
    color: "#D97742",
    fontWeight: 600,
  },
  h1: {
    fontFamily: "Georgia, serif",
    fontSize: 56,
    margin: "12px 0",
    color: "#2B2B24",
  },
  subtext: {
    maxWidth: 560,
    margin: "0 auto 32px",
    color: "#6B6B5E",
    fontSize: 16,
    lineHeight: 1.6,
  },
  ctaRow: { display: "flex", justifyContent: "center", gap: 16, flexWrap: "wrap" },
  primaryButton: {
    padding: "14px 28px",
    borderRadius: 10,
    backgroundColor: "#4B7A51",
    color: "#fff",
    textDecoration: "none",
    fontSize: 15,
  },
  secondaryButton: {
    padding: "14px 28px",
    borderRadius: 10,
    border: "1px solid #4B7A51",
    color: "#4B7A51",
    textDecoration: "none",
    fontSize: 15,
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
    gap: 24,
    maxWidth: 1000,
    margin: "0 auto",
    padding: "40px 24px",
    fontFamily: "sans-serif",
  },
  card: {
    border: "1px solid #EEEBE2",
    borderRadius: 16,
    padding: 24,
  },
  cardTitle: { fontFamily: "Georgia, serif", fontSize: 20, marginBottom: 8 },
  cardDescription: { color: "#6B6B5E", fontSize: 14, lineHeight: 1.5, marginBottom: 16 },
  cardLink: { color: "#4B7A51", textDecoration: "none", fontSize: 14, fontWeight: 600 },
  disclaimer: {
    textAlign: "center",
    color: "#8A8A7C",
    fontSize: 12,
    fontFamily: "sans-serif",
    padding: "0 24px 60px",
    maxWidth: 600,
    margin: "0 auto",
  },
};
