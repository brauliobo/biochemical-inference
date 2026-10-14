// Precomputes the small data files the home page and the dashboard index draw from, so they need no simulator:
//   src/sim/data/baseline-fluxes.json   steady-state fluxes and levels of the methylation model, keyed by the map node ids
//   src/sim/data/validation-summary.json  pass / documented-mismatch status of every validation target
//   src/sim/data/dash-thumbs.json       sparklines and mini-maps for the dashboard cards
// Run `node scripts/precompute-dash.js` after changing a model or its parameters. tests/unit/dash-precomputed.test.js
// recomputes the cheap parts and fails when a file is out of date (`--check` does the same from the command line).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { compileModel, simulate } from '../src/sim/index.js'
import { concentrationByNode, fluxByNode } from '../src/components/dash/map-binding.js'
import { ontologyBindings, methylationModel } from '../src/sim/models/index.js'
import { steady } from '../src/sim/models/methylation-run.js'
import { runValidation } from '../src/sim/models/methylation-validate.js'
import { gastricModel, gastricPh, gastricSimOptions } from '../src/sim/models/gastric.js'
import { histamineModel } from '../src/sim/models/histamine.js'
import { glycinePkModel, betainePkModel } from '../src/sim/models/pk.js'
import { scenarioIndex } from '../src/sim/scenarios.js'
import { runScenario } from '../src/sim/models/methylation-run.js'
import { loadLayout } from '../src/viz/layouts/index.js'
import { graph, home } from '../src/knowledge/index.js'
import b2 from '../src/sim/data/parameters-b2.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = join(root, 'src/sim/data')
const round = (value, digits = 4) => (Number.isFinite(value) ? Number(value.toPrecision(digits)) : null)
const every = (values, count) => {
  const step = (values.length - 1) / (count - 1)
  return Array.from({ length: count }, (_, i) => values[Math.round(i * step)])
}

export function baselineFluxes() {
  const ss = steady(methylationModel, {})
  const flux = fluxByNode(ss.fluxes, ontologyBindings.byReactionOntology)
  const conc = concentrationByNode(ss.state, ontologyBindings.bySpeciesOntology)
  const rounded = (obj) => Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, round(v)]))
  return {
    model: methylationModel.id, layout: 'core-methylation', fluxUnit: 'uM/h', concUnit: 'uM',
    note: 'Reference steady state of the illustrative methylation model (Reed 2015 liver cycle, calibrated).',
    samSahRatio: round(ss.observables.samSahRatio), tHcy: round(ss.observables.tHcy),
    fluxes: rounded(flux), concentrations: rounded(conc)
  }
}

export function validationSummary() {
  const rows = runValidation().map((row) => ({
    id: row.id, group: row.group, title: row.title,
    status: row.status === 'pass' ? 'pass' : row.status === 'info' ? 'info' : 'mismatch',
    ...(row.status === 'fail' && row.why ? { why: row.why } : {}),
    ...(row.detail ? { detail: String(row.detail).slice(0, 220) } : {})
  }))
  const count = (status) => rows.filter((row) => row.status === status).length
  return { total: rows.length, pass: count('pass'), mismatch: count('mismatch'), info: count('info'), rows }
}

async function layoutThumb(id) {
  const layout = await loadLayout(id)
  const { width, height } = layout.viewBox
  const at = new Map(layout.nodes.map((node) => [node.id, node]))
  return {
    box: [width, height],
    nodes: layout.nodes.map((node) => [Math.round(node.x), Math.round(node.y), node.kind === 'reaction' ? 1 : 0]),
    edges: layout.edges.filter((edge) => at.has(edge.from) && at.has(edge.to)).map((edge) => {
      const a = at.get(edge.from)
      const b = at.get(edge.to)
      return [Math.round(a.x), Math.round(a.y), Math.round(b.x), Math.round(b.y)]
    })
  }
}

