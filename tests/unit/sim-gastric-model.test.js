// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { compileModel, conservedSums, simulate, validateModel } from '../../src/sim/index.js'
import { analyzeGastric, gastricConservedGroups, gastricModel, gastricPh, gastricScenarios } from '../../src/sim/models/gastric.js'
import b2 from '../../src/sim/data/parameters-b2.js'

const FAST = { rtol: 1e-4, atol: 1e-9 }
const compiled = compileModel(gastricModel)
const b2p = Object.fromEntries(b2.parameters.map((p) => [p.id, p]))
const run = (controls = {}, extra = {}) => simulate(compiled, { duration: 8, samples: 161, controls, ...FAST, ...extra })
const nonincreasing = (a) => a.every((v, i) => i === 0 || v <= a[i - 1] + 1e-9)
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)]
// three meals in 24 h: Plate is refilled with events
const day = { duration: 24, samples: 145, events: [8, 13, 19].map((time) => ({ time, add: { Plate: 400 }, set: { eat_k: 12 } })) }
const closedStomach = { bao: 0, dpao: 0, hco3_mucosal: 0, alk_other: 0, hco3d_basal: 0, fluid_in: 0, air_in: 0 }

describe('gastric model: definition', () => {
  it('validates without errors or warnings and compiles', () => {
    const v = validateModel(gastricModel)
    expect(v.errors).toEqual([])
    expect(v.warnings).toEqual([])
    expect(compiled.names.length).toBeGreaterThan(30)
  })

  it('takes literature parameters from B2 unchanged', () => {
    const value = (id) => gastricModel.parameters.find((p) => p.id === id).value
    expect(value('bao')).toBe(b2p['gastric-bao'].value)
    expect(value('bao') + value('dpao')).toBeCloseTo(b2p['gastric-pao'].value, 10)
    expect(value('hco3_mucosal')).toBeCloseTo(b2p['gastric-hco3-basal-umol-h'].value / 1000, 10)
    expect(value('k_pump_rec')).toBeCloseTo(Math.LN2 / b2p['ppi-pump-recovery-halflife-h'].value, 10)
    expect(value('hco3d_max')).toBe(b2p['pancreatic-hco3-max-mmol-h'].value)
    expect(value('k_pass')).toBe(b2p['gastric-gas-fraction-passed-distally'].value) // 0.8 per hour with k_belch 0.2: 80% of venting is distal
    expect(value('k_pass') / (value('k_pass') + value('k_belch'))).toBeCloseTo(b2p['gastric-gas-fraction-passed-distally'].value, 10)
    expect(value('hco3d_basal')).toBeCloseTo((b2p['duodenal-hco3-basal-umol-cm-h'].value * 4) / 1000, 2)
    // every parameter has a source and a confidence from the allowed set
    for (const p of gastricModel.parameters) {
      expect(p.source, p.id).toBeTruthy()
      expect(['high', 'medium', 'low', 'assumed']).toContain(p.confidence)
    }
  })

  it('has evidence-labelled scenarios that only use declared controls and run', { timeout: 60000 }, () => {
    expect(gastricScenarios.length).toBeGreaterThanOrEqual(10)
    for (const s of gastricScenarios) {
      expect(['measured-anchor', 'model-prediction', 'hypothesis']).toContain(s.status)
      for (const id of Object.keys(s.controls)) expect(compiled.controlIds, `${s.id}: ${id}`).toContain(id)
      const r = simulate(compiled, { duration: Math.min(s.duration ?? 8, 8), samples: 41, controls: s.controls, ...FAST })
      expect(r.ok, s.id).toBe(true)
      expect(r.warnings, s.id).toEqual([])
    }
    // the glycine acid effect is a hypothesis and off by default
    expect(gastricScenarios.find((s) => s.id === 'glycine-acid-70').status).toBe('hypothesis')
    expect(gastricModel.controls.find((c) => c.id === 'glycineAcidBoostPct').default).toBe(0)
  })
})

