// The shared ScenarioPresets (src/components/dash/ScenarioPresets.vue) draws a word chip from a scenario's `evidence`
// (supported | partly | animal | hypothesis). The gut dashboards keep a finer `status` of their own (shown in a badge
// beside the controls); this maps it to the shared chip so no preset row reads "Unrated".

const EVIDENCE_OF_STATUS = Object.freeze({
  'measured-anchor': 'supported', // reproduces a measurement
  recorded: 'supported', // a value from recorded data
  'model-prediction': 'partly', // the model's own prediction, not directly measured
  hypothesis: 'hypothesis' // no human data
})

/** The `evidence` word of the shared preset chips for a dashboard preset `status`. */
export const evidenceOf = (status) => EVIDENCE_OF_STATUS[status] ?? 'hypothesis'

/** Freeze presets with `evidence` filled in from `status` (an explicit `evidence` is kept). */
export const withEvidence = (presets) => Object.freeze(presets.map((item) => Object.freeze({ evidence: evidenceOf(item.status), ...item })))
