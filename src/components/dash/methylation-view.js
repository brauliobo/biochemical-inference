// Pure view models of the methylation dashboard: what the charts, tiles and the state plane draw, computed from the
// plain result of methylation-dash-run.js. No simulator, no Vue, no DOM: unit-tested with a small fake result.
import { formatNumber } from '../../viz/scale.js'

/** The quantities the time-course chart can show (observable or species id of the run result). */
export const QUANTITIES = [
  { id: 'samSahRatio', label: 'SAM:SAH', unit: 'ratio', title: 'SAM:SAH ratio (liver)' },
  { id: 'sam', label: 'SAM', unit: 'uM', title: 'SAM (liver)' },
  { id: 'sah', label: 'SAH', unit: 'uM', title: 'SAH (liver)' },
  { id: 'tHcy', label: 'tHcy', unit: 'uM', title: 'Plasma total homocysteine' },
  { id: 'mthf', label: '5-MTHF', unit: 'uM', title: '5-methyl-THF (liver)' },
  { id: 'gly_p', label: 'Glycine', unit: 'uM', title: 'Plasma glycine' }
]
export const ALL_QUANTITIES = 'all'

/** Region definitions of the SAM:SAH x tHcy plane (documented in the UI). */
export const STATE_DEFINITIONS = Object.freeze({
  lowRatio: 0.75, // SAM:SAH below 75% of the reference state: "under-methylation-like" (lowered SAM:SAH, state:undermethylation)
  highRatio: 1 / 0.75, // above 133%: "over-methylation-like" (persistently raised SAM:SAH, state:overmethylation)
  thcyUpperReference: 12, // umol/L, upper reference limit of fasting tHcy with good vitamin status (Refsum 2004)
  thcyModerate: 15 // umol/L, moderate hyperhomocysteinaemia begins (Refsum 2004)
})

/** Words for the ratio and homocysteine arms of a point. */
export function classifyState(ratio, referenceRatio, thcy) {
  const relative = ratio / referenceRatio
  const arm = relative < STATE_DEFINITIONS.lowRatio ? 'under' : relative > STATE_DEFINITIONS.highRatio ? 'over' : 'reference'
  const label = { under: 'under-methylation-like', over: 'over-methylation-like', reference: 'reference-like' }[arm]
  const hcy = thcy >= STATE_DEFINITIONS.thcyModerate ? 'above the moderate-hyperhomocysteinaemia threshold' : thcy > STATE_DEFINITIONS.thcyUpperReference ? 'above the upper reference limit' : 'within the reference range'
  return { arm, label, hcy, text: `${label} (SAM:SAH ${formatNumber(relative * 100, 3)}% of reference), tHcy ${hcy}` }
}

const sign = (x) => (x < 0 ? '−' : '+')
/** "−5.2%" / "+1.4%" / "0%" for a relative change. */
export function percentText(relative, digits = 2) {
  if (!Number.isFinite(relative)) return ''
  if (Math.abs(relative) < 0.0005) return '0%'
  return `${sign(relative)}${formatNumber(Math.abs(relative) * 100, digits)}%`
}

/** "−9% to +7%": the lowest and highest value of a series relative to its reference. */
export function relativeRange(values, reference) {
  const rel = values.map((v) => v / reference - 1)
  return `${percentText(Math.min(...rel))} to ${percentText(Math.max(...rel))}`
}

/** "35 min" below one hour, else "2.5 h". */
export const formatTime = (hours) => (hours < 1 ? `${Math.round(hours * 60)} min` : `${formatNumber(hours, 3)} h`)

/** Sample of `values` furthest from `reference` (the last when nothing moves by more than `floor`, relative). */
export function extreme(values, reference, floor = 0.003) {
  let index = values.length - 1
  let deviation = floor
  values.forEach((value, k) => {
    const d = Math.abs(value / reference - 1)
    if (d > deviation) { deviation = d; index = k }
  })
  return { index, value: values[index], relative: values[index] / reference - 1 }
}

const TILES = [
  { id: 'samSahRatio', label: 'SAM:SAH', unit: 'ratio', bad: 'down' },
  { id: 'sam', label: 'SAM', unit: 'uM', bad: null },
  { id: 'tHcy', label: 'Plasma tHcy', unit: 'uM', bad: 'up' },
  { id: 'mthf', label: '5-MTHF', unit: 'uM', bad: null },
  { id: 'gly_p', label: 'Plasma glycine', unit: 'uM', bad: null },
  { id: 'bet_p', label: 'Plasma betaine', unit: 'uM', bad: null }
]

/** Headline tiles: each shows its value at the largest departure from the reference state, with the change and the hour. */
export function resultTiles(result) {
  return TILES.map((tile) => {
    const reference = result.reference[tile.id]
    const { index, value, relative } = extreme(result.series[tile.id], reference)
    const moved = Math.abs(relative) >= 0.005
    const worse = tile.bad === 'down' ? relative < -0.1 : tile.bad === 'up' ? relative > 0.1 : false
    const bit = tile.bad === 'down' ? relative < -0.05 : tile.bad === 'up' ? relative > 0.05 : false
    const rel = result.series[tile.id].map((v) => v / reference - 1)
    const range = `${percentText(Math.min(...rel))} to ${percentText(Math.max(...rel))}`
    return {
      id: tile.id, label: tile.label, unit: tile.unit, value: formatNumber(value), delta: moved ? percentText(relative) : '',
      tone: worse ? 'bad' : bit ? 'warning' : moved ? 'info' : '',
      note: moved ? `vs reference at hour ${formatNumber(result.time[index], 3)}. Over the run: ${range}` : 'unchanged'
    }
  })
}

