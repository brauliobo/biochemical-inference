// Text and geometry for the "What is robust?" strip: one bar per question (the spread of the effect over the sampled
// parameter sets), a verdict word and the fraction of sets beyond a threshold. Pure; the numbers come from
// src/sim/data/robustness.json (scripts/precompute-robustness.js).
import { formatNumber } from '../../viz/scale.js'

/** Axis of the bars, as relative change. Spreads beyond it are clipped (and said so in the text). */
export const AXIS = Object.freeze({ low: -0.6, high: 0.6 })

const pct = (x) => `${x < 0 ? '−' : x > 0 ? '+' : ''}${formatNumber(Math.abs(x) * 100, 2)}%`
const position = (x) => ((Math.min(AXIS.high, Math.max(AXIS.low, x)) - AXIS.low) / (AXIS.high - AXIS.low)) * 100

/** Verdict tone: how sure the answer is, not which way it points. */
export const verdictTone = (verdict) => (verdict.key.startsWith('robust') ? 'success' : verdict.key.startsWith('mostly') ? 'info' : 'warning')

/** "51% of the 100 parameter sets fall by more than 5%". */
export function thresholdText(threshold, members) {
  const share = `${Math.round(threshold.fraction * 100)}%`
  const size = formatNumber(Math.abs(threshold.x) * 100, 3)
  return `${share} of ${members} parameter sets ${threshold.op === 'below' ? 'fall' : 'rise'} by more than ${size}%`
}

/** Flat list of { key, row, metric } for the metrics of the rows. */
export const flattenRows = (rows) => rows.flatMap((row) => row.metrics.map((metric) => ({ key: `${row.id}:${metric.id}`, row, metric })))

/** Bar geometry (0 to 100) and the sentence read by assistive technology. */
export function barModel({ row, metric }) {
  const clipLow = metric.p5 < AXIS.low
  const clipHigh = metric.p95 > AXIS.high
  const clipped = clipLow || clipHigh
  const first = metric.thresholds[0]
  return {
    zero: position(0), clipLow, clipHigh, p5: position(metric.p5), p25: position(metric.p25), p50: position(metric.p50), p75: position(metric.p75), p95: position(metric.p95), clipped,
    fraction: first ? thresholdText(first, row.members) : '',
    text: `${row.label}: ${metric.label}. Median ${pct(metric.p50)}, 5th to 95th percentile ${pct(metric.p5)} to ${pct(metric.p95)} over ${row.members} parameter sets. Verdict: ${metric.verdict.text}.`
  }
}

/** The headline sentence for a question, used in the variant warning: median change per variant row id. */
export function medianOf(rows, rowId, metricId) {
  const metric = rows.find((row) => row.id === rowId)?.metrics.find((m) => m.id === metricId)
  return metric ? metric.p50 : null
}
export { pct as percent }