describe('gastric model: fasting and meal', () => {
  it('starts at a fasting steady state that matches the B2 anchors', () => {
    const r = run({ mealMl: 0 }, { duration: 24, samples: 25 })
    const ph = gastricPh(r)
    expect(Math.abs(ph[24] - ph[0])).toBeLessThan(0.01)
    expect(Math.abs(r.series.V[24] - r.series.V[0])).toBeLessThan(0.3)
    expect(ph[0]).toBeGreaterThan(b2p['gastric-ph-fasting'].low) // pH 1.7 (1-2.5)
    expect(ph[0]).toBeLessThan(b2p['gastric-ph-fasting'].high)
    expect(r.series.V[0]).toBeGreaterThan(b2p['gastric-fasting-volume-ml'].low)
    expect(r.series.V[0]).toBeLessThan(b2p['gastric-fasting-volume-ml'].high + 10)
    const a = analyzeGastric(r)
    const pco2 = a.pco2DissolvedMmHg[0]
    expect(pco2).toBeGreaterThan(b2p['gastric-pco2-basal-mmhg'].low) // 63 mmHg (44-82)
    expect(pco2).toBeLessThan(b2p['gastric-pco2-basal-mmhg'].high)
    // gas pocket CO2 follows Henry's law: P(gas) = 760 * CO2g / (CO2g + Air) is close to the dissolved PCO2
    const pGas = (760 * r.series.CO2g[0]) / r.series.gasTotal[0]
    expect(Math.abs(pGas - pco2) / pco2).toBeLessThan(0.1)
  })

  it('a meal buffers the stomach and the pH returns to its fasting value', () => {
    const r = run({}, { duration: 16, samples: 321 })
    const a = analyzeGastric(r)
    const fasted = a.ph[0]
    expect(a.phMax).toBeGreaterThan(b2p['gastric-ph-fed-peak'].low) // peak 5-7.4 (median 6.7)
    expect(a.phMax).toBeLessThan(b2p['gastric-ph-fed-peak'].high)
    const at = (t) => a.ph[Math.round((t / 16) * 320)]
    expect(at(0.9)).toBeCloseTo(fasted, 1) // before the meal
    expect(at(1 + b2p['gastric-ph-recovery-h'].high + 0.5)).toBeLessThan(fasted + 0.4) // back near fasting within ~2.5 h
    expect(Math.abs(at(16) - fasted)).toBeLessThan(0.1) // and baseline again at the end
    // meal-stimulated acid output is of the B2 order (15.8 mmol/h; peak output 13.7-43.4)
    const peakOut = Math.max(...a.acidOutputMmolPerH)
    expect(peakOut).toBeGreaterThan(b2p['gastric-meal-acid-output'].low)
    expect(peakOut).toBeLessThan(b2p['gastric-pao'].high)
    expect(r.series.V[Math.round((1.1 / 16) * 320)]).toBeGreaterThan(300) // the meal is in the stomach
    expect(r.series.V[320]).toBeLessThan(r.series.V[Math.round((1.1 / 16) * 320)] / 3) // and emptied
  })

  it('reproduces the 24 h acid output and the PPI effect on 24 h acidity and median pH', () => {
    const r0 = run({ mealMl: 0 }, day)
    const r60 = run({ mealMl: 0, ppiInhibitionPct: 60 }, day)
    const a0 = analyzeGastric(r0)
    const a60 = analyzeGastric(r60)
    expect(a0.acidSecretedMmol).toBeGreaterThan(b2p['gastric-acid-24h'].low * 0.9) // 208 (190-227) mmol
    expect(a0.acidSecretedMmol).toBeLessThan(b2p['gastric-acid-24h'].high * 1.1)
    const reduction = 1 - a60.acidSecretedMmol / a0.acidSecretedMmol
    expect(reduction).toBeGreaterThan(0.4) // omeprazole 20 mg: -60% by day 5
    expect(reduction).toBeLessThan(0.7)
    expect(median(a0.ph)).toBeLessThan(2.2) // untreated median pH 1.7
    expect(median(a60.ph)).toBeGreaterThan(3.5) // omeprazole median pH 4.6 (Delchier 1997)
    const below4 = (ph) => ph.filter((x) => x < 4).length / ph.length
    expect(below4(a0.ph)).toBeGreaterThan(0.85) // 89% of the time at pH < 4
    expect(below4(a60.ph)).toBeLessThan(0.6) // 35% on omeprazole
  })
})

