// @vitest-environment node
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { baselineFluxes, budgets, dashThumbs, validationSummary } from '../../scripts/precompute-dash.js'
import { computeRow, fingerprint } from '../../scripts/precompute-robustness.js'
import { ensembleBands } from '../../src/sim/ensemble-bands.js'
import { ENSEMBLE_N, ENSEMBLE_SEED, ROBUSTNESS_ROWS, verdictOf } from '../../src/sim/robustness-defs.js'
import { scenarioIndex } from '../../src/sim/scenarios.js'
import { validationTargets } from '../../src/sim/validation-targets.js'
import { doseScenario } from '../../src/components/dash/glycine-model.js'

// The files under src/sim/data/*.json are computed by scripts (node scripts/precompute-dash.js, node scripts/precompute-robustness.js)
// from the models and the literature tables. These tests fail when a model change makes one of them out of date.
const read = (name) => JSON.parse(readFileSync(new URL(`../../src/sim/data/${name}`, import.meta.url), 'utf8'))
const text = (name) => readFileSync(new URL(`../../src/sim/data/${name}`, import.meta.url), 'utf8')
const same = (value) => JSON.parse(JSON.stringify(value))

describe('precomputed dashboard data is current', () => {
  it('baseline fluxes and levels of the home map', () => {
    expect(read('baseline-fluxes.json')).toEqual(same(baselineFluxes()))
  })
  it('validation summary: 41 checks, 28 pass, 13 documented, statuses as pinned in the validation targets', () => {
    const stored = read('validation-summary.json')
    expect(stored).toEqual(same(validationSummary()))
    expect(stored).toMatchObject({ total: 41, pass: 28, mismatch: 13 })
    for (const row of stored.rows) expect(row.status, row.id).toBe(validationTargets.find((t) => t.id === row.id).expectedStatus === 'pass' ? 'pass' : 'mismatch')
    for (const row of stored.rows.filter((r) => r.status === 'mismatch')) expect(row.why, row.id).toBeTruthy()
  })
  it('flux budgets', () => {
    expect(read('budgets.json')).toEqual(same(budgets()))
  })
  it('card thumbnails', async () => {
    expect(read('dash-thumbs.json')).toEqual(same(await dashThumbs()))
  }, 60000)
  it('robustness: the fingerprint of every input matches, and one row recomputes to the stored numbers', () => {
    const stored = read('robustness.json')
    expect(stored.fingerprint).toBe(fingerprint())
    expect(stored.n).toBe(ENSEMBLE_N)
    expect(stored.rows.map((r) => r.id)).toEqual(ROBUSTNESS_ROWS.map((r) => r.id))
    const row = ROBUSTNESS_ROWS.find((r) => r.id === 'g10-luka')
    expect(stored.rows.find((r) => r.id === 'g10-luka')).toEqual(same(computeRow(row)))
  }, 60000)
  it('robustness reproduces the table of docs/METHYLATION_MODEL.md', () => {
    const find = (id, metric) => read('robustness.json').rows.find((r) => r.id === id).metrics.find((m) => m.id === metric)
    const trough = find('g10-all', 'trough')
    expect(trough.p50).toBeCloseTo(-0.052, 2)
    expect(trough.thresholds.map((t) => t.fraction)).toEqual([0.51, 0.3, 0.11])
    expect(find('g10-reed', 'trough').thresholds[0].fraction).toBeLessThanOrEqual(0.03)
    expect(find('g10-luka', 'trough').thresholds[0].fraction).toBeGreaterThan(0.75)
    expect(find('niacin2', 'final').thresholds[0].fraction).toBeGreaterThan(0.95)
    expect(find('pemt2', 'final').verdict.key).toBe('robust-down')
    expect(find('mthfr', 'thcy').verdict.key).toBe('robust-up')
    expect(find('bet6-human', 'thcy').p50).toBeLessThan(find('bet6-reed', 'thcy').p50 - 0.05)
    expect(text('robustness.json').length).toBeLessThan(40000)
  })
  it('reads verdicts by the share of parameter sets that agree', () => {
    expect(verdictOf({ fracDown: 0.95, fracUp: 0 }).key).toBe('robust-down')
    expect(verdictOf({ fracDown: 0, fracUp: 0.75 }).key).toBe('mostly-up')
    expect(verdictOf({ fracDown: 0.4, fracUp: 0.3 }).key).toBe('mixed')
    expect(verdictOf({ fracDown: 0, fracUp: 0 }).key).toBe('robust-flat')
    expect(ENSEMBLE_SEED).toBe(7)
    expect(scenarioIndex['glycine-10g']).toBeTruthy()
  })
})

describe('ensemble bands for the time-course ribbons', () => {
  it('returns ordered ratio bands on the time grid of the run, deterministic for a seed, and reports progress', async () => {
    const seen = []
    const job = { scenario: doseScenario(10), variants: {}, observables: ['samSahRatio', 'sam', 'gly_p'], n: 5, seed: 3, onProgress: (done, n) => seen.push([done, n]) }
    const a = await ensembleBands(job)
    const b = await ensembleBands({ ...job, onProgress: undefined })
    expect(a.ok + a.failures).toBe(5)
    expect(a.time).toHaveLength(145)
    expect(seen.at(-1)).toEqual([5, 5])
    for (const id of job.observables) {
      const band = a.bands[id]
      expect(band.p5).toHaveLength(145)
      band.p5.forEach((v, k) => { expect(v).toBeLessThanOrEqual(band.p50[k] + 1e-12); expect(band.p50[k]).toBeLessThanOrEqual(band.p95[k] + 1e-12) })
      expect(band.p50[0]).toBeCloseTo(1, 6) // ratio to each member's own starting value
    }
    expect(b.bands.samSahRatio.p50).toEqual(a.bands.samSahRatio.p50)
    // the glycine dose lifts plasma glycine in every member
    expect(Math.min(...a.bands.gly_p.p5)).toBeGreaterThanOrEqual(0.9)
    expect(Math.max(...a.bands.gly_p.p50)).toBeGreaterThan(3)
  }, 60000)

  it('stops early when cancelled', async () => {
    let calls = 0
    const out = await ensembleBands({ scenario: doseScenario(5), observables: ['sam'], n: 50, cancelled: () => (calls += 1) > 2 })
    expect(out.cancelled).toBe(true)
    expect(out.bands).toBeUndefined()
  }, 30000)
})
