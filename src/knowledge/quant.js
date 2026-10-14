// Structured quantities: the numbers that entity prose and facts only state as text.
//
// A record is plain data (src/knowledge/data/quant.js), not an entity:
//   { id: 'quant:choline-ai-men-iom-1998', subject: 'compound:choline', kind: 'AI',
//     value: 550, unit: 'mg/day', basis: 'elemental choline', authority: 'IOM 1998', population: 'men 19+',
//     refs: ['article:iom-1998-choline-dri'], established: true }
//
//   value        number, or null when nothing is established (then `established: false` and a `note`)
//   low / high   optional range; with both set, low <= high and value (if any) lies between them
//   approximate  true when the source says "about"
//   target       entity id the number relates to: the component of a content-fraction, the whole of a
//                flux-share, the product of a conversion
//   refs         article ids that carry the number; required for every kind that quotes a source
//
// This module is pure: lookups and unit/dose conversions over a record array. Validation lives in
// quant-validate.js (build/test time) so the browser bundle stays free of it.

const MICRO = 'µ' // the micro sign used in every unit string

/** Unit table: dimension plus the factor to the base unit of that dimension. */
export const UNITS = Object.freeze({
  [`${MICRO}g`]: { dimension: 'mass', factor: 1e-6 },
  mg: { dimension: 'mass', factor: 1e-3 },
  g: { dimension: 'mass', factor: 1 },
  kg: { dimension: 'mass', factor: 1e3 },
  [`${MICRO}g/day`]: { dimension: 'mass-per-day', factor: 1e-6 },
  'mg/day': { dimension: 'mass-per-day', factor: 1e-3 },
  'g/day': { dimension: 'mass-per-day', factor: 1 },
  'mg/kg/day': { dimension: 'mass-per-kg-day', factor: 1e-3 },
  'g/kg/day': { dimension: 'mass-per-kg-day', factor: 1 },
  'mg/MJ': { dimension: 'mass-per-energy', factor: 1e-3 },
  [`${MICRO}L`]: { dimension: 'volume', factor: 1e-6 },
  mL: { dimension: 'volume', factor: 1e-3 },
  L: { dimension: 'volume', factor: 1 },
  'mL/day': { dimension: 'volume-per-day', factor: 1e-3 },
  'L/day': { dimension: 'volume-per-day', factor: 1 },
  'nmol/L': { dimension: 'molar-concentration', factor: 1e-9 },
  [`${MICRO}mol/L`]: { dimension: 'molar-concentration', factor: 1e-6 },
  'mmol/L': { dimension: 'molar-concentration', factor: 1e-3 },
  'mmol/h': { dimension: 'molar-rate', factor: 1e-3 },
  'mmol/day': { dimension: 'molar-rate-day', factor: 1e-3 },
  [`${MICRO}mol/kg/h`]: { dimension: 'molar-rate-per-kg', factor: 1e-6 },
  'g/mol': { dimension: 'molar-mass', factor: 1 },
  kDa: { dimension: 'molar-mass-kda', factor: 1 },
  'mmol/g': { dimension: 'amount-per-mass', factor: 1e-3 },
  'mL/mmol': { dimension: 'volume-per-amount', factor: 1 },
  'g/g': { dimension: 'mass-ratio', factor: 1 },
  'mol/mol': { dimension: 'mole-ratio', factor: 1 },
  fraction: { dimension: 'fraction', factor: 1 },
  ratio: { dimension: 'ratio', factor: 1 },
  pH: { dimension: 'ph', factor: 1 },
  pKa: { dimension: 'pka', factor: 1 },
  ppm: { dimension: 'ppm', factor: 1 },
  minutes: { dimension: 'time', factor: 60 },
  hours: { dimension: 'time', factor: 3600 },
  days: { dimension: 'time', factor: 86400 },
  mmHg: { dimension: 'pressure', factor: 1 }
})

export const UNIT_IDS = Object.freeze(Object.keys(UNITS))

const normalizeUnit = (unit) => String(unit).replace(/[μ]/g, MICRO).replace(/^ug/, `${MICRO}g`).replace(/^umol/, `${MICRO}mol`)

