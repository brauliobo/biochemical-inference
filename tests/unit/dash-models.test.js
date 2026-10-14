// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { runCholineDash } from '../../src/components/dash/choline-dash-run.js'
import { requirement, tmaItems, fateBars, LIMITS_AXIS_MAX } from '../../src/components/dash/choline-model.js'
import { budgetBars, contentItems, deficitItems, doseScenario, mapFlux, synthesisItems } from '../../src/components/dash/glycine-model.js'
import { runGlycineDash } from '../../src/components/dash/glycine-dash-run.js'
import { concentrationByNode, fluxByNode, layoutToMap, ratioByNode } from '../../src/components/dash/map-binding.js'
import { runMethylationDash } from '../../src/components/dash/methylation-dash-run.js'
import { DEFAULT_PRESET, PRESET_LIST, controlSpecs, controlsForPreset, matchesPreset, presetScenarios, scenarioFor, variantsForPreset } from '../../src/components/dash/methylation-state.js'
import { STATE_DEFINITIONS, classifyState, consumerBars, extreme, percentText, relativeRange, resultTiles, scenarioChart, timeChart, topChanges } from '../../src/components/dash/methylation-view.js'
import { rangeListModel } from '../../src/components/dash/range-list.js'
import { AXIS, barModel, flattenRows, verdictTone } from '../../src/components/dash/robust-model.js'
import { planeModel } from '../../src/components/dash/state-plane.js'
import { barThumb, lineThumb, mapThumb } from '../../src/components/dash/thumb-model.js'
import { ontologyBindings } from '../../src/sim/models/index.js'
import { fakeMethylationResult } from '../helpers/dash-fixtures.js'
import robustness from '../../src/sim/data/robustness.json'


describe('methylation dashboard state', () => {
  it('lists the 13 presets, each a real scenario, with evidence status', () => {
    const presets = presetScenarios()
    expect(presets).toHaveLength(PRESET_LIST.length)
    expect(presets.every((p) => p.id && p.evidence.status && p.short)).toBe(true)
    expect(presets.find((p) => p.id === 'glycine-10g').evidence.status).toBe('hypothesis')
  })

  it('has the 12 model controls with ranges, and presets map onto sliders and back', () => {
    const specs = controlSpecs()
    expect(specs).toHaveLength(12)
    for (const spec of specs) { expect(spec.min).toBeLessThan(spec.max); expect(spec.step).toBeGreaterThan(0); expect(spec.unit).toBeTruthy() }
    expect(controlsForPreset('niacin-2g').niacinDose).toBe(2)
    expect(controlsForPreset('mthfr-677tt').mthfrActivity).toBe(0.4)
    expect(controlsForPreset('glycine-niacin-low-folate')).toMatchObject({ folateSupply: 0.5, glycineLoad: 10, niacinDose: 2 })
    expect(controlsForPreset('glycine-10g').glycineLoad).toBe(0) // an acute dose is an event, not a slider
    for (const id of PRESET_LIST.map(([p]) => p)) expect(matchesPreset(id, controlsForPreset(id))).toBe(true)
    expect(matchesPreset('niacin-2g', { ...controlsForPreset('niacin-2g'), niacinDose: 1 })).toBe(false)
    expect(variantsForPreset(DEFAULT_PRESET)).toEqual({ gnmtGlycineKm: 'reed130', bhmtBetaineKm: 'human2200', samConsumerBudget: 'reed2015' })
  })

  it('builds a scenario whose intervention stage carries only the sliders that differ', () => {
    const base = scenarioFor('glycine-10g', controlsForPreset('glycine-10g'))
    expect(base.stages).toHaveLength(2)
    expect(base.stages[1].controls).toEqual({})
    expect(base.stages[1].events[0].dose.glycine).toBe(10) // the dose of the preset is kept
    const moved = scenarioFor('niacin-2g', { ...controlsForPreset('niacin-2g'), glycineLoad: 5 })
    expect(moved.stages[1].controls).toEqual({ niacinDose: 2, glycineLoad: 5 })
    const low = scenarioFor('mthfr-677tt-low-folate'.replace('mthfr-677tt-low-folate', 'glycine-niacin-low-folate'), controlsForPreset('glycine-niacin-low-folate'))
    expect(low.background).toEqual({ folateSupply: 0.5 })
    expect(low.stages[1].controls).toEqual({ glycineLoad: 10, niacinDose: 2 })
    const plain = scenarioFor('baseline-fed', { ...controlsForPreset('baseline-fed'), pemtActivity: 2 })
    expect(plain.stages.map((s) => s.hours)).toEqual([8, 64])
    expect(plain.stages[1].controls).toEqual({ pemtActivity: 2 })
  })
})

