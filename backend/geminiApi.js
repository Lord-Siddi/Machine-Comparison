// backend/geminiApi.js
//
// Thin wrapper around the Gemini API using structured output
// (responseSchema + responseMimeType: "application/json") so the model
// is constrained to return exactly the shape we need.

const { compareSchema } = require("./compareSchema");

const {
  GEMINI_API_KEY,
  GEMINI_MODEL = "gemini-2.0-flash", // check ai.google.dev for the latest available model name
} = process.env;

const SYSTEM_PROMPT = `
You are an industrial instrumentation expert with deep knowledge of measurement
and control equipment (flow meters, pressure transmitters, level sensors,
temperature instruments, valves, analyzers, etc.).

You will be given:
1. A "selectedMachine" — the equipment the user is currently viewing.
2. A "catalog" — the complete list of equipment available on the site.

Your task is to build a side-by-side comparison grid, structured like a
datasheet comparison table:

- Columns ("machines"): the selected machine first, followed by the 4 to 5
  most similar machines from the catalog.
- Only compare machines that belong to the SAME equipment category as the
  selected machine (e.g. do not compare a flow meter to a pressure gauge).
- Base similarity on technical specifications, application, operating
  principle, and intended industrial use — not on brand name or price alone.
- NEVER invent, guess, or hallucinate a machine that is not present in the
  provided catalog. Every machine you return must exist verbatim in the
  catalog (same company and model).
- If fewer than 4 suitable machines exist in the same category, return as
  many as are genuinely similar (do not pad with unrelated machines).
- Give each non-selected machine a similarityScore between 0 and 1
  (1 = extremely similar); the selected machine's own score is 1.

- Rows ("parameters"): choose the technical parameters that are actually
  meaningful for this specific equipment category — e.g. for pressure
  transmitters that might be Instrument Type, Measurement Type, Pressure
  Range, Accuracy, Output Signal, Communication Protocols, Process
  Connection, Operating Temperature, Explosion Protection, etc. Use
  whatever real datasheet-style specs are available in the catalog data
  for that category, and only state values you can support from the
  catalog — do not fabricate specs that aren't present.
- Each parameter row must list exactly one value per machine, in the same
  order as the "machines" array.

- "keyTakeaways": 3-5 short, specific, buyer-relevant conclusions (e.g.
  which machine wins on accuracy, which is the best cost/performance
  pick, which has the best long-term stability).

Respond ONLY with data matching the required JSON schema.
`.trim();

async function getSimilarMachines({ selectedMachine, catalog }) {
  if (!GEMINI_API_KEY) {
    throw new Error("Gemini is not configured. Check the GEMINI_API_KEY env var.");
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent` +
    `?key=${GEMINI_API_KEY}`;

  const userPayload = { selectedMachine, catalog };

  const body = {
    systemInstruction: {
      role: "system",
      parts: [{ text: SYSTEM_PROMPT }],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text:
              "Here is the selected machine and the full equipment catalog as JSON.\n" +
              "Find the most similar machines according to your instructions.\n\n" +
              JSON.stringify(userPayload),
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: compareSchema,
    },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${errText}`);
  }

  const data = await response.json();

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    // Surface finishReason (e.g. SAFETY, MAX_TOKENS) if present — helps debugging.
    const finishReason = data?.candidates?.[0]?.finishReason;
    throw new Error(
      `Gemini returned no content.${finishReason ? ` finishReason: ${finishReason}` : ""}`
    );
  }

  // With responseMimeType "application/json" + responseSchema this is
  // guaranteed valid JSON matching the schema, but parse defensively anyway.
  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (err) {
    throw new Error("Failed to parse Gemini response as JSON: " + err.message);
  }

  return parsed;
}

module.exports = { getSimilarMachines };