/** Convert a number between two units of the same dimension; throws when the dimensions differ. */
export function convertUnit(value, from, to) {
  const a = UNITS[normalizeUnit(from)]
  const b = UNITS[normalizeUnit(to)]
  if (!a || !b) throw new RangeError(`unknown unit: ${!a ? from : to}`)
  if (a.dimension !== b.dimension) throw new RangeError(`cannot convert ${from} (${a.dimension}) to ${to} (${b.dimension})`)
  return (value * a.factor) / b.factor
}

const MASS_RATE = ['mass-per-day', 'mass-per-kg-day']
const AMOUNT = ['mass', 'mass-per-day', 'mass-per-kg-day', 'mass-per-energy', 'molar-concentration', 'volume', 'molar-rate', 'molar-rate-day', 'molar-rate-per-kg', 'mass-ratio']

/**
 * Kinds of quantity. `group` orders and filters them; `dimensions` lists the unit dimensions a kind accepts;
 * `refs` says whether a source article is mandatory; `limit` kinds also need authority and population.
 */
export const KINDS = Object.freeze({
  EAR: { label: 'Estimated average requirement', group: 'limit', dimensions: MASS_RATE, refs: true, order: 1 },
  RDA: { label: 'Recommended dietary allowance', group: 'limit', dimensions: MASS_RATE, refs: true, order: 2 },
  PRI: { label: 'Population reference intake', group: 'limit', dimensions: [...MASS_RATE, 'mass-per-energy'], refs: true, order: 3 },
  AI: { label: 'Adequate intake', group: 'limit', dimensions: MASS_RATE, refs: true, order: 4 },
  UL: { label: 'Tolerable upper intake level', group: 'limit', dimensions: MASS_RATE, refs: true, order: 5 },
  LOAEL: { label: 'Lowest observed adverse effect level', group: 'limit', dimensions: MASS_RATE, refs: true, order: 5.5 },
  OSL: { label: 'Observed safe level', group: 'limit', dimensions: MASS_RATE, refs: true, order: 6 },
  'typical-dose': { label: 'Typical dose', group: 'dose', dimensions: [...MASS_RATE, 'mass', 'volume', 'volume-per-day'], refs: false, order: 7 },
  'trial-dose': { label: 'Dose used in trials', group: 'dose', dimensions: [...MASS_RATE, 'mass', 'volume', 'volume-per-day'], refs: false, order: 8 },
  'approved-dose': { label: 'Approved or labelled dose', group: 'dose', dimensions: [...MASS_RATE, 'mass', 'volume', 'volume-per-day'], refs: true, order: 9 },
  'reference-range': { label: 'Reference range', group: 'measure', dimensions: ['molar-concentration', 'mass-ratio', 'ratio'], refs: true, order: 10 },
  threshold: { label: 'Diagnostic or classification threshold', group: 'measure', dimensions: ['molar-concentration', 'ppm', 'ph', 'fraction', 'time'], refs: true, order: 11 },
  concentration: { label: 'Typical concentration', group: 'measure', dimensions: ['molar-concentration'], refs: true, order: 12 },
  ratio: { label: 'Typical ratio', group: 'measure', dimensions: ['ratio', 'mole-ratio', 'mass-ratio'], refs: true, order: 13 },
  ph: { label: 'pH', group: 'measure', dimensions: ['ph'], refs: true, order: 14 },
  pKa: { label: 'Acid dissociation constant (pKa)', group: 'measure', dimensions: ['pka'], refs: false, order: 14.5 },
  flux: { label: 'Flux or rate', group: 'flux', dimensions: [...AMOUNT, 'volume-per-day'], refs: true, order: 15 },
  'flux-share': { label: 'Share of a flux', group: 'flux', dimensions: ['fraction'], refs: true, order: 16 },
  pool: { label: 'Pool size', group: 'flux', dimensions: ['mass', 'molar-concentration'], refs: true, order: 17 },
  'content-fraction': { label: 'Content (mass fraction)', group: 'derived', dimensions: ['fraction'], refs: false, order: 18 },
  'molar-mass': { label: 'Molar mass', group: 'derived', dimensions: ['molar-mass'], refs: false, order: 19 },
  conversion: { label: 'Conversion factor', group: 'derived', dimensions: ['amount-per-mass', 'volume-per-amount', 'mass-ratio', 'mole-ratio', 'fraction'], refs: false, order: 20 },
  composition: { label: 'Composition', group: 'derived', dimensions: ['fraction', 'mass'], refs: true, order: 21 }
})

