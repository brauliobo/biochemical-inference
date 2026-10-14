// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { compileModel, ensemble, simulate } from '../../src/sim/index.js'
import { getModel, methylationModel } from '../../src/sim/models/methylation.js'
import { drawMember, ensembleSpace, methylationEnsemble, rankSensitivity, steadyResidual } from '../../src/sim/models/methylation-ensemble.js'
import { scenarioIndex } from '../../src/sim/scenarios.js'
import { createRng } from '../../src/sim/rng.js'

const M = (id, observable, reduce) => ({ id, observable, reduce })
const metrics = [M('ratioTrough', 'samSahRatio', 'min'), M('ratioFinal', 'samSahRatio', 'final'), M('samTrough', 'sam', 'min'), M('gnmtPeak', 'gnmt', 'max'), M('sarPeak', 'sar', 'max'), M('tHcyFinal', 'tHcy', 'final'), M('mthfFinal', 'mthf', 'final')]
const run = (id, extra = {}) => methylationEnsemble({ scenario: scenarioIndex[id], n: 100, seed: 7, metrics, ...extra })

describe('methylation ensemble: sampling', () => {
  it('samples kinetic constants, the flux partition, load scaling and uncertain reference concentrations', () => {
    const space = ensembleSpace()
    const groups = new Set(space.map((s) => s.group))
    expect([...groups].sort()).toEqual(['params', 'plan', 'ref', 'struct'])
    expect(space.length).toBeGreaterThan(80)
    expect(space.find((s) => s.id === 'km_gnmt_gly')).toMatchObject({ low: 12.2, high: 20000 })
    expect(space.find((s) => s.id === 'km_bhmt_bet')).toMatchObject({ low: 23, high: 2200 })
    expect(space.find((s) => s.group === 'ref' && s.id === 'gly')).toMatchObject({ low: 600, high: 4000 })
  })

  it('every member is exactly at its own steady state (no baseline drift) and the draws are deterministic', () => {
    const space = ensembleSpace()
    const rng = createRng(42)
    for (let i = 0; i < 40; i += 1) expect(steadyResidual(getModel({}, drawMember(rng, space)))).toBeLessThan(1e-8)
    const a = drawMember(createRng(5), space); const b = drawMember(createRng(5), space)
    expect(a).toEqual(b)
    expect(drawMember(createRng(6), space)).not.toEqual(a)
    expect(drawMember(createRng(5), space, { params: { km_gnmt_gly: 130 } }).params.km_gnmt_gly).toBe(130)
  })
})

