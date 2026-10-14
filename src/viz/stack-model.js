// Geometry and text of the stacked share bar (StackedBar). Pure functions.
//
//   bars: [{ id, label, items: [{ id, label, value, low?, high? }] }]
// With `normalize` each bar is scaled to 100 percent; otherwise bars share one
// axis from 0 to the largest total. `low`/`high` are an uncertainty range for
// the item's value (same unit as `value`).
import { formatNumber, niceTicks, scaleFor, textWidth, truncate } from './scale.js'
import { seriesLook } from './shapes.js'

export const BAR_HEIGHT = 36
export const BAR_GAP = 30
export const GAP = 2

/** Categories in order of first appearance, each with a stable look across all bars. */
export function categoriesOf(bars) {
  const seen = new Map()
  for (const bar of bars) {
    for (const item of bar.items) {
      if (!seen.has(item.id)) seen.set(item.id, { id: item.id, label: item.label, look: seriesLook(item.look ?? seen.size) })
    }
  }
  return [...seen.values()]
}

export const totalOf = (bar) => bar.items.reduce((sum, item) => sum + Math.max(item.value, 0), 0)

/** Value of an item as a share of its bar's total, 0 to 1. */
export const shareOf = (bar, item) => {
  const total = totalOf(bar)
  return total > 0 ? Math.max(item.value, 0) / total : 0
}

export function buildStack({ bars, normalize = true, width = 640, unit = '' }) {
  const categories = categoriesOf(bars)
  const lookOf = new Map(categories.map((category) => [category.id, category.look]))
  const left = bars.length > 1 && width >= 520 ? 130 : 14
  const right = width - 14
  const stacked = left > 14
  const maxTotal = normalize ? 1 : Math.max(...bars.map(totalOf), Number.MIN_VALUE)
  const axis = normalize ? { ticks: [0, 0.25, 0.5, 0.75, 1], max: 1 } : (() => { const t = niceTicks(0, maxTotal, 5); return { ticks: t.ticks, max: t.max } })()
  const x = scaleFor({ domain: [0, axis.max], range: [left, right] })
  const fmt = (value) => (normalize ? `${formatNumber(value * 100)}%` : `${formatNumber(value)}${unit ? ` ${unit}` : ''}`)

  const built = bars.map((bar, index) => {
    const total = totalOf(bar)
    const top = 8 + index * (BAR_HEIGHT + BAR_GAP) + (stacked ? 0 : 16)
    let cursor = 0
    const segments = bar.items.map((item) => {
      const value = Math.max(item.value, 0)
      const share = normalize ? (total > 0 ? value / total : 0) : value
      const x0 = x(cursor)
      cursor += share
      const x1 = x(cursor)
      const w = Math.max(0, x1 - x0 - GAP)
      const pct = total > 0 ? (value / total) * 100 : 0
      const short = `${truncate(item.label, 14)} ${formatNumber(normalize ? pct : value)}${normalize ? '%' : ''}`
      const fits = w >= textWidth(short, 12) + 10
      const fitsShort = !fits && w >= textWidth(`${formatNumber(normalize ? pct : value)}${normalize ? '%' : ''}`, 12) + 8
      return {
        id: item.id,
        label: item.label,
        look: lookOf.get(item.id),
        x: x0,
        w,
        value,
        pct,
        text: fits ? short : fitsShort ? `${formatNumber(normalize ? pct : value)}${normalize ? '%' : ''}` : '',
        amountText: `${normalize ? `${formatNumber(pct)}%` : fmt(value)}${item.low !== undefined && item.high !== undefined ? ` (range ${formatNumber(item.low)} to ${formatNumber(item.high)})` : ''}`,
        title: `${item.label}: ${normalize ? `${formatNumber(pct)}%` : fmt(value)}${item.low !== undefined && item.high !== undefined ? `, range ${formatNumber(item.low)} to ${formatNumber(item.high)}` : ''}`
      }
    })
    return { id: bar.id, label: bar.label, top, total, segments }
  })

  const withRanges = bars.some((bar) => bar.items.some((item) => item.low !== undefined && item.high !== undefined))
  const barsBottom = 8 + bars.length * (BAR_HEIGHT + BAR_GAP) + (stacked ? 0 : 16)
  const axisY = barsBottom - 6
  const ranges = withRanges ? rangeRows({ bars, categories, normalize, width, top: axisY + 44, fmt }) : { rows: [], height: 0, x: null }
  return {
    width,
    height: withRanges ? ranges.bottom + 8 : axisY + 34,
    left,
    right,
    stacked,
    axisY,
    ticks: axis.ticks.map((value) => ({ value, pos: x(value), label: fmt(value) })),
    bars: built,
    categories,
    ranges: ranges.rows,
    rangeAxisY: ranges.axisY,
    rangeTicks: ranges.ticks
  }
}

