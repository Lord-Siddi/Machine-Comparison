// backend/compareSchema.js
//
// Schema used with Gemini's structured output feature
// (generationConfig.responseSchema + responseMimeType: "application/json").
//
// Shape mirrors a parameter-by-machine comparison grid:
//   - "machines": the columns (selected machine first, then the most similar ones)
//   - "parameters": the rows — each has a parameter name and one value per
//     machine, in the SAME order as the "machines" array
//   - "keyTakeaways": short bullet-style conclusions, same as the
//     "✅ Key Takeaway" section at the bottom of the reference sheet
//
// Gemini's schema format is a constrained subset of OpenAPI 3.0 Schema —
// type values are uppercase strings, no "additionalProperties", ordering
// is hinted via "propertyOrdering".

const compareSchema = {
  type: "OBJECT",
  properties: {
    category: {
      type: "STRING",
      description: "The equipment category shared by all machines in this grid.",
    },
    machines: {
      type: "ARRAY",
      description:
        "Columns of the grid, in display order. The first entry is always the " +
        "selected machine. The rest are the 4-5 most similar machines found in the catalog.",
      items: {
        type: "OBJECT",
        properties: {
          company: { type: "STRING" },
          model: { type: "STRING" },
          isSelected: {
            type: "BOOLEAN",
            description: "True only for the machine the user was originally viewing.",
          },
          similarityScore: {
            type: "NUMBER",
            description:
              "Similarity to the selected machine, 0-1 (1 = identical). Omit meaning " +
              "for the selected machine itself by returning 1.",
          },
        },
        required: ["company", "model", "isSelected", "similarityScore"],
        propertyOrdering: ["company", "model", "isSelected", "similarityScore"],
      },
    },
    parameters: {
      type: "ARRAY",
      description:
        "Rows of the grid. Choose the technical parameters that matter for this " +
        "equipment category (e.g. for pressure transmitters: Instrument Type, " +
        "Measurement Type, Pressure Range, Accuracy, Output Signal, Process " +
        "Connection, Operating Temperature, etc.).",
      items: {
        type: "OBJECT",
        properties: {
          parameter: { type: "STRING" },
          values: {
            type: "ARRAY",
            description:
              "One value per machine, in the exact same order as the 'machines' array.",
            items: { type: "STRING" },
          },
        },
        required: ["parameter", "values"],
        propertyOrdering: ["parameter", "values"],
      },
    },
    keyTakeaways: {
      type: "ARRAY",
      description:
        "Short, specific conclusions a buyer would care about, e.g. which machine " +
        "wins on accuracy, which is the best cost/performance pick, etc.",
      items: { type: "STRING" },
    },
  },
  required: ["category", "machines", "parameters", "keyTakeaways"],
  propertyOrdering: ["category", "machines", "parameters", "keyTakeaways"],
};

module.exports = { compareSchema };
