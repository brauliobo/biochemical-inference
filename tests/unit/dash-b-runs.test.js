// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { analyzeGastric, gastricScenarios } from '../../src/sim/models/gastric.js'
import { compileModel, simulate } from '../../src/sim/index.js'
import { gastricModel, gastricSimOptions } from '../../src/sim/models/gastric.js'
import { co2Budget, createGutRunner, eventMarkers, median, timeMean } from '../../src/components/dash-gut/gut-run.js'
import { GUT_DEFAULTS, GUT_PRESETS, presetFor, toModelControls } from '../../src/components/dash-gut/gut-presets.js'
import { clearanceShares, createHistamineRunner } from '../../src/components/dash-gut/histamine-run.js'
import { HISTAMINE_DEFAULTS, HISTAMINE_PRESETS, METHYLATION_LINKS, toHistamineControls } from '../../src/components/dash-gut/histamine-presets.js'
import { chronicControls, methylationSamSah } from '../../src/components/dash-gut/methylation-link.js'
import { createB6Runner, plpActivity, PLP_GRID } from '../../src/components/dash-gut/b6-run.js'
import { scenarioIndex } from '../../src/sim/scenarios.js'
import { validationIndex } from '../../src/sim/validation-targets.js'

describe('gut presets stay in step with the gastric scenarios', () => {
  it('every preset that names a gastric scenario sets the same model controls', () => {
    const same = ['meal', 'fasting', 'ppi-60', 'bhcl-650', 'bhcl-3250-ppi', 'nahco3-500', 'alginate-20']
    for (const id of same) {
      const scenario = gastricScenarios.find((item) => item.id === id)
      const preset = GUT_PRESETS.find((item) => item.id === id)
      expect(scenario, id).toBeTruthy()
      const model = toModelControls(preset.controls)
      const defaults = toModelControls(GUT_DEFAULTS)
      for (const [key, value] of Object.entries(scenario.controls)) expect(model[key], `${id}.${key}`).toBe(value)
      // controls the scenario does not set keep their default
      for (const key of Object.keys(model)) if (!(key in scenario.controls)) expect(model[key], `${id}.${key}`).toBe(defaults[key])
      expect(preset.status).toBe(scenario.status)
    }
    const boost = gastricScenarios.find((item) => item.id === 'glycine-acid-70')
    expect(toModelControls(GUT_PRESETS.find((item) => item.id === 'glycine-acid-70').controls).glycineAcidBoostPct).toBe(boost.controls.glycineAcidBoostPct)
    expect(boost.status).toBe('hypothesis')
  })

  it('the default controls are the standard meal and presetFor finds a preset by its controls', () => {
    expect(presetFor(GUT_DEFAULTS)).toBe('meal')
    expect(presetFor({ ...GUT_DEFAULTS, ppi: 35 })).toBe('')
    expect(presetFor(GUT_PRESETS.find((item) => item.id === 'ppi-60').controls)).toBe('ppi-60')
  })
})

