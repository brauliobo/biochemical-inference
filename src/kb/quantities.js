// Structured quantities as chips, dose rows and range rows. Pure functions over the shipped quantity index
// (src/knowledge/quant.js); the templates only draw what these return.
import { KINDS, UNITS, convertUnit, populationRank } from '../knowledge/quant.js'
import { contentFraction, getEntity, limitsFor, quantFor } from '../knowledge/index.js'
import { formatNumber } from '../viz/scale.js'

export const SHORT_KIND = Object.freeze({
  EAR: 'EAR', RDA: 'RDA', PRI: 'PRI', AI: 'AI', UL: 'UL', LOAEL: 'LOAEL', OSL: 'OSL',
  'typical-dose': 'Typical dose', 'trial-dose': 'Trial dose', 'approved-dose': 'Approved dose',
  'reference-range': 'Reference range', threshold: 'Threshold', concentration: 'Concentration', ratio: 'Ratio', ph: 'pH', pKa: 'pKa',
  flux: 'Flux', 'flux-share': 'Flux share', pool: 'Pool size', 'content-fraction': 'Content', 'molar-mass': 'Molar mass', conversion: 'Conversion', composition: 'Composition'
})

// What a chip row shows first, most informative to least.
const PRIORITY = ['UL', 'AI', 'RDA', 'PRI', 'EAR', 'approved-dose', 'typical-dose', 'trial-dose', 'reference-range', 'threshold', 'concentration', 'ph', 'pKa', 'flux-share', 'flux', 'pool', 'content-fraction', 'molar-mass', 'conversion', 'composition', 'ratio', 'LOAEL', 'OSL']

const unitText = (unit) => (['fraction', 'ratio', 'pKa', 'pH'].includes(unit) ? '' : unit)

/** Value text of a record: '3500 mg/day', '3-10 g/day', '41 %', 'none established'. */
export function valueText(record) {
  if (record.value === null || record.value === undefined) {
    if (Number.isFinite(record.low) && Number.isFinite(record.high)) return `${formatNumber(record.low)} to ${formatNumber(record.high)} ${unitText(record.unit)}`.trim()
    return 'none established'
  }
  if (record.unit === 'fraction') return `${formatNumber(record.value * 100)} %`
  const range = Number.isFinite(record.low) && Number.isFinite(record.high) && record.low !== record.high ? ` (${formatNumber(record.low)} to ${formatNumber(record.high)})` : ''
  return `${record.approximate ? 'about ' : ''}${formatNumber(record.value)} ${unitText(record.unit)}${range}`.trim()
}

/** A record as a chip: label (kind and who), text (value) and the provenance the popover shows. */
export function chipFor(record) {
  const kind = SHORT_KIND[record.kind] ?? record.kind
  const who = [record.authority, record.population].filter(Boolean).join(', ')
  const target = record.target ? getEntity(record.target)?.name : null
  return {
    id: record.id,
    kind: record.kind,
    label: record.kind === 'content-fraction' && target ? `${kind} of ${target}` : who && KINDS[record.kind]?.group === 'limit' ? `${kind} (${record.authority})` : kind,
    text: valueText(record),
    absent: record.value === null && !(Number.isFinite(record.low) && Number.isFinite(record.high)),
    authority: record.authority ?? null,
    population: record.population ?? null,
    basis: record.basis ?? null,
    target,
    note: record.note ?? null,
    approximate: Boolean(record.approximate),
    established: record.established !== false,
    derived: KINDS[record.kind]?.group === 'derived',
    refs: record.refs ?? [],
    kindLabel: KINDS[record.kind]?.label ?? record.kind,
    unit: record.unit
  }
}

const rank = (record) => {
  const index = PRIORITY.indexOf(record.kind)
  return index < 0 ? PRIORITY.length : index
}

