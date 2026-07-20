// src/App.jsx
//
// Stand-in for one of your real equipment detail pages. Lets you pick a
// machine (matching backend/mockCatalog.json) and click Compare on it.
// Replace this file's content with your real page once you wire
// CompareButton into your actual site.

import React, { useState } from "react";
import CompareButton from "./CompareButton";

// Mirrors backend/mockCatalog.json — replace with your real catalog fetch.
const MOCK_EQUIPMENT = [
  { id: "1", company: "Endress+Hauser", model: "PMP50", category: "Pressure Transmitter" },
  { id: "2", company: "Siemens", model: "SITRANS P320/P420", category: "Pressure Transmitter" },
  { id: "6", company: "Emerson", model: "Rosemount 3051", category: "Pressure Transmitter" },
  { id: "3", company: "Yokogawa", model: "ADMAG AXW", category: "Flow Meter" },
];

export default function App() {
  const [selectedId, setSelectedId] = useState(MOCK_EQUIPMENT[0].id);
  const selected = MOCK_EQUIPMENT.find((m) => m.id === selectedId);

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>Equipment Detail Page (stand-in)</h1>

      <label>
        Viewing equipment:{" "}
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {MOCK_EQUIPMENT.map((m) => (
            <option key={m.id} value={m.id}>
              {m.company} {m.model}
            </option>
          ))}
        </select>
      </label>

      <div style={{ marginTop: 16, padding: 16, border: "1px solid #ddd", borderRadius: 8 }}>
        <h2 style={{ marginTop: 0 }}>
          {selected.company} {selected.model}
        </h2>
        <p>Category: {selected.category}</p>

        <CompareButton equipmentId={selected.id} />
      </div>
    </div>
  );
}