describe('gastric model: PPI control', () => {
  it('lowers acid output and raises pH monotonically with the inhibited fraction', { timeout: 60000 }, () => {
    const levels = [0, 30, 60, 90, 100]
    const acid = []
    const medians = []
    const eaten = []
    for (const ppiInhibitionPct of levels) {
      const a = analyzeGastric(run({ mealMl: 0, ppiInhibitionPct }, day))
      acid.push(a.acidSecretedMmol)
      medians.push(median(a.ph))
      eaten.push(a.hoursBelow4)
    }
    expect(nonincreasing(acid)).toBe(true)
    expect(acid[0]).toBeGreaterThan(acid[2] * 1.5)
    expect(acid[4]).toBeLessThan(1e-6) // all pumps blocked: no acid
    expect(nonincreasing(eaten)).toBe(true)
    expect(medians.every((v, i) => i === 0 || v >= medians[i - 1] - 1e-9)).toBe(true)
  })

  it('pumps recover with the 28 h half-life when dosing stops', () => {
    const r = run({ ppiInhibitionPct: 90, ppiRecovers: 1, mealMl: 0 }, { duration: 112, samples: 5 })
    r.time.forEach((t, i) => expect(r.series.Pump[i]).toBeCloseTo(1 - 0.9 * 2 ** (-t / 28), 3))
    // while dosing continues, the inhibited fraction stays put
    const kept = run({ ppiInhibitionPct: 90, mealMl: 0 }, { duration: 112, samples: 5 })
    expect(kept.series.Pump[4]).toBeCloseTo(0.1, 6)
  })
})

describe('gastric model: mass balance', () => {
  it('conserves H+, HCO3-/CO2, meal buffer and air with every dose switched on', () => {
    const r = run({ betaineHclG: 1, bicarbonateMg: 500, alginateMl: 10, glycineAcidBoostPct: 50, dgReflux: 1, ppiInhibitionPct: 30 }, { duration: 10, samples: 201 })
    expect(r.ok).toBe(true)
    const groups = conservedSums(compiled, gastricConservedGroups, r)
    for (const g of groups) {
      expect(g.balanced, `${g.id} ${JSON.stringify(g.violations)}`).toBe(true)
      expect(g.drift, g.id).toBeLessThan(1e-4) // solver tolerance: the invariants are linear, drift is rounding and the stiff solver
    }
    // explicit ledger at the end: H+ supplied (parietal + 1 g capsule) + what was there at t=0
    //   = free + buffered + duodenal + passed on + capsule left + CO2 made from it (CO2 minus the blood back-flux)
    const s = r.series
    const L = r.time.length - 1
    const lhs = s.H_secreted[L] + s.BHCl[0] + s.H[0] + s.HBm[0] + s.Hd[0] + s.co2Pools[0] + s.Plate[0] * 0.00024 // 0.00024 mmol/mL of the meal is already protonated buffer
    const rhs = s.H[L] + s.HBm[L] + s.Hd[L] + s.H_dist[L] + s.BHCl[L] + s.co2Pools[L] - s.CO2_blood[L] + s.Plate[L] * 0.00024
    expect(s.BHCl[0]).toBeCloseTo(6.51, 6)
    expect(Math.abs(lhs - rhs)).toBeLessThan(1e-6)
  })

  it('1 mmol of H+ neutralised by bicarbonate gives 1 mmol CO2 = 25.45 mL at 37 C', () => {
    // no secretion, no background alkali: add 10 mmol H+ and 6 mmol HCO3- to the stomach
    const r = simulate(compiled, {
      duration: 3, samples: 31, controls: { mealMl: 0 }, params: closedStomach, ...FAST,
      events: [{ time: 0, add: { H: 10, HCO3: 6 }, label: 'acid and bicarbonate' }]
    })
    const a = analyzeGastric(r)
    const before = (r.series.CO2d[0] + r.series.CO2g[0]) * 25.45 // the stomach already holds ~0.14 mmol CO2 at the fasting steady state
    expect(a.co2.stomachMl - before).toBeCloseTo(6 * 25.45, 0) // 152.7 mL formed in the stomach
    expect(r.series.HCO3[30]).toBeLessThan(1e-4) // bicarbonate is used up
    // nothing is created from nothing: H+ still free or on its way + CO2 made from it stays equal to the 10 mmol added + what was there
    const s = r.series
    const ledger = (i) => s.H[i] + s.Hd[i] + s.H_dist[i] + s.HBm[i] + s.co2Pools[i] - s.CO2_blood[i]
    expect(s.H[0]).toBeGreaterThan(10)
    expect(ledger(30)).toBeCloseTo(ledger(0), 6)
  })

  it('bicarbonate in excess of acid stays bicarbonate (final-pH correction) and does not make more CO2 than acid', () => {
    const r = simulate(compiled, { duration: 3, samples: 31, controls: { mealMl: 0 }, params: closedStomach, ...FAST, events: [{ time: 0, set: { H: 0.05 }, add: { HCO3: 6 } }] })
    const a = analyzeGastric(r)
    expect(a.co2.stomachMl).toBeLessThan(0.05 * 25.45 * 1.5 + 6 * 25.45 * 0.2) // the dissolved/bicarbonate equilibrium holds back most of it
    expect(Math.max(...a.ph)).toBeGreaterThan(5)
  })
})