describe('methylation runner (real model)', () => {
  it('returns the plain shape the page draws, fast, with a dip for glycine and a clear fall for niacin', () => {
    const t0 = performance.now()
    const glycine = runMethylationDash({ presetId: 'glycine-10g', controls: controlsForPreset('glycine-10g'), variants: variantsForPreset('glycine-10g') })
    runMethylationDash({ presetId: 'glycine-10g', controls: controlsForPreset('glycine-10g'), variants: variantsForPreset('glycine-10g') })
    expect((performance.now() - t0) / 2).toBeLessThan(1500)
    expect(glycine.ok).toBe(true)
    expect(glycine.time).toHaveLength(glycine.series.samSahRatio.length)
    expect(glycine.events).toEqual([{ x: 8, label: '10 g glycine' }])
    expect(glycine.reference.samSahRatio).toBeCloseTo(6.16, 1)
    expect(Math.min(...glycine.series.samSahRatio)).toBeLessThan(glycine.reference.samSahRatio)
    expect(Math.max(...glycine.series.gly_p)).toBeGreaterThan(5 * glycine.reference.gly_p)
    expect(Object.keys(glycine.map.flux)).toContain('reaction:gnmt-glycine-methylation')
    expect(glycine.map.baseFlux['reaction:gnmt-glycine-methylation']).toBeCloseTo(43.97, 1)
    const sum = Object.values(glycine.shares.baseline).reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1, 6)
    const niacin = runMethylationDash({ presetId: 'niacin-2g', controls: controlsForPreset('niacin-2g'), variants: variantsForPreset('niacin-2g') })
    expect(niacin.series.samSahRatio.at(-1) / niacin.reference.samSahRatio).toBeLessThan(0.7)
    expect(niacin.shares.scenario.nnmt).toBeGreaterThan(0.3)
  })

  it('shows the contested GNMT Km: a 10 g dose moves SAM:SAH more with 2 mM than with 130 uM', () => {
    const dip = (km) => { const r = runMethylationDash({ presetId: 'glycine-10g', controls: controlsForPreset('glycine-10g'), variants: { ...variantsForPreset('glycine-10g'), gnmtGlycineKm: km } }); return Math.min(...r.series.samSahRatio) / r.reference.samSahRatio - 1 }
    expect(dip('luka2000')).toBeLessThan(dip('reed130') - 0.02)
  })

  it('runs the glycine and choline runners with their extra series', () => {
    const g = runGlycineDash({ doseG: 5, variants: { gnmtGlycineKm: 'reed130' } })
    expect(g.ok).toBe(true)
    expect(g.pk.peak.value).toBeGreaterThan(800)
    expect(g.pk.peak.time).toBeLessThan(1)
    expect(g.pk.baseline).toBeCloseTo(217, 0)
    expect(g.events[0].label).toBe('5 g glycine')
    expect(doseScenario(0).stages[1].events).toEqual([])
    expect(runGlycineDash({ doseG: 0, variants: {} }).pk.peak.value).toBeCloseTo(217, 0)
    const c = runCholineDash({ cholineMg: 2000, betaineG: 3, variants: { bhmtBetaineKm: 'human2200' } })
    expect(c.ok).toBe(true)
    expect(c.thcyByKm.human2200.at(-1)).toBeLessThan(c.thcyByKm.reed100.at(-1))
    expect(c.pk.betaine.length).toBe(c.pk.time.length)
    expect(Math.max(...c.pk.betaine)).toBeGreaterThan(300)
  })
})

