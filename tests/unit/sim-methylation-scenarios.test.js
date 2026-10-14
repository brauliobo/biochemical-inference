// @vitest-environment node
import { describe, expect, it } from 'vitest'
import knowledge from '../../src/knowledge/data/index.js'
import { effect, expandEvents, runScenario, stageValue } from '../../src/sim/models/methylation-run.js'
import { scenarioIndex, scenarios } from '../../src/sim/scenarios.js'

const known = new Set(knowledge.map((e) => e.id))
const runs = Object.fromEntries(scenarios.map((s) => [s.id, runScenario(s)]))
/** Relative change of `id` between the end of the baseline stage and its extreme/final value afterwards. */
const change = (sid, id, how = 'final') => {
  const r = runs[sid]
  const e = effect(r, id, { ref: stageValue(r, id, 0, 'end'), from: r.stages[0].end })
  return how === 'peak' ? e.peakRel : how === 'trough' ? e.troughRel : e.finalRel
}

describe('methylation scenarios: catalogue', () => {
  it('provides the requested named presets with labels, descriptions, expected outcomes and evidence status', () => {
    const ids = scenarios.map((s) => s.id)
    for (const id of ['baseline-fed', 'glycine-3g', 'glycine-5g', 'glycine-10g', 'choline-500mg', 'choline-2g', 'betaine-3g', 'mthfr-677tt', 'b6-restriction', 'b12-deficiency', 'niacin-500mg', 'niacin-2g', 'pemt-upregulation', 'methionine-meal', 'glycine-niacin-low-folate']) expect(ids).toContain(id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const s of scenarios) {
      expect(s.label, s.id).toBeTruthy(); expect(s.description.length, s.id).toBeGreaterThan(40)
      expect(s.expected.length, s.id).toBeGreaterThan(0)
      expect(['supported', 'partly', 'animal', 'hypothesis']).toContain(s.evidence.status)
      expect(s.evidence.summary.length).toBeGreaterThan(30)
      for (const ref of s.evidence.refs) expect(known.has(ref), `${s.id}: ${ref}`).toBe(true)
      expect(s.stages.reduce((a, st) => a + st.hours, 0), s.id).toBe(72)
    }
  })

  it('marks the glycine -> SAM drain as a hypothesis (no human SAM/SAH data after glycine)', () => {
    for (const id of ['glycine-3g', 'glycine-5g', 'glycine-10g', 'glycine-10g-day', 'glycine-niacin-low-folate', 'glycine-low-folate']) {
      expect(scenarioIndex[id].evidence.status, id).toBe('hypothesis')
      expect(scenarioIndex[id].evidence.summary).toMatch(/no human|No human|not measured|mechanistic/i)
    }
    expect(scenarioIndex['betaine-3g'].evidence.status).toBe('supported')
    expect(scenarioIndex['niacin-2g'].evidence.status).toBe('partly')
  })

  it('expands gram doses into depot amounts and offsets the event times', () => {
    const [e] = expandEvents([{ at: 2, dose: { glycine: 5, methionine: 1 }, label: 'x' }], 8)
    expect(e.time).toBe(10)
    expect(e.add.gly_gut).toBeCloseTo(66605, -1) // 5 g / 75.07 g/mol
    expect(e.add.met_gut).toBeCloseTo(6702, -1)
    expect(() => expandEvents([{ at: 0, dose: { water: 1 } }])).toThrow(/Unknown dose/)
  })
})

describe('methylation scenarios: every preset simulates', () => {
  it('runs all scenarios to completion, positive and finite, in under 150 ms each', () => {
    for (const s of scenarios) {
      const r = runScenario(s) // second run: compiled model already cached
      expect(r.ok, s.id).toBe(true)
      expect(r.time[r.time.length - 1]).toBeCloseTo(72, 6)
      for (const id of ['met', 'sam', 'sah', 'hcy', 'gly', 'bet', 'mthf', 'thf', 'samSahRatio', 'tHcy']) {
        for (const v of r.series[id]) { expect(Number.isFinite(v), `${s.id}.${id}`).toBe(true); expect(v, `${s.id}.${id}`).toBeGreaterThanOrEqual(0) }
      }
      expect(r.ms, s.id).toBeLessThan(150)
    }
  })

  it('stays flat in the baseline-fed scenario', () => {
    const r = runs['baseline-fed']
    for (const id of ['sam', 'sah', 'samSahRatio', 'tHcy', 'gly', 'mthf']) expect(effect(r, id).peakRel).toBeCloseTo(0, 3)
    expect(effect(r, 'sam').troughRel).toBeCloseTo(0, 3)
  })
})

