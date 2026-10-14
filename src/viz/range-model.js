// Geometry and text of the dose/limit chart (RangeBar). Pure functions.
//
//   rows: [{ id, label, markers: [{ kind: 'ai'|'rda'|'ear'|'pri'|'ul', value }],
//            typical?: { from, to, label? }, noUl?: true, noUlNote?: 'EFSA: insufficient data' }]
import { markerPath } from './shapes.js'
import { formatNumber, niceTicks, scaleFor, withUnit } from './scale.js'
import { stagger } from './labels.js'

export const KINDS = Object.freeze({
  ear: Object.freeze({ id: 'ear', label: 'EAR', name: 'Estimated average requirement', shape: 'square' }),
  ai: Object.freeze({ id: 'ai', label: 'AI', name: 'Adequate intake', shape: 'triangle' }),
  rda: Object.freeze({ id: 'rda', label: 'RDA', name: 'Recommended dietary allowance', shape: 'circle' }),
  pri: Object.freeze({ id: 'pri', label: 'PRI', name: 'Population reference intake', shape: 'circle' }),
  ul: Object.freeze({ id: 'ul', label: 'UL', name: 'Tolerable upper intake level', shape: 'bar' })
})
const REQUIREMENT_KINDS = ['ear', 'ai', 'rda', 'pri']

export const ROW_HEIGHT = 116
const TITLE_Y = 14
const NOTE_Y = 30
const BRACKET_Y = 50
const TRACK_Y = 60
const TRACK_H = 14

/** The lowest requirement marker (what must be reached) and the UL of a row, as numbers or null. */
export function limitsOf(row) {
  const requirement = (row.markers ?? []).filter((m) => REQUIREMENT_KINDS.includes(m.kind)).map((m) => m.value)
  const ul = (row.markers ?? []).find((m) => m.kind === 'ul')
  return { requirement: requirement.length ? Math.min(...requirement) : null, ul: ul ? ul.value : null, noUl: !ul }
}

/** Where a value sits against a row: { code, text }. */
export function statusFor(row, value, unit = '') {
  if (value === undefined || value === null) return null
  const { requirement, ul } = limitsOf(row)
  const here = withUnit(value, unit)
  if (ul !== null && value > ul) return { code: 'above-ul', text: `${here} is above the upper limit (${formatNumber(ul)}).` }
  if (requirement !== null && value < requirement) return { code: 'below', text: `${here} is below the lowest reference intake (${formatNumber(requirement)}).` }
  if (ul === null) return { code: 'no-ul', text: `${here} meets the reference intake; no upper limit is established to compare with.` }
  return { code: 'within', text: `${here} is between the reference intake and the upper limit.` }
}

/** Axis maximum: the largest value anywhere, a little headroom, rounded. */
export function axisMax({ rows, value, max }) {
  if (max !== undefined) return max
  const values = rows.flatMap((row) => [...(row.markers ?? []).map((m) => m.value), row.typical?.to ?? 0])
  if (value !== undefined && value !== null) values.push(value)
  return niceTicks(0, Math.max(...values, 1) * 1.08, 5).max
}

