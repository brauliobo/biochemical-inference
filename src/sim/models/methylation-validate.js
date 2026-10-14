// Evaluation of the validation targets (src/sim/validation-targets.js) against the methylation model.
// runValidation() returns one row per target: { id, group, title, observed, expected, tolerance, status: 'pass' | 'fail' |
// 'info', detail, source, why }. Rows whose pinned expectedStatus is 'fail' are known, explained disagreements.

import { conservedSums, simulate } from '../index.js'
import { validationTargets } from '../validation-targets.js'
import { getModel, methylationModel } from './methylation.js'
import { compiledFor, effect, runScenario, steady } from './methylation-run.js'
import { scenarioIndex } from '../scenarios.js'

const cache = new Map()
const modelIds = new WeakMap()
let nextModelId = 1
const mid = (m) => { if (!modelIds.has(m)) modelIds.set(m, nextModelId++); return modelIds.get(m) }

/** Steady state of control settings (cached). */
export function ss(controls = {}, model = methylationModel) {
  const k = `${mid(model)}:${JSON.stringify(controls)}`
  if (!cache.has(k)) cache.set(k, steady(model, controls))
  return cache.get(k)
}
const relOf = (a, b, id) => a.values[id] / b.values[id] - 1
const pct = (x) => `${(x * 100).toFixed(1)}%`
const inRange = (x, lo, hi) => x >= lo && x <= hi

/** Weights of the labile-methyl accounting (methyl groups carried by each species). */
export const METHYL_WEIGHTS = { met: 1, sam: 1, mthf: 1, ch2thf: 1, f10: 1, cho: 3, bet: 3, dmg: 2, sar: 1, pc: 3 }
export const FOLATE_SPECIES = ['thf', 'ch2thf', 'mthf', 'f10', 'dhf']
/** Reactions that move folate between forms only (closed folate sub-system). */
export const FOLATE_CLOSED = ['mthfr', 'shmt_f', 'shmt_r', 'gcs', 'mtd_f', 'mtd_r', 'fts', 'ftd', 'pur', 'ts', 'dhfr', 'mtr', 'dmgdh', 'sardh']

const base = () => ss({})

