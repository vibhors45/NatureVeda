import Link from "next/link";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/my-garden", label: "My Garden" },
  { href: "/plants", label: "Explore Plants" },
  { href: "/therapies", label: "Therapies" },
  { href: "/homeopathy", label: "Homeopathy" },
  { href: "/scanner", label: "Plant Scanner" },
  { href: "/symptom-checker", label: "Symptom Checker" },
  { href: "/report-scanner", label: "Report Scanner" },
  { href: "/dosha-assessment", label: "Dosha Assessment" },
  { href: "/signin", label: "Sign In" },
];

export default function NavBar() {
  return (
    <nav className="nav-bar" style={styles.nav}>
      <Link href="/" style={styles.logo}>
        NatureVeda
      </Link>
      <div className="nav-links" style={styles.linksWrap}>
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="nav-link" style={styles.link}>
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 32px",
    borderBottom: "1px solid #EEEBE2",
    fontFamily: "sans-serif",
    backgroundColor: "#FFFFFF",
  },
  logo: {
    fontFamily: "Georgia, serif",
    fontSize: 20,
    fontWeight: "bold",
    color: "#2B2B24",
    textDecoration: "none",
  },
  linksWrap: { display: "flex", gap: 24, flexWrap: "wrap" },
  link: {
    color: "#4B7A51",
    textDecoration: "none",
    fontSize: 14,
  },
};
