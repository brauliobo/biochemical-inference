// Geometry, readout and text alternative of the multi-series time-course chart
// (LineChartPlus). Pure functions over plain data so they are unit-tested
// without a DOM.
//
//   series: [{ id, label, values, lower?, upper?, baseline?, unit? }]   x: [0, 0.5, ...]
//   events: [{ x, label }]   bands: [{ from, to, label }]   refLines: [{ value, label }]
import { extentOf, formatNumber, logTicks, niceTicks, nearestIndex, sampleEvenly, scaleFor, textWidth, truncate, withUnit } from './scale.js'
import { isOpenMarker, markerPath, seriesLook } from './shapes.js'

export const EVENT_ROW_HEIGHT = 14
export const MAX_EVENT_ROWS = 3
const MARK_LIMIT = 12

/** "p5\u2013p95": the name of an uncertainty band. */
export const rangeLabel = (entry) => `${entry.lowerLabel ?? 'p5'}\u2013${entry.upperLabel ?? 'p95'}`

/** True when every plotted value (and band edge) is positive, so a log axis is valid. */
export function logAllowed(series) {
  return series.every((entry) => [entry.values, entry.lower, entry.upper].every((list) => (list ?? []).every((value) => value === null || value === undefined || value > 0)))
}

function yDomain({ series, bands, refLines, yMin, yMax, type }) {
  const extent = extentOf(
    ...series.flatMap((entry) => [entry.values, entry.lower, entry.upper]),
    ...(bands ?? []).flatMap((band) => [[band.from, band.to]]),
    (refLines ?? []).map((line) => line.value)
  ) ?? [0, 1]
  let [low, high] = extent
  if (type === 'log') {
    const positive = Math.max(low, Number.MIN_VALUE)
    const ticks = logTicks(yMin ?? positive, yMax ?? high)
    return { min: ticks.min, max: ticks.max, ticks: ticks.ticks }
  }
  if (yMin === undefined && low >= 0 && low < high * 0.4) low = 0
  const ticks = niceTicks(yMin ?? low, yMax ?? high, 5)
  return { min: yMin ?? ticks.min, max: yMax ?? ticks.max, ticks: ticks.ticks.filter((tick) => tick >= (yMin ?? ticks.min) - 1e-9 && tick <= (yMax ?? ticks.max) + 1e-9) }
}

function place(items, { pad = 6, rowLimit = MAX_EVENT_ROWS, right, fontSize = 12 }) {
  const ends = []
  return items.map((item, order) => {
    const width = textWidth(item.text, fontSize)
    const anchor = item.pos + width > right ? 'end' : 'start'
    const from = anchor === 'start' ? item.pos : item.pos - width
    const to = anchor === 'start' ? item.pos + width : item.pos
    let row = ends.findIndex((end) => end + pad < from)
    if (row === -1) row = ends.length < rowLimit ? ends.length : order % rowLimit
    ends[row] = Math.max(to, ends[row] ?? -Infinity)
    return { ...item, anchor, row }
  })
}

function linePath(points) {
  let d = ''
  let pen = false
  for (const point of points) {
    if (!point) { pen = false; continue }
    d += `${pen ? 'L' : 'M'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`
    pen = true
  }
  return d
}

function ribbonPath(upper, lower) {
  const top = upper.filter(Boolean)
  const bottom = lower.filter(Boolean)
  if (top.length < 2 || bottom.length < 2) return ''
  return `M${top.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L')}L${[...bottom].reverse().map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('L')}Z`
}

/**
 * Everything the component draws, for a given size.
 * Options: width, height, yScale ('linear' | 'log'), yMin, yMax, hidden (ids), xMin, xMax.
 */