describe('methylation ensemble: glycine -> SAM:SAH (the key honest result)', () => {
  const full = run('glycine-10g')
  const reed = run('glycine-10g', { fixed: { params: { km_gnmt_gly: 130 } } })
  const luka = run('glycine-10g', { fixed: { params: { km_gnmt_gly: 2000 } } })

  it('produces ordered bands for every metric and no failed members', () => {
    for (const res of [full, reed, luka]) {
      expect(res.ok).toBe(100); expect(res.failures).toBe(0)
      for (const m of metrics) { const s = res.summary[m.id]; expect(s.p5).toBeLessThanOrEqual(s.p25); expect(s.p25).toBeLessThanOrEqual(s.p50); expect(s.p50).toBeLessThanOrEqual(s.p75); expect(s.p75).toBeLessThanOrEqual(s.p95) }
    }
  })

  it('reports how often SAM:SAH falls by more than x% after a 10 g glycine dose (parameter-dependent, mostly small)', () => {
    const f = (res, x) => res.summary.ratioTrough.fracBelow(-x)
    console.info(`10 g glycine, trough SAM:SAH change: full ensemble median ${(full.summary.ratioTrough.p50 * 100).toFixed(1)}% [p5 ${(full.summary.ratioTrough.p5 * 100).toFixed(0)}%, p95 ${(full.summary.ratioTrough.p95 * 100).toFixed(0)}%]; fraction of members below -5% / -10% / -20%: ${f(full, 0.05).toFixed(2)} / ${f(full, 0.1).toFixed(2)} / ${f(full, 0.2).toFixed(2)}; Reed-Km members ${f(reed, 0.05).toFixed(2)} / ${f(reed, 0.1).toFixed(2)}; Luka-Km members ${f(luka, 0.05).toFixed(2)} / ${f(luka, 0.1).toFixed(2)} / ${f(luka, 0.2).toFixed(2)}`)
    // median effect is small; a >5% fall happens in roughly half of the members, >20% only rarely
    expect(full.summary.ratioTrough.p50).toBeGreaterThan(-0.15); expect(full.summary.ratioTrough.p50).toBeLessThan(0)
    expect(f(full, 0.05)).toBeGreaterThan(0.25); expect(f(full, 0.05)).toBeLessThan(0.8)
    expect(f(full, 0.2)).toBeLessThan(0.3)
    // the contested GNMT glycine Km decides the result
    expect(f(luka, 0.05)).toBeGreaterThan(0.6)
    expect(f(reed, 0.05)).toBeLessThan(0.3)
    expect(luka.summary.ratioTrough.p50).toBeLessThan(reed.summary.ratioTrough.p50 - 0.03)
    expect(luka.summary.gnmtPeak.fracAbove(0.05)).toBeGreaterThan(0.8)
    expect(reed.summary.gnmtPeak.fracAbove(0.05)).toBeLessThan(0.5)
    // the dip is transient: SAM:SAH is back at baseline 60 h later
    expect(Math.max(...full.members.map((m) => Math.abs(m.effects.ratioFinal)))).toBeLessThan(0.02)
  })

  it('identifies the GNMT glycine Km as the dominant driver of the SAM:SAH dip in the full ensemble', () => {
    const top = rankSensitivity(full, 'ratioTrough', 3)
    expect(top[0].id).toBe('km_gnmt_gly')
    expect(top[0].rho).toBeLessThan(-0.6) // rank correlation: a larger Km gives a more negative (larger) SAM:SAH dip
  })

  it('hepatic sarcosine and GNMT flux rise in most members (they are the robust part of the glycine hypothesis)', () => {
    expect(full.summary.gnmtPeak.fracAbove(0.02)).toBeGreaterThan(0.6)
    expect(full.summary.sarPeak.fracAbove(0.02)).toBeGreaterThan(0.6)
    expect(full.summary.gnmtPeak.p95).toBeGreaterThan(0.2)
  })

  it('the chronic-glycine steady effect on SAM:SAH is not robust (sign depends on parameters)', () => {
    const chronic = run('glycine-10g-day')
    const up = chronic.summary.ratioFinal.fracAbove(0.02); const down = chronic.summary.ratioFinal.fracBelow(-0.02)
    expect(up).toBeGreaterThan(0.2); expect(down).toBeGreaterThan(0.1) // both signs occur
    // while tHcy falls in most members (serine -> CBS arm)
    expect(chronic.summary.tHcyFinal.fracBelow(-0.05)).toBeGreaterThan(0.6)
  })
})

