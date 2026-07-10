import { useState } from "react";

// The FastAPI backend runs on a different port than the Next.js dev
// server, so relative "/plant-images/..." URLs from the API response
// need this prefix. Change if your backend runs elsewhere / in prod.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

// Converts a plant name like "Aloe Vera" into the expected image filename
// convention: "aloe_vera.jpg" -- matching the plant-images folder README.
// Only used as a fallback when no explicit imageUrl is passed in (e.g.
// on the Explore Plants page, which doesn't have a scanned photo).
function toImageSlug(name) {
  return name.toLowerCase().trim().replace(/\s+/g, "_");
}

// Shows a plant's photo. Two modes:
//   1. Pass `imageUrl` (e.g. from the /api/plants/identify response) to
//      show that exact image -- this is what the scanner result uses,
//      since it already knows the real file that was matched.
//   2. Omit `imageUrl` and just pass `name` to fall back to guessing
//      /plant-images/<slug>.(jpg|jpeg|png) -- used on pages like
//      Explore Plants that don't have a specific photo from a scan.
// Falls back to a leaf placeholder if nothing loads, so the UI never
// shows a broken-image icon.
export default function PlantImage({ name, imageUrl, style }) {
  const [errorCount, setErrorCount] = useState(0);
  const slug = toImageSlug(name);
  const extensions = ["jpg", "jpeg", "png"];

  const resolvedSrc = imageUrl
    ? (imageUrl.startsWith("http") ? imageUrl : `${API_BASE_URL}${imageUrl}`)
    : `/plant-images/${slug}.${extensions[errorCount]}`;

  const outOfFallbacks = imageUrl ? errorCount >= 1 : errorCount >= extensions.length;

  if (outOfFallbacks) {
    return (
      <div style={{ ...styles.placeholder, ...style }}>
        <span style={styles.placeholderIcon}>🌿</span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={name}
      style={{ ...styles.image, ...style }}
      onError={() => setErrorCount((c) => c + 1)}
    />
  );
}

const styles = {
  image: {
    width: "100%",
    height: 140,
    objectFit: "cover",
    borderRadius: 12,
    backgroundColor: "#F0EEE6",
  },
  placeholder: {
    width: "100%",
    height: 140,
    borderRadius: 12,
    backgroundColor: "#EEF3EC",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderIcon: { fontSize: 32 },
};