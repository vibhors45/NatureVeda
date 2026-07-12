import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

function toImageSlug(name) {
  if (!name) return "unknown";
  return name.toLowerCase().trim().replace(/\s+/g, "_");
}

const SLUG_EXTENSIONS = ["jpg", "jpeg", "png"];

// Shows a plant's photo. Two modes:
//   1. `imageUrl` provided (from an API response, e.g. Report Scanner or
//      Explore Plants) -- shown directly, with its own failure tracking.
//   2. No `imageUrl` -- falls back to guessing /plant-images/<slug>.ext.
// These two modes use SEPARATE failure counters so that an early render
// without imageUrl (before an async fetch resolves) can't permanently
// block a real imageUrl from being tried once it arrives.
export default function PlantImage({ name, imageUrl, style }) {
  const [urlFailed, setUrlFailed] = useState(false);
  const [slugAttempt, setSlugAttempt] = useState(0);

  useEffect(() => {
    if (imageUrl) {
      setUrlFailed(false);
    }
  }, [imageUrl]);

  if (imageUrl && !urlFailed) {
    const resolvedSrc = imageUrl.startsWith("http")
      ? imageUrl
      : `${API_BASE_URL}${imageUrl}`;

    return (
      <img
        src={resolvedSrc}
        alt={name || "plant"}
        style={{ ...styles.image, ...style }}
        onError={() => setUrlFailed(true)}
      />
    );
  }

  const slug = toImageSlug(name);

  if (slugAttempt >= SLUG_EXTENSIONS.length) {
    return (
      <div style={{ ...styles.placeholder, ...style }}>
        <span style={styles.placeholderIcon}>🌿</span>
      </div>
    );
  }

  return (
    <img
      src={`/plant-images/${slug}.${SLUG_EXTENSIONS[slugAttempt]}`}
      alt={name || "plant"}
      style={{ ...styles.image, ...style }}
      onError={() => setSlugAttempt((c) => c + 1)}
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