export function buildRangeModel({ rows, width = 640, min = 0, max, value, unit = '' }) {
  const top = value === undefined || value === null ? 8 : 26
  const domainMax = axisMax({ rows, value, max })
  const left = 14
  const right = width - 14
  const x = scaleFor({ domain: [min, domainMax], range: [left, right] })
  const ticks = niceTicks(min, domainMax, width < 420 ? 4 : 6).ticks.filter((tick) => tick >= min && tick <= domainMax)

  const built = rows.map((row, index) => {
    const y = top + index * ROW_HEIGHT
    const { requirement, ul, noUl } = limitsOf(row)
    const sorted = [...(row.markers ?? [])].sort((a, b) => a.value - b.value)
    const labels = stagger(
      sorted.map((marker) => ({ ...marker, pos: x(marker.value), text: `${KINDS[marker.kind]?.label ?? marker.kind} ${formatNumber(marker.value)}` })),
      { right: right - 4, rowLimit: 2, fontSize: 12 }
    )
    const regions = []
    const trackTop = y + TRACK_Y
    if (requirement !== null && requirement > min) regions.push({ kind: 'below', x: left, w: x(requirement) - left })
    if (requirement !== null) {
      const end = ul !== null ? x(ul) : right
      regions.push({ kind: ul !== null ? 'within' : 'no-limit', x: x(requirement), w: Math.max(0, end - x(requirement)) })
    }
    if (ul !== null && ul < domainMax) regions.push({ kind: 'above', x: x(ul), w: right - x(ul) })
    return {
      id: row.id,
      label: row.label,
      y,
      titleY: y + TITLE_Y,
      noteY: y + NOTE_Y,
      bracketY: y + BRACKET_Y,
      trackY: trackTop,
      trackH: TRACK_H,
      regions,
      markers: labels.map((marker) => {
        const kind = KINDS[marker.kind]
        const cx = x(marker.value)
        const cy = trackTop + TRACK_H / 2
        return {
          kind: marker.kind,
          value: marker.value,
          x: cx,
          shape: kind?.shape ?? 'circle',
          d: kind?.shape === 'bar' ? `M${cx} ${trackTop - 7}V${trackTop + TRACK_H + 7}` : markerPath(kind?.shape ?? 'circle', cx, cy, 6),
          text: marker.text,
          anchor: marker.anchor,
          labelX: marker.anchor === 'start' ? cx + 2 : cx - 2,
          labelY: trackTop + TRACK_H + 20 + marker.row * 14
        }
      }),
      typical: row.typical ? { x1: x(row.typical.from), x2: x(row.typical.to), label: row.typical.label ?? 'Typical supplement dose', from: row.typical.from, to: row.typical.to } : null,
      noUl,
      noUlText: 'No upper limit established',
      status: statusFor(row, value, unit)
    }
  })

  return {
    width,
    height: top + rows.length * ROW_HEIGHT + 46,
    top,
    left,
    right,
    axisY: top + rows.length * ROW_HEIGHT + 2,
    domain: [min, domainMax],
    x,
    ticks: ticks.map((tick) => ({ value: tick, pos: x(tick), label: formatNumber(tick) })),
    rows: built,
    userX: value === undefined || value === null ? null : x(Math.min(Math.max(value, min), domainMax))
  }
}

/** One sentence per row for the text alternative. */
export function describeRanges({ rows, unit = '', value }) {
  const sentences = rows.map((row) => {
    const parts = [...(row.markers ?? [])].sort((a, b) => a.value - b.value).map((m) => `${KINDS[m.kind]?.label ?? m.kind} ${withUnit(m.value, unit)}`)
    if (limitsOf(row).noUl) parts.push(row.noUlNote ? `no upper limit established (${row.noUlNote})` : 'no upper limit established')
    if (row.typical) parts.push(`${row.typical.label ?? 'typical dose'} ${formatNumber(row.typical.from)} to ${withUnit(row.typical.to, unit)}`)
    return `${row.label}: ${parts.join(', ')}.`
  })
  const here = value === undefined || value === null ? '' : ` Your value ${withUnit(value, unit)}: ${rows.map((row) => `${row.label}, ${statusFor(row, value, unit).text}`).join(' ')}`
  return `${sentences.join(' ')}${here}`.trim()
}

/** Table: kinds present across the rows become columns. */
export function rangeTable({ rows, unit = '', value }) {
  const kinds = Object.keys(KINDS).filter((kind) => rows.some((row) => (row.markers ?? []).some((m) => m.kind === kind)))
  const heads = [...kinds.map((kind) => `${KINDS[kind].label} (${KINDS[kind].name.toLowerCase()})${unit ? `, ${unit}` : ''}`), 'Typical dose']
  if (value !== undefined && value !== null) heads.push(`Your value ${withUnit(value, unit)}`)
  return {
    heads,
    rows: rows.map((row) => ({
      id: row.id,
      label: row.label,
      cells: [
        ...kinds.map((kind) => {
          const marker = (row.markers ?? []).find((m) => m.kind === kind)
          if (marker) return formatNumber(marker.value)
          return kind === 'ul' ? (row.noUlNote ? `none established (${row.noUlNote})` : 'none established') : 'not set'
        }),
        row.typical ? `${formatNumber(row.typical.from)} to ${formatNumber(row.typical.to)}` : 'not shown',
        ...(value === undefined || value === null ? [] : [statusFor(row, value, unit).text])
      ]
    }))
  }
}