describe('methylation scenarios: expected qualitative outcomes', () => {
  it('glycine bolus: plasma glycine and hepatic glycine rise and relax; sarcosine/GNMT/SAM:SAH change is small (hypothesis)', () => {
    for (const id of ['glycine-3g', 'glycine-5g', 'glycine-10g']) {
      expect(change(id, 'gly_p', 'peak')).toBeGreaterThan(1)
      expect(change(id, 'gly', 'peak')).toBeGreaterThan(0.2)
      expect(Math.abs(change(id, 'samSahRatio', 'trough'))).toBeLessThan(0.1)
      expect(Math.abs(change(id, 'samSahRatio', 'final'))).toBeLessThan(0.01) // back to baseline in 64 h
    }
    expect(change('glycine-10g', 'gly_p', 'peak')).toBeGreaterThan(change('glycine-3g', 'gly_p', 'peak'))
    expect(change('glycine-10g', 'gly', 'peak')).toBeGreaterThan(change('glycine-3g', 'gly', 'peak'))
  })

  it('glycine bolus with the Luka-style Km: GNMT flux rises and SAM:SAH dips, more than with the Reed Km', () => {
    const luka = runScenario(scenarioIndex['glycine-10g'], { variants: { gnmtGlycineKm: 'luka2000' } })
    const reed = runScenario(scenarioIndex['glycine-10g'], { variants: { gnmtGlycineKm: 'reed130' } })
    const dip = (r) => effect(r, 'samSahRatio', { ref: r.series.samSahRatio[0], from: 8 }).troughRel
    const gn = (r) => effect(r, 'gnmt', { ref: r.fluxes.gnmt[0], from: 8 }).peakRel
    expect(gn(luka)).toBeGreaterThan(0.05); expect(gn(luka)).toBeGreaterThan(gn(reed) + 0.03)
    expect(dip(luka)).toBeLessThan(dip(reed) - 0.03)
    expect(dip(luka)).toBeLessThan(-0.03); expect(dip(luka)).toBeGreaterThan(-0.2)
  })

  it('choline and betaine doses: betaine up, BHMT up, hepatic Hcy and plasma tHcy down (dose-ordered)', () => {
    for (const id of ['choline-500mg', 'choline-2g', 'betaine-3g']) {
      expect(change(id, 'bet', 'peak')).toBeGreaterThan(0)
      expect(change(id, 'bhmt', 'peak')).toBeGreaterThan(0)
      expect(change(id, 'hcy', 'trough')).toBeLessThan(0)
    }
    expect(change('choline-2g', 'bhmt', 'peak')).toBeGreaterThan(change('choline-500mg', 'bhmt', 'peak'))
    expect(change('betaine-3g', 'tHcy', 'trough')).toBeLessThan(-0.05)
    expect(change('betaine-6g-day', 'tHcy', 'final')).toBeLessThan(-0.1)
    expect(change('betaine-3g', 'bet_p', 'peak')).toBeGreaterThan(10)
  })

  it('MTHFR 677TT-like: 5-MTHF falls, tHcy rises, SAM:SAH falls; worse in a low-folate state', () => {
    expect(change('mthfr-677tt', 'mthf')).toBeLessThan(-0.3)
    expect(change('mthfr-677tt', 'tHcy')).toBeGreaterThan(0.2)
    expect(change('mthfr-677tt', 'samSahRatio', 'trough')).toBeLessThan(-0.05)
    const low = runs['mthfr-677tt-low-folate']
    expect(low.series.mthf[0]).toBeLessThan(runs['mthfr-677tt'].series.mthf[0] * 0.7) // the low-folate background really is low
    expect(low.series.tHcy[0]).toBeGreaterThan(runs['mthfr-677tt'].series.tHcy[0] * 1.2)
    expect(low.series.tHcy[low.series.tHcy.length - 1]).toBeGreaterThan(runs['mthfr-677tt'].series.tHcy[0] * 1.8)
  })

  it('B6 restriction and deficiency: cystathionine rises with severity; post-load tHcy increment is larger', () => {
    expect(change('b6-restriction', 'cysta')).toBeGreaterThan(0.3)
    expect(change('b6-severe', 'cysta')).toBeGreaterThan(change('b6-restriction', 'cysta'))
    expect(change('b6-severe', 'tHcy')).toBeGreaterThan(change('b6-restriction', 'tHcy'))
    const inc = (id) => { const r = runs[id]; const k0 = r.time.findIndex((t) => t >= r.stages[0].end); return effect(r, 'tHcy', { ref: r.series.tHcy[k0], from: r.stages[0].end }).peak - r.series.tHcy[k0] }
    expect(inc('methionine-load-test-b6')).toBeGreaterThan(inc('methionine-load-test'))
  })

  it('B12 deficiency: folate trap (5-MTHF up, THF and formyl-folate down), total folate unchanged, tHcy up', () => {
    for (const id of ['b12-deficiency', 'b12-severe']) {
      expect(change(id, 'mthf')).toBeGreaterThan(0.5)
      expect(change(id, 'thf')).toBeLessThan(-0.5)
      expect(change(id, 'f10')).toBeLessThan(-0.4)
      expect(Math.abs(change(id, 'folateTotal'))).toBeLessThan(0.005)
      expect(change(id, 'tHcy')).toBeGreaterThan(0.5)
    }
    expect(change('b12-severe', 'mthf')).toBeGreaterThan(change('b12-deficiency', 'mthf'))
    expect(change('b12-severe', 'thf')).toBeLessThan(change('b12-deficiency', 'thf'))
  })

  it('niacin: NNMT flux and MNA rise, SAH rises, SAM and SAM:SAH fall, in proportion to the dose', () => {
    for (const id of ['niacin-500mg', 'niacin-2g']) {
      expect(change(id, 'nnmt')).toBeGreaterThan(5)
      expect(change(id, 'sah')).toBeGreaterThan(0)
      expect(change(id, 'sam')).toBeLessThan(0)
      expect(change(id, 'samSahRatio')).toBeLessThan(-0.02)
    }
    expect(change('niacin-2g', 'samSahRatio')).toBeLessThan(change('niacin-500mg', 'samSahRatio') - 0.2)
    expect(change('niacin-2g', 'samUseTotal')).toBeGreaterThan(0.03)
    // about 54-70% of the niacin is methylated (parameters-b2: 4.38-6.3 mmol methyl per g)
    expect(runs['niacin-2g'].fluxes.nnmt.at(-1) / (2 * 8.123 * 5)).toBeGreaterThan(0.5)
  })

  it('PEMT upregulation: SAM use by PC synthesis rises and SAM:SAH falls', () => {
    expect(change('pemt-upregulation', 'samUsePemt')).toBeGreaterThan(0.5)
    expect(change('pemt-upregulation', 'samSahRatio')).toBeLessThan(-0.1)
    expect(change('pemt-upregulation', 'pe')).toBeLessThan(0)
  })

  it('methionine meal and load test: transient SAM, SAH and tHcy surge, SAM:SAH dips, tHcy peaks hours later', () => {
    for (const id of ['methionine-meal', 'methionine-load-test']) {
      expect(change(id, 'sam', 'peak')).toBeGreaterThan(0.3)
      expect(change(id, 'samSahRatio', 'trough')).toBeLessThan(-0.2)
      expect(change(id, 'tHcy', 'peak')).toBeGreaterThan(0.1)
      expect(Math.abs(change(id, 'samSahRatio', 'final'))).toBeLessThan(0.01)
      const e = effect(runs[id], 'tHcy', { ref: runs[id].series.tHcy[0], from: 8 })
      expect(e.tPeak - 8).toBeGreaterThan(2)
    }
    expect(change('methionine-load-test', 'tHcy', 'peak')).toBeGreaterThan(change('methionine-meal', 'tHcy', 'peak'))
  })

  it('glycine + niacin in a low-folate state: an under-methylation-like profile (SAM and SAM:SAH clearly lower than either exposure alone)', () => {
    const combo = change('glycine-niacin-low-folate', 'samSahRatio')
    expect(combo).toBeLessThan(-0.3)
    expect(change('glycine-niacin-low-folate', 'sam')).toBeLessThan(-0.3)
    expect(combo).toBeLessThan(change('glycine-low-folate', 'samSahRatio') - 0.2)
    expect(change('glycine-niacin-low-folate', 'sah')).toBeGreaterThan(0)
    // low-folate background alone already lowers SAM and raises tHcy before the intervention starts
    const r = runs['glycine-niacin-low-folate']
    expect(r.series.sam[0]).toBeLessThan(runs['baseline-fed'].series.sam[0] * 0.85)
    expect(r.series.tHcy[0]).toBeGreaterThan(runs['baseline-fed'].series.tHcy[0] * 1.2)
  })
})
