// backend/compareRoute.js
//
// Express route: POST /api/equipment/:id/compare and POST /compare
//
// Responsibilities (and ONLY these, per the PoC scope):
// 1. Fetch the selected machine.
// 2. Fetch the full equipment catalog.
// 3. Send both to Gemini API.
// 4. Return the AI response UNCHANGED to the frontend.
//
// No similarity logic lives here — that's entirely the model's job.

const express = require("express");
const router = express.Router();
const { getSimilarMachines } = require("./geminiApi");

// --- Replace these with your real data access (DB, ORM, existing service, etc.) ---
async function fetchMachineById(id) {
  const catalog = await fetchEquipmentCatalog();
  return catalog.find((m) => String(m.id) === String(id)) || null;
}

async function fetchEquipmentCatalog() {
  return require("./mockCatalog.json");
}
// ------------------------------------------------------------------------------

// Shared comparison logic executor with proper production error handling
async function runComparison(selectedMachine, catalog, res) {
  if (!selectedMachine) {
    return res.status(404).json({ error: "Selected equipment not found." });
  }

  if (!catalog || !Array.isArray(catalog) || catalog.length === 0) {
    return res.status(400).json({ error: "Catalog must be a non-empty array of equipment." });
  }

  try {
    const aiResponse = await getSimilarMachines({
      selectedMachine,
      catalog,
    });

    // Return the AI response unchanged, as required for this PoC.
    return res.status(200).json(aiResponse);
  } catch (err) {
    console.error("[compare] error:", err);
    
    // Check if it looks like a Gemini API issue vs internal error
    const isGeminiError = err.message && (
      err.message.includes("Gemini") || 
      err.message.includes("API key") || 
      err.message.includes("generateContent") ||
      err.message.includes("status")
    );

    return res.status(isGeminiError ? 502 : 500).json({
      error: isGeminiError ? "Gemini API failure." : "Internal Server Error.",
      details: err.message || String(err),
    });
  }
}

// 1. Existing frontend route: POST /api/equipment/:id/compare
router.post("/api/equipment/:id/compare", async (req, res) => {
  const { id } = req.params;

  try {
    const selectedMachine = await fetchMachineById(id);
    if (!selectedMachine) {
      return res.status(404).json({ error: `Equipment with id "${id}" not found.` });
    }

    const catalog = await fetchEquipmentCatalog();
    await runComparison(selectedMachine, catalog, res);
  } catch (err) {
    console.error("[compareRoute] Route /api/equipment/:id/compare failed:", err);
    return res.status(500).json({ error: "Internal Server Error.", details: err.message });
  }
});

// 2. Verified route: POST /compare
router.post("/compare", async (req, res) => {
  const { id, equipmentId, selectedMachine, catalog } = req.body;

  try {
    // A. If selectedMachine and catalog are provided directly in the request body
    if (selectedMachine && catalog) {
      return await runComparison(selectedMachine, catalog, res);
    }

    // B. If an ID is provided in the request body
    const targetId = id || equipmentId;
    if (targetId) {
      const machine = await fetchMachineById(targetId);
      if (!machine) {
        return res.status(404).json({ error: `Equipment with id "${targetId}" not found.` });
      }
      const fullCatalog = await fetchEquipmentCatalog();
      return await runComparison(machine, fullCatalog, res);
    }

    // C. Neither provided - Bad Request
    return res.status(400).json({
      error: "Invalid request format.",
      details: "Please provide either 'id'/'equipmentId' or both 'selectedMachine' and 'catalog' in the request body."
    });
  } catch (err) {
    console.error("[compareRoute] Route /compare failed:", err);
    return res.status(500).json({ error: "Internal Server Error.", details: err.message });
  }
});

// 3. Catalog listing route: GET /api/catalog
router.get("/api/catalog", async (req, res) => {
  try {
    const catalog = await fetchEquipmentCatalog();
    const summary = catalog.map((m) => ({
      id: m.id,
      company: m.company,
      model: m.model,
      category: m.category,
      subcategory: m.subcategory,
    }));
    return res.status(200).json(summary);
  } catch (err) {
    console.error("[catalog] error:", err);
    return res.status(500).json({ error: "Failed to fetch catalog list.", details: err.message });
  }
});

module.exports = router;


