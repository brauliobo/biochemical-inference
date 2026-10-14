// Precomputes src/sim/data/robustness.json: for each question in src/sim/robustness-defs.js, the spread of the effect over
// n = 100 parameter sets (median, p5 to p95, the fraction of sets beyond each threshold, and a verdict word). It takes about
// two minutes. The dashboards show it in "What is robust?" and need no ensemble run for it.
//
//   node scripts/precompute-robustness.js            write the file
//   node scripts/precompute-robustness.js --check    fail when the stored file is out of date (inputs changed)
//
// The file carries a fingerprint of everything it was computed from (the questions, the scenarios they use, the sampled
// constants and ranges, the seed). tests/unit/dash-precomputed.test.js compares it and recomputes one row.
import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ENSEMBLE_N, ENSEMBLE_SEED, FLAT_BAND, ROBUSTNESS_ROWS, verdictOf } from '../src/sim/robustness-defs.js'
import { ensembleSpace, methylationEnsemble } from '../src/sim/models/methylation-ensemble.js'
import { scenarioIndex } from '../src/sim/scenarios.js'
import { methylationModel } from '../src/sim/models/index.js'

const file = join(dirname(fileURLToPath(import.meta.url)), '../src/sim/data/robustness.json')
const round = (value, digits = 3) => Number(value.toFixed(digits))

const scenarioOf = (row) => (typeof row.scenario === 'string' ? scenarioIndex[row.scenario] : row.scenario)

/** Hash of every input of the file, so a stale file can be detected without rerunning the ensembles. */
export function fingerprint() {
  const inputs = {
    version: 1, n: ENSEMBLE_N, seed: ENSEMBLE_SEED,
    rows: ROBUSTNESS_ROWS.map((row) => ({ ...row, scenario: scenarioOf(row) })),
    space: ensembleSpace(),
    calibration: methylationModel.reference.calibration
  }
  return createHash('sha256').update(JSON.stringify(inputs)).digest('hex').slice(0, 16)
}

/** One precomputed row for a question definition (runs the ensemble). */
export function computeRow(row) {
  const scenario = scenarioOf(row)
  const metrics = row.metrics.map((m) => ({ id: m.id, observable: m.observable, reduce: m.reduce }))
  const result = methylationEnsemble({ scenario, n: ENSEMBLE_N, seed: ENSEMBLE_SEED, metrics, fixed: row.fixed ?? {} })
  return {
    id: row.id, scenario: scenario.id, group: row.group, label: row.label, ...(row.note ? { note: row.note } : {}),
    members: result.ok, failures: result.failures,
    metrics: row.metrics.map((m) => {
      const s = result.summary[m.id]
      const fracDown = s.fracBelow(-FLAT_BAND)
      const fracUp = s.fracAbove(FLAT_BAND)
      return {
        id: m.id, label: m.label, observable: m.observable, reduce: m.reduce,
        p5: round(s.p5), p25: round(s.p25), p50: round(s.p50), p75: round(s.p75), p95: round(s.p95),
        fracDown: round(fracDown, 2), fracUp: round(fracUp, 2),
        thresholds: m.thresholds.map((t) => ({ op: t.op, x: t.x, fraction: round(t.op === 'below' ? s.fracBelow(t.x) : s.fracAbove(t.x), 2) })),
        verdict: verdictOf({ fracDown, fracUp })
      }
    })
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const print = fingerprint()
  if (process.argv.includes('--check')) {
    const stored = JSON.parse(readFileSync(file, 'utf8'))
    if (stored.fingerprint !== print) { console.error('src/sim/data/robustness.json is out of date: run node scripts/precompute-robustness.js'); process.exit(1) }
    console.log('robustness.json is current')
  } else {
    const rows = []
    for (const row of ROBUSTNESS_ROWS) {
      const t0 = Date.now()
      rows.push(computeRow(row))
      console.log(`${row.id}: ${Date.now() - t0} ms`)
    }
    writeFileSync(file, `${JSON.stringify({ n: ENSEMBLE_N, seed: ENSEMBLE_SEED, flatBand: FLAT_BAND, fingerprint: print, rows }, null, 1)}\n`)
    console.log(`wrote src/sim/data/robustness.json (${rows.length} questions)`)
  }
}