/** Chips for an entity, most informative first. `kinds` narrows, `limit` caps. */
export function chipsFor(id, { kinds, limit, skip = [] } = {}) {
  const records = quantFor(id, kinds ? { kind: kinds } : {}).filter((record) => !skip.includes(record.kind))
  const sorted = [...records].sort((a, b) => rank(a) - rank(b) || populationRank(a.population) - populationRank(b.population))
  return (limit ? sorted.slice(0, limit) : sorted).map(chipFor)
}

/** The few quantities worth a line on a compact card. */
export function topQuantities(id, n = 3) {
  return chipsFor(id, { skip: ['molar-mass', 'conversion', 'composition'], limit: n })
}

const isMass = (unit) => ['mass-per-day', 'mass'].includes(UNITS[unit]?.dimension)

/** Choose mg/day, µg/day or g/day so the largest value reads as 1 to 9999. */
function readableUnit(valuesMg) {
  const max = Math.max(...valuesMg.filter(Number.isFinite), 0)
  if (max > 0 && max < 1) return 'µg/day'
  if (max >= 10000) return 'g/day'
  return 'mg/day'
}

const toMg = (value, unit) => {
  const dimension = UNITS[unit]?.dimension
  return convertUnit(value, unit, dimension === 'mass' ? 'mg' : 'mg/day')
}
const fromMg = (value, unit) => convertUnit(value, 'mg/day', unit)

const round = (value) => Number(Number(value).toPrecision(4))

/**
 * Dose-against-limits rows for RangeBar. One row per authority and adult population, so a row never holds two values
 * of one kind. A UL that was explicitly not set gives `noUlNote` (the bar prints "No upper limit established").
 * Returns { rows, unit } or null when the compound has no intake limits in mass per day.
 */
export function limitRows(id) {
  const rows = []
  for (const group of limitsFor(id)) {
    const byPopulation = new Map()
    for (const record of group.limits) {
      if (populationRank(record.population) !== 0 || !isMass(record.unit)) continue
      const key = record.population ?? 'all'
      if (!byPopulation.has(key)) byPopulation.set(key, [])
      byPopulation.get(key).push(record)
    }
    // A limit for "adults 19+" applies to men and to women: put it on each sex-specific row instead of a row of its own.
    const sexKeys = [...byPopulation.keys()].filter((key) => /^(men|women)\b/.test(key))
    const genericKeys = [...byPopulation.keys()].filter((key) => !sexKeys.includes(key))
    if (sexKeys.length && genericKeys.length) {
      for (const key of sexKeys) {
        const own = byPopulation.get(key)
        for (const generic of genericKeys) {
          for (const record of byPopulation.get(generic)) if (!own.some((item) => item.kind === record.kind)) own.push(record)
        }
      }
      for (const key of genericKeys) byPopulation.delete(key)
    }
    for (const [population, records] of byPopulation) {
      const markers = []
      let noUlNote = ''
      for (const record of records) {
        const kind = record.kind.toLowerCase()
        if (!['ear', 'rda', 'pri', 'ai', 'ul'].includes(kind)) continue
        if (record.value === null) {
          if (kind === 'ul') noUlNote = record.note ?? 'No upper limit established'
          continue
        }
        if (markers.some((marker) => marker.kind === kind)) continue // one marker per kind in a row; the chips list every record
        markers.push({ kind, mg: toMg(record.value, record.unit) })
      }
      if (!markers.length && !noUlNote) continue
      rows.push({ id: `${group.authority}-${population}`, label: `${group.authority}, ${population}`, markers, noUlNote })
    }
  }
  if (!rows.length) return null
  const unit = readableUnit(rows.flatMap((row) => row.markers.map((marker) => marker.mg)))
  return {
    unit,
    rows: rows.slice(0, 6).map((row) => ({ id: row.id, label: row.label, markers: row.markers.map((marker) => ({ kind: marker.kind, value: round(fromMg(marker.mg, unit)) })), ...(row.noUlNote ? { noUlNote: row.noUlNote } : {}) }))
  }
}