describe('methylation view models', () => {
  const result = fakeMethylationResult()
  it('classifies states by the documented definitions', () => {
    expect(STATE_DEFINITIONS.lowRatio).toBe(0.75)
    expect(classifyState(6.16, 6.16, 7).arm).toBe('reference')
    expect(classifyState(4, 6.16, 7).label).toBe('under-methylation-like')
    expect(classifyState(9, 6.16, 7).label).toBe('over-methylation-like')
    expect(classifyState(6, 6.16, 13).hcy).toMatch(/above the upper reference/)
    expect(classifyState(6, 6.16, 16).hcy).toMatch(/moderate/)
  })

  it('formats changes and finds the sample furthest from the reference', () => {
    expect(percentText(-0.0524)).toBe('−5.2%')
    expect(percentText(0.2)).toBe('+20%')
    expect(percentText(0.0001)).toBe('0%')
    expect(extreme([1, 1, 0.8, 0.95], 1)).toMatchObject({ index: 2, value: 0.8 })
    expect(extreme([1, 1.001, 1], 1).index).toBe(2) // nothing moves: the last sample
    expect(relativeRange([1, 0.9, 1.1], 1)).toBe('−10% to +10%')
  })

  it('builds six tiles with a printed change, a tone and the hour', () => {
    const tiles = resultTiles(fakeMethylationResult({ ratioDepth: 0.25 }))
    expect(tiles.map((t) => t.id)).toEqual(['samSahRatio', 'sam', 'tHcy', 'mthf', 'gly_p', 'bet_p'])
    const ratio = tiles[0]
    expect(ratio.delta).toMatch(/^−\d/)
    expect(ratio.tone).toBe('bad')
    expect(ratio.note).toMatch(/hour/)
    expect(tiles.find((t) => t.id === 'mthf').note).toBe('unchanged')
  })

  it('builds the consumer bars with the contested range on the reference only', () => {
    const [reference, scenario] = consumerBars(result)
    expect(reference.items).toHaveLength(6)
    expect(reference.items[0]).toMatchObject({ id: 'gnmt', value: 43.7, low: 17.8, high: 43.7 })
    expect(scenario.items[0].low).toBeUndefined()
    expect(scenario.label).toMatch(/^At hour/)
  })

  it('builds chart models: a reference line, the scenario, events, and ribbons anchored at the starting value', () => {
    const chart = timeChart(result, 'samSahRatio')
    expect(chart.series.map((s) => s.id)).toEqual(['reference', 'scenario'])
    expect(chart.series[0].baseline).toBe(true)
    expect(chart.series[0].values.every((v) => v === 6.16)).toBe(true)
    expect(chart.events).toEqual([{ x: 8, label: '10 g glycine' }])
    expect(chart.yMin).toBeLessThan(Math.min(...chart.series[1].values))
    const ones = result.time.map(() => 1)
    const withBands = timeChart(result, 'samSahRatio', { bands: { samSahRatio: { p5: ones.map((v) => v * 0.9), p50: ones, p95: ones.map((v) => v * 1.1) } } })
    expect(withBands.series[1].lower[0]).toBeCloseTo(6.16 * 0.9, 6)
    expect(withBands.series[1].upper[3]).toBeCloseTo(6.16 * 1.1, 6)
    const all = timeChart(result, 'all')
    expect(all.series).toHaveLength(6)
    expect(all.refLines[0].value).toBe(100)
    expect(scenarioChart({ time: [0, 1], values: [5, 5], reference: 5, unit: 'x', title: 't' }).yMax).toBeGreaterThan(5) // never collapses
  })

  it('ranks the largest map changes against the reference', () => {
    const nodes = [{ id: 'reaction:gnmt-glycine-methylation', label: 'GNMT' }, { id: 'compound:sam', label: 'SAM' }, { id: 'compound:glycine', label: 'Glycine' }, { id: 'reaction:pemt-pe-to-pc', label: 'PEMT' }]
    const top = topChanges(result.map, nodes)
    expect(top[0].label).toBe('Glycine')
    expect(top.map((t) => t.kind)).toContain('reaction')
    expect(top.every((t) => Math.abs(t.relative) >= 0.005)).toBe(true)
  })
})

describe('state plane geometry', () => {
  const r = fakeMethylationResult({ ratioDepth: 0.4 })
  const plane = planeModel({ time: r.time, ratio: r.series.samSahRatio, thcy: r.series.tHcy, referenceRatio: 6.16, referenceThcy: 7, focusIndex: r.focus.index, width: 560 })
  it('draws three stacked bands that tile the plot, with the limits at 12 and 15', () => {
    expect(plane.regions.map((x) => x.id)).toEqual(['over', 'reference', 'under'])
    const top = plane.regions[0]
    const bottom = plane.regions[2]
    expect(top.y).toBeCloseTo(plane.plot.top, 5)
    expect(bottom.y + bottom.height).toBeCloseTo(plane.plot.bottom, 5)
    expect(plane.regions[0].y + plane.regions[0].height).toBeCloseTo(plane.regions[1].y, 5)
    expect(plane.strips.map((s) => s.id)).toEqual(['upper', 'moderate'])
    expect(plane.path.startsWith('M')).toBe(true)
    expect(plane.focus.state.label).toBe('under-methylation-like')
    expect(plane.rows.length).toBeLessThanOrEqual(24)
    expect(plane.summary).toMatch(/Largest departure/)
  })
})

