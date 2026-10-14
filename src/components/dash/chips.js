// Words and tones for the evidence status of a scenario. The word always carries the meaning; the tone only reinforces it.
export const EVIDENCE_CHIPS = Object.freeze({
  supported: { label: 'Supported', tone: 'success' },
  partly: { label: 'Partly supported', tone: 'info' },
  animal: { label: 'Animal data', tone: 'muted' },
  hypothesis: { label: 'Hypothesis', tone: 'warning' }
})

/** Chip for a scenario-like object: evidence is a status word or { status }. */
export function chipOf(scenario) {
  const status = typeof scenario?.evidence === 'string' ? scenario.evidence : scenario?.evidence?.status
  return EVIDENCE_CHIPS[status] ?? { label: status ?? 'Unrated', tone: 'muted' }
}
