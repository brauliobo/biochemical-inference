// Scales, ticks and number formatting for the chart primitives. Pure functions.

/** Round `value` up/down to 1, 2, 2.5 or 5 times a power of ten. */
function niceNumber(value, round) {
  if (!(value > 0) || !Number.isFinite(value)) return 1
  const exponent = Math.floor(Math.log10(value))
  const fraction = value / 10 ** exponent
  let nice
  if (round) nice = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10
  else nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10
  return nice * 10 ** exponent
}

/**
 * Round tick values covering [min, max] with about `count` steps:
 * { ticks, min, max, step }. `min`/`max` are widened to the first and last tick.
 */
export function niceTicks(min, max, count = 5) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return { ticks: [0, 1], min: 0, max: 1, step: 1 }
  if (min === max) {
    const pad = min === 0 ? 1 : Math.abs(min) * 0.1
    min -= pad
    max += pad
  }
  const range = niceNumber(max - min, false)
  const step = niceNumber(range / Math.max(count - 1, 1), true)
  const first = Math.floor(min / step) * step
  const last = Math.ceil(max / step) * step
  const ticks = []
  for (let value = first; value <= last + step / 2; value += step) ticks.push(clean(value, step))
  return { ticks, min: first, max: last, step }
}

/** Remove floating point noise: 0.30000000000000004 -> 0.3. */
function clean(value, step) {
  const digits = Math.max(0, 1 - Math.floor(Math.log10(step)))
  return Number(value.toFixed(Math.min(digits, 12)))
}

/** Ticks for a log axis: 1, 2, 5 times each power of ten inside [min, max] (min > 0). */
export function logTicks(min, max) {
  const low = Math.max(min, Number.MIN_VALUE)
  const first = Math.floor(Math.log10(low))
  const last = Math.ceil(Math.log10(Math.max(max, low)))
  const decades = last - first
  const multipliers = decades > 4 ? [1] : decades > 2 ? [1, 3] : [1, 2, 5]
  const ticks = []
  for (let exponent = first; exponent <= last; exponent += 1) {
    for (const multiplier of multipliers) {
      const value = multiplier * 10 ** exponent
      if (value >= low * 0.999999 && value <= max * 1.000001) ticks.push(Number(value.toPrecision(3)))
    }
  }
  if (!ticks.length) ticks.push(low, max)
  return { ticks, min: 10 ** first, max: 10 ** last }
}

/** A function mapping a domain value to a range value (linear or log10). */
export function scaleFor({ domain, range, type = 'linear' }) {
  const [d0, d1] = domain
  const [r0, r1] = range
  if (type === 'log') {
    const l0 = Math.log10(Math.max(d0, Number.MIN_VALUE))
    const l1 = Math.log10(Math.max(d1, Number.MIN_VALUE))
    const span = l1 - l0 || 1
    return (value) => r0 + ((Math.log10(Math.max(value, Number.MIN_VALUE)) - l0) / span) * (r1 - r0)
  }
  const span = d1 - d0 || 1
  return (value) => r0 + ((value - d0) / span) * (r1 - r0)
}

/** Inverse of a linear scale: range value back to domain value. */
export function invertLinear({ domain, range }, position) {
  const [d0, d1] = domain
  const [r0, r1] = range
  const span = r1 - r0 || 1
  return d0 + ((position - r0) / span) * (d1 - d0)
}

/** Smallest and largest finite value across arrays (or numbers); null when there is none. */
export function extentOf(...lists) {
  let low = Infinity
  let high = -Infinity
  for (const list of lists) {
    for (const value of list ?? []) {
      if (typeof value !== 'number' || !Number.isFinite(value)) continue
      if (value < low) low = value
      if (value > high) high = value
    }
  }
  return low === Infinity ? null : [low, high]
}

export const clamp = (value, low, high) => Math.min(high, Math.max(low, value))

/** Index of the entry of a sorted numeric array nearest to `value`. */
export function nearestIndex(sorted, value) {
  if (!sorted.length) return -1
  let low = 0
  let high = sorted.length - 1
  while (high - low > 1) {
    const mid = (low + high) >> 1
    if (sorted[mid] < value) low = mid
    else high = mid
  }
  return Math.abs(sorted[low] - value) <= Math.abs(sorted[high] - value) ? low : high
}

/** Compact number for axis ticks and readouts: 1200 -> "1.2k", 0.00031 -> "3.1e-4", 2.50 -> "2.5". */
export function formatNumber(value, digits = 3) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'n/a'
  if (!Number.isFinite(value)) return value > 0 ? 'inf' : '-inf'
  if (value === 0) return '0'
  const abs = Math.abs(value)
  if (abs >= 1e6) return `${trim((value / 1e6).toPrecision(digits))}M`
  if (abs >= 1e4) return `${trim((value / 1e3).toPrecision(digits))}k`
  if (abs < 1e-3) return value.toExponential(Math.max(digits - 1, 0)).replace(/\.?0+e/, 'e')
  if (abs >= 100) return trim(value.toFixed(0))
  return trim(Number(value.toPrecision(digits)).toString())
}

function trim(text) {
  return text.includes('.') && !text.includes('e') ? text.replace(/\.?0+$/, '') : text
}

/** A value with its unit: "4.2 uM". */
export function withUnit(value, unit, digits) {
  return unit ? `${formatNumber(value, digits)} ${unit}` : formatNumber(value, digits)
}

/** At most `limit` entries spread evenly over a list, always keeping the first and last. */
export function sampleEvenly(list, limit) {
  if (list.length <= limit) return list.map((item, index) => ({ item, index }))
  const picked = []
  for (let slot = 0; slot < limit; slot += 1) {
    const index = Math.round((slot * (list.length - 1)) / (limit - 1))
    if (!picked.length || picked.at(-1).index !== index) picked.push({ item: list[index], index })
  }
  return picked
}

/** A readable label for the chart text alternative: "a, b and c". */
export function joinWords(items) {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`
}

/** Shorten text with an ellipsis. */
export function truncate(text, max = 24) {
  const value = String(text ?? '')
  return value.length <= max ? value : `${value.slice(0, Math.max(max - 1, 1)).trimEnd()}…`
}

/** Approximate rendered width of a label in SVG units for the caption/tick text sizes. */
export const textWidth = (text, size = 12) => String(text ?? '').length * size * 0.56
