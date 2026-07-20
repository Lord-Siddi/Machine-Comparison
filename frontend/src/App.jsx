// src/App.jsx
//
// Dynamic equipment detail page stand-in. Loads all available catalog items
// from the backend, groups them by Category -> Subcategory, and allows you to
// choose and compare any industrial instrument.

import React, { useState, useEffect } from "react";
import CompareButton from "./CompareButton";
import { fetchCatalog } from "./compareApi";

export default function App() {
  const [catalog, setCatalog] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const data = await fetchCatalog();
        setCatalog(data);
        if (data.length > 0) {
          // Default to the first element
          setSelectedId(data[0].id);
        }
      } catch (err) {
        console.error("Failed to load catalog:", err);
        setError("Could not load catalog. Please verify your backend server is running.");
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const selected = catalog.find((m) => m.id === selectedId);

  // Group catalog by Category -> Subcategory
  const grouped = {};
  catalog.forEach((m) => {
    const cat = m.category || "General";
    const sub = m.subcategory || "Uncategorized";
    if (!grouped[cat]) grouped[cat] = {};
    if (!grouped[cat][sub]) grouped[cat][sub] = [];
    grouped[cat][sub].push(m);
  });

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.centered}>Loading equipment catalog...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Industrial Instrumentation Catalog</h1>
        <p style={styles.subtitle}>Select any industrial device to compare specs side-by-side using Gemini AI</p>
      </header>

      <div style={styles.pickerBox}>
        <label style={styles.label}>
          Select Equipment:{" "}
          <select 
            style={styles.select} 
            value={selectedId} 
            onChange={(e) => setSelectedId(e.target.value)}
          >
            {Object.entries(grouped).map(([category, subcategories]) => (
              Object.entries(subcategories).map(([subcategory, items]) => (
                <optgroup key={`${category}-${subcategory}`} label={`${category} ➔ ${subcategory}`}>
                  {items.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.company} {m.model} (ID: {m.id})
                    </option>
                  ))}
                </optgroup>
              ))
            ))}
          </select>
        </label>
      </div>

      {selected && (
        <div style={styles.detailCard}>
          <div style={styles.cardHeader}>
            <span style={styles.badge}>{selected.category}</span>
            {selected.subcategory && (
              <span style={styles.subbadge}>{selected.subcategory}</span>
            )}
          </div>
          <h2 style={styles.cardTitle}>
            {selected.company} <span style={styles.cardModel}>{selected.model}</span>
          </h2>
          <p style={styles.cardMeta}>Equipment ID: <strong style={{ color: "#4f46e5" }}>{selected.id}</strong></p>
          
          <div style={styles.buttonWrapper}>
            <CompareButton equipmentId={selected.id} />
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 750,
    margin: "40px auto",
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    padding: "0 20px",
    color: "#333",
  },
  header: {
    marginBottom: 30,
    textAlign: "center",
  },
  title: {
    fontSize: "2rem",
    fontWeight: 700,
    color: "#1e293b",
    margin: "0 0 8px 0",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#64748b",
    margin: 0,
  },
  pickerBox: {
    background: "#f8fafc",
    padding: 20,
    borderRadius: 12,
    border: "1px solid #e2e8f0",
    marginBottom: 24,
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    fontWeight: 600,
    color: "#475569",
    fontSize: "0.95rem",
  },
  select: {
    padding: "10px 14px",
    fontSize: "1rem",
    borderRadius: 8,
    border: "1px solid #cbd5e1",
    backgroundColor: "#fff",
    color: "#0f172a",
    outline: "none",
    cursor: "pointer",
    boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
    transition: "border-color 0.2s",
  },
  detailCard: {
    border: "1px solid #e2e8f0",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
    backgroundColor: "#fff",
  },
  cardHeader: {
    display: "flex",
    gap: 8,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: "#e0e7ff",
    color: "#4338ca",
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: "0.75rem",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  subbadge: {
    backgroundColor: "#f1f5f9",
    color: "#475569",
    padding: "4px 10px",
    borderRadius: 20,
    fontSize: "0.75rem",
    fontWeight: 600,
  },
  cardTitle: {
    fontSize: "1.6rem",
    margin: "0 0 10px 0",
    color: "#0f172a",
  },
  cardModel: {
    fontWeight: 400,
    color: "#64748b",
  },
  cardMeta: {
    fontSize: "0.9rem",
    color: "#64748b",
    margin: "0 0 24px 0",
  },
  buttonWrapper: {
    display: "inline-block",
  },
  centered: {
    textAlign: "center",
    padding: "40px 0",
    fontSize: "1.1rem",
    color: "#64748b",
  },
  error: {
    color: "#b91c1c",
    backgroundColor: "#fef2f2",
    padding: 16,
    borderRadius: 8,
    border: "1px solid #fee2e2",
    textAlign: "center",
    fontWeight: 500,
  },
};