describe('robustness strip model', () => {
  const items = flattenRows(robustness.rows)
  it('turns every precomputed metric into a bar inside the axis and a sentence', () => {
    expect(items.length).toBeGreaterThan(25)
    for (const item of items) {
      const bar = barModel(item)
      for (const key of ['p5', 'p25', 'p50', 'p75', 'p95']) { expect(bar[key]).toBeGreaterThanOrEqual(0); expect(bar[key]).toBeLessThanOrEqual(100) }
      expect(bar.p5).toBeLessThanOrEqual(bar.p95)
      expect(bar.text).toContain('Verdict')
    }
    expect(AXIS.low).toBeLessThan(0)
  })
  it('names the verdict by how sure it is, and clips wide spreads', () => {
    const niacin = items.find((i) => i.key === 'niacin2:final')
    expect(barModel(niacin).clipLow).toBe(true)
    expect(verdictTone({ key: 'robust-down' })).toBe('success')
    expect(verdictTone({ key: 'mixed' })).toBe('warning')
    expect(barModel(items.find((i) => i.key === 'g10-all:trough')).fraction).toMatch(/51% of 100 parameter sets fall by more than 5%/)
  })
})

describe('glycine and choline view data', () => {
  it('keeps the contested glycine budget as ranges and the 10 g/day claim against the estimates', () => {
    const [sources, sinks] = budgetBars()
    expect(sources.items.map((i) => i.id).every((id) => id.startsWith('in-'))).toBe(true)
    expect(new Set([...sources.items, ...sinks.items].map((i) => i.id)).size).toBe(sources.items.length + sinks.items.length)
    expect(sinks.items.find((i) => /Collagen/.test(i.label))).toMatchObject({ value: 12, low: 4, high: 12 })
    const [claim, balance, low] = deficitItems()
    expect(claim.value).toBe(10)
    expect(balance.value).toBeCloseTo(10.07, 1)
    expect(balance.low).toBeLessThan(0)
    expect(low.value).toBeCloseTo(2.08, 2)
    const synth = synthesisItems()
    expect(synth).toHaveLength(5)
    expect(Math.max(...synth.map((s) => s.value)) / Math.min(...synth.map((s) => s.value))).toBeGreaterThan(14)
  })
  it('puts budget numbers on the map nodes in net and gross mode', () => {
    const net = mapFlux('net')
    expect(net['reaction:collagen-chain-assembly']).toBe(12)
    expect(net['reaction:shmt-serine-glycine-interconversion']).toBeCloseTo(2.54, 2)
    const gross = mapFlux('gross')
    expect(gross['reaction:glycine-cleavage-system']).toBe(24)
    expect(gross['reaction:shmt-serine-glycine-interconversion']).toBeCloseTo(24.3, 1)
  })
  it('compares glycine in products using the calculators', () => {
    const rows = Object.fromEntries(contentItems(10, 400).map((i) => [i.id, i]))
    expect(rows.collagen).toMatchObject({ value: 2.25, low: 2, high: 2.5 })
    expect(rows.mg.value).toBeCloseTo(2.47, 2)
    expect(rows.uc2.value).toBeCloseTo(0.009, 3)
  })
  it('computes the choline needed for glycine: 13.9 g at the ceiling, 3.96 times the limit', () => {
    const ceiling = requirement({ glycineG: 10, conversion: 1 })
    expect(ceiling.need.value).toBeCloseTo(13.876, 2)
    expect(ceiling.ulMultiple).toBeCloseTo(3.96, 2)
    expect(ceiling.overUl).toBe(true)
    const quoted = requirement({ glycineG: 10, conversion: 0.447 })
    expect(quoted.need.value).toBeCloseTo(31.04, 1)
    expect(quoted.coverage.value).toBeCloseTo(0.1, 1)
    expect(quoted.salts.find((s) => s.id === 'choline-bitartrate').grams).toBeCloseTo(quoted.need.value / 0.411, 1)
    expect(quoted.rows.find((r) => r.id === 'efsa').noUlNote).toBeTruthy()
    expect(quoted.rows[0].typical.to).toBeLessThanOrEqual(LIMITS_AXIS_MAX)
    expect(requirement({ glycineG: 2, conversion: 1 }).overUl).toBe(false)
    expect(quoted.partitions.map((p) => p.status)).toEqual(['computed', 'estimate', 'estimate', 'hypothesis'])
  })
  it('estimates TMA from choline as an assumed fraction', () => {
    const [habitual, bolus, pc] = tmaItems(0)
    expect(habitual.value).toBeCloseTo(0.16, 2)
    expect(habitual.high).toBeGreaterThan(habitual.low)
    expect(tmaItems(2000)[1].value).toBeGreaterThan(habitual.value * 10)
    expect(bolus.low).toBe(bolus.high)
    expect(pc.value).toBe(0)
    expect(fateBars()[1].items.some((i) => /trimethylamine/i.test(i.label))).toBe(true)
  })
})