export function buildLineModel({ x, series, events = [], bands = [], refLines = [], width = 640, height = 300, yScale = 'linear', yMin, yMax, hidden = [] }) {
  const visible = series.filter((entry) => !hidden.includes(entry.id))
  const type = yScale === 'log' && logAllowed(series) ? 'log' : 'linear'
  const domain = yDomain({ series: visible.length ? visible : series, bands, refLines, yMin, yMax, type })
  const xExtent = extentOf(x) ?? [0, 1]
  const xTicks = niceTicks(xExtent[0], xExtent[1], width < 420 ? 4 : 7)
  const tickLabels = domain.ticks.map((tick) => formatNumber(tick))
  const left = Math.ceil(Math.max(...tickLabels.map((label) => textWidth(label)), 12)) + 38
  const right = width - 14
  const bottom = height - 44
  const xScale = scaleFor({ domain: [xExtent[0], xExtent[1]], range: [left, right] })

  const placed = place(
    [...events].sort((a, b) => a.x - b.x).map((event) => ({ ...event, text: truncate(event.label, 34), pos: xScale(event.x) })),
    { right: right - 4 }
  )
  const rows = placed.length ? Math.max(...placed.map((event) => event.row)) + 1 : 0
  const top = 12 + rows * EVENT_ROW_HEIGHT
  const yFn = scaleFor({ domain: [domain.min, domain.max], range: [bottom, top], type })

  const lines = series.map((entry, index) => {
    const look = seriesLook(entry.look ?? index)
    const isVisible = !hidden.includes(entry.id)
    const points = entry.values.map((value, i) => (value === null || value === undefined || Number.isNaN(value) || x[i] === undefined ? null : { x: xScale(x[i]), y: yFn(value), i }))
    const solid = points.filter(Boolean)
    const step = Math.max(1, Math.ceil(solid.length / MARK_LIMIT))
    const upperPoints = entry.upper ? entry.upper.map((value, i) => (value === null || value === undefined ? null : { x: xScale(x[i]), y: yFn(value) })) : null
    const lowerPoints = entry.lower ? entry.lower.map((value, i) => (value === null || value === undefined ? null : { x: xScale(x[i]), y: yFn(value) })) : null
    return {
      id: entry.id,
      label: entry.label,
      baseline: Boolean(entry.baseline),
      look,
      visible: isVisible,
      path: linePath(points),
      ribbon: upperPoints && lowerPoints ? ribbonPath(upperPoints, lowerPoints) : '',
      markPath: solid.filter((_, position) => position % step === 0 || position === solid.length - 1).map((p) => markerPath(look.shape, p.x, p.y, 3.5)).join(''),
      markOpen: isOpenMarker(look.shape)
    }
  })

  return {
    width,
    height,
    plot: { left, right, top, bottom },
    xScale,
    yScale: yFn,
    yType: type,
    logAllowed: logAllowed(series),
    yDomain: domain,
    xTicks: xTicks.ticks.filter((tick) => tick >= xExtent[0] - 1e-9 && tick <= xExtent[1] + 1e-9).map((value) => ({ value, pos: xScale(value), label: formatNumber(value) })),
    yTicks: domain.ticks.map((value) => ({ value, pos: yFn(value), label: formatNumber(value) })),
    lines,
    events: placed.map((event) => ({ ...event, labelY: 10 + event.row * EVENT_ROW_HEIGHT })),
    bands: bands.map((band) => {
      const a = yFn(Math.max(band.from, type === 'log' ? domain.min : -Infinity))
      const b = yFn(band.to)
      return { ...band, y: Math.min(a, b), height: Math.abs(a - b), labelY: Math.min(a, b) + 12 }
    }),
    refLines: refLines.map((line) => ({ ...line, y: yFn(line.value) }))
  }
}

/** Index of the sample nearest to a pixel x position inside the plot. */
export function indexAtPixel(model, x, pixel) {
  const [first, last] = [x[0], x.at(-1)]
  const span = model.plot.right - model.plot.left || 1
  const value = first + ((pixel - model.plot.left) / span) * (last - first)
  return nearestIndex(x, value)
}

