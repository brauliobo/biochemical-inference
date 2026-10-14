// Geometry and text of a sparkline. Pure functions.
import { extentOf, formatNumber, withUnit } from './scale.js'

/**
 * values: numbers (null = gap). Returns { path, area, last, min, max, text }.
 * `lower`/`upper` (same length) draw a band. The line fills the box with `pad` inside.
 */
export function sparkModel({ values, lower, upper, width = 120, height = 32, pad = 4, label = '', unit = '', min, max }) {
  const [low, high] = extentOf(values, lower, upper) ?? [0, 1]
  const lo = min ?? low
  const hi = max ?? (high === lo ? lo + 1 : high)
  const x = (index) => pad + (values.length > 1 ? (index / (values.length - 1)) * (width - 2 * pad) : (width - 2 * pad) / 2)
  const y = (value) => height - pad - ((value - lo) / (hi - lo || 1)) * (height - 2 * pad)
  let path = ''
  let pen = false
  values.forEach((value, index) => {
    if (value === null || value === undefined || Number.isNaN(value)) { pen = false; return }
    path += `${pen ? 'L' : 'M'}${x(index).toFixed(1)} ${y(value).toFixed(1)}`
    pen = true
  })
  let band = ''
  if (lower && upper && values.length > 1) {
    const top = upper.map((value, index) => `${x(index).toFixed(1)} ${y(value).toFixed(1)}`)
    const bottom = lower.map((value, index) => `${x(index).toFixed(1)} ${y(value).toFixed(1)}`).reverse()
    band = `M${top.join('L')}L${bottom.join('L')}Z`
  }
  const finite = values.map((value, index) => ({ value, index })).filter((point) => Number.isFinite(point.value))
  const lastPoint = finite.at(-1)
  const first = finite[0]
  const smallest = finite.length ? Math.min(...finite.map((point) => point.value)) : null
  const largest = finite.length ? Math.max(...finite.map((point) => point.value)) : null
  return {
    width,
    height,
    path,
    band,
    last: lastPoint ? { x: x(lastPoint.index), y: y(lastPoint.value), value: lastPoint.value } : null,
    min: smallest,
    max: largest,
    text: finite.length
      ? `${label ? `${label}: ` : ''}from ${withUnit(first.value, unit)} to ${withUnit(lastPoint.value, unit)}, lowest ${formatNumber(smallest)}, highest ${formatNumber(largest)}, ${finite.length} values.`
      : `${label ? `${label}: ` : ''}no values.`
  }
}
