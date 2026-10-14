// Pure view data of the glycine dashboard: the flux budgets as stacked-bar items, the numbers on the glycine flux map, the
// "10 g/day deficit" estimates and the glycine content of products. Sources: sim/data/budgets.json (B2 flux budgets) and
// the calculators (sim/calculators.js). No Vue, no DOM, no simulator.
import budgetData from '../../sim/data/budgets.json'
import { GLYCINE_DEFICIT, collagenGlycine, glycineBudget, magnesiumGlycinateGlycine, ucIIGlycine } from '../../sim/calculators.js'

export const budget = () => glycineBudget(budgetData.budgets)
const short = (label) => label.replace(/\s*\(.*$/, '').replace(/ ->.*$/, '').trim()
const item = (prefix) => (entry, index) => ({ id: `${prefix}-${index}`, label: short(entry.label), value: entry.value, low: entry.low, high: entry.high })

/** Two bars in g/day: where glycine comes from (net supply) and where it goes (net uses), with the contested ranges. */
export function budgetBars() {
  const b = budget()
  return [
    { id: 'sources', label: 'Net supply', items: b.sources.items.filter((entry) => entry.value >= 0.05).map(item('in')) },
    { id: 'sinks', label: 'Net uses', items: b.sinks.items.map(item('out')) }
  ]
}

const SOURCE = {
  serine: /^Serine/, choline: /choline/, gnmt: /^Sarcosine from endogenous/, collagen: /^Collagen/, glutathione: /^Glutathione/, creatine: /^Creatine/, bile: /^Bile/
}
const find = (items, pattern) => items.find((entry) => pattern.test(entry.label))?.value

/** Flux per reaction node of the glycine-flux map: 'net' = the net budget (g/day), 'gross' = whole-body turnover (g/day). */
export function mapFlux(mode = 'net') {
  const sources = budgetData.budgets.find((b) => b.id === 'glycine-sources').items
  const sinks = budgetData.budgets.find((b) => b.id === 'glycine-sinks').items
  if (mode === 'gross') {
    const partition = budgetData.budgets.find((b) => b.id === 'glycine-flux-partition').items
    return {
      'reaction:shmt-serine-glycine-interconversion': find(partition, /SHMT/),
      'reaction:glycine-cleavage-system': find(partition, /Glycine cleavage/)
    }
  }
  const serine = find(sources, SOURCE.serine)
  return {
    'reaction:phgdh-3pg-oxidation': serine, 'reaction:psat1-phosphoserine-transamination': serine, 'reaction:psph-phosphoserine-hydrolysis': serine,
    'reaction:shmt-serine-glycine-interconversion': serine,
    'reaction:dmgdh-dimethylglycine-demethylation': find(sources, SOURCE.choline),
    'reaction:gnmt-glycine-methylation': 0.22,
    'reaction:collagen-chain-assembly': find(sinks, SOURCE.collagen),
    'reaction:gss-glutathione-synthesis': find(sinks, SOURCE.glutathione),
    'reaction:agat-guanidinoacetate-synthesis': find(sinks, SOURCE.creatine),
    'reaction:baat-glycine-conjugation': find(sinks, SOURCE.bile)
  }
}

/** Rows of the deficit RangeList (g/day): the claim, the budget balance and the five de novo synthesis estimates. */
export function deficitItems() {
  const b = budget()
  const claim = { id: 'claim', label: 'The claim: a 10 g/day shortfall', value: 10, low: 10, high: 10 }
  const own = { id: 'balance', label: 'Uses minus supply (this budget)', value: b.balance.value, low: b.balance.low, high: b.balance.high }
  const smallest = { id: 'deficit-low', label: 'Same, with a lower collagen need', value: GLYCINE_DEFICIT.low, low: GLYCINE_DEFICIT.low, high: GLYCINE_DEFICIT.high }
  return [claim, own, smallest]
}
export function synthesisItems() {
  return budgetData.budgets.find((entry) => entry.id === 'glycine-synthesis-estimates').items.map((entry, index) => ({
    id: `synth-${index}`, label: entry.label.replace(/:.*$/, ''), value: entry.value, low: entry.low, high: entry.high
  }))
}

/** Glycine in common products, in g: [{ label, value, low, high }] for `powderG` grams of powder (calculators). */
export function contentItems(powderG = 10, magnesiumMg = 400) {
  const collagen = collagenGlycine({ powderG })
  const mg = magnesiumGlycinateGlycine({ magnesiumMg })
  const uc = ucIIGlycine({ mg: 40 })
  return [
    { id: 'powder', label: `Glycine powder, ${powderG} g`, value: powderG, low: powderG, high: powderG },
    { id: 'collagen', label: `Collagen peptides or gelatin, ${powderG} g`, value: collagen.value, low: collagen.low, high: collagen.high },
    { id: 'mg', label: `Magnesium glycinate, ${magnesiumMg} mg Mg`, value: mg.value / 1000, low: mg.value / 1000, high: mg.value / 1000 },
    { id: 'uc2', label: 'UC-II collagen, 40 mg', value: uc.value / 1000, low: uc.low / 1000, high: uc.high / 1000 },
    { id: 'diet', label: 'Typical dietary protein, per day', value: 2.25, low: 1.5, high: 3 }
  ]
}

/** The scenario the dashboard runs for a dose in grams (shared with the ensemble job). */
export function doseScenario(doseG) {
  return {
    id: 'glycine-dose', label: `Glycine ${doseG} g`,
    stages: [{ label: 'baseline', hours: 8 }, { label: 'glycine', hours: 64, events: doseG > 0 ? [{ at: 0, dose: { glycine: doseG }, label: `${doseG} g glycine` }] : [] }]
  }
}