describe('gut runner (gastric model)', () => {
  const runner = createGutRunner()
  const meal = runner(GUT_DEFAULTS)
  const ppi = runner({ ...GUT_DEFAULTS, ppi: 60 })

  it('a 60% PPI shortens the time with pH below 4 and raises the median pH (the keyboard task)', () => {
    expect(meal.hoursBelow4).toBeGreaterThan(6.5)
    expect(ppi.hoursBelow4).toBeGreaterThan(3)
    expect(ppi.hoursBelow4).toBeLessThan(5)
    expect(ppi.medianPh).toBeGreaterThan(meal.medianPh + 2)
    expect(ppi.baseline.hoursBelow4).toBe(meal.hoursBelow4)
    expect(ppi.acidSecretedMmol).toBeLessThan(meal.acidSecretedMmol)
  })

  it('CO2 from acid and bicarbonate is a small part of what is belched: about 0.2% of the CO2 formed, under 15% of the belched gas', () => {
    expect(meal.co2.shareOfBelchedGas).toBeGreaterThan(0.02)
    expect(meal.co2.shareOfBelchedGas).toBeLessThan(0.15)
    expect(meal.co2.belchedMl).toBeLessThan(10)
    expect(meal.co2.belchedMl / meal.co2.formedMl).toBeLessThan(0.01)
    expect(meal.co2.swallowedAirMl).toBeGreaterThan(100)
    expect(meal.co2.swallowedAirMl).toBeGreaterThan(20 * meal.co2.belchedMl)
  })

  it('the CO2 budget adds up to the CO2 formed, and agrees with analyzeGastric', () => {
    const compiled = compileModel(gastricModel)
    const run = simulate(compiled, { controls: toModelControls({ ...GUT_DEFAULTS, bicarbonateMg: 500, betaineHclG: 0.65 }), duration: 8, samples: 161, ...gastricSimOptions })
    const budget = co2Budget(run)
    const parts = budget.absorbedMl + budget.carriedMl + budget.heldMl + budget.passedMl + budget.belchedMl
    expect(parts).toBeCloseTo(budget.formedMl, 8)
    expect(budget.formedMl).toBeCloseTo(analyzeGastric(run).co2.formedMl, 6)
  })

  it('betaine HCl: 650 mg is 4.2 mmol H+, about 0.8 h of basal output', () => {
    const bhcl = runner({ ...GUT_DEFAULTS, betaineHclG: 0.65 })
    expect(bhcl.capsuleAcidMmol).toBeCloseTo(4.23, 1)
    expect(bhcl.capsuleHoursOfBasal).toBeCloseTo(0.83, 1)
    expect(meal.capsuleAcidMmol).toBe(0)
  })

  it('the hypothesis control raises acid output; the default is zero', () => {
    expect(GUT_DEFAULTS.glycineAcidBoostPct).toBe(0)
    const boosted = runner({ ...GUT_DEFAULTS, glycineAcidBoostPct: 70 })
    expect(boosted.acidSecretedMmol).toBeGreaterThan(meal.acidSecretedMmol * 1.3)
  })

  it('provides the map inputs, markers and chart series of equal length', () => {
    expect(meal.time).toHaveLength(161)
    expect(meal.ph).toHaveLength(161)
    expect(meal.acid).toHaveLength(161)
    expect(Object.keys(meal.flux)).toContain('reaction:gastric-hcl-secretion')
    expect(meal.concentration['compound:proton']).toBeGreaterThan(meal.concentration['compound:bicarbonate'])
    expect(eventMarkers({ ...GUT_DEFAULTS, bicarbonateMg: 100, betaineHclG: 0.65 })).toEqual([{ x: 0.5, label: 'Sodium bicarbonate' }, { x: 1, label: 'Meal + Betaine HCl' }])
    expect(eventMarkers({ ...GUT_DEFAULTS, meal: false })).toEqual([])
  })

  it('timeMean and median', () => {
    expect(timeMean([0, 1, 2], [0, 2, 2])).toBeCloseTo(1.5, 10)
    expect(median([3, 1, 2])).toBe(2)
    expect(median([1, 2, 3, 4])).toBe(2.5)
  })
}, 120000)

describe('histamine runner', () => {
  const runner = createHistamineRunner()
  const reference = runner(HISTAMINE_DEFAULTS)

  it('reference state is 1.0 for systemic and CNS histamine; HNMT carries 60% (CNS 80%) of clearance by assumption', () => {
    expect(reference.state.plasma).toBeCloseTo(1, 6)
    expect(reference.state.cns).toBeCloseTo(1, 6)
    expect(reference.state.shares.systemic.share).toBeCloseTo(0.6, 2)
    expect(reference.state.shares.cns.share).toBeCloseTo(0.8, 2)
    expect(reference.hnmtCapacity).toBeCloseTo(1, 10)
  })

  it('SAM 60 -> 30 uM raises systemic histamine 1.20x and CNS 1.28x (docs/SMALL_MODELS.md)', () => {
    const low = runner(HISTAMINE_PRESETS.find((item) => item.id === 'low-sam').controls)
    expect(low.state.plasma).toBeCloseTo(1.195, 2)
    expect(low.state.cns).toBeCloseTo(1.284, 2)
    expect(low.hnmtCapacity).toBeLessThan(0.8)
    // the sweep contains the same point and falls with SAM
    const sweep = low.sweep
    expect(sweep[0].plasma).toBeGreaterThan(sweep.at(-1).plasma)
    expect(sweep.every((point, i) => i === 0 || point.plasma <= sweep[i - 1].plasma + 1e-9)).toBe(true)
  })

  it('blocking gut DAO triples systemic histamine; the CNS is unaffected (no DAO there)', () => {
    const blocked = runner(HISTAMINE_PRESETS.find((item) => item.id === 'dao-blocked').controls)
    expect(blocked.state.plasma).toBeGreaterThan(2.5)
    expect(blocked.state.cns).toBeCloseTo(1, 6)
  })

  it('the diurnal toggle gives plasma exactly 2x higher at 04:00 than at 16:00, and nothing when off', () => {
    const on = runner({ ...HISTAMINE_DEFAULTS, diurnal: true })
    expect(on.at04 / on.at16).toBeCloseTo(2, 1)
    expect(toHistamineControls({ ...HISTAMINE_DEFAULTS, diurnal: true }).diurnalAmplitude).toBe(0.42)
    expect(reference.day.plasma.every((value) => Math.abs(value - 1) < 1e-3)).toBe(true)
    expect(reference.day.x[0]).toBe(0)
    expect(reference.day.x.at(-1)).toBe(24)
  })

  it('clearanceShares turns fluxes into shares', () => {
    const shares = clearanceShares({ hnmt_p: 6, other_p: 4, hnmt_b: 8, efflux_b: 2, dao_g: 3, absorb_g: 1 })
    expect(shares.systemic.share).toBe(0.6)
    expect(shares.cns.share).toBe(0.8)
    expect(shares.gut.total).toBe(4)
  })
}, 120000)