describe('map binding, range list and thumbnails', () => {
  it('nets reversible pairs and picks the liver pool', () => {
    expect(fluxByNode({ mat1: 70, mat3: 30, ahcy_f: 320, ahcy_r: 220 }, { 'reaction:mat': ['mat1', 'mat3'], 'reaction:ahcy': ['ahcy_f', 'ahcy_r'], 'reaction:none': ['x'] })).toEqual({ 'reaction:mat': 100, 'reaction:ahcy': 100 })
    expect(concentrationByNode({ gly: 1500, gly_p: 217, gly_gut: 0 }, { 'compound:glycine': ['gly_gut', 'gly', 'gly_p'] })).toEqual({ 'compound:glycine': 1500 })
    expect(ratioByNode({ a: 2, b: 1 }, { a: 1, b: 0 })).toEqual({ a: 2 })
    const bindings = ontologyBindings.byReactionOntology
    expect(Object.keys(bindings)).toContain('reaction:gnmt-glycine-methylation')
  })
  it('turns a layout into a map with edges tied to reactions and a viewBox', () => {
    const map = layoutToMap({ viewBox: { width: 100, height: 50 }, groups: [{ id: 'g', label: 'Group' }], nodes: [{ id: 'compound:a', kind: 'compound', x: 1, y: 2, label: 'A', group: 'g' }, { id: 'reaction:r', kind: 'reaction', x: 3, y: 4, label: 'R' }], edges: [{ from: 'compound:a', to: 'reaction:r', n: 2 }, { from: 'compound:a', to: 'compound:missing' }], reactions: { 'reaction:r': { reversible: true } } })
    expect(map.viewBox).toEqual([0, 0, 100, 50])
    expect(map.nodes[0].group).toBe('Group')
    expect(map.nodes[1].reversible).toBe(true)
    expect(map.edges).toEqual([{ from: 'compound:a', to: 'reaction:r', reaction: 'reaction:r', stoich: 2 }])
  })
  it('places range-list rows on one axis that includes zero', () => {
    const model = rangeListModel({ items: [{ label: 'a', value: 10, low: -20, high: 30 }, { label: 'b', value: 5 }], unit: 'g' })
    expect(model.zero).toBeGreaterThan(0)
    expect(model.rows[0].from).toBeLessThan(model.rows[0].at)
    expect(model.rows[0].at).toBeLessThan(model.rows[0].to)
    expect(model.rows[1].range).toBe(false)
    expect(model.summary).toContain('a: 10 g (range -20 to 30)')
    expect(rangeListModel({ items: [{ label: 'c', value: 3 }] }).zero).toBeNull()
  })
  it('scales sparklines and mini-maps into the box', () => {
    const lines = lineThumb([{ label: 'a', values: [1, 2, 3] }, { label: 'b', values: [3, 2, 1], baseline: true }])
    expect(lines).toHaveLength(2)
    expect(lines[0].d.startsWith('M5 ')).toBe(true)
    expect(lines[1].baseline).toBe(true)
    const map = mapThumb({ box: [100, 100], nodes: [[0, 0, 0], [100, 100, 1]], edges: [[0, 0, 100, 100]] })
    expect(map.dots).toHaveLength(2)
    expect(map.dots.every((d) => d.x >= 0 && d.x <= 160 && d.y >= 0 && d.y <= 56)).toBe(true)
    const bars = barThumb([{ value: 1 }, { value: 4 }])
    expect(bars[1].height).toBeGreaterThan(bars[0].height)
  })
})