export async function dashThumbs() {
  const methylationBase = runScenario(scenarioIndex['baseline-fed'], { samplesPerHour: 1 })
  const niacin = runScenario(scenarioIndex['niacin-2g'], { samplesPerHour: 1 })
  const gly = simulate(compileModel(glycinePkModel), { controls: { doseGPerKg: 0.0714 }, duration: 6, samples: 120 })
  const bet = simulate(compileModel(betainePkModel), { duration: 24, samples: 120 })
  const gastric = (controls) => {
    const run = simulate(compileModel(gastricModel), { controls, duration: 8, samples: 160, ...gastricSimOptions })
    return every(gastricPh(run), 40).map((v) => round(v, 3))
  }
  const hist = simulate(compileModel(histamineModel), { controls: { diurnalAmplitude: 0.42 }, duration: 24, samples: 96 })
  const series = (label, values, extra = {}) => ({ label, values: every(values, 40).map((v) => round(v, 4)), ...extra })
  return {
    methylation: { title: 'SAM:SAH after niacin 2 g/day (model)', series: [series('Reference', methylationBase.series.samSahRatio, { baseline: true }), series('Niacin 2 g/day', niacin.series.samSahRatio)] },
    glycine: { title: 'Plasma glycine after a 5 g dose (model)', series: [series('Plasma glycine', gly.series.plasma)] },
    choline: { title: 'Plasma betaine after 3.5 g betaine (model)', series: [series('Plasma betaine', bet.series.plasma)] },
    'gut-acid': { title: 'Stomach pH over 8 h with a meal (model)', series: [{ label: 'No PPI', values: gastric({}) }, { label: 'PPI, 60% of pumps', values: gastric({ ppiInhibitionPct: 60 }) }] },
    'histamine-night': { title: 'Systemic histamine over 24 h if release peaks at 04:00 (weak support)', series: [series('Histamine vs baseline', hist.series.plasmaRel)] },
    evidence: { title: 'Claims by evidence status', bars: ['supported', 'partly-supported', 'contested', 'unsupported'].map((status) => ({ label: status, value: graph.entities.filter((e) => e.type === 'claim' && e.status === status).length })) },
    atlas: { title: 'Entries by kind', bars: home().types.map((t) => ({ label: t.type, value: t.count })) },
    maps: { 'core-methylation': await layoutThumb('core-methylation'), 'b6-gaba': await layoutThumb('gaba-shunt-b6'), 'bile-acids': await layoutThumb('bile-acid-conjugation'), 'tma-tmao': await layoutThumb('tma-tmao-axis') }
  }
}

const BUDGETS = ['glycine-sinks', 'glycine-sources', 'glycine-synthesis-estimates', 'glycine-flux-partition', 'choline-sources', 'choline-fate']
/** The flux budgets the glycine and choline dashboards draw (labels, values, ranges, shortened notes), without the 189 kB table. */
export function budgets() {
  const pick = (item) => ({ label: item.label, value: item.value, low: item.low, high: item.high, ...(item.source ? { source: item.source } : {}), ...(item.note ? { note: item.note.slice(0, 240) } : {}) })
  return { unit: 'g/day or mmol/day, see each budget', budgets: BUDGETS.map((id) => {
    const budget = b2.fluxBudgets.find((candidate) => candidate.id === id)
    return { id, title: budget.title, unit: budget.unit, items: budget.items.map(pick), ...(budget.totals ? { totals: budget.totals.map(pick) } : {}), ...(budget.contested ? { contested: budget.contested.map((c) => c.slice(0, 400)) } : {}) }
  }) }
}

const OUTPUTS = {
  'budgets.json': budgets,
  'baseline-fluxes.json': baselineFluxes,
  'validation-summary.json': validationSummary,
  'dash-thumbs.json': dashThumbs
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes('--check')
  mkdirSync(dataDir, { recursive: true })
  let stale = 0
  for (const [name, make] of Object.entries(OUTPUTS)) {
    const text = `${JSON.stringify(await make(), null, 1)}\n`
    const file = join(dataDir, name)
    if (check) {
      const current = (() => { try { return readFileSync(file, 'utf8') } catch { return '' } })()
      if (current !== text) { stale += 1; console.error(`stale: src/sim/data/${name}`) }
    } else {
      writeFileSync(file, text)
      console.log(`wrote src/sim/data/${name} (${text.length} bytes)`)
    }
  }
  if (stale) process.exit(1)
}
