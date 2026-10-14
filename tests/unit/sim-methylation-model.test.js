// @vitest-environment node
import { gzipSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { build } from 'vite'
import { compileModel, conservedSums, steadyState, validateModel } from '../../src/sim/index.js'
import knowledge from '../../src/knowledge/data/index.js'
import { PLAN, REF, buildMethylationModel, getModel, methylationModel, variantOptions, variants } from '../../src/sim/models/methylation.js'
import * as entry from '../../src/sim/models/index.js'
import { runScenario } from '../../src/sim/models/methylation-run.js'
import { scenarioIndex } from '../../src/sim/scenarios.js'
import { FOLATE_CLOSED, FOLATE_SPECIES, METHYL_WEIGHTS, ss } from '../../src/sim/models/methylation-validate.js'

const known = new Set(knowledge.map((e) => e.id))
const compiled = compileModel(methylationModel)
const residual = (model) => {
  const c = compileModel(model)
  const d = c.bind().derivative(0, Float64Array.from(c.y0))
  return Math.max(...c.names.map((n, i) => (c.fixed[i] ? 0 : Math.abs(d[i]) / (Math.abs(c.y0[i]) + 1e-6))))
}

describe('methylation model: structure', () => {
  it('passes the engine validator with no errors or warnings', () => {
    const v = validateModel(methylationModel)
    expect(v.errors).toEqual([])
    expect(v.warnings).toEqual([])
    expect(methylationModel.label).toMatch(/Illustrative educational model/)
    expect(methylationModel.time.unit).toBe('h')
  })

  it('contains the required species, reactions, controls and observables', () => {
    const species = methylationModel.species.map((s) => s.id)
    for (const id of ['met', 'sam', 'sah', 'hcy', 'cysta', 'cys', 'thf', 'ch2thf', 'mthf', 'f10', 'dhf', 'cho', 'bet', 'dmg', 'sar', 'gly', 'ser', 'pe', 'pc']) expect(species).toContain(id)
    const reactions = methylationModel.reactions.map((r) => r.id)
    for (const id of ['mat1', 'mat3', 'gnmt', 'pemt', 'gamt', 'dnmt', 'mt_other', 'nnmt', 'ahcy_f', 'ahcy_r', 'bhmt', 'mtr', 'mthfr', 'shmt_f', 'shmt_r', 'gcs', 'cbs', 'cth', 'chdh', 'dmgdh', 'sardh', 'met_in', 'cho_in', 'bet_p_in', 'gly_p_in']) expect(reactions).toContain(id)
    const controls = Object.fromEntries(methylationModel.controls.map((c) => [c.id, c]))
    for (const id of ['glycineLoad', 'cholineIntake', 'betaineIntake', 'folateSupply', 'b12Activity', 'b6Status', 'mthfrActivity', 'niacinDose', 'gnmtActivity', 'bhmtActivity', 'methionineIntake', 'pemtActivity']) {
      expect(controls[id], id).toBeTruthy()
      expect(controls[id].min).toBeLessThanOrEqual(controls[id].default)
      expect(controls[id].max).toBeGreaterThanOrEqual(controls[id].default)
      expect(controls[id].unit).toBeTruthy()
    }
    for (const id of ['samSahRatio', 'sam', 'sah', 'tHcy', 'gnmtShare', 'pemtShare', 'gamtShare', 'dnmtShare', 'nnmtShare', 'transsulfurationFraction', 'remethylationFraction', 'methylationIndex', 'samUseTotal']) {
      expect(compiled.observableIds.concat(compiled.names)).toContain(id)
    }
    expect(methylationModel.species.length).toBeGreaterThanOrEqual(25)
    expect(methylationModel.reactions.length).toBeGreaterThanOrEqual(60)
  })

  it('binds species and reactions to existing ontology entities', () => {
    for (const s of methylationModel.species) if (s.ontologyId) expect(known.has(s.ontologyId), `${s.id}: ${s.ontologyId}`).toBe(true)
    for (const r of methylationModel.reactions) {
      if (r.ontologyId) expect(known.has(r.ontologyId), `${r.id}: ${r.ontologyId}`).toBe(true)
      if (r.enzymeId) expect(known.has(r.enzymeId), `${r.id}: ${r.enzymeId}`).toBe(true)
    }
    expect(entry.ontologyBindings.species.sam).toBe('compound:sam')
    expect(entry.ontologyBindings.reactions.gnmt).toEqual({ ontologyId: 'reaction:gnmt-glycine-methylation', enzymeId: 'enzyme:gnmt' })
    expect(entry.ontologyBindings.byReactionOntology['reaction:mat-sam-synthesis']).toEqual(['mat1', 'mat3'])
    expect(entry.ontologyBindings.bySpeciesOntology['compound:glycine']).toContain('gly')
  })

  it('every constant carries a unit, a range around its value and a confidence', () => {
    for (const p of methylationModel.parameters) {
      expect(p.low, p.id).toBeLessThanOrEqual(p.value * (1 + 1e-12))
      expect(p.high, p.id).toBeGreaterThanOrEqual(p.value * (1 - 1e-12))
      expect(['high', 'medium', 'low', 'assumed']).toContain(p.confidence)
      expect(p.unit).toBeDefined()
    }
  })
})

describe('methylation model: calibrated reference steady state', () => {
  it('is an exact steady state of the dynamics (all derivatives vanish)', () => {
    expect(residual(methylationModel)).toBeLessThan(1e-10)
    const s = steadyState(compiled)
    expect(s.converged).toBe(true)
    expect(s.state.sam).toBeCloseTo(23.97, 6)
    expect(s.state.sah).toBeCloseTo(3.89, 6)
    expect(s.state.hcy).toBeCloseTo(2.27, 6)
  })

  it('reproduces the Reed 2015 fluxes and maximal rates it was calibrated against', () => {
    const f = ss({}).fluxes
    expect(f.mat1 + f.mat3).toBeCloseTo(100.6, 0)
    expect(f.gnmt).toBeCloseTo(43.97, 5)
    expect(f.pemt * 3).toBeCloseTo(27.53, 5)
    expect(f.gamt).toBeCloseTo(25.42, 5)
    expect(f.dnmt).toBeCloseTo(2.05, 5)
    expect(f.cbs).toBeCloseTo(50, 5)
    // fitted Vmax values come out near the published Reed constants (MAT-I 260, MAT-III 220, AHCY 320 / 1310)
    const v = (id) => methylationModel.parameters.find((p) => p.id === id).value
    expect(v('vmax_mat1')).toBeGreaterThan(250); expect(v('vmax_mat1')).toBeLessThan(275)
    expect(v('vmax_mat3')).toBeGreaterThan(210); expect(v('vmax_mat3')).toBeLessThan(232)
    expect(v('vmax_ahcy_f')).toBeGreaterThan(300); expect(v('vmax_ahcy_f')).toBeLessThan(340)
    expect(v('vmax_ahcy_r')).toBeGreaterThan(1250); expect(v('vmax_ahcy_r')).toBeLessThan(1370)
    expect(methylationModel.reference.calibration.vmax_gnmt.reaction).toBe('gnmt')
  })

  it('has neutral default controls (default control values leave the steady state untouched)', () => {
    const sys = compiled.bind(compiled.defaultControls())
    const d = sys.derivative(0, Float64Array.from(sys.y0))
    compiled.names.forEach((n, i) => { if (!compiled.fixed[i]) expect(Math.abs(d[i]) / (Math.abs(sys.y0[i]) + 1e-6), n).toBeLessThan(1e-10) })
  })

  it('keeps the flux plan feasible and the reference exact over sampled partitions (calibration is reusable)', () => {
    const plans = [{ gnmt: 15, gamt: 70, pemtSam: 13 }, { cbs: 75, bhmt: 31, gnmt: 15, gamt: 13 }, { gcs: 400, shmtExchange: 1000, pur: 40 }, { hcyExp: 5 }]
    for (const plan of plans) {
      const m = buildMethylationModel({ plan })
      expect(residual(m), JSON.stringify(plan)).toBeLessThan(1e-8)
      for (const p of m.parameters) expect(Number.isFinite(p.value) && p.value >= 0, `${p.id} ${p.value}`).toBe(true)
    }
    for (const id of Object.keys(PLAN)) expect(PLAN[id][1]).toBeLessThanOrEqual(PLAN[id][0]), expect(PLAN[id][2]).toBeGreaterThanOrEqual(PLAN[id][0])
    expect(REF.sam).toBe(23.97)
  })
})

describe('methylation model: variants', () => {
  it('exposes the two contested structural alternatives plus the consumer budget', () => {
    expect(Object.keys(variants)).toEqual(['gnmtGlycineKm', 'bhmtBetaineKm', 'samConsumerBudget'])
    expect(variants.gnmtGlycineKm.options.reed130.params.km_gnmt_gly).toBe(130)
    expect(variants.gnmtGlycineKm.options.luka2000.params.km_gnmt_gly).toBe(2000)
    expect(variants.bhmtBetaineKm.options.reed100.params.km_bhmt_bet).toBe(100)
    expect(variants.bhmtBetaineKm.options.human2200.params.km_bhmt_bet).toBe(2200)
    expect(variantOptions({ gnmtGlycineKm: 'luka2000' }).params.km_gnmt_gly).toBe(2000)
    expect(() => variantOptions({ gnmtGlycineKm: 'nope' })).toThrow(/unknown option/)
  })

  it('rescales the maximal rates so every variant keeps the same reference state and fluxes', () => {
    const base = getModel()
    for (const sel of [{ gnmtGlycineKm: 'luka2000' }, { bhmtBetaineKm: 'reed100' }, { samConsumerBudget: 'b2budget' }]) {
      const m = getModel(sel)
      expect(m).not.toBe(base)
      expect(residual(m)).toBeLessThan(1e-9)
      expect(validateModel(m).errors).toEqual([])
    }
    const v = (m, id) => m.parameters.find((p) => p.id === id).value
    // Vmax for GNMT rises ~2x when the glycine Km moves from 130 uM to 2 mM (glycine saturation 0.93 -> 0.45)
    expect(v(getModel({ gnmtGlycineKm: 'luka2000' }), 'vmax_gnmt') / v(base, 'vmax_gnmt')).toBeGreaterThan(1.9)
    expect(v(getModel({ gnmtGlycineKm: 'luka2000' }), 'vmax_gnmt') / v(base, 'vmax_gnmt')).toBeLessThan(2.2)
    // BHMT Vmax rises when the betaine Km is large (saturated at Km 100, linear at 2200)
    expect(v(base, 'vmax_bhmt') / v(getModel({ bhmtBetaineKm: 'reed100' }), 'vmax_bhmt')).toBeGreaterThan(1.5)
    // the b2 budget lowers the GNMT share of SAM use
    expect(ss({}, getModel({ samConsumerBudget: 'b2budget' })).observables.gnmtShare).toBeLessThan(0.25)
  })

  it('shows opposite glycine-saturation of GNMT in the two variants', () => {
    const sat = (sel) => { const m = getModel(sel); const km = m.parameters.find((p) => p.id === 'km_gnmt_gly').value; return REF.gly / (REF.gly + km) }
    expect(sat({ gnmtGlycineKm: 'reed130' })).toBeGreaterThan(0.9)
    expect(sat({ gnmtGlycineKm: 'luka2000' })).toBeLessThan(0.5)
  })
})

describe('methylation model: conservation', () => {
  it('closed folate reactions conserve total folate; only supply and loss are open', () => {
    const c = compileModel(methylationModel)
    expect(conservedSums(c, [{ id: 'folate', species: FOLATE_SPECIES }], null, { reactions: FOLATE_CLOSED })[0].balanced).toBe(true)
    const open = conservedSums(c, [{ id: 'folate', species: FOLATE_SPECIES }])[0].violations.map((v) => v.reaction).sort()
    expect(open).toEqual(['fol_in', 'fol_loss_ch2thf', 'fol_loss_dhf', 'fol_loss_f10', 'fol_loss_mthf', 'fol_loss_thf'])
    // the total folate pool follows supply: input = loss x pool at steady state
    expect(ss({ folateSupply: 0.5 }).observables.folateTotal / ss({}).observables.folateTotal).toBeCloseTo(0.5, 4)
  })

  it('internal methyl transfers conserve methyl groups; the boundary reactions are listed exactly', () => {
    const c = compileModel(methylationModel)
    const res = conservedSums(c, [{ id: 'methyl', weights: METHYL_WEIGHTS }])[0]
    const open = new Set(res.violations.map((v) => v.reaction))
    for (const internal of ['mat1', 'mat3', 'gnmt', 'pemt', 'bhmt', 'mtr', 'mthfr', 'dmgdh', 'sardh', 'chdh', 'chok', 'pld', 'mtd_f', 'mtd_r', 'ahcy_f', 'ahcy_r', 'cbs', 'cth']) expect(open.has(internal), internal).toBe(false)
    for (const boundary of ['met_in', 'cho_in', 'cho_out', 'pc_out', 'gamt', 'dnmt', 'mt_other', 'nnmt', 'ts', 'pur', 'ftd', 'fts', 'gcs', 'shmt_f', 'shmt_r', 'dmg_out', 'sar_out', 'fol_in']) expect(open.has(boundary), boundary).toBe(true)
  })

  it('methyl accounting closes in a simulation: d(methyl pool)/dt equals the boundary exchange', () => {
    const run = runScenario({ stages: [{ hours: 12, events: [{ at: 1, dose: { methionine: 1, choline: 1 } }] }] }, { samplesPerHour: 100, rtol: 1e-8, atol: 1e-11 })
    const c = compileModel(methylationModel)
    const delta = {}
    c.reactionIds.forEach((rid, j) => { delta[rid] = Object.entries(METHYL_WEIGHTS).reduce((a, [sp, w]) => a + w * c.stoichiometry[c.speciesIndex.get(sp)][j], 0) })
    const pool = run.time.map((_, k) => Object.entries(METHYL_WEIGHTS).reduce((a, [sp, w]) => a + w * run.series[sp][k], 0))
    const boundary = (k) => Object.entries(delta).reduce((a, [rid, d]) => a + (d ? d * run.fluxes[rid][k] : 0), 0)
    // the pool changes only through boundary reactions (inputs, sinks, one-carbon exchange); compare slopes at several times
    let checked = 0
    for (const t of [2, 3, 5, 8, 11]) {
      const k = run.time.findIndex((x) => Math.abs(x - t) < 1e-9)
      const slope = (pool[k + 1] - pool[k - 1]) / (run.time[k + 1] - run.time[k - 1])
      expect(Math.abs(slope - boundary(k)), `t=${t}`).toBeLessThan(0.02 * Math.max(Math.abs(slope), Math.abs(boundary(k)), 5))
      checked += 1
    }
    expect(checked).toBe(5)
    expect(Math.max(...pool) - Math.min(...pool)).toBeGreaterThan(50) // the dose really moved the pool
  })
})

describe('methylation model: provenance and entry point', () => {
  it('exports the model, variants, scenarios, observable meta and ontology bindings', () => {
    expect(entry.methylationModel).toBe(methylationModel)
    expect(Object.keys(entry.variants)).toContain('gnmtGlycineKm')
    expect(entry.scenarios.length).toBeGreaterThanOrEqual(20)
    expect(entry.observablesMeta.find((o) => o.id === 'samSahRatio').label).toMatch(/SAM:SAH/)
    expect(entry.observablesMeta.every((o) => o.id && o.label && o.unit && o.group)).toBe(true)
  })

  it('looks up the provenance of any parameter lazily (value, range, source article, confidence, locator)', async () => {
    const gly = await entry.parameterSources('km_gnmt_gly')
    expect(gly).toMatchObject({ id: 'km_gnmt_gly', value: 130, low: 12.2, high: 20000, unit: 'uM' })
    expect(gly.sourceArticle).toBe('article:ogawa-1982-gnmt-rat-liver')
    expect(known.has(gly.sourceArticle)).toBe(true)
    expect(gly.locator).toBeTruthy()
    expect(gly.evidence).toBe('measured')
    expect(gly.origin).toContain('b1:GNMT.Km_gly')
    const vmax = await entry.parameterSources('vmax_gnmt')
    expect(vmax.evidence).toBe('calibrated')
    expect(vmax.note).toMatch(/target flux 43\.97/)
    const assumed = await entry.parameterSources('k_gly_efl')
    expect(assumed.evidence).toBe('assumed')
    const sources = await entry.getSources()
    const all = sources.all()
    expect(all).toHaveLength(methylationModel.parameters.length)
    // every sourced record points at an article that exists
    for (const r of all) if (r.sourceArticle) expect(known.has(r.sourceArticle), `${r.id}: ${r.sourceArticle}`).toBe(true)
    expect(all.filter((r) => !r.origin.length)).toEqual([])
  })
})

describe('methylation model: runtime and bundle size', () => {
  it('simulates a 72 h scenario in under 150 ms', () => {
    const sc = scenarioIndex['glycine-10g']
    runScenario(sc) // warm-up and compile
    const times = []
    for (let i = 0; i < 7; i += 1) { const t0 = performance.now(); runScenario(sc); times.push(performance.now() - t0) }
    times.sort((a, b) => a - b)
    expect(times[3]).toBeLessThan(150)
    const slow = runScenario(scenarioIndex['methionine-load-test'])
    expect(slow.ms).toBeLessThan(250)
  })

  it('model data plus parameters gzip to well under 25 kB (provenance and literature tables load lazily)', async () => {
    const dir = join(tmpdir(), 'sim-methylation-bundle')
    mkdirSync(dir, { recursive: true })
    const src = '/' + new URL('../../src/sim/', import.meta.url).pathname.replace(/^\//, '')
    const gz = async (name, contents) => {
      const file = join(dir, `${name}.js`)
      writeFileSync(file, contents.replaceAll('@@', src))
      const out = await build({ configFile: false, logLevel: 'silent', root: dir, build: { write: false, minify: true, lib: { entry: file, formats: ['es'], fileName: name } } })
      const chunk = (Array.isArray(out) ? out[0] : out).output.find((o) => o.type === 'chunk')
      return gzipSync(Buffer.from(chunk.code)).length
    }
    const modelWithCompile = await gz('model', "export { methylationModel, getModel, variants } from '@@models/methylation.js'")
    const entryPoint = await gz('entry', "export * from '@@models/index.js'")
    console.info(`gzip: model + engine compile ${modelWithCompile} B, UI entry (model, variants, scenarios, meta) ${entryPoint} B`)
    expect(modelWithCompile).toBeLessThan(25 * 1024)
    expect(entryPoint).toBeLessThan(25 * 1024)
  }, 60000)
})
