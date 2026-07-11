import { useState } from "react";

// Converts a plant name like "Aloe Vera" into the expected image filename
// convention: "aloe_vera.jpg" -- matching the plant-images folder README.
function toImageSlug(name) {
  if (!name) return "unknown";
  return name.toLowerCase().trim().replace(/\s+/g, "_");
}

// Shows the plant's photo if one exists at /plant-images/<slug>.jpg (or
// .jpeg/.png), and falls back to a simple leaf placeholder if not --
// so the UI never breaks or shows a broken-image icon even before real
// photos have been added.
export default function PlantImage({ name, style }) {
  const [errorCount, setErrorCount] = useState(0);
  const slug = toImageSlug(name);
  const extensions = ["jpg", "jpeg", "png"];

  if (errorCount >= extensions.length) {
    return (
      <div style={{ ...styles.placeholder, ...style }}>
        <span style={styles.placeholderIcon}>🌿</span>
      </div>
    );
  }

  return (
    <img
      src={`/plant-images/${slug}.${extensions[errorCount]}`}
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