import { useState } from "react";
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
  const [open, setOpen] = useState(false);

  return (
    <nav className="nav-bar" style={styles.nav}>
      <div style={styles.topRow}>
        <Link href="/" style={styles.logo} onClick={() => setOpen(false)}>
          NatureVeda
        </Link>

        {/* Desktop links -- hidden on mobile via CSS below */}
        <div className="nav-links-desktop" style={styles.linksWrap}>
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="nav-link" style={styles.link}>
              {link.label}
            </Link>
          ))}
        </div>

        {/* Hamburger -- hidden on desktop via CSS below */}
        <button
          className="nav-hamburger"
          style={styles.hamburger}
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <span style={{ ...styles.hamburgerBar, ...(open ? styles.hamburgerBarTop : {}) }} />
          <span style={{ ...styles.hamburgerBar, ...(open ? styles.hamburgerBarHide : {}) }} />
          <span style={{ ...styles.hamburgerBar, ...(open ? styles.hamburgerBarBottom : {}) }} />
        </button>
      </div>

      {/* Mobile dropdown menu -- only rendered on small screens (CSS-controlled) */}
      <div
        className="nav-links-mobile"
        style={{
          ...styles.mobileMenu,
          maxHeight: open ? 600 : 0,
        }}
      >
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            style={styles.mobileLink}
            onClick={() => setOpen(false)}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <style jsx>{`
        .nav-hamburger {
          display: none;
        }
        @media (max-width: 860px) {
          .nav-links-desktop {
            display: none !important;
          }
          .nav-hamburger {
            display: flex !important;
          }
        }
        @media (min-width: 861px) {
          .nav-links-mobile {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}

const styles = {
  nav: {
    borderBottom: "1px solid #EEEBE2",
    fontFamily: "sans-serif",
    backgroundColor: "#FFFFFF",
    position: "sticky",
    top: 0,
    zIndex: 50,
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
  },
  logo: {
    fontFamily: "Georgia, serif",
    fontSize: 20,
    fontWeight: "bold",
    color: "#2B2B24",
    textDecoration: "none",
  },
  linksWrap: { display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" },
  link: {
    color: "#4B7A51",
    textDecoration: "none",
    fontSize: 14,
  },
  hamburger: {
    flexDirection: "column",
    justifyContent: "center",
    gap: 5,
    width: 32,
    height: 32,
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
  },
  hamburgerBar: {
    display: "block",
    width: "100%",
    height: 2,
    backgroundColor: "#2B2B24",
    borderRadius: 2,
    transition: "transform 0.2s ease, opacity 0.2s ease",
  },
  hamburgerBarTop: { transform: "translateY(7px) rotate(45deg)" },
  hamburgerBarHide: { opacity: 0 },
  hamburgerBarBottom: { transform: "translateY(-7px) rotate(-45deg)" },
  mobileMenu: {
    overflow: "hidden",
    transition: "max-height 0.25s ease",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#FFFFFF",
    borderTop: "1px solid #EEEBE2",
  },
  mobileLink: {
    padding: "14px 24px",
    color: "#2B2B24",
    textDecoration: "none",
    fontSize: 15,
    borderBottom: "1px solid #F5F3EC",
  },
};