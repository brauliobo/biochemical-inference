// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { B6_PRESETS, GENERIC_K, b6PresetFor, b6Tiles, effectSeries, mapFlux as b6MapFlux, stepBars, validationRows } from '../../src/components/dash-gut/b6-view.js'
import { BILE_PRESETS, bileFlux, bilePresetFor, bileTiles, curveSeries, kineticRows, shareBars as bileShareBars } from '../../src/components/dash-gut/bile-view.js'
import { co2Bars, co2Summary } from '../../src/components/dash-gut/co2-bars.js'
import { EXPLANATIONS } from '../../src/components/dash-gut/gut-explanations.js'
import { GUT_DEFAULTS } from '../../src/components/dash-gut/gut-presets.js'
import { acidSeries, gutTiles, phSeries } from '../../src/components/dash-gut/gut-tiles.js'
import { dayEvents, daySeries, histamineTiles, shareBars, sweepView } from '../../src/components/dash-gut/histamine-view.js'
import { HISTAMINE_DEFAULTS } from '../../src/components/dash-gut/histamine-presets.js'
import { CLAIM, TMA_PRESETS, claimNumbers, coverageBars, mapFlux as tmaMapFlux, responseView, tmaPresetFor, tmaTiles } from '../../src/components/dash-gut/tma-view.js'
import * as knowledge from '../../src/knowledge/index.js'
import { b6Result, bileResult, gutResult, histamineResult } from '../helpers/dash-b-fixtures.js'

describe('gut tiles and series', () => {
  it('tiles state the time below pH 4, the capsule acid and the belched CO2 next to the swallowed air', () => {
    const tiles = gutTiles(gutResult(GUT_DEFAULTS), GUT_DEFAULTS)
    expect(tiles.map((tile) => tile.label)).toEqual(['Time with stomach pH below 4', 'Median pH', 'Acid secreted', 'Capsule acid', 'CO2 formed from acid + bicarbonate', 'CO2 belched'])
    expect(tiles[0]).toMatchObject({ value: '7.2', unit: 'h of 8', delta: 'same as the standard meal' })
    expect(tiles[3].value).toBe('none')
    expect(tiles[5]).toMatchObject({ value: '2.8', unit: 'mL', delta: '6% of the belched gas' })
    expect(tiles[5].note).toBe('Swallowed air: 163 mL (assumed).')
  })

  it('a PPI lowers the time below pH 4 and says by how much; a capsule shows its acid in hours of basal output; the hypothesis tile is warned', () => {
    const controls = { ...GUT_DEFAULTS, ppi: 60, betaineHclG: 0.65, glycineAcidBoostPct: 70 }
    const tiles = gutTiles(gutResult(controls), controls)
    expect(tiles[0].delta).toBe('-1.9 h vs the standard meal')
    expect(tiles[3]).toMatchObject({ value: '4.2', unit: 'mmol H+', delta: '0.8 h of basal output' })
    expect(tiles[2].tone).toBe('warning')
    expect(tiles[2].note).toBe('Includes the glycine what-if: a hypothesis.')
  })

  it('draws the scenario against the standard-meal baseline', () => {
    const run = gutResult({ ...GUT_DEFAULTS, ppi: 60 })
    expect(phSeries(run).map((s) => [s.id, Boolean(s.baseline)])).toEqual([['ph', false], ['ph-base', true]])
    expect(acidSeries(run)[0].values).toHaveLength(run.time.length)
  })

  it('the CO2 bars share item ids across bars so colours stay put, and the summary quotes the numbers', () => {
    const co2 = gutResult().co2
    const bars = co2Bars(co2)
    expect(bars.map((bar) => bar.id)).toEqual(['formed', 'pocket', 'belches'])
    expect(bars[0].items.find((item) => item.id === 'belched').value).toBe(2.8)
    expect(bars[2].items.find((item) => item.id === 'belched').label).toBe(bars[0].items.find((item) => item.id === 'belched').label)
    expect(bars[1].items.find((item) => item.id === 'air').value).toBe(163)
    expect(co2Summary(co2)).toBe('Over 8 hours the model forms 1457 mL of CO2 from acid and bicarbonate; 1385 mL is absorbed through the gut wall and 2.8 mL is belched (0.2% of what formed). Swallowed air adds 163 mL (an assumption); 6% of the belched gas is CO2.')
  })

  it('every explanation names evidence entries that exist, and its model chip reads the run', () => {
    const run = gutResult()
    for (const item of EXPLANATIONS) {
      for (const entry of item.evidence) expect(knowledge.getEntity(entry.id), entry.id).toBeTruthy()
      const chip = item.model(run, GUT_DEFAULTS)
      expect(chip.label.length).toBeGreaterThan(0)
      expect(['info', 'muted', 'success', 'warning']).toContain(chip.tone)
    }
    expect(EXPLANATIONS.find((item) => item.id === 'glycine-acid').model(run, { ...GUT_DEFAULTS, glycineAcidBoostPct: 70 }).label).toBe('What-if on: +70% acid (hypothesis)')
  })
})

