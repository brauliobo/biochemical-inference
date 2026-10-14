// Validation of structured quantities (src/knowledge/data/quant.js). Pure and zod-free:
// records + graph in, issues out. validate.js maps the rule ids to severities and merges them into the report.
import { KINDS, QUANT_ID_PATTERN, UNITS, parseMolarMassFact } from './quant.js'

export const QUANT_RULES = Object.freeze({
  'quant-schema': { severity: 'error', title: 'Quantity records that break the contract' },
  'quant-duplicate-id': { severity: 'error', title: 'Duplicate quantity ids' },
  'quant-dangling-subject': { severity: 'error', title: 'Quantities about entities that do not exist' },
  'quant-dangling-ref': { severity: 'error', title: 'Quantity refs or targets that do not exist' },
  'quant-unit': { severity: 'error', title: 'Units unknown or not valid for the kind of quantity' },
  'quant-range': { severity: 'error', title: 'Values outside their range (low > high, fraction > 1, pH outside 0-14)' },
  'quant-limit-order': { severity: 'error', title: 'Upper levels below the intake they bound' },
  'quant-established': { severity: 'error', title: 'Established flag inconsistent with the value' },
  'quant-no-ref': { severity: 'error', title: 'Quantities that quote a source but cite none' },
  'quant-fact-mismatch': { severity: 'error', title: 'Molar masses that disagree with the compound fact' }
})

const ALLOWED_KEYS = new Set(['id', 'subject', 'kind', 'value', 'low', 'high', 'unit', 'basis', 'authority', 'population', 'note', 'refs', 'established', 'approximate', 'target'])
const isNumber = (value) => typeof value === 'number' && Number.isFinite(value)
const isText = (value) => typeof value === 'string' && value.trim().length > 0
const NOT_SUBJECTS = new Set(['article', 'claim'])
const ADULT_LIKE = /^(adults?|men|women)\b/

/**
 * checkQuant(records, graph) -> [{ rule, id, path, message }]
 * `graph` is a knowledge graph from buildGraph (used to resolve subjects, refs, targets and compound facts).
 */