/** The readout for sample `index`: x text, one row per visible series, events at that x. */
export function readoutAt({ x, series, events = [], bands = [], hidden = [], xUnit = '', unit = '', index }) {
  const at = x[index]
  const rows = series
    .filter((entry) => !hidden.includes(entry.id))
    .map((entry) => {
      const value = entry.values[index]
      const lower = entry.lower?.[index]
      const upper = entry.upper?.[index]
      const suffix = entry.unit ?? unit
      return {
        id: entry.id,
        label: entry.label,
        value,
        valueText: value === null || value === undefined ? 'no value' : withUnit(value, suffix),
        rangeText: lower !== undefined && upper !== undefined && lower !== null ? `${rangeLabel(entry)} ${formatNumber(lower)} to ${formatNumber(upper)}` : '',
        inBands: bands.filter((band) => value >= band.from && value <= band.to).map((band) => band.label)
      }
    })
  const span = x.length > 1 ? Math.abs(x[1] - x[0]) : 0
  const here = events.filter((event) => Math.abs(event.x - at) <= Math.max(span / 2, 1e-9))
  const xText = `${formatNumber(at)}${xUnit ? ` ${xUnit}` : ''}`
  const parts = rows.map((row) => `${row.label} ${row.valueText}${row.rangeText ? ` (${row.rangeText})` : ''}${row.inBands.length ? `, inside ${row.inBands.join(', ')}` : ''}`)
  return { index, xText, rows, events: here, text: `At ${xText}: ${parts.join('; ')}${here.length ? `. Event: ${here.map((event) => event.label).join(', ')}` : ''}.` }
}

/** One plain sentence per series and a sentence for the markers, for the visible summary. */
export function describeLines({ x, series, events = [], bands = [], refLines = [], xUnit = '', unit = '' }) {
  const span = `${formatNumber(x[0])} to ${formatNumber(x.at(-1))}${xUnit ? ` ${xUnit}` : ''}`
  const sentences = series.map((entry) => {
    const finite = entry.values.map((value, i) => ({ value, i })).filter((item) => Number.isFinite(item.value))
    if (!finite.length) return `${entry.label}: no values.`
    const peak = finite.reduce((best, item) => (item.value > best.value ? item : best))
    const suffix = entry.unit ?? unit
    const band = entry.lower && entry.upper ? ` with a ${rangeLabel(entry)} band` : ''
    return `${entry.label}${band}: starts at ${withUnit(finite[0].value, suffix)}, peaks at ${withUnit(peak.value, suffix)} (${formatNumber(x[peak.i])}${xUnit ? ` ${xUnit}` : ''}) and ends at ${withUnit(finite.at(-1).value, suffix)}.`
  })
  const extras = []
  if (events.length) extras.push(`Events: ${events.map((event) => `${event.label} at ${formatNumber(event.x)}${xUnit ? ` ${xUnit}` : ''}`).join('; ')}.`)
  if (bands.length) extras.push(`Reference ranges: ${bands.map((band) => `${band.label} ${formatNumber(band.from)} to ${formatNumber(band.to)}`).join('; ')}.`)
  if (refLines.length) extras.push(`Reference lines: ${refLines.map((line) => `${line.label} ${formatNumber(line.value)}`).join('; ')}.`)
  return `${series.length} series over ${span}. ${sentences.join(' ')} ${extras.join(' ')}`.trim()
}

/** Table rows for the text alternative: at most `limit` samples, always the first and last. */
export function tableRows({ x, series, limit = 24 }) {
  return sampleEvenly(x, limit).map(({ item, index }) => ({
    x: formatNumber(item),
    cells: series.flatMap((entry) => [
      formatNumber(entry.values[index]),
      ...(entry.lower && entry.upper ? [formatNumber(entry.lower[index]), formatNumber(entry.upper[index])] : [])
    ])
  }))
}

/** Column headings matching `tableRows` cells. */
export function tableHeadings({ series, unit = '' }) {
  return series.flatMap((entry) => {
    const suffix = entry.unit ?? unit
    const name = suffix ? `${entry.label} (${suffix})` : entry.label
    return entry.lower && entry.upper ? [name, `${entry.label} ${entry.lowerLabel ?? 'p5'}`, `${entry.label} ${entry.upperLabel ?? 'p95'}`] : [name]
  })
}
