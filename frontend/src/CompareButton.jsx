// src/CompareButton.jsx
//
// Drop-in button for an equipment detail page. On click, calls the
// backend, which calls Gemini, and renders the returned comparison grid
// (machines as columns, parameters as rows, key takeaways at the bottom) —
// plus a collapsible raw JSON view for debugging.

import React, { useState } from "react";
import { fetchComparison } from "./compareApi";

export default function CompareButton({ equipmentId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  const handleClick = async () => {
    setIsOpen(true);
    setIsLoading(true);
    setError(null);
    setResult(null);
    setShowRaw(false);

    try {
      const data = await fetchComparison(equipmentId);
      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => setIsOpen(false);

  return (
    <>
      <button onClick={handleClick} disabled={isLoading}>
        {isLoading ? "Comparing..." : "Compare"}
      </button>

      {isOpen && (
        <div role="dialog" aria-modal="true" style={styles.overlay} onClick={handleClose}>
          <div style={styles.panel} onClick={(e) => e.stopPropagation()}>
            <div style={styles.header}>
              <h3 style={{ margin: 0 }}>
                Comparison{result?.category ? ` — ${result.category}` : ""}
              </h3>
              <button onClick={handleClose} aria-label="Close">
                ✕
              </button>
            </div>

            {isLoading && (
              <div style={styles.centered}>
                <Spinner />
                <p>Asking Gemini to build the comparison grid...</p>
              </div>
            )}

            {!isLoading && error && (
              <div style={styles.error}>
                <strong>Error:</strong> {error}
              </div>
            )}

            {!isLoading && !error && result && (
              <>
                <ComparisonGrid result={result} />

                {result.keyTakeaways?.length > 0 && (
                  <div style={styles.takeaways}>
                    <strong>✅ Key Takeaways</strong>
                    <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                      {result.keyTakeaways.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <button
                  style={styles.rawToggle}
                  onClick={() => setShowRaw((v) => !v)}
                >
                  {showRaw ? "Hide raw JSON" : "Show raw JSON"}
                </button>
                {showRaw && (
                  <pre style={styles.pre}>{JSON.stringify(result, null, 2)}</pre>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function ComparisonGrid({ result }) {
  const { machines = [], parameters = [] } = result;

  if (machines.length === 0 || parameters.length === 0) {
    return <p>No comparison data returned.</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.thParam}>Parameter</th>
            {machines.map((m, i) => (
              <th key={i} style={styles.th}>
                <div>{m.company}</div>
                <div style={{ fontWeight: 400 }}>{m.model}</div>
                {!m.isSelected && typeof m.similarityScore === "number" && (
                  <div style={styles.scoreBadge}>
                    {Math.round(m.similarityScore * 100)}% match
                  </div>
                )}
                {m.isSelected && <div style={styles.selectedBadge}>Selected</div>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {parameters.map((row, i) => (
            <tr key={i} style={i % 2 === 0 ? styles.rowEven : undefined}>
              <td style={styles.tdParam}>{row.parameter}</td>
              {machines.map((_, j) => (
                <td key={j} style={styles.td}>
                  {row.values?.[j] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Spinner() {
  return (
    <div style={styles.spinner}>
      <style>{`@keyframes compare-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  panel: {
    background: "#fff",
    borderRadius: 8,
    padding: 20,
    width: "min(1100px, 95vw)",
    maxHeight: "85vh",
    overflowY: "auto",
    boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  centered: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 12,
    padding: "24px 0",
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid #ddd",
    borderTopColor: "#333",
    borderRadius: "50%",
    animation: "compare-spin 0.8s linear infinite",
  },
  error: {
    color: "#b00020",
    background: "#fdecea",
    padding: 12,
    borderRadius: 6,
  },
  table: {
    borderCollapse: "collapse",
    width: "100%",
    fontSize: 13,
  },
  th: {
    background: "#1f2937",
    color: "#fff",
    padding: "10px 12px",
    textAlign: "left",
    minWidth: 150,
    verticalAlign: "top",
  },
  thParam: {
    background: "#111827",
    color: "#fff",
    padding: "10px 12px",
    textAlign: "left",
    minWidth: 160,
    position: "sticky",
    left: 0,
  },
  td: {
    padding: "8px 12px",
    borderBottom: "1px solid #eee",
    verticalAlign: "top",
  },
  tdParam: {
    padding: "8px 12px",
    borderBottom: "1px solid #eee",
    fontWeight: 600,
    background: "#f9fafb",
    position: "sticky",
    left: 0,
  },
  rowEven: {
    background: "#fafafa",
  },
  scoreBadge: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: 600,
    color: "#a7f3d0",
  },
  selectedBadge: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: 600,
    color: "#fde68a",
  },
  takeaways: {
    marginTop: 16,
    padding: 12,
    background: "#ecfdf5",
    borderRadius: 6,
  },
  rawToggle: {
    marginTop: 16,
    fontSize: 12,
    background: "none",
    border: "1px solid #ccc",
    borderRadius: 4,
    padding: "4px 10px",
    cursor: "pointer",
  },
  pre: {
    marginTop: 8,
    background: "#f5f5f5",
    padding: 16,
    borderRadius: 6,
    fontSize: 12,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    maxHeight: 300,
    overflowY: "auto",
  },
};