export const KIND_IDS = Object.freeze(Object.keys(KINDS))
export const LIMIT_KINDS = Object.freeze(KIND_IDS.filter((kind) => KINDS[kind].group === 'limit'))

const kindOrder = (kind) => KINDS[kind]?.order ?? 99

export const QUANT_ID_PATTERN = /^quant:[a-z0-9]+(?:-[a-z0-9]+)*$/

const FACT_NUMBER = /^[-+]?\d+(?:\.\d+)?/
/** Leading number of a molarMass fact such as '75.07 g/mol' or '399.45 g/mol (cation); ...'. */
export function parseMolarMassFact(text) {
  const match = FACT_NUMBER.exec(String(text ?? '').trim())
  return match ? Number(match[0]) : null
}

const freezeAll = (list) => Object.freeze(list.map((item) => Object.freeze(item)))

/**
 * Index over a record array. All lookups return frozen, stable-ordered arrays.
 * The functions below are the public API; src/knowledge/index.js binds them to the shipped data.
 */
export function makeQuantIndex(records = []) {
  const byId = new Map()
  const bySubject = new Map()
  for (const record of records) {
    if (!record || byId.has(record.id)) continue
    byId.set(record.id, record)
    const list = bySubject.get(record.subject)
    if (list) list.push(record)
    else bySubject.set(record.subject, [record])
  }
  for (const [subject, list] of bySubject) {
    list.sort((a, b) => kindOrder(a.kind) - kindOrder(b.kind) || String(a.authority ?? '').localeCompare(String(b.authority ?? '')) || a.id.localeCompare(b.id))
    bySubject.set(subject, Object.freeze(list))
  }
  return Object.freeze({ records: freezeAll([...byId.values()]), byId, bySubject })
}

const EMPTY = Object.freeze([])

/** One record by its quant id, or undefined. */
export function quantOf(index, id) {
  return index.byId.get(id)
}

/**
 * Records for a subject entity id, ordered by kind. `filter` may hold `kind` (string or array),
 * `authority`, `population`, `basis` and `established` to narrow them.
 */
export function quantFor(index, subject, filter = {}) {
  const wanted = filter.kind === undefined ? null : new Set([].concat(filter.kind))
  return (index.bySubject.get(subject) ?? EMPTY).filter((record) => (
    (!wanted || wanted.has(record.kind)) &&
    (filter.authority === undefined || record.authority === filter.authority) &&
    (filter.population === undefined || record.population === filter.population) &&
    (filter.basis === undefined || record.basis === filter.basis) &&
    (filter.established === undefined || record.established === filter.established)
  ))
}

/**
 * Intake limits (EAR/RDA/PRI/AI/UL/OSL) of a subject grouped by authority:
 * [{ authority, limits: [record...] }], authorities in reading order (the order of first appearance
 * by year, then name), limits ordered EAR, RDA, PRI, AI, UL, OSL then population.
 */
export function limitsFor(index, subject) {
  const groups = new Map()
  for (const record of quantFor(index, subject, { kind: LIMIT_KINDS })) {
    const key = record.authority ?? 'unspecified'
    const list = groups.get(key)
    if (list) list.push(record)
    else groups.set(key, [record])
  }
  const year = (authority) => Number(/(\d{4})/.exec(authority)?.[1] ?? 9999)
  return [...groups.entries()]
    .sort(([a], [b]) => year(a) - year(b) || a.localeCompare(b))
    .map(([authority, limits]) => ({
      authority,
      limits: Object.freeze([...limits].sort((a, b) => kindOrder(a.kind) - kindOrder(b.kind) || populationRank(a.population) - populationRank(b.population) || String(a.population ?? '').localeCompare(String(b.population ?? ''))))
    }))
}

/** Reading order of populations: adults and sexes first, then pregnancy, lactation, adolescents, children, infants. */
export function populationRank(population = '') {
  const order = [/^(adults?|men|women)\b/, /^pregnan/, /^lactat/, /^adolescent/, /^child/, /^infant/]
  const found = order.findIndex((pattern) => pattern.test(population))
  return found < 0 ? order.length : found
}