describe('methylation ensemble: which conclusions are robust', () => {
  it('MTHFR 0.4x: 5-MTHF falls and tHcy rises in every member; the SAM:SAH fall depends on the folate inhibition of GNMT', () => {
    const r = run('mthfr-677tt')
    expect(r.summary.mthfFinal.p95).toBeLessThan(-0.3)
    expect(r.summary.tHcyFinal.p5).toBeGreaterThan(0.2)
    expect(r.summary.ratioTrough.p50).toBeLessThan(0)
    expect(rankSensitivity(r, 'ratioTrough', 2).map((x) => x.id)).toContain('ki_gnmt_mthf2')
  })

  it('B12 deficiency: tHcy and 5-MTHF rise in every member, but the sign of the SAM:SAH change is parameter-dependent', () => {
    const r = run('b12-deficiency')
    expect(r.summary.mthfFinal.p5).toBeGreaterThan(0.3)
    expect(r.summary.tHcyFinal.p5).toBeGreaterThan(0.3)
    expect(r.summary.ratioFinal.fracAbove(0.02)).toBeGreaterThan(0.3)
    expect(r.summary.ratioFinal.fracBelow(-0.02)).toBeGreaterThan(0.05)
  })

  it('niacin 2 g/day: SAM:SAH falls in essentially every member, 500 mg much less', () => {
    const hi = run('niacin-2g'); const lo = run('niacin-500mg')
    expect(hi.summary.ratioFinal.fracBelow(-0.2)).toBeGreaterThan(0.9)
    expect(lo.summary.ratioFinal.p50).toBeGreaterThan(hi.summary.ratioFinal.p50)
    expect(lo.summary.ratioFinal.fracBelow(-0.05)).toBeGreaterThan(0.3)
    expect(rankSensitivity(hi, 'ratioFinal', 2).map((x) => x.id)).toContain('loadScale')
  })

  it('betaine lowers tHcy only if BHMT is not saturated by betaine (Km 100 uM vs 2.2 mM)', () => {
    const low = run('betaine-6g-day', { fixed: { params: { km_bhmt_bet: 100 } } })
    const high = run('betaine-6g-day', { fixed: { params: { km_bhmt_bet: 2200 } } })
    expect(high.summary.tHcyFinal.p50).toBeLessThan(low.summary.tHcyFinal.p50 - 0.03)
    expect(high.summary.tHcyFinal.fracBelow(-0.05)).toBeGreaterThan(0.6)
    expect(low.summary.tHcyFinal.fracBelow(-0.05)).toBeLessThan(0.4)
  })

  it('PEMT upregulation lowers SAM:SAH in every member', () => {
    const r = run('pemt-upregulation')
    expect(r.summary.ratioFinal.p95).toBeLessThan(-0.05)
  })

  it('B6 restriction: cystathionine rises in every member (robust); fasting tHcy rises in every member (conflicts with the study)', () => {
    const r = methylationEnsemble({ scenario: scenarioIndex['b6-restriction'], n: 60, seed: 3, metrics: [M('cysta', 'cysta', 'final'), M('tHcy', 'tHcy', 'final')] })
    expect(r.summary.cysta.p5).toBeGreaterThan(0.2)
    expect(r.summary.tHcy.p5).toBeGreaterThan(0.02)
  })
})

describe('methylation ensemble: runtime and the engine ensemble', () => {
  it('n = 100 members of a 72 h scenario run in under 10 s', () => {
    const t0 = performance.now()
    const r = methylationEnsemble({ scenario: scenarioIndex['glycine-10g'], n: 100, seed: 1, metrics })
    const ms = performance.now() - t0
    console.info(`methylationEnsemble n=100: ${ms.toFixed(0)} ms (${(ms / 100).toFixed(1)} ms per member), ${r.failures} failures`)
    expect(r.ok).toBe(100)
    expect(ms).toBeLessThan(10000)
  }, 30000)

  it('is deterministic for a seed', () => {
    const a = methylationEnsemble({ scenario: scenarioIndex['glycine-5g'], n: 10, seed: 9, metrics })
    const b = methylationEnsemble({ scenario: scenarioIndex['glycine-5g'], n: 10, seed: 9, metrics })
    expect(a.summary.ratioTrough.p50).toBe(b.summary.ratioTrough.p50)
    expect(a.members[3].effects).toEqual(b.members[3].effects)
  })

  it('the engine ensemble() also works on the fixed model (uncalibrated: baseline moves with the sampled constants); ~100 ms per member because it cannot select the stiff solver', () => {
    const c = compileModel(methylationModel)
    const only = ['ka_gly', 'ka_bet', 'k_gly_per', 'k_bet_ren', 'km_gly_up', 'km_bet_up', 'ki_bet_trans']
    const t0 = performance.now()
    const res = ensemble(c, { n: 40, seed: 1, only, duration: 24, samples: 25, controls: { glycineLoad: 10 } })
    const ms = performance.now() - t0
    console.info(`engine ensemble() n=40 on the fixed model: ${ms.toFixed(0)} ms (${(ms / 40).toFixed(0)} ms per member; n=100 would take about ${(ms / 40 * 100 / 1000).toFixed(0)} s)`)
    expect(ms).toBeLessThan(10000)
    expect(res.ok).toBeGreaterThan(36)
    const band = res.bands.gly_p
    for (let k = 0; k < band.p50.length; k += 1) { expect(band.p5[k]).toBeLessThanOrEqual(band.p50[k] + 1e-9); expect(band.p50[k]).toBeLessThanOrEqual(band.p95[k] + 1e-9) }
    expect(Math.max(...band.p95)).toBeGreaterThan(Math.max(...band.p5)) // genuine spread
    void simulate
  }, 30000)
})
