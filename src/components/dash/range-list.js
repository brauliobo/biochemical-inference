// Geometry and text of RangeList: estimates with a best value and a range on one shared axis (percent positions).
// Pure functions; RangeList.vue only draws them.
import { formatNumber, niceTicks } from '../../viz/scale.js'

/**
 * items: [{ id, label, value, low?, high?, note?, tone? }]. The axis covers every value and range (and 0), widened to
 * round ticks, unless `min` / `max` are given. Returns { domain, ticks, zero, rows } with positions in percent.
 */
export function rangeListModel({ items, unit = '', min, max }) {
  const values = items.flatMap((item) => [item.value, item.low ?? item.value, item.high ?? item.value]).filter(Number.isFinite)
  const ticks = niceTicks(min ?? Math.min(0, ...values), max ?? Math.max(0, ...values), 6)
  const pos = (x) => ((Math.min(ticks.max, Math.max(ticks.min, x)) - ticks.min) / (ticks.max - ticks.min || 1)) * 100
  const text = (item) => {
    const low = item.low ?? item.value
    const high = item.high ?? item.value
    const best = `${formatNumber(item.value)}${unit ? ` ${unit}` : ''}`
    return low === high ? best : `${best} (range ${formatNumber(low)} to ${formatNumber(high)})`
  }
  return {
    domain: [ticks.min, ticks.max],
    ticks: ticks.ticks.map((value) => ({ value, pos: pos(value) })),
    zero: ticks.min < 0 ? pos(0) : null,
    rows: items.map((item) => ({ ...item, from: pos(item.low ?? item.value), to: pos(item.high ?? item.value), at: pos(item.value), text: text(item), range: (item.low ?? item.value) !== (item.high ?? item.value) })),
    summary: items.map((item) => `${item.label}: ${text(item)}`).join('. ')
  }
}