/** Molar mass in g/mol of a compound id (optionally of a given basis such as 'cation'), or null. */
export function molarMassOf(index, subject, basis) {
  const found = quantFor(index, subject, { kind: 'molar-mass', ...(basis === undefined ? {} : { basis }) })
  return found[0]?.value ?? null
}

/** Mass fraction (0-1) of `component` in `subject` (a salt or product), or null when no record exists. */
export function contentFraction(index, subject, component) {
  const found = quantFor(index, subject, { kind: 'content-fraction' }).find((record) => record.target === component)
  return found?.value ?? null
}

/**
 * Convert an amount of a salt or product into the amount of one of its components (or the reverse), through
 * content-fraction records, e.g. choline bitartrate -> choline.
 *   convertDose(index, { from: 'intervention:choline-bitartrate', to: 'compound:choline', amount: 1000, unit: 'mg' })
 * returns { amount, unit, fraction, via } or null when no content fraction is recorded.
 * With `reverse: true` the amount is of the component and the result is the salt that supplies it.
 */
export function convertDose(index, { from, to, amount, unit = 'mg', reverse = false }) {
  const fraction = reverse ? contentFraction(index, to, from) : contentFraction(index, from, to)
  if (fraction === null || !(fraction > 0)) return null
  return { amount: reverse ? amount / fraction : amount * fraction, unit, fraction, via: reverse ? to : from }
}

/**
 * Glycine <-> choline stoichiometry from molar masses: one mole of choline can yield at most one mole of glycine
 * (choline -> betaine -> dimethylglycine -> sarcosine -> glycine). `conversion` is the fraction of choline assumed to
 * take that route (1 = every molecule); the result is the choline needed in grams.
 *   cholineForGlycine(index, { glycineGrams: 10 })               // 13.88 g at 100 %
 *   cholineForGlycine(index, { glycineGrams: 10, conversion: 0.5 }) // 27.8 g
 * Returns { moles, cholineGrams, saltGrams } where saltGrams is for choline bitartrate when its content fraction is known.
 */
export function cholineForGlycine(index, { glycineGrams, conversion = 1, salt = 'intervention:choline-bitartrate' }) {
  const glycine = molarMassOf(index, 'compound:glycine')
  const choline = molarMassOf(index, 'compound:choline')
  if (glycine === null || choline === null) return null
  if (!(conversion > 0 && conversion <= 1)) throw new RangeError('conversion must be in (0, 1]')
  const moles = glycineGrams / glycine
  const cholineGrams = (moles * choline) / conversion
  const fraction = contentFraction(index, salt, 'compound:choline')
  return { moles, cholineGrams, saltGrams: fraction ? cholineGrams / fraction : null }
}

/** Inverse of cholineForGlycine: glycine grams obtainable from `cholineGrams` at the given conversion fraction. */
export function glycineFromCholine(index, { cholineGrams, conversion = 1 }) {
  const glycine = molarMassOf(index, 'compound:glycine')
  const choline = molarMassOf(index, 'compound:choline')
  if (glycine === null || choline === null) return null
  return ((cholineGrams / choline) * glycine) * conversion
}

const GAS_CONSTANT = 8.314462618 // J/(mol K)
const ATM = 101325 // Pa

/** Molar volume of an ideal gas in mL/mmol (numerically litres per mole): 25.45 at 37 C and 1 atm. */
export function gasMolarVolume({ celsius = 37, atm = 1 } = {}) {
  return (GAS_CONSTANT * (celsius + 273.15)) / (atm * ATM) * 1000
}

/**
 * Gas released when `mmol` of acid is neutralised by bicarbonate (H+ + HCO3- -> H2O + CO2, one CO2 per H+),
 * counting only the gas phase (no dissolved CO2, dry ideal gas). Returns mL.
 */
export function co2VolumeFromAcid({ mmol, celsius = 37, atm = 1 }) {
  return mmol * gasMolarVolume({ celsius, atm })
}

/** Acid delivered by a betaine hydrochloride dose, in mmol H+ (one per molecule), from its molar mass. */
export function betaineHclAcid(index, { grams, salt = 'intervention:betaine-hcl' }) {
  const molar = molarMassOf(index, salt)
  return molar ? (grams / molar) * 1000 : null
}