describe('histamine view model', () => {
  it('tiles: reference is 1.00x; the rhythm tile appears only with the rhythm and is warned as weak', () => {
    const run = histamineResult(HISTAMINE_DEFAULTS)
    const tiles = histamineTiles(run, HISTAMINE_DEFAULTS)
    expect(tiles.map((tile) => tile.label)).toEqual(['Systemic histamine', 'Brain (CNS) histamine', 'HNMT capacity'])
    expect(tiles[0]).toMatchObject({ value: '1.00x', delta: 'same as the reference' })
    expect(tiles[2].delta).toBe('SAM:SAH 5.0 (reference 5.0)')
    const withRhythm = histamineTiles(histamineResult({ ...HISTAMINE_DEFAULTS, diurnal: true }), { ...HISTAMINE_DEFAULTS, diurnal: true })
    expect(withRhythm.at(-1)).toMatchObject({ label: 'Plasma at 04:00 against 16:00', value: '2.0x', tone: 'warning', delta: 'one study (Szefler 1991)' })
  })

  it('lower SAM shows a rise against the reference', () => {
    const controls = { ...HISTAMINE_DEFAULTS, samUM: 30 }
    const tiles = histamineTiles(histamineResult(controls), controls)
    expect(tiles[0].value).toBe('1.30x')
    expect(tiles[0].delta).toBe('+30% vs the reference')
  })

  it('day series, markers, sweep and share bars', () => {
    const run = histamineResult(HISTAMINE_DEFAULTS)
    expect(daySeries(run).map((s) => s.id)).toEqual(['plasma', 'cns', 'plasma-ref'])
    expect(dayEvents({ diurnal: true }).map((event) => event.x)).toEqual([4, 16])
    expect(dayEvents({ diurnal: false })).toEqual([])
    const sweep = sweepView(run, { ...HISTAMINE_DEFAULTS, samUM: 42 })
    expect(sweep.events).toEqual([{ x: 42, label: 'This scenario' }])
    expect(sweep.x).toEqual(run.sweep.map((point) => point.sam))
    const bars = shareBars(run)
    expect(bars.map((bar) => bar.id)).toEqual(['sys-ref', 'sys-now', 'cns-ref', 'cns-now'])
    for (const bar of bars) expect(bar.label.length).toBeLessThanOrEqual(16)
  })
})

describe('B6 view model', () => {
  const run = b6Result({ plp: 41 })
  it('presets are recognised by their PLP and the map keeps PLP-independent steps at 100% so the others can fall below', () => {
    expect(b6PresetFor({ plp: 41 })).toBe('restriction')
    expect(b6PresetFor({ plp: 55 })).toBe('')
    expect(B6_PRESETS.every((item) => item.note.length > 0)).toBe(true)
    const full = b6MapFlux(100)
    expect(full['reaction:gad-glutamate-decarboxylation']).toBeCloseTo(100, 8)
    expect(full['reaction:aldh5a1-succinate-semialdehyde-oxidation']).toBe(100)
    const low = b6MapFlux(41)
    expect(low['reaction:gad-glutamate-decarboxylation']).toBeCloseTo((0.41 / (GENERIC_K + 0.41) / (1 / (GENERIC_K + 1))) * 100, 8)
    expect(low['reaction:gad-glutamate-decarboxylation']).toBeLessThan(low['reaction:aldh5a1-succinate-semialdehyde-oxidation'])
  })

  it('tiles compare the dose with both upper limits', () => {
    const tiles = b6Tiles(run, 24, { efsa: 12, iom: 100 })
    expect(tiles.at(-2)).toMatchObject({ value: '2.0', unit: 'x the UL', delta: '2.0 times the UL', tone: 'warning' })
    expect(tiles.at(-1)).toMatchObject({ value: '0.2', delta: '24% of the UL', tone: '' })
    expect(b6Tiles(run, 5, { efsa: null, iom: 100 }).at(-2).value).toBe('n/a')
  })

  it('effect series, validation rows with a verdict word and a link, and the step bars', () => {
    const effect = effectSeries(run)
    expect(effect.series.map((s) => s.id)).toEqual(['cysta', 'thcy', 'gly', 'ratio'])
    expect(effect.series[0].values).toHaveLength(effect.x.length)
    const rows = validationRows(run)
    expect(rows.map((row) => row.verdict.word)).toEqual(['Model matches', 'Model disagrees', 'Model disagrees'])
    expect(rows[0].href).toBe('/evidence/article/gregory-2013-b6-restriction-metabolomics')
    expect(rows[0].model).toBe('+68%')
    expect(stepBars(run).map((bar) => bar.percent)).toEqual([70, 60])
  })
})