/** Typical, trial and approved dose records of a subject that are masses (per day or per dose), in mg. */
function doseRecords(id) {
  return quantFor(id, { kind: ['typical-dose', 'trial-dose', 'approved-dose'] }).filter((record) => isMass(record.unit) && (Number.isFinite(record.value) || (Number.isFinite(record.low) && Number.isFinite(record.high))))
}

/** Compound ids a product's doses can be compared with: content-fraction targets and compounds named by a dose's basis. */
function targetsOf(id) {
  const targets = new Map()
  for (const record of quantFor(id, { kind: 'content-fraction' })) if (record.target && getEntity(record.target)) targets.set(record.target, record.value)
  for (const record of quantFor(id, { kind: ['typical-dose', 'trial-dose', 'approved-dose'] })) {
    const guess = `compound:${String(record.basis ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`
    if (!targets.has(guess) && getEntity(guess)) targets.set(guess, contentFraction(id, guess) ?? 1)
  }
  return targets
}

/**
 * Typical and trial doses of a product (an intervention or compound) against the upper limits of what it delivers.
 * Rows: one bracket per dose record, then one UL row per authority, expressed in product mass when the product holds only a
 * fraction of the nutrient. Returns { rows, unit, notes } or null when there is nothing to show.
 */
export function doseRows(id) {
  const records = doseRecords(id)
  if (!records.length) return null
  const rows = []
  const mgOf = (record, key) => toMg(record[key], record.unit)
  for (const record of records.slice(0, 5)) {
    const from = Number.isFinite(record.low) ? mgOf(record, 'low') : mgOf(record, 'value') * 0.97
    const to = Number.isFinite(record.high) ? mgOf(record, 'high') : mgOf(record, 'value') * 1.03
    const label = `${SHORT_KIND[record.kind]}${record.population ? `, ${record.population}` : ''}`
    rows.push({ id: record.id, label, markers: [], doseOnly: true, typical: { from, to, label: valueText(record) }, noUlNote: '' })
  }
  const notes = []
  for (const [target, fraction] of targetsOf(id)) {
    const share = Number.isFinite(fraction) && fraction > 0 ? fraction : 1
    for (const limit of limitRows(target)?.rows ?? []) {
      const ul = limit.markers.find((marker) => marker.kind === 'ul')
      if (!ul && !limit.noUlNote) continue
      const name = getEntity(target)?.name ?? target
      rows.push({
        id: `ul-${target}-${limit.id}`,
        label: `${limit.label}: UL for ${name}${share < 1 ? ' as this product' : ''}`,
        mgUl: ul ? ul.value : null,
        unitHint: limitRows(target).unit,
        markers: [],
        noUlNote: ul ? '' : limit.noUlNote,
        share
      })
      if (share < 1 && ul) notes.push(`${name} is ${formatNumber(share * 100)} % of this product by mass, so its upper limit is divided by ${formatNumber(share)}.`)
    }
  }
  const recorded = getEntity(id)?.facts?.ul
  if (recorded) notes.push(`Upper limit recorded for this product: ${recorded}.`)
  // express everything in one unit
  const doseMg = rows.flatMap((row) => (row.typical ? [row.typical.from, row.typical.to] : []))
  const ulMg = rows.filter((row) => row.mgUl !== undefined && row.mgUl !== null).map((row) => convertUnit(row.mgUl, row.unitHint, 'mg/day') / row.share)
  const unit = readableUnit([...doseMg, ...ulMg])
  const out = rows.slice(0, 9).map((row) => {
    if (row.typical) return { id: row.id, label: row.label, markers: [], doseOnly: true, typical: { from: round(fromMg(row.typical.from, unit)), to: round(fromMg(row.typical.to, unit)), label: row.typical.label } }
    const markers = row.mgUl !== null && row.mgUl !== undefined ? [{ kind: 'ul', value: round(fromMg(convertUnit(row.mgUl, row.unitHint, 'mg/day') / row.share, unit)) }] : []
    return { id: row.id, label: row.label, markers, ...(row.noUlNote ? { noUlNote: row.noUlNote } : {}) }
  })
  return { rows: out, unit, notes: [...new Set(notes)] }
}
