// ILLUSTRATIVE sample data for the gallery and tests only. The numbers are
// invented to show how the components look; they are not measurements,
// reference values or advice.

/** Choline-like intake against two authorities; the EFSA row has no UL (illustrative). */
export function rangeSample() {
  return {
    unit: 'mg/day',
    min: 0,
    max: 4000,
    rows: [
      {
        id: 'iom',
        label: 'IOM (US), adults (sample)',
        markers: [{ kind: 'ai', value: 500 }, { kind: 'ul', value: 3500 }],
        typical: { from: 250, to: 1000, label: 'Typical supplement dose' }
      },
      {
        id: 'efsa',
        label: 'EFSA (EU), adults (sample)',
        markers: [{ kind: 'ai', value: 400 }],
        noUlNote: 'insufficient data',
        typical: { from: 250, to: 1000, label: 'Typical supplement dose' }
      }
    ]
  }
}

/** Where the methyl groups go in two scenarios, with ranges on the baseline (illustrative). */
export function sharesSample() {
  return {
    bars: [
      {
        id: 'baseline',
        label: 'Baseline',
        items: [
          { id: 'gnmt', label: 'GNMT', value: 38, low: 28, high: 48 },
          { id: 'pemt', label: 'PEMT', value: 27, low: 20, high: 34 },
          { id: 'creatine', label: 'Creatine synthesis', value: 18, low: 12, high: 24 },
          { id: 'other', label: 'Other methyltransferases', value: 17, low: 10, high: 25 }
        ]
      },
      {
        id: 'glycine',
        label: 'Glycine 5 g',
        items: [
          { id: 'gnmt', label: 'GNMT', value: 52, low: 40, high: 62 },
          { id: 'pemt', label: 'PEMT', value: 21, low: 15, high: 28 },
          { id: 'creatine', label: 'Creatine synthesis', value: 14, low: 9, high: 19 },
          { id: 'other', label: 'Other methyltransferases', value: 13, low: 8, high: 20 }
        ]
      }
    ]
  }
}

export const SAMPLE_TYPES = Object.freeze([
  ['compound', 'Compound'], ['enzyme', 'Enzyme'], ['reaction', 'Reaction'], ['pathway', 'Pathway'],
  ['state', 'State'], ['disease', 'Disease'], ['outcome', 'Outcome'], ['system', 'System'],
  ['intervention', 'Intervention'], ['claim', 'Claim'], ['article', 'Article']
].map(([id, label]) => Object.freeze({ id, label, short: label.length > 8 ? `${label.slice(0, 7)}.` : label })))

/** Relation counts between kinds: a made-up but structured pattern. */
export function matrixSample() {
  const counts = {}
  SAMPLE_TYPES.forEach((from, r) => {
    counts[from.id] = {}
    SAMPLE_TYPES.forEach((to, c) => {
      const value = Math.max(0, Math.round(24 * Math.exp(-((r - c) ** 2) / 14) * (1 + Math.sin((r + 1) * (c + 2))) * 0.6) - (r === c ? 3 : 0))
      if (value > 0) counts[from.id][to.id] = value
    })
  })
  return { types: SAMPLE_TYPES, counts }
}

/** Entities by kind and evidence grade (counts). */
export function gradeHeatSample() {
  const cols = [{ id: 'established', label: 'Established' }, { id: 'plausible', label: 'Plausible' }, { id: 'speculative', label: 'Speculative' }, { id: 'conversation-only', label: 'Conversation only', short: 'Conv. only' }]
  const rows = SAMPLE_TYPES.slice(0, 8).map((type) => ({ id: type.id, label: type.label }))
  const values = rows.map((_, r) => cols.map((__, c) => Math.max(0, Math.round(40 * Math.exp(-c * 0.7) * (0.4 + ((r * 7 + c * 3) % 5) / 5)) - (c === 3 ? 2 : 0))))
  return { rows, cols, values }
}

/** A diverging example: change of each metabolite under each scenario, in percent. */
export function changeHeatSample() {
  const rows = [{ id: 'sam', label: 'SAM' }, { id: 'sah', label: 'SAH' }, { id: 'hcy', label: 'Homocysteine' }, { id: 'betaine', label: 'Betaine' }, { id: 'gly', label: 'Glycine' }]
  const cols = [{ id: 'gly5', label: 'Glycine 5 g' }, { id: 'chol', label: 'Choline 1 g' }, { id: 'b12', label: 'B12 added' }]
  const values = [[-18, 6, 4], [9, -3, -2], [12, -9, -22], [-4, 31, 1], [180, -6, 0]]
  return { rows, cols, values }
}

/** Articles by year and design. */
export function timelineSample() {
  const groups = [{ id: 'rct', label: 'Randomised trial' }, { id: 'cohort', label: 'Cohort study' }, { id: 'mech', label: 'Mechanistic study' }, { id: 'review', label: 'Review' }, { id: 'case', label: 'Case report' }]
  const items = []
  let serial = 0
  groups.forEach((group, g) => {
    for (let year = 1994 + g * 2; year <= 2025; year += 1) {
      const count = Math.max(0, Math.round(1.6 * Math.sin((year * (g + 2)) / 3.1) + 0.9 + (year - 1994) / 24 - g * 0.15))
      for (let i = 0; i < count; i += 1) {
        serial += 1
        items.push({ id: `a${serial}`, title: `${group.label} ${serial} (sample)`, year, group: group.id, detail: 'Made-up record.' })
      }
    }
  })
  return { groups, items }
}

export const sparkSample = () => ({
  values: [4.1, 4.3, 4.2, 5.0, 5.6, 5.1, 4.8, 4.9, 5.4, 6.0, 5.8, 6.1],
  lower: [3.8, 3.9, 3.9, 4.5, 5.0, 4.7, 4.4, 4.5, 4.9, 5.4, 5.3, 5.5],
  upper: [4.4, 4.7, 4.6, 5.5, 6.2, 5.5, 5.2, 5.3, 5.9, 6.6, 6.3, 6.7]
})