/** Bars for the SAM-consumer StackedBar: reference with its contested range, and the scenario at the focus hour. */
export const CONSUMERS = [
  { id: 'gnmt', label: 'GNMT (glycine to sarcosine)' },
  { id: 'pemt', label: 'PEMT (phosphatidylcholine)' },
  { id: 'gamt', label: 'GAMT (creatine)' },
  { id: 'dnmt', label: 'DNMT (DNA)' },
  { id: 'nnmt', label: 'NNMT (niacin)' },
  { id: 'other', label: 'Other methyltransferases' }
]
export function consumerBars(result) {
  const pct = (share) => Math.round(share * 1000) / 10
  const item = (shares, withRange) => CONSUMERS.map((consumer) => ({
    id: consumer.id, label: consumer.label, value: pct(shares[consumer.id]),
    ...(withRange ? { low: pct(result.shares.range[consumer.id][0]), high: pct(result.shares.range[consumer.id][1]) } : {})
  }))
  return [
    { id: 'baseline', label: 'Reference', items: item(result.shares.baseline, true) },
    { id: 'scenario', label: `At hour ${formatNumber(result.focus.time, 3)}`, items: item(result.shares.scenario, false) }
  ]
}

/** Chart model of the time-course view for one quantity (or all, as percent of the reference). */
export function timeChart(result, quantity, bands = null) {
  const x = result.time
  const events = dedupeEvents(result.events)
  if (quantity === ALL_QUANTITIES) {
    const series = QUANTITIES.map((q, look) => ({ id: q.id, label: q.label, look, values: result.series[q.id].map((v) => (v / result.reference[q.id]) * 100) }))
    return { x, series, events, unit: '% of reference', refLines: [{ value: 100, label: 'Reference state' }], title: 'Everything as percent of the reference state', yMin: undefined, yMax: undefined }
  }
  const meta = QUANTITIES.find((q) => q.id === quantity) ?? QUANTITIES[0]
  return scenarioChart({ time: x, values: result.series[meta.id], reference: result.reference[meta.id], unit: meta.unit, title: `${meta.title}: scenario against the reference state`, events, ribbon: bands?.bands?.[meta.id] })
}

/**
 * One scenario curve against its flat reference line, with an optional ribbon (bands of the response as ratios to each
 * parameter set's own starting value, multiplied by this run's starting value) and a y range that never collapses.
 */
export function scenarioChart({ time, values, reference, unit, title, events = [], ribbon = null, id = 'scenario', label = 'Scenario' }) {
  const scenario = { id, label, values, look: 1 }
  if (ribbon && ribbon.p5.length === values.length) {
    scenario.lower = ribbon.p5.map((r) => values[0] * r)
    scenario.upper = ribbon.p95.map((r) => values[0] * r)
  }
  const all = [...values, reference, ...(scenario.lower ?? []), ...(scenario.upper ?? [])].filter(Number.isFinite)
  const low = Math.min(...all)
  const high = Math.max(...all)
  const pad = Math.max((high - low) * 0.15, Math.abs(reference) * 0.06)
  return {
    x: time, events, unit, title, refLines: [],
    series: [{ id: 'reference', label: 'Reference state', values: time.map(() => reference), baseline: true, look: 0 }, scenario],
    yMin: low - pad < 0 && low >= 0 ? 0 : low - pad, yMax: high + pad
  }
}

function dedupeEvents(events) {
  const seen = new Set()
  return events.filter((event) => { const key = `${event.x}|${event.label}`; if (seen.has(key)) return false; seen.add(key); return true })
}

/** Largest changes against the reference among map nodes: [{ id, label, kind, relative }] by |relative|, labels from the map. */
export function topChanges(map, nodes, limit = 8) {
  const label = new Map(nodes.map((node) => [node.id, node]))
  const rows = []
  const push = (values, base, kind) => {
    for (const [id, value] of Object.entries(values)) {
      const b = base[id]
      if (!label.has(id) || !(Math.abs(b) > 1e-9) || !Number.isFinite(value)) continue
      const relative = value / b - 1
      if (Math.abs(relative) >= 0.005) rows.push({ id, kind, label: label.get(id).label, relative })
    }
  }
  push(map.flux, map.baseFlux, 'reaction')
  push(map.conc, map.baseConc, 'compound')
  return rows.sort((a, b) => Math.abs(b.relative) - Math.abs(a.relative)).slice(0, limit)
}

/** Concentration encoding of the map: levels, or the change against the reference (a ratio per compound). */
export function mapConcentration(map, mode) {
  if (mode === 'change') {
    const out = {}
    for (const [id, value] of Object.entries(map.conc)) if (map.baseConc[id] > 0) out[id] = value / map.baseConc[id]
    return { values: out, unit: 'x reference' }
  }
  return { values: map.conc, unit: 'uM' }
}
