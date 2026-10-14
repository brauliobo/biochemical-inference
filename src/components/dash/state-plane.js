// Geometry and text of the SAM:SAH x tHcy plane: labelled state regions, the reference state and the trajectory of a
// scenario through them. Pure functions (no Vue, no DOM); StatePlane.vue only draws what this returns.
import { niceTicks, sampleEvenly, scaleFor, formatNumber } from '../../viz/scale.js'
import { STATE_DEFINITIONS, classifyState } from './methylation-view.js'

const MARGIN = { left: 56, right: 16, top: 16, bottom: 48 }

/**
 * input: { time, ratio, thcy, referenceRatio, referenceThcy, focusIndex, width, height }
 * Returns plot box, ticks, the three SAM:SAH regions (bands over the full width), the tHcy strips, the trajectory
 * path, the reference/start/end/focus points and the rows of a data table.
 */
export function planeModel({ time, ratio, thcy, referenceRatio, referenceThcy, focusIndex = ratio.length - 1, width = 640, height = 320 }) {
  const plot = { left: MARGIN.left, right: width - MARGIN.right, top: MARGIN.top, bottom: height - MARGIN.bottom }
  const x = niceTicks(0, Math.max(STATE_DEFINITIONS.thcyModerate + 3, ...thcy, referenceThcy) * 1.05, 6)
  const y = niceTicks(0, Math.max(referenceRatio * 1.6, ...ratio) * 1.05, 6)
  const px = scaleFor({ domain: [x.min, x.max], range: [plot.left, plot.right] })
  const py = scaleFor({ domain: [y.min, y.max], range: [plot.bottom, plot.top] })
  const low = referenceRatio * STATE_DEFINITIONS.lowRatio
  const high = referenceRatio * STATE_DEFINITIONS.highRatio
  const band = (id, label, from, to) => ({ id, label, x: plot.left, width: plot.right - plot.left, y: py(Math.min(to, y.max)), height: py(from) - py(Math.min(to, y.max)) })
  const point = (k) => ({ x: px(thcy[k]), y: py(ratio[k]), time: time[k], ratio: ratio[k], thcy: thcy[k], state: classifyState(ratio[k], referenceRatio, thcy[k]) })
  const last = ratio.length - 1
  const path = ratio.map((_, k) => `${k === 0 ? 'M' : 'L'}${px(thcy[k]).toFixed(1)} ${py(ratio[k]).toFixed(1)}`).join('')
  const rows = sampleEvenly(ratio.map((_, k) => k), 24).map(({ item: k }) => ({ time: time[k], ratio: ratio[k], thcy: thcy[k], state: classifyState(ratio[k], referenceRatio, thcy[k]).label }))
  return {
    width, height, plot,
    xTicks: x.ticks.map((value) => ({ value, pos: px(value) })), yTicks: y.ticks.map((value) => ({ value, pos: py(value) })),
    regions: [
      band('over', 'Over-methylation-like (SAM:SAH above 133% of reference)', high, y.max),
      band('reference', 'Reference-like', low, high),
      band('under', 'Under-methylation-like (SAM:SAH below 75% of reference)', 0, low)
    ],
    strips: [
      { id: 'upper', label: 'tHcy above the reference limit', x: px(STATE_DEFINITIONS.thcyUpperReference), width: plot.right - px(STATE_DEFINITIONS.thcyUpperReference) },
      { id: 'moderate', label: 'moderate hyperhomocysteinaemia', x: px(STATE_DEFINITIONS.thcyModerate), width: plot.right - px(STATE_DEFINITIONS.thcyModerate) }
    ].filter((strip) => strip.x < plot.right),
    path,
    reference: { x: px(referenceThcy), y: py(referenceRatio) },
    start: point(0), end: point(last), focus: point(focusIndex),
    rows,
    summary: `Trajectory from ${formatNumber(ratio[0])} to ${formatNumber(ratio[last])} SAM:SAH and from ${formatNumber(thcy[0])} to ${formatNumber(thcy[last])} umol/L tHcy. `
      + `Largest departure at hour ${formatNumber(time[focusIndex], 3)}: ${classifyState(ratio[focusIndex], referenceRatio, thcy[focusIndex]).text}.`
  }
}