export function checkQuant(records, graph) {
  const issues = []
  const add = (rule, id, message, path = '') => issues.push({ rule, id, path, message })

  if (!Array.isArray(records)) {
    add('quant-schema', '', 'quantity data must be an array of records')
    return issues
  }

  const seen = new Map()
  const usable = []
  records.forEach((record, index) => {
    const id = isText(record?.id) ? record.id : `#${index}`
    if (record === null || typeof record !== 'object' || Array.isArray(record)) {
      add('quant-schema', id, 'record must be an object')
      return
    }
    const bad = (message, path = '') => add('quant-schema', id, message, path)
    const unknownKeys = Object.keys(record).filter((key) => !ALLOWED_KEYS.has(key))
    if (unknownKeys.length) bad(`unknown field${unknownKeys.length > 1 ? 's' : ''}: ${unknownKeys.join(', ')}`)
    if (!QUANT_ID_PATTERN.test(String(record.id))) bad(`id '${record.id}' must look like 'quant:<kebab-slug>'`, 'id')
    else if (seen.has(record.id)) add('quant-duplicate-id', id, `id is defined more than once (first at #${seen.get(record.id)})`)
    else seen.set(record.id, index)

    const kind = KINDS[record.kind]
    if (!kind) bad(`kind '${record.kind}' is unknown; use one of ${Object.keys(KINDS).join(', ')}`, 'kind')
    if (!isText(record.subject)) bad('subject is required', 'subject')
    if (!(record.value === null || isNumber(record.value))) bad('value must be a number, or null when nothing is established', 'value')
    for (const key of ['low', 'high']) if (record[key] !== undefined && !isNumber(record[key])) bad(`${key} must be a number`, key)
    if (!isText(record.unit)) bad('unit is required', 'unit')
    if (!isText(record.basis)) bad('basis is required (what the number refers to: elemental, salt, DFE, ...)', 'basis')
    if (typeof record.established !== 'boolean') bad('established must be true or false', 'established')
    for (const key of ['authority', 'population', 'note', 'target']) if (record[key] !== undefined && !isText(record[key])) bad(`${key} must be a non-empty string`, key)
    if (record.approximate !== undefined && typeof record.approximate !== 'boolean') bad('approximate must be a boolean', 'approximate')
    if (record.refs !== undefined && !(Array.isArray(record.refs) && record.refs.every(isText))) bad('refs must be an array of article ids', 'refs')
    if (kind?.group === 'limit') {
      if (!isText(record.authority)) bad(`${record.kind} needs an authority ('IOM 1998', 'EFSA 2016', ...)`, 'authority')
      if (!isText(record.population)) bad(`${record.kind} needs a population ('adults', 'pregnancy', ...)`, 'population')
    }
    usable.push({ record, id, kind })
  })

  for (const { record, id, kind } of usable) {
    // units
    const unit = UNITS[record.unit]
    if (isText(record.unit)) {
      if (!unit) add('quant-unit', id, `unit '${record.unit}' is not in the unit table`, 'unit')
      else if (kind && !kind.dimensions.includes(unit.dimension)) {
        add('quant-unit', id, `${record.kind} cannot use unit '${record.unit}' (${unit.dimension}); allowed dimensions: ${kind.dimensions.join(', ')}`, 'unit')
      }
    }

    // ranges
    const { value, low, high } = record
    if (isNumber(low) && isNumber(high) && low > high) add('quant-range', id, `low (${low}) is above high (${high})`, 'low')
    for (const [key, number] of [['value', value], ['low', low], ['high', high]]) {
      if (!isNumber(number)) continue
      if (number < 0) add('quant-range', id, `${key} is negative`, key)
      if (unit?.dimension === 'fraction' && number > 1) add('quant-range', id, `${key} (${number}) is above 1; fractions are 0-1`, key)
      if (unit?.dimension === 'ph' && number > 14) add('quant-range', id, `${key} (${number}) is not a pH`, key)
    }
    if (isNumber(value) && isNumber(low) && value < low) add('quant-range', id, `value (${value}) is below low (${low})`, 'value')
    if (isNumber(value) && isNumber(high) && value > high) add('quant-range', id, `value (${value}) is above high (${high})`, 'value')
    if (record.kind === 'molar-mass' && isNumber(value) && value <= 0) add('quant-range', id, 'molar mass must be positive', 'value')

    // established flag
    const hasNumber = isNumber(value) || (isNumber(low) && isNumber(high))
    if (record.established === true && !hasNumber) add('quant-established', id, 'established is true but there is no value (use value, or low and high)', 'established')
    if (record.established === false) {
      if (hasNumber || isNumber(low) || isNumber(high)) add('quant-established', id, "established is false, so value must be null and there is no range ('no UL established' is value: null)", 'established')
      if (!isText(record.note)) add('quant-established', id, 'established: false needs a note saying what is missing', 'note')
    }

    // references
    if (kind?.refs && !(record.refs?.length > 0)) add('quant-no-ref', id, `${record.kind} quotes a source; cite it in refs: ['article:...']`, 'refs')
    for (const [index, ref] of (record.refs ?? []).entries()) {
      if (!isText(ref)) continue
      if (graph.get(ref)?.type !== 'article') add('quant-dangling-ref', id, `ref '${ref}' is not an article in the knowledge base`, `refs[${index}]`)
    }
    if (isText(record.target) && !graph.has(record.target)) add('quant-dangling-ref', id, `target '${record.target}' does not exist`, 'target')

    // subject
    if (isText(record.subject)) {
      const subject = graph.get(record.subject)
      if (!subject) add('quant-dangling-subject', id, `subject '${record.subject}' does not exist`, 'subject')
      else if (NOT_SUBJECTS.has(subject.type)) add('quant-dangling-subject', id, `subject '${record.subject}' is a ${subject.type}; use the compound, intervention or other entity the number is about`, 'subject')
    }
  }

  // upper levels must not sit below the intake they bound (same basis, comparable population)
  const bySubject = Map.groupBy(usable.filter(({ record }) => record.established === true && isNumber(record.value) && UNITS[record.unit]), ({ record }) => record.subject)
  for (const [subject, group] of bySubject) {
    const uppers = group.filter(({ record }) => record.kind === 'UL')
    const floors = group.filter(({ record }) => ['EAR', 'RDA', 'PRI', 'AI'].includes(record.kind))
    for (const upper of uppers) {
      for (const floor of floors) {
        if (upper.record.basis !== floor.record.basis) continue
        if (UNITS[upper.record.unit].dimension !== UNITS[floor.record.unit].dimension) continue
        const samePopulation = upper.record.population === floor.record.population || (ADULT_LIKE.test(upper.record.population ?? '') && ADULT_LIKE.test(floor.record.population ?? ''))
        if (!samePopulation) continue
        const ul = upper.record.value * UNITS[upper.record.unit].factor
        const reference = floor.record.value * UNITS[floor.record.unit].factor
        if (ul < reference) add('quant-limit-order', upper.id, `UL ${upper.record.value} ${upper.record.unit} is below ${floor.record.kind} ${floor.record.value} ${floor.record.unit} (${floor.id}) for ${subject}; give them different bases if the UL covers only supplements`, 'value')
      }
    }
  }

  // molar masses agree with the compound facts they were derived from
  const masses = new Map()
  for (const { record } of usable) {
    if (record.kind === 'molar-mass' && isNumber(record.value)) {
      const list = masses.get(record.subject) ?? []
      list.push(record.value)
      masses.set(record.subject, list)
    }
  }
  for (const entity of graph.entities) {
    const stated = parseMolarMassFact(entity.facts?.molarMass)
    if (stated === null) continue
    const found = masses.get(entity.id)
    if (!found) add('quant-fact-mismatch', entity.id, `facts.molarMass says ${entity.facts.molarMass} but there is no molar-mass quantity for it`)
    else if (!found.some((value) => Math.abs(value - stated) <= 0.011)) add('quant-fact-mismatch', entity.id, `facts.molarMass starts with ${stated} but the molar-mass quantities are ${found.join(', ')}`)
  }

  return issues
}