const RANGE_ROW = 40
const RANGE_ROW_NARROW = 58

/** Dumbbell rows: each item's value with its low-to-high range, on a 0 to max axis. */
function rangeRows({ bars, categories, normalize, width, top, fmt }) {
  const left = 14
  const right = width - 14
  const rows = []
  for (const bar of bars) {
    for (const item of bar.items) {
      if (item.low === undefined || item.high === undefined) continue
      rows.push({ bar, item, share: shareOf(bar, item) })
    }
  }
  const scaleMax = normalize ? Math.min(1, Math.max(...rows.map((row) => Math.max(row.item.high / (totalOf(row.bar) || 1), row.share))) * 1.08) : niceTicks(0, Math.max(...rows.map((row) => row.item.high)) * 1.05, 5).max
  const axisMax = normalize ? Math.max(0.1, Math.ceil(scaleMax * 20) / 20) : scaleMax
  const x = scaleFor({ domain: [0, axisMax], range: [left, right] })
  const norm = (row, value) => (normalize ? value / (totalOf(row.bar) || 1) : value)
  const narrow = width < 520
  const step = narrow ? RANGE_ROW_NARROW : RANGE_ROW
  const items = rows.map((row, index) => {
    const y = top + 18 + index * step
    const look = categories.find((category) => category.id === row.item.id).look
    return {
      id: `${row.bar.id}-${row.item.id}`,
      label: bars.length > 1 ? `${row.item.label} (${row.bar.label})` : row.item.label,
      look,
      y,
      dy: narrow ? 34 : 16,
      vx: narrow ? 14 : width - 14,
      vy: narrow ? y + 18 : y + 4,
      vanchor: narrow ? 'start' : 'end',
      x1: x(norm(row, row.item.low)),
      x2: x(norm(row, row.item.high)),
      xv: x(row.share ? (normalize ? row.share : row.item.value) : 0),
      text: `${fmt(norm(row, row.item.value))} (${fmt(norm(row, row.item.low))} to ${fmt(norm(row, row.item.high))})`
    }
  })
  const tickCount = width < 420 ? 3 : 5
  const tickValues = normalize
    ? Array.from({ length: tickCount }, (_, i) => (axisMax * i) / (tickCount - 1))
    : niceTicks(0, axisMax, tickCount).ticks
  const axisY = top + 18 + rows.length * step
  return {
    rows: items,
    axisY,
    ticks: tickValues.map((value) => ({ value, pos: x(value), label: fmt(value) })),
    bottom: axisY + 28,
    x
  }
}

/** Sentences for the text alternative. */
export function describeStack({ bars, normalize = true, unit = '' }) {
  return bars.map((bar) => {
    const total = totalOf(bar)
    const parts = bar.items.map((item) => {
      const amount = normalize ? `${formatNumber(total > 0 ? (Math.max(item.value, 0) / total) * 100 : 0)}%` : `${formatNumber(item.value)}${unit ? ` ${unit}` : ''}`
      const range = item.low !== undefined && item.high !== undefined ? ` (range ${formatNumber(item.low)} to ${formatNumber(item.high)})` : ''
      return `${item.label} ${amount}${range}`
    })
    return `${bar.label ? `${bar.label}: ` : ''}${parts.join(', ')}.`
  }).join(' ')
}

/** Table rows: one row per category, one column per bar. */
export function stackTable({ bars, normalize = true, unit = '' }) {
  const categories = categoriesOf(bars)
  return {
    heads: bars.map((bar) => bar.label || 'Value'),
    rows: categories.map((category) => ({
      id: category.id,
      label: category.label,
      cells: bars.map((bar) => {
        const item = bar.items.find((entry) => entry.id === category.id)
        if (!item) return 'none'
        const total = totalOf(bar)
        const amount = normalize ? `${formatNumber(total > 0 ? (Math.max(item.value, 0) / total) * 100 : 0)}%` : `${formatNumber(item.value)}${unit ? ` ${unit}` : ''}`
        return item.low !== undefined && item.high !== undefined ? `${amount} (range ${formatNumber(item.low)} to ${formatNumber(item.high)})` : amount
      })
    }))
  }
}