const checks = {
  'S-steady': () => {
    const b = base(); const neg = Object.entries(b.state).filter(([, v]) => v < 0)
    return { observed: b.residual, pass: b.converged && b.residual < 1e-9 && neg.length === 0, detail: `residual ${b.residual.toExponential(1)}, min species ${Math.min(...Object.values(b.state)).toExponential(1)}` }
  },
  'S-stable': () => {
    const c = compiledFor(methylationModel)
    let seed = 20250101
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 }
    let worstFast = 0; let worstSlow = 0
    for (let trial = 0; trial < 3; trial += 1) {
      const set = {}
      c.names.forEach((n, i) => { if (!c.fixed[i] && c.y0[i] > 0) set[n] = c.y0[i] * (0.7 + 0.6 * rnd()) })
      const run = simulate(c, { times: [0, 150, 3000], events: [{ time: 0, set }], rtol: 1e-6 })
      if (!run.ok) return { observed: NaN, pass: false, detail: 'relaxation run failed' }
      const dev = (t) => Math.max(...c.names.map((n, i) => (c.fixed[i] || c.y0[i] === 0 ? 0 : Math.abs(run.series[n][t] / c.y0[i] - 1))))
      worstFast = Math.max(worstFast, dev(1)); worstSlow = Math.max(worstSlow, dev(2))
    }
    return { observed: worstSlow, pass: worstSlow < 0.01, detail: `max deviation from the steady state: ${pct(worstFast)} at 150 h (folate, PE and PC pools relax with half-lives of weeks), ${pct(worstSlow)} at 3000 h; no growth in 3 random +-30% perturbations` }
  },
  'S-sam': () => { const v = base().state.sam; return { observed: v, pass: inRange(v, 21.6, 26.4), detail: `${v.toFixed(2)} uM` } },
  'S-sah': () => { const v = base().state.sah; return { observed: v, pass: inRange(v, 3.5, 4.3), detail: `${v.toFixed(2)} uM` } },
  'S-ratio': () => { const v = base().observables.samSahRatio; return { observed: v, pass: inRange(v, 3.6, 6.6), detail: `SAM:SAH ${v.toFixed(2)}` } },
  'S-thcy': () => { const v = base().observables.tHcy; return { observed: v, pass: inRange(v, 5.7, 8.3), detail: `${v.toFixed(2)} uM` } },
  'S-mat': () => { const v = base().fluxes.mat1 + base().fluxes.mat3; return { observed: v, pass: Math.abs(v / 100.25 - 1) < 0.05, detail: `MAT-I ${base().fluxes.mat1.toFixed(1)} + MAT-III ${base().fluxes.mat3.toFixed(1)} = ${v.toFixed(1)} uM/h` } },
  'S-shares-reed': () => {
    const o = base().observables
    const got = { gnmt: o.gnmtShare, pemt: o.pemtShare, gamt: o.gamtShare, dnmt: o.dnmtShare }
    const want = { gnmt: 0.4386, pemt: 0.2746, gamt: 0.2536, dnmt: 0.0204 }
    const dev = Math.max(...Object.keys(want).map((k) => Math.abs(got[k] - want[k])))
    return { observed: got, pass: dev < 0.03, detail: `GNMT ${pct(got.gnmt)}, PEMT ${pct(got.pemt)}, GAMT ${pct(got.gamt)}, DNMT ${pct(got.dnmt)} (Reed 2015: 44 / 27 / 25 / 2); max deviation ${pct(dev)}` }
  },
  'S-shares-b2': () => {
    const o = base().observables
    return { observed: o.gnmtShare, pass: inRange(o.gnmtShare, 0.095, 0.31) && inRange(o.gamtShare, 0.2, 0.55), detail: `GNMT ${pct(o.gnmtShare)} (whole-body budget 14.5%, range 9.5-31%), creatine ${pct(o.gamtShare)} (budget 36%, range 18-73%)` }
  },
  'S-partition': () => {
    const o = base().observables
    return { observed: o.transsulfurationFraction, pass: inRange(o.transsulfurationFraction, 0.4, 0.7) && base().fluxes.mat1 + base().fluxes.mat3 > 1.9 * base().fluxes.cbs, detail: `transsulfuration ${pct(o.transsulfurationFraction)} of homocysteine disposal; ${((base().fluxes.mat1 + base().fluxes.mat3) / base().fluxes.cbs).toFixed(2)} methionine cycles per cystathionine (Mudd >= 1.9)` }
  },
  'S-bhmt-share': () => { const v = base().observables.bhmtShareOfRemethylation; return { observed: v, pass: inRange(v, 0.35, 0.65), detail: `BHMT ${pct(v)} of remethylation` } },
  'S-met-balance': () => {
    const f = base().fluxes; const err = Math.abs(f.met_in - (f.cbs + f.hcy_exp))
    return { observed: err, pass: err < 1e-6, detail: `methionine in ${f.met_in.toFixed(3)} = CBS ${f.cbs.toFixed(3)} + Hcy export ${f.hcy_exp.toFixed(3)} uM/h` }
  },
  'S-scale': () => {
    const f = base().fluxes; const tm = f.mat1 + f.mat3
    const share = (tm * 24) / 1000 / 20 // model liver 1 L: uM/h -> mmol/day, over whole-body 20 mmol/day
    return { observed: share, pass: share >= 0.3, detail: `model liver (1 L) transmethylation ${tm.toFixed(0)} umol/h = ${(tm * 24 / 1000).toFixed(1)} mmol/day = ${pct(share)} of whole-body 20 mmol/day` }
  },
  'S-folate-total': () => { const v = base().observables.folateTotal; return { observed: v, pass: inRange(v, 18, 28), detail: `${v.toFixed(1)} uM of modelled folate forms (Reed total 20)` } },
  'S-gnmt-gly-sat': () => {
    const r = getModel({ gnmtGlycineKm: 'reed130' }); const l = getModel({ gnmtGlycineKm: 'luka2000' })
    const g = base().state.gly
    const sr = g / (g + r.parameters.find((p) => p.id === 'km_gnmt_gly').value); const sl = g / (g + l.parameters.find((p) => p.id === 'km_gnmt_gly').value)
    return { observed: { reed130: sr, luka2000: sl }, pass: inRange(sr, 0.9, 0.96), detail: `GNMT glycine saturation ${pct(sr)} with Km 130 uM (B1 note: ~93%), ${pct(sl)} with Km 2 mM` }
  },
  'S-pemt-fraction': () => {
    const pc = base().fluxes.pemt / base().state.pc * 100
    return { observed: pc, pass: inRange(pc, 0.27, 1.06), detail: `PEMT makes ${pc.toFixed(3)}%/h of the PC pool (Pynn 2011: 0.53%/h, range 0.27-1.06)` }
  },
  'S-gly-pk': () => {
    // 1 mmol/kg lean mass (4.6 g) in Gannon 2002
    const run2 = runScenario({ stages: [{ hours: 1 }, { hours: 6, events: [{ at: 0, dose: { glycine: 4.6 } }] }] }, { samplesPerHour: 12 })
    const e = effect(run2, 'gly_p', { from: 1 })
    const k120 = run2.series.gly_p[run2.time.findIndex((t) => Math.abs(t - 3) < 1e-9)]
    return { observed: { peak: e.peak, tPeak: e.tPeak - 1, at2h: k120 }, pass: inRange(e.peak, 909 * 0.85, 909 * 1.15) && inRange(e.tPeak - 1, 0.4, 0.9), detail: `peak ${e.peak.toFixed(0)} uM at ${((e.tPeak - 1) * 60).toFixed(0)} min (Gannon 2002, unverified secondhand: 217 -> 909 uM at 40 min; 414 uM at 120 min, model ${k120.toFixed(0)})` }
  },
  'S-bet-pk': () => {
    const run = runScenario({ stages: [{ hours: 1 }, { hours: 72, events: [{ at: 0, dose: { betaine: 3.5 } }] }] }, { samplesPerHour: 8 })
    const e = effect(run, 'bet_p', { from: 1 })
    // terminal half-life from the 24-60 h decline
    const at = (t) => run.series.bet_p[run.time.findIndex((x) => Math.abs(x - t) < 1e-9)]
    const half = (36 * Math.LN2) / Math.log(at(25) / at(61))
    return { observed: { cmax: e.peak, tmax: e.tPeak - 1, half }, pass: inRange(e.peak, 939 * 0.85, 939 * 1.15) && inRange(e.tPeak - 1, 0.4, 1.4) && inRange(half, 6, 32), detail: `Cmax ${e.peak.toFixed(0)} uM at ${(e.tPeak - 1).toFixed(2)} h, late half-life ${half.toFixed(1)} h (Schwahn 2003, 50 mg/kg: 939 uM, 0.9 h, 14.4 h [6-32])` }
  },
  'D-betaine-hcy': () => {
    const b = base(); const out = {}
    for (const g of [1.5, 3, 6]) out[g] = relOf(ss({ betaineIntake: g }), b, 'tHcy')
    return { observed: out, pass: inRange(out[6], -0.28, -0.1) && out[1.5] > out[3] && out[3] > out[6] && out[1.5] < 0, detail: `tHcy ${pct(out[1.5])} / ${pct(out[3])} / ${pct(out[6])} at 1.5 / 3 / 6 g/day (Olthof 2003: -12% / -15% / -20%)` }
  },
  'D-betaine-postload': () => {
    const mk = (bg) => runScenario({ background: bg, stages: [{ hours: 4 }, { hours: 24, events: [{ at: 0, dose: { methionine: 7 } }] }] }, { samplesPerHour: 4 })
    const a = mk({}); const b = mk({ betaineIntake: 6 })
    const inc = (r) => { const e = effect(r, 'tHcy', { from: 4 }); return e.peak - r.series.tHcy[r.time.findIndex((t) => t >= 4)] }
    const ia = inc(a); const ib = inc(b); const change = ib / ia - 1
    return { observed: change, pass: inRange(change, -0.6, -0.2), detail: `post-load tHcy increment ${ia.toFixed(1)} -> ${ib.toFixed(1)} uM with betaine 6 g/day (${pct(change)}; Olthof 2003: -40%)` }
  },
  'D-choline-hcy': () => {
    const v = relOf(ss({ cholineIntake: 2600 }), base(), 'tHcy')
    return { observed: v, pass: inRange(v, -0.3, -0.06), detail: `tHcy ${pct(v)} at +2.6 g choline/day (Olthof 2005: -18%)` }
  },
  'D-choline-bhmt': () => {
    const b = base(); const c = ss({ cholineIntake: 2000 }); const t = ss({ betaineIntake: 3 })
    return { observed: { choline: relOf(c, b, 'bhmt'), betaine: relOf(t, b, 'bhmt') }, pass: relOf(c, b, 'bhmt') > 0.02 && relOf(t, b, 'bhmt') > 0.1 && relOf(c, b, 'hcy') < 0 && relOf(t, b, 'hcy') < 0, detail: `BHMT flux ${pct(relOf(c, b, 'bhmt'))} (choline 2 g/day), ${pct(relOf(t, b, 'bhmt'))} (betaine 3 g/day); liver Hcy ${pct(relOf(c, b, 'hcy'))} / ${pct(relOf(t, b, 'hcy'))}` }
  },
  'D-mthfr': () => {
    const b = base(); const m = ss({ mthfrActivity: 0.4 })
    return { observed: { hcy: relOf(m, b, 'tHcy'), mthf: relOf(m, b, 'mthf') }, pass: relOf(m, b, 'tHcy') > 0 && relOf(m, b, 'mthf') < 0, detail: `MTHFR 0.4x: tHcy ${pct(relOf(m, b, 'tHcy'))}, 5-MTHF ${pct(relOf(m, b, 'mthf'))}, SAM:SAH ${pct(relOf(m, b, 'samSahRatio'))}` }
  },
  'D-b6-cysta': () => {
    const b = base(); const m = ss({ b6Status: 0.41 })
    const c = relOf(m, b, 'cysta')
    return { observed: c, pass: inRange(c, 0.3, 0.9), detail: `cystathionine ${pct(c)} at PLP 41% (Gregory 2013: +52% and +66%)` }
  },
  'D-b6-thcy': () => {
    const v = relOf(ss({ b6Status: 0.41 }), base(), 'tHcy')
    return { observed: v, pass: Math.abs(v) < 0.05, detail: `fasting tHcy ${pct(v)} (restriction study: unchanged)` }
  },
  'D-b6-glycine': () => {
    const v = relOf(ss({ b6Status: 0.41 }), base(), 'gly')
    return { observed: v, pass: inRange(v, 0.1, 0.29), detail: `hepatic glycine ${pct(v)} (plasma glycine +10-29% in restriction studies)` }
  },
  'D-b6-postload': () => {
    const mk = (bg) => runScenario({ background: bg, stages: [{ hours: 4 }, { hours: 24, events: [{ at: 0, dose: { methionine: 7 } }] }] }, { samplesPerHour: 4 })
    const inc = (r) => effect(r, 'tHcy', { from: 4 }).peak - r.series.tHcy[r.time.findIndex((t) => t >= 4)]
    const a = inc(mk({})); const b = inc(mk({ b6Status: 0.41 }))
    return { observed: b / a - 1, pass: b > a, detail: `post-load tHcy increment ${a.toFixed(1)} -> ${b.toFixed(1)} uM (B6 restriction: larger, Ubbink 1996)` }
  },
  'D-b12-trap': () => {
    const b = base(); const m = ss({ b12Activity: 0.2 })
    return { observed: { mthf: relOf(m, b, 'mthf'), thf: relOf(m, b, 'thf'), tHcy: relOf(m, b, 'tHcy') }, pass: relOf(m, b, 'mthf') > 0.3 && relOf(m, b, 'thf') < -0.3 && relOf(m, b, 'tHcy') > 0.3 && Math.abs(relOf(m, b, 'folateTotal')) < 0.01, detail: `B12 0.2x: 5-MTHF ${pct(relOf(m, b, 'mthf'))}, THF ${pct(relOf(m, b, 'thf'))}, 10-formyl-THF ${pct(relOf(m, b, 'f10'))}, tHcy ${pct(relOf(m, b, 'tHcy'))}, total folate ${pct(relOf(m, b, 'folateTotal'))}` }
  },
  'D-b12-ratio': () => {
    const v = relOf(ss({ b12Activity: 0.2 }), base(), 'samSahRatio')
    return { observed: v, pass: v < 0, detail: `SAM:SAH ${pct(v)} (cobalamin-deficiency literature: SAM low-normal, SAH up; model: trapped 5-MTHF inhibits GNMT)` }
  },
  'D-niacin': () => {
    const b = base(); const n = ss({ niacinDose: 2 })
    return { observed: { sah: relOf(n, b, 'sah'), ratio: relOf(n, b, 'samSahRatio'), nnmt: n.fluxes.nnmt }, pass: relOf(n, b, 'sah') > 0 && relOf(n, b, 'samSahRatio') < -0.05 && relOf(n, b, 'sam') < 0, detail: `niacin 2 g/day: SAH ${pct(relOf(n, b, 'sah'))}, SAM ${pct(relOf(n, b, 'sam'))}, SAM:SAH ${pct(relOf(n, b, 'samSahRatio'))}, NNMT ${n.fluxes.nnmt.toFixed(0)} uM/h` }
  },
  'D-niacin-thcy': () => {
    const v = relOf(ss({ niacinDose: 1 }), base(), 'tHcy')
    return { observed: v, pass: inRange(v, 0.05, 0.6), detail: `tHcy ${pct(v)} at 1 g/day niacin (Garg 1999: +17% during titration to 1 g, +55% at 18 weeks)` }
  },
  'D-niacin-methyl': () => {
    const n = ss({ niacinDose: 2 }); const frac = n.fluxes.nnmt / (2 * 8.123 * 5)
    return { observed: frac, pass: inRange(frac, 0.5, 0.8), detail: `${pct(frac)} of niacin methylated at 2 g/day (B2: 4.38-6.3 mmol methyl/g of 8.12 mmol/g = 54-78%)` }
  },
  'D-glycine-sarcosine': () => {
    const out = {}
    for (const v of ['reed130', 'luka2000']) {
      const m = getModel({ gnmtGlycineKm: v })
      const r = runScenario({ stages: [{ hours: 4 }, { hours: 24, events: [{ at: 0, dose: { glycine: 10 } }] }] }, { model: m, samplesPerHour: 4 })
      out[v] = { gnmt: effect(r, 'gnmt', { from: 4 }).peakRel, sar: effect(r, 'sar', { from: 4 }).peakRel, ratio: effect(r, 'samSahRatio', { from: 4 }).troughRel, sam: effect(r, 'sam', { from: 4 }).troughRel }
    }
    return { observed: out, pass: ['reed130', 'luka2000'].every((v) => out[v].gnmt > 0.01 && out[v].sar > 0.01), detail: `10 g glycine bolus, peak GNMT flux / sarcosine / trough SAM:SAH: Reed Km ${pct(out.reed130.gnmt)} / ${pct(out.reed130.sar)} / ${pct(out.reed130.ratio)}; Luka Km ${pct(out.luka2000.gnmt)} / ${pct(out.luka2000.sar)} / ${pct(out.luka2000.ratio)}` }
  },
  'D-glycine-chronic-sarcosine': () => {
    const b = base(); const g = ss({ glycineLoad: 10 }); const l = getModel({ gnmtGlycineKm: 'luka2000' }); const gl = ss({ glycineLoad: 10 }, l); const bl = ss({}, l)
    return { observed: { reed: relOf(g, b, 'sar'), luka: relOf(gl, bl, 'sar') }, pass: relOf(g, b, 'sar') > 0.2, detail: `chronic glycine 10 g/day: liver sarcosine ${pct(relOf(g, b, 'sar'))} (Reed Km), ${pct(relOf(gl, bl, 'sar'))} (Luka Km); mouse +86% (Alves 2022)` }
  },
  'D-glycine-thcy': () => {
    const v = relOf(ss({ glycineLoad: 7 }), base(), 'tHcy')
    return { observed: v, pass: inRange(v, 0, 0.15), detail: `tHcy ${pct(v)} at 7 g/day glycine (Tan 2025: +0.6 uM = +6%); the serine -> CBS arm lowers Hcy in the model` }
  },
  'D-gnmt-ko': () => {
    const f = relOf(ss({ gnmtActivity: 0 }, methylationModel), base(), 'sam') + 1
    const sah = relOf(ss({ gnmtActivity: 0 }), base(), 'sah')
    return { observed: f, pass: inRange(f, 28, 47), detail: `GNMT activity 0: SAM x${f.toFixed(1)} (human deficiency x28-47, mouse x36), SAH ${pct(sah)} (mouse: falls 12-15 -> 3-5)` }
  },
  'D-bhmt-ko': () => {
    const b = base(); const k = ss({ bhmtActivity: 0 })
    const ok = inRange(k.values.sam / b.values.sam, 0.4, 0.8) && k.values.sah / b.values.sah > 1.5 && k.values.tHcy / b.values.tHcy > 3
    return { observed: { sam: k.values.sam / b.values.sam, sah: k.values.sah / b.values.sah, tHcy: k.values.tHcy / b.values.tHcy }, pass: ok, detail: `BHMT activity 0: SAM x${(k.values.sam / b.values.sam).toFixed(2)} (mouse x0.57), SAH x${(k.values.sah / b.values.sah).toFixed(2)} (mouse x2.6), tHcy x${(k.values.tHcy / b.values.tHcy).toFixed(2)} (mouse x8)` }
  },
  'D-met-load': () => {
    const r = runScenario(scenarioIndex['methionine-load-test'], { samplesPerHour: 4 })
    const e = effect(r, 'tHcy', { from: 8 })
    return { observed: { peakRel: e.peakRel, tPeak: e.tPeak - 8 }, pass: inRange(e.peakRel, 0.4, 2.0) && inRange(e.tPeak - 8, 3, 10), detail: `100 mg/kg methionine: tHcy peaks ${pct(e.peakRel)} at ${(e.tPeak - 8).toFixed(1)} h after the dose (clinical test: roughly +100% at 4-8 h)` }
  },
  'D-folate-low': () => {
    const b = base(); const f = ss({ folateSupply: 0.5 })
    return { observed: { mthf: relOf(f, b, 'mthf'), tHcy: relOf(f, b, 'tHcy'), sam: relOf(f, b, 'sam') }, pass: relOf(f, b, 'tHcy') > 0 && relOf(f, b, 'sam') < 0, detail: `folate supply 0.5x: total folate ${pct(relOf(f, b, 'folateTotal'))}, tHcy ${pct(relOf(f, b, 'tHcy'))}, SAM ${pct(relOf(f, b, 'sam'))}` }
  },
  'C-folate': () => {
    const c = compiledFor(methylationModel)
    const res = conservedSums(c, [{ id: 'folate', species: FOLATE_SPECIES }], null, { reactions: FOLATE_CLOSED })
    const viol = res[0].violations.map((v) => v.reaction)
    const open = conservedSums(c, [{ id: 'folate', species: FOLATE_SPECIES }], null)[0].violations.map((v) => v.reaction).sort()
    return { observed: viol, pass: viol.length === 0 && open.join() === ['fol_in', 'fol_loss_ch2thf', 'fol_loss_dhf', 'fol_loss_f10', 'fol_loss_mthf', 'fol_loss_thf'].sort().join(), detail: `closed folate reactions conserve total folate; the only open reactions are ${open.join(', ')}` }
  },
  'C-methyl': () => {
    const c = compiledFor(methylationModel)
    const res = conservedSums(c, [{ id: 'methyl', weights: METHYL_WEIGHTS }], null)[0]
    const names = res.violations.map((v) => v.reaction).sort()
    return { observed: names, pass: !names.includes('mat1') && !names.includes('mat3') && !names.includes('gnmt') && !names.includes('pemt') && !names.includes('bhmt') && !names.includes('mtr') && !names.includes('mthfr') && !names.includes('dmgdh') && !names.includes('sardh') && !names.includes('chdh') && !names.includes('chok') && !names.includes('pld') && names.includes('gamt') && names.includes('dnmt') && names.includes('nnmt') && names.includes('met_in') && names.includes('cho_in'), detail: `internal methyl transfers (MAT, GNMT, PEMT, BHMT, MTR, MTHFR, DMGDH, SARDH, CHDH, Kennedy, PLD) conserve methyl groups; ${names.length} boundary reactions exchange them: ${names.join(', ')}` }
  }
}

/** Evaluate every target; `only` limits to ids or groups. */
export function runValidation({ only } = {}) {
  return validationTargets.filter((t) => !only || only.includes(t.id) || only.includes(t.group)).map((t) => {
    let r
    try { r = checks[t.id] ? checks[t.id]() : { observed: null, pass: null, detail: 'no evaluator' } } catch (e) { r = { observed: null, pass: false, detail: `error: ${e.message}` } }
    const status = t.kind === 'info' ? 'info' : (r.pass ? 'pass' : 'fail')
    return { id: t.id, group: t.group, title: t.title, expected: t.expected, tolerance: t.tolerance, source: t.source, observed: r.observed, detail: r.detail, status, expectedStatus: t.expectedStatus, why: t.why }
  })
}

export { checks }