describe('gastric model: CO2, gas and belching', () => {
  const bicarb = (controls = {}, params = {}) => analyzeGastric(run({ bicarbonateMg: 500, mealMl: 0, ...controls }, { params }))

  it('almost all stomach CO2 is absorbed, not vented as gas, so it hardly contributes to belching', () => {
    const a = bicarb()
    expect(a.co2.stomachMl).toBeGreaterThan(5.95 * 25.45) // 500 mg NaHCO3 = 5.95 mmol = 151 mL plus the background CO2
    expect(a.co2.stomachFractionAbsorbed).toBeGreaterThan(0.85)
    expect(a.co2.stomachFractionGasVented).toBeLessThan(0.1)
    expect(a.co2.fractionAbsorbedInModel).toBeGreaterThan(0.9) // stomach + duodenum (the rest is carried to the jejunum)
    expect(a.co2.gasPocketPeakMl).toBeLessThan(0.1 * 151) // peak CO2 gas < 10% of what the dose could make
    expect(a.co2.gasPocketPeakMl).toBeLessThan(a.co2.swallowedAirMl / 8) // far below the swallowed air passing through
    expect(a.co2.shareOfBelchedGas).toBeLessThan(0.2) // CO2 is a minority of the belched gas
    // dissolved PCO2 peaks well above the basal 63 mmHg (Kolkman 1994: 144 mmHg after 500 mg with more fluid)
    expect(Math.max(...a.pco2DissolvedMmHg)).toBeGreaterThan(b2p['gastric-pco2-basal-mmhg'].value * 1.5)
  })

  it('a slower absorption rate vents a larger share (the headline depends on the PCO2 anchor)', () => {
    const base = bicarb().co2.stomachFractionGasVented
    const slow = bicarb({ co2AbsorptionRate: 10 }).co2.stomachFractionGasVented
    expect(slow).toBeGreaterThan(base * 2)
  })

  it('CO2 formed in the stomach rises monotonically with the bicarbonate dose', { timeout: 60000 }, () => {
    const doses = [0, 250, 500, 1000, 2000]
    const formed = doses.map((bicarbonateMg) => analyzeGastric(run({ bicarbonateMg, mealMl: 0 }, {})).co2.stomachMl)
    expect(formed.every((v, i) => i === 0 || v > formed[i - 1])).toBe(true)
    // never more than the dose in mmol x 25.45 mL/mmol: bicarbonate beyond the available acid leaves for the duodenum unreacted
    doses.forEach((mg, i) => expect(formed[i] - formed[0]).toBeLessThanOrEqual((mg / 84.006) * 25.45 + 1e-6))
    expect(formed[2] - formed[0]).toBeGreaterThan(0.3 * (500 / 84.006) * 25.45)
    // acid-limited: the increment grows less than in proportion to the dose
    expect(formed[4] - formed[0]).toBeLessThan(0.6 * (2000 / 84.006) * 25.45)
  })

  it('duodeno-gastric reflux raises the gastric dissolved PCO2 (hypothesis, off in health)', () => {
    const off = analyzeGastric(run({ mealMl: 0, dgReflux: 0 }, {}))
    const on = analyzeGastric(run({ mealMl: 0, dgReflux: 3 }, {}))
    expect(Math.max(...on.pco2DissolvedMmHg)).toBeGreaterThan(Math.max(...off.pco2DissolvedMmHg) * 1.02)
  })
})

