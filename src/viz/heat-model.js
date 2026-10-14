// Binning, totals and text of the heatmap and matrix. Pure functions.
//
// A sequential scale has 6 bins (viz-bin-s1..s6) and a diverging scale 7
// (viz-bin-n3..n1, z, p1..p3, around `center`). The cell value is always printed
// as text, so the colour is a second channel.
import { extentOf, formatNumber } from './scale.js'

export const SEQ_BINS = 6
export const DIV_BINS = ['n3', 'n2', 'n1', 'z', 'p1', 'p2', 'p3']

/** Domain of the colour scale: [low, high] (sequential) or symmetric about `center` (diverging). */
export function heatDomain(matrix, { mode = 'sequential', center = 0, domain } = {}) {
  if (domain) return domain
  const [low, high] = extentOf(...matrix) ?? [0, 1]
  if (mode === 'diverging') {
    const spread = Math.max(Math.abs(low - center), Math.abs(high - center)) || 1
    return [center - spread, center + spread]
  }
  return [Math.min(0, low), high === Math.min(0, low) ? low + 1 : high]
}

/** Bin id for a value: 's1'..'s6', or 'n3'..'p3'; 'none' for a missing value. */
export function binFor(value, { mode = 'sequential', domain, center = 0 }) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'none'
  const [low, high] = domain
  if (mode === 'diverging') {
    const spread = Math.max(Math.abs(high - center), Math.abs(low - center)) || 1
    const t = (value - center) / spread
    const size = Math.abs(t)
    const level = size < 0.1 ? 0 : size < 0.4 ? 1 : size < 0.7 ? 2 : 3
    if (level === 0) return 'z'
    return `${t < 0 ? 'n' : 'p'}${level}`
  }
  const position = (value - low) / (high - low || 1)
  return `s${Math.min(SEQ_BINS, Math.max(1, Math.floor(position * SEQ_BINS) + 1))}`
}

/** The legend: [{ bin, from, to, text }] with the value range each bin covers. */
export function legendBins({ mode = 'sequential', domain, center = 0, format = formatNumber }) {
  const [low, high] = domain
  if (mode === 'diverging') {
    const spread = Math.max(Math.abs(high - center), Math.abs(low - center)) || 1
    const edges = [-1, -0.7, -0.4, -0.1, 0.1, 0.4, 0.7, 1].map((t) => center + t * spread)
    return DIV_BINS.map((bin, index) => ({ bin, from: edges[index], to: edges[index + 1], text: `${format(edges[index])} to ${format(edges[index + 1])}` }))
  }
  return Array.from({ length: SEQ_BINS }, (_, index) => {
    const from = low + (index * (high - low)) / SEQ_BINS
    const to = low + ((index + 1) * (high - low)) / SEQ_BINS
    return { bin: `s${index + 1}`, from, to, text: `${format(from)} to ${format(to)}` }
  })
}

/**
 * cells[r][c] = { value, text, bin, label } plus totals. `values` is a matrix
 * (rows x cols), or a function (rowId, colId) => number | null.
 */
export function buildHeat({ rows, cols, values, mode = 'sequential', center = 0, domain, format = formatNumber, blankZero = false, unit = '' }) {
  const get = typeof values === 'function' ? values : (rowId, colId) => values[rows.findIndex((r) => r.id === rowId)]?.[cols.findIndex((c) => c.id === colId)]
  const matrix = rows.map((row) => cols.map((col) => {
    const value = get(row.id, col.id)
    return typeof value === 'number' && Number.isFinite(value) ? value : null
  }))
  const scale = heatDomain(matrix, { mode, center, domain })
  const suffix = unit ? ` ${unit}` : ''
  const cells = matrix.map((line, r) => line.map((value, c) => ({
    row: rows[r].id,
    col: cols[c].id,
    value,
    bin: binFor(value, { mode, domain: scale, center }),
    text: value === null ? '–' : blankZero && value === 0 ? '·' : format(value),
    label: `${rows[r].label}, ${cols[c].label}: ${value === null ? 'no data' : `${format(value)}${suffix}`}`
  })))
  const sum = (list) => list.reduce((total, value) => total + (value ?? 0), 0)
  return {
    cells,
    domain: scale,
    rowTotals: matrix.map(sum),
    colTotals: cols.map((_, c) => sum(matrix.map((line) => line[c]))),
    grandTotal: sum(matrix.flat()),
    legend: legendBins({ mode, domain: scale, center, format }),
    matrix
  }
}

/** The cursor after a key press on a grid of `rowCount` x `colCount`; null if the key is not a navigation key. */
export function moveCursor({ row, col }, key, { rowCount, colCount, ctrl = false }) {
  const last = { row: rowCount - 1, col: colCount - 1 }
  switch (key) {
    case 'ArrowRight': return { row, col: Math.min(col + 1, last.col) }
    case 'ArrowLeft': return { row, col: Math.max(col - 1, 0) }
    case 'ArrowDown': return { row: Math.min(row + 1, last.row), col }
    case 'ArrowUp': return { row: Math.max(row - 1, 0), col }
    case 'Home': return ctrl ? { row: 0, col: 0 } : { row, col: 0 }
    case 'End': return ctrl ? last : { row, col: last.col }
    case 'PageDown': return { row: last.row, col }
    case 'PageUp': return { row: 0, col }
    default: return null
  }
}

/** Highest and lowest cell, for the summary sentence. */
export function describeHeat({ rows, cols, built, format = formatNumber, unit = '', title = '' }) {
  const flat = built.cells.flat().filter((cell) => cell.value !== null)
  if (!flat.length) return `${title}: no data.`
  const top = flat.reduce((best, cell) => (cell.value > best.value ? cell : best))
  const bottom = flat.reduce((best, cell) => (cell.value < best.value ? cell : best))
  const nameOf = (list, id) => list.find((item) => item.id === id)?.label ?? id
  const suffix = unit ? ` ${unit}` : ''
  return `${rows.length} rows by ${cols.length} columns. Highest: ${nameOf(rows, top.row)} and ${nameOf(cols, top.col)} at ${format(top.value)}${suffix}. Lowest: ${nameOf(rows, bottom.row)} and ${nameOf(cols, bottom.col)} at ${format(bottom.value)}${suffix}.`
}
