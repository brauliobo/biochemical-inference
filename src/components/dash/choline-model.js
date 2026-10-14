// Pure view data of the choline and betaine dashboard: the choline flux budgets, the choline-for-glycine calculator with its
// salt forms and dose limits, and the gut-bacterial TMA marker. Sources: sim/data/budgets.json and the calculators.
// No Vue, no DOM, no simulator.
import budgetData from '../../sim/data/budgets.json'
import { formatNumber } from '../../viz/scale.js'
import { CONSTANTS, CONVERSION_PARTITIONS, SALT_FRACTIONS, cholineCoverageOfDeficit, cholineForGlycine, elementalFromSalt } from '../../sim/calculators.js'

const short = (label) => label.replace(/\s*\(.*$/, '').replace(/,.*$/, '').trim()
const budgetOf = (id) => budgetData.budgets.find((b) => b.id === id)

/** Two bars in mmol/day: where body choline comes from and what happens to it (ranges are contested or assumed). */
export function fateBars() {
  const items = (b, prefix) => b.items.map((entry, i) => ({ id: `${prefix}-${i}`, label: short(entry.label), value: entry.value, low: entry.low, high: entry.high }))
  return [
    { id: 'sources', label: 'Supply', items: items(budgetOf('choline-sources'), 'in') },
    { id: 'fate', label: 'Fate', items: items(budgetOf('choline-fate'), 'out') }
  ]
}
export const fateContested = () => budgetOf('choline-fate').contested

const SALT_LABELS = {
  'choline-bitartrate': 'Choline bitartrate', 'alpha-gpc': 'Alpha-GPC', citicoline: 'Citicoline (CDP-choline)', 'phosphatidylcholine-pure': 'Phosphatidylcholine, pure'
}
export const CONVERSION_STATUS = { computed: 'Calculated', estimate: 'Estimate', hypothesis: 'Hypothesis' }

/** The axis of the limits chart ends here (mg/day); a need beyond it is drawn at the edge and said so in the label. */
export const LIMITS_AXIS_MAX = 4500

function needBracket(need, glycineG) {
  const from = need.low * 1000
  const to = need.high * 1000
  const label = `Needed for ${glycineG} g glycine: ${formatNumber(need.low)} to ${formatNumber(need.high)} g (100% to 25% conversion)`
  if (from <= LIMITS_AXIS_MAX) return { from, to: Math.min(to, LIMITS_AXIS_MAX), label: to > LIMITS_AXIS_MAX ? `${label}, runs off the scale` : label }
  return { from: LIMITS_AXIS_MAX * 0.97, to: LIMITS_AXIS_MAX, label: `${label}: off the scale` }
}

/**
 * The calculator: choline (g, cation) needed to make `glycineG` of glycine at `conversion` (fraction), its multiple of the
 * IOM upper limit, how much of the 10 g/day deficit choline within the limit could cover, the salt forms that supply
 * it, rows for the RangeBar (IOM and EFSA) and the partitions that people quote.
 */
export function requirement({ glycineG = 10, conversion = 0.447 }) {
  const need = cholineForGlycine({ glycineG, conversion })
  const coverage = cholineCoverageOfDeficit({ conversion })
  const mg = need.value * 1000
  const salts = Object.keys(SALT_LABELS).map((salt) => {
    const grams = elementalFromSalt({ salt, mg, reverse: true })
    return { id: salt, label: SALT_LABELS[salt], fraction: SALT_FRACTIONS[salt].value, grams: grams.value / 1000, low: grams.low / 1000, high: grams.high / 1000, status: grams.status }
  })
  return {
    need, coverage, salts, mg,
    ulMultiple: need.ulMultiple,
    overUl: mg > CONSTANTS.cholineUlMgPerDay,
    rows: [
      { id: 'iom', label: 'IOM (US)', markers: [{ kind: 'ai', value: CONSTANTS.cholineAiMgPerDay.menIom }, { kind: 'ul', value: CONSTANTS.cholineUlMgPerDay }], typical: needBracket(need, glycineG) },
      { id: 'efsa', label: 'EFSA (EU)', markers: [{ kind: 'ai', value: CONSTANTS.cholineAiMgPerDay.efsa }], noUlNote: 'insufficient data to set one' }
    ],
    partitions: need.alternatives.map((a) => ({ id: a.id, label: a.label, value: a.cholineG, conversion: a.conversion, status: a.status })),
    sources: need.sources
  }
}

/** The ceiling and the glycine that choline within the IOM limit can give (g/day). */
export const AT_LIMIT = () => cholineCoverageOfDeficit({ conversion: 1 }).glycineAtUlG

/**
 * Gut-bacterial trimethylamine (TMA) from choline: total choline = habitual diet + extra; the fraction reaching gut
 * bacteria is ASSUMED 5% (1 to 30%) on a habitual diet and 63% for a large free-choline bolus (Zhang 1999); phosphatidylcholine
 * does not raise TMAO (Cho 2020). Rows in mmol/day.
 */
export function tmaItems(extraMg = 0) {
  const total = CONSTANTS.dietaryCholineMmolPerDay.value + extraMg / CONSTANTS.cholineMolarMass
  return [
    { id: 'habitual', label: 'Habitual intake, assumed 5% (1 to 30%)', value: total * 0.05, low: total * 0.01, high: total * 0.3 },
    { id: 'bolus', label: 'Extra taken as one free-choline bolus, 63% (one study)', ...(() => { const v = (extraMg / CONSTANTS.cholineMolarMass) * 0.63 + CONSTANTS.dietaryCholineMmolPerDay.value * 0.05; return { value: v, low: v, high: v } })() },
    { id: 'pc', label: 'As phosphatidylcholine: no rise in TMAO (Cho 2020)', value: 0, low: 0, high: 0 }
  ]
}

export { CONVERSION_PARTITIONS }