describe('gastric model: betaine HCl, glycine and antacids', () => {
  it('betaine HCl delivers 6.51 mmol H+ per gram, to be compared with ~5 mmol/h basal output', () => {
    const r = run({ mealMl: 0, betaineHclG: 0.65 })
    expect(r.series.Betaine_rel[r.time.length - 1]).toBeCloseTo((0.65 * 1000) / 153.61, 3) // 4.23 mmol betaine and 4.23 mmol H+
    const a = analyzeGastric(r)
    expect(a.capsuleAcidMmol).toBeCloseTo(0.65 * 6.51, 1)
    expect(a.capsuleAcidMmol / b2p['gastric-bao'].value).toBeLessThan(1) // less than an hour of basal output
  })

  it('betaine HCl lowers the pH under a PPI', () => {
    const without = analyzeGastric(run({ ppiInhibitionPct: 60, mealMl: 400 }, { duration: 6, samples: 121 }))
    const withCaps = analyzeGastric(run({ ppiInhibitionPct: 60, mealMl: 400, betaineHclG: 3.25 }, { duration: 6, samples: 121 }))
    expect(withCaps.hoursBelow4).toBeGreaterThan(without.hoursBelow4)
    const meanPh = (a) => a.ph.reduce((x, y) => x + y, 0) / a.ph.length
    expect(meanPh(withCaps)).toBeLessThan(meanPh(without))
  })

  it('glycine causes no extra acid by default; the what-if control raises acid output (hypothesis)', () => {
    const control = compiled.defaultControls()
    expect(control.glycineAcidBoostPct).toBe(0) // human data: no gastrin effect (Wald 1982)
    const acid = (glycineAcidBoostPct) => analyzeGastric(run({ glycineAcidBoostPct })).acidSecretedMmol
    const levels = [0, 35, 70, 140].map(acid)
    expect(levels.every((v, i) => i === 0 || v > levels[i - 1])).toBe(true)
    expect(levels[2]).toBeGreaterThan(levels[0] * 1.15) // feedback damps the +70% to a smaller rise
    expect(levels[2]).toBeLessThan(levels[0] * 1.7)
    expect(levels[0]).toBeCloseTo(acid(undefined), 2)
  })

  it('alginate-carbonate adds a CO2 load that is also absorbed', () => {
    const none = analyzeGastric(run({ mealMl: 0 }))
    const alg = analyzeGastric(run({ mealMl: 0, alginateMl: 20 }))
    const extra = alg.co2.stomachMl - none.co2.stomachMl
    expect(extra).toBeGreaterThan(0.3 * 20 * 0.4 * 25.45) // 8 mmol CO2-yielding base: part reacts in the stomach, the rest leaves unreacted
    expect(extra).toBeLessThanOrEqual(20 * 0.4 * 25.45)
    expect(alg.co2.stomachFractionAbsorbed).toBeGreaterThan(0.8)
  })
})

describe('gastric model: speed', () => {
  it('an 8 h scenario with the default tolerances runs in about a second', () => {
    const t0 = performance.now()
    const r = run({ ppiInhibitionPct: 60, betaineHclG: 1, bicarbonateMg: 500 })
    expect(r.ok).toBe(true)
    expect(performance.now() - t0).toBeLessThan(3000)
  })
})