describe('methylation link for the histamine page', () => {
  it('turns chronic scenarios into SAM and SAH ratios applied to the histamine model\'s tissue values', () => {
    const niacin = methylationSamSah('niacin-2g')
    expect(niacin.relSam).toBeLessThan(1)
    expect(niacin.sam).toBeCloseTo(60 * niacin.relSam, 6)
    expect(niacin.sah).toBeGreaterThan(12)
    expect(niacin.ratio).toBeLessThan(niacin.ratio0)
    expect(niacin.status).toBe('partly')
    const betaine = methylationSamSah('betaine-6g-day')
    expect(betaine.sam).toBeGreaterThan(60)
    expect(methylationSamSah('glycine-10g-day').status).toBe('hypothesis')
  })

  it('every link names an existing scenario with a chronic setting', () => {
    for (const link of METHYLATION_LINKS) {
      const scenario = scenarioIndex[link.scenario]
      expect(scenario, link.id).toBeTruthy()
      expect(link.evidence, link.id).toBe(scenario.evidence.status)
      expect(Object.keys(chronicControls(scenario)).length, link.id).toBeGreaterThan(0)
    }
    expect(() => methylationSamSah('nope')).toThrow(/Unknown methylation scenario/)
  })
}, 120000)

describe('B6 runner (methylation model)', () => {
  const runner = createB6Runner()
  const result = runner({ plp: 41 })

  it('B6 restriction raises cystathionine strongly; fasting tHcy and glycine barely move in the data', () => {
    const at41 = result.sweep.find((row) => row.plp === 41)
    expect(at41.cysta).toBeGreaterThan(30)
    expect(at41.cysta).toBeLessThan(90)
    expect(result.now.cysta).toBeCloseTo(at41.cysta, 6)
    expect(result.sweep.find((row) => row.plp === 100).cysta).toBeCloseTo(0, 6)
    expect(result.sweep.map((row) => row.plp)).toEqual([...PLP_GRID])
  })

  it('validated and mismatched flags are the pinned validation statuses', () => {
    const byId = Object.fromEntries(result.rows.map((row) => [row.id, row]))
    expect(byId.cysta.verdict).toBe(validationIndex['D-b6-cysta'].expectedStatus === 'pass' ? 'matches' : 'disagrees')
    expect(byId.cysta.verdict).toBe('matches')
    expect(byId.tHcy.verdict).toBe('disagrees')
    expect(byId.gly.verdict).toBe('disagrees')
    expect(byId.postload.verdict).toBe('matches')
    expect(byId.postload.model).toBeGreaterThan(0)
    for (const row of result.rows) expect(row.why.length + row.expected.length, row.id).toBeGreaterThan(0)
  })

  it('PLP-dependent steps keep their activity at baseline and lose most at low PLP', () => {
    expect(plpActivity(1, 0.43)).toBeCloseTo(1, 10)
    expect(plpActivity(0.41, 0.43)).toBeCloseTo(0.698, 2)
    const high = runner({ plp: 100 })
    for (const step of high.steps) expect(step.activity).toBeCloseTo(1, 8)
    const low = runner({ plp: 15 })
    expect(low.steps.find((step) => step.id === 'cth').activity).toBeLessThan(low.steps.find((step) => step.id === 'shmt').activity)
    expect(low.steps.map((step) => step.id)).toEqual(['cbs', 'cth', 'shmt', 'gcs'])
  })
}, 120000)
