# Equipment Compare — Proof of Concept (Gemini API)

Minimal PoC: click "Compare" on an equipment page → backend sends the
selected machine + full catalog to the **Gemini API** using
**structured output** (`responseSchema` + `responseMimeType: "application/json"`)
→ raw JSON result is shown in a modal.

No similarity logic exists anywhere in this code — the model does 100% of
the matching, constrained by the schema in `backend/compareSchema.js` and
the instructions in `backend/geminiApi.js`.

## Structure

```
backend/
  compareSchema.js    Gemini-format schema (OpenAPI subset) for responseSchema
  geminiApi.js         Calls Gemini generateContent with structured output
  compareRoute.js       Express route: fetch machine + catalog -> call AI -> return raw JSON
  mockCatalog.json      Placeholder catalog data (swap for your real DB call)
  server.js             Minimal Express app wiring the route
  .env.example           Env vars needed

frontend/
  CompareButton.jsx           Button + modal, loading spinner, error state
  compareApi.js                fetch() wrapper calling the backend
  EquipmentDetailPageExample.jsx  Shows how to drop CompareButton into an existing page
```

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your Gemini API key
npm start              # runs on http://localhost:4000
```

Get a key at https://aistudio.google.com/apikey. `GEMINI_MODEL` defaults to
`gemini-2.0-flash` — check https://ai.google.dev/gemini-api/docs/models for
current model names/availability, since these change over time.

`compareRoute.js` currently reads from `mockCatalog.json` via
`fetchMachineById` / `fetchEquipmentCatalog` — replace those two functions
with your real data access (DB query, existing internal API, etc.). That's
the only integration point on the backend.

### Frontend

Copy `CompareButton.jsx` and `compareApi.js` into your React app. Drop
`<CompareButton equipmentId={equipment.id} />` into your existing equipment
detail page (see `EquipmentDetailPageExample.jsx`).

If your frontend is served from a different origin than the backend, set:

```
REACT_APP_API_BASE_URL=http://localhost:4000
```

## What happens on click

1. `CompareButton` opens the modal, shows a spinner, calls
   `POST /api/equipment/:id/compare`.
2. `compareRoute.js` fetches the selected machine + full catalog, passes
   both to `getSimilarMachines()`.
3. `geminiApi.js` sends a system instruction (instrumentation-expert
   persona, same-category constraint, no-hallucination rule) plus the
   machine + catalog as the user message, with `generationConfig.responseSchema`
   set to the strict schema and `responseMimeType: "application/json"`.
4. Gemini returns JSON matching the schema shape.
5. The route returns that JSON unchanged.
6. The modal renders it as formatted raw JSON so you can verify the
   model's picks before building the real comparison UI.

## Response shape

Gemini now returns a comparison **grid**, not a flat similarity list:

```json
{
  "category": "Pressure Transmitter",
  "machines": [
    { "company": "Endress+Hauser", "model": "PMP50", "isSelected": true, "similarityScore": 1 },
    { "company": "Emerson", "model": "Rosemount 3051", "isSelected": false, "similarityScore": 0.86 }
  ],
  "parameters": [
    { "parameter": "Accuracy", "values": ["±0.055%", "±0.025–0.05%"] },
    { "parameter": "Output Signal", "values": ["4–20 mA HART", "4–20 mA HART, WirelessHART, Fieldbus"] }
  ],
  "keyTakeaways": [
    "Emerson Rosemount 3051 has the best accuracy and stability.",
    "Endress+Hauser PMP50 offers the best cost-performance balance."
  ]
}
```

- `machines` = grid columns, selected machine first.
- `parameters` = grid rows; each `values[i]` lines up with `machines[i]`.
- `keyTakeaways` = the "✅ Key Takeaway" section.

The frontend (`CompareButton.jsx`) renders this directly as an HTML table
with a key-takeaways box underneath, plus a "Show raw JSON" toggle for
debugging what Gemini actually returned.

## Notes on Gemini's schema format

Gemini's `responseSchema` is a constrained subset of OpenAPI 3.0 — it's
similar in spirit to OpenAI's JSON Schema structured outputs, but with
differences:
- Type values are uppercase strings: `"OBJECT"`, `"STRING"`, `"NUMBER"`, `"ARRAY"`, `"BOOLEAN"`.
- No `additionalProperties` field.
- Key ordering in the response is hinted via `propertyOrdering` rather than
  object key order.

## Next steps (not part of this PoC)

- Replace mock catalog fetch with real data source.
- Add caching so repeated clicks on the same machine don't re-call the API.
- Build the actual comparison table UI once the raw output looks correct.
