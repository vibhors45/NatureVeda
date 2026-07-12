import { useEffect, useState } from "react";
import "../styles/globals.css";
import Head from "next/head";

// Decorative floating leaves shown behind every page -- position,
// size, and timing vary per leaf so they don't all move in lockstep.
const LEAVES = [
  { left: "6%", size: 20, duration: 18, delay: 0 },
  { left: "18%", size: 14, duration: 24, delay: 3 },
  { left: "32%", size: 24, duration: 20, delay: 6 },
  { left: "48%", size: 16, duration: 26, delay: 1 },
  { left: "63%", size: 22, duration: 19, delay: 8 },
  { left: "78%", size: 15, duration: 23, delay: 4 },
  { left: "90%", size: 20, duration: 21, delay: 10 },
];

export default function App({ Component, pageProps }) {
  // Brief splash screen on first load: visible, then fades out, then
  // unmounts entirely so it doesn't sit in the DOM (or block clicks)
  // after it's done.
  const [splashPhase, setSplashPhase] = useState("visible");

  useEffect(() => {
    const fadeTimer = setTimeout(() => setSplashPhase("fading"), 1100);
    const removeTimer = setTimeout(() => setSplashPhase("gone"), 1500);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <>
      <Head>
        {/* Required for responsive scaling to actually work on mobile browsers */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <title>NatureVeda</title>
      </Head>

      {splashPhase !== "gone" && (
        <div
          className={
            "splash-screen" +
            (splashPhase === "fading" ? " splash-fade-out" : "")
          }
        >
          {/* Swap /logo.png for the real logo file once it's added to
              apps/web/public/ -- this just hides itself if missing so
              it never shows a broken-image icon in the meantime. */}
          <img
            src="/logo.png"
            alt="NatureVeda"
            className="splash-logo"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <p className="splash-title">NatureVeda</p>
        </div>
      )}

      {/* Shared ambient leaves layer -- one instance for the whole app
          instead of per-page, so it's consistent everywhere. */}
      <div className="site-leaves" aria-hidden="true">
        {LEAVES.map((leaf, i) => (
          <span
            key={i}
            className="site-leaf"
            style={{
              left: leaf.left,
              width: leaf.size,
              height: leaf.size,
              animationDuration: `${leaf.duration}s`,
              animationDelay: `${leaf.delay}s`,
            }}
          />
        ))}
      </div>

      <Component {...pageProps} />
    </>
  );
}