describe('bile view model', () => {
  it('presets and tiles: observed bile is 75%, glycine used by conjugation is small beside a 10 g dose', () => {
    expect(bilePresetFor({ glycineG: 0, taurineX: 1 })).toBe('none')
    expect(bilePresetFor({ glycineG: 3, taurineX: 1 })).toBe('')
    expect(BILE_PRESETS.find((item) => item.id === 'glycine-10').status).toBe('hypothesis')
    const controls = { glycineG: 10, taurineX: 1 }
    const tiles = bileTiles(bileResult(controls), controls)
    expect(tiles[0].label).toBe('Glycine-conjugated bile acids')
    expect(tiles[0].tone).toBe('warning')
    expect(tiles[3]).toMatchObject({ label: 'Glycine used for bile conjugation', value: '0.45', delta: '4.5% of a 10 g dose' })
    const none = bileTiles(bileResult({ glycineG: 0, taurineX: 1 }), { glycineG: 0, taurineX: 1 })
    expect(none[0]).toMatchObject({ value: '75%', delta: 'same as observed bile (75%)', tone: '' })
  })

  it('bars carry the observed range, curves one series per taurine setting, flux the BAAT rates, rows the kinetics', () => {
    const run = bileResult({ glycineG: 10, taurineX: 1 })
    const [observed, whatif] = bileShareBars(run)
    expect(observed.items[0]).toMatchObject({ value: 75, low: 70, high: 80 })
    expect(whatif.items[0].low).toBeUndefined()
    const curves = curveSeries(run, { glycineG: 10, taurineX: 1 })
    expect(curves.series).toHaveLength(3)
    expect(curves.events).toEqual([{ x: 10, label: '10 g' }])
    expect(Object.keys(bileFlux(run))).toContain('reaction:baat-glycine-conjugation')
    expect(kineticRows().map((row) => row.coefficient)).toEqual(['0.44', '0.19'])
  })
})

describe('TMA view model', () => {
  it('presets: 28 and 35 g are hypotheses, the rest recorded', () => {
    expect(TMA_PRESETS.map((item) => [item.mg, item.status])).toEqual([[330, 'recorded'], [1000, 'recorded'], [3500, 'recorded'], [28000, 'hypothesis'], [35000, 'hypothesis']])
    expect(tmaPresetFor(35000)).toBe('claim-high')
    expect(tmaPresetFor(1234)).toBe('')
    expect(CLAIM).toEqual({ lowG: 28, highG: 35 })
  })

  it('tiles at the UL, at the claim, and the coverage of the glycine deficit', () => {
    const ul = tmaTiles(3500, 0.45)
    expect(ul[0]).toMatchObject({ value: '3.50', delta: '100% of the IOM UL', tone: '' })
    expect(ul[1].value).toBe('21')
    expect(ul[3].value).toBe('10%')
    const claim = tmaTiles(35000, 0.45)
    expect(claim[0]).toMatchObject({ value: '35.0', tone: 'warning' })
    expect(claim[0].delta).toContain('10.0 times the IOM UL')
    expect(claim[2].value).toBe('11.4') // 35 g choline at 45% = 11.4 g glycine
  })

  it('the claim in numbers: 13.88 g at the ceiling, 30.8 g at 45%, four partitions', () => {
    const numbers = claimNumbers(0.45)
    expect(numbers.ceilingG).toBeCloseTo(13.876, 2)
    expect(numbers.needG).toBeCloseTo(30.84, 1)
    expect(numbers.ulMultiple).toBeCloseTo(8.81, 1)
    expect(numbers.alternatives.map((item) => item.status)).toEqual(['computed', 'estimate', 'estimate', 'hypothesis'])
  })

  it('response chart: two series with ribbons over 0 to 40 g with the UL and the claim marked; coverage bar: covered vs uncovered; map flux follows the dose', () => {
    const view = responseView()
    expect(view.x[0]).toBe(0)
    expect(view.x.at(-1)).toBe(40)
    expect(view.series).toHaveLength(2)
    expect(view.series[0].upper.at(-1)).toBeGreaterThan(view.series[0].values.at(-1))
    expect(view.events.map((event) => event.x)).toEqual([3.5, 28, 35])
    const [bar] = coverageBars(0.45)
    expect(bar.items.map((item) => item.id)).toEqual(['covered', 'uncovered'])
    expect(bar.items[0].value + bar.items[1].value).toBeCloseTo(10.08, 1)
    expect(tmaMapFlux(0)['reaction:choline-tma-lyase']).toBe(0)
    expect(tmaMapFlux(3500)['reaction:fmo3-tma-n-oxidation']).toBeCloseTo(21.17, 1)
  })
})
