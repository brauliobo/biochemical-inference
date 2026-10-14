// Small deterministic stand-ins for the model runs of the gut/histamine/B6/bile dashboards, so component tests do not
// integrate ODEs. The shapes are those of src/components/dash-gut/*-run.js; the numbers are made up for the tests.
const range = (n, step = 1) => Array.from({ length: n }, (_, i) => i * step)

export function gutResult(controls = {}) {
  const ppi = controls.ppi ?? 0
  const time = range(9)
  const ph = time.map((t) => (t < 1 ? 1.6 : 1.6 + (ppi / 100) * 3 + (t === 1 ? 3 : 0)))
  const base = {
    time,
    ph: time.map((t) => (t < 1 ? 1.6 : t === 1 ? 5.3 : 1.5)),
    acid: time.map((t) => (t === 1 ? 16 : 4)),
    hoursBelow4: 7.15,
    medianPh: 1.5,
    acidSecretedMmol: 63,
    co2: { formedMl: 1457, absorbedMl: 1385, carriedMl: 61, heldMl: 0.3, passedMl: 7.9, belchedMl: 2.8, airBelchedMl: 42, airPassedMl: 80, airHeldMl: 30, swallowedAirMl: 163, co2GasMl: 12, shareOfBelchedGas: 0.06, shareOfFormed: 0.002 }
  }
  return {
    ...base,
    ph,
    acid: base.acid.map((value) => value * (1 - ppi / 200)),
    hoursBelow4: 7.15 - (ppi / 100) * 3.2,
    medianPh: 1.5 + (ppi / 100) * 3.1,
    phMax: 5.3,
    acidSecretedMmol: 63 * (1 - ppi / 200) * (1 + (controls.glycineAcidBoostPct ?? 0) / 100),
    capsuleAcidMmol: (controls.betaineHclG ?? 0) * 6.51,
    capsuleHoursOfBasal: ((controls.betaineHclG ?? 0) * 6.51) / 5.1,
    markers: [{ x: 1, label: 'Meal' }],
    flux: { 'reaction:gastric-hcl-secretion': 7.8, 'reaction:h-k-atpase-proton-pumping': 7.8, 'reaction:carbonic-anhydrase-bicarbonate-dehydration': 7.2 },
    concentration: { 'compound:proton': 28.7, 'compound:bicarbonate': 0.012, 'compound:carbon-dioxide': 1.6 },
    warnings: [],
    ok: true,
    baseline: base
  }
}

export function histamineResult(controls = {}) {
  const sam = controls.samUM ?? 60
  const factor = 1 + Math.max(0, 60 - sam) / 100
  const x = range(25)
  const flat = (value) => x.map(() => value)
  const shares = (hnmt) => ({ hnmt, other: 10 - hnmt, total: 10, share: hnmt / 10 })
  const state = { plasma: factor, cns: factor * 1.1, shares: { systemic: shares(6 / factor), cns: shares(8 / factor), gut: { dao: 3, absorbed: 1, total: 4 } } }
  return {
    day: { x, plasma: controls.diurnal ? x.map((t) => 1 + 0.4 * Math.cos(((t - 4) * Math.PI) / 12)) : flat(factor), cns: flat(factor * 1.1) },
    baselineDay: { x, plasma: flat(1), cns: flat(1) },
    state,
    baselineState: { plasma: 1, cns: 1, shares: { systemic: shares(6), cns: shares(8), gut: { dao: 3, absorbed: 1, total: 4 } } },
    sweep: [5, 30, 60, 100, 150].map((s) => ({ sam: s, plasma: 1 + Math.max(0, 60 - s) / 100, cns: 1 + Math.max(0, 60 - s) / 80 })),
    hnmtCapacity: 1 / factor,
    ratio: (controls.sahUM ?? 12) > 0 ? sam / (controls.sahUM ?? 12) : null,
    at04: 1.33,
    at16: 0.67,
    warnings: []
  }
}

export function b6Result(controls = {}) {
  const plp = controls.plp ?? 100
  const grid = [15, 41, 100, 150]
  const rise = (value) => (100 - value) / 100
  return {
    plp,
    now: { cysta: rise(plp) * 100, tHcy: rise(plp) * 35, gly: rise(plp) * 3, ser: 0, ratio: -rise(plp) * 10 },
    sweep: grid.map((value) => ({ plp: value, cysta: rise(value) * 100, tHcy: rise(value) * 35, gly: rise(value) * 3, ser: 0, ratio: -rise(value) * 10 })),
    rows: [
      { id: 'cysta', label: 'Cystathionine (liver)', unit: 'uM', observed: '+52% and +66% in B6 restriction', article: 'article:gregory-2013-b6-restriction-metabolomics', validation: 'D-b6-cysta', model: 68, modelAt: 41, verdict: 'matches', why: 'CTH is more PLP-sensitive.', expected: '+52%' },
      { id: 'tHcy', label: 'Fasting total homocysteine', unit: 'uM', observed: 'unchanged', article: 'article:lamers-2011-b6-restriction-methionine-cycle', validation: 'D-b6-thcy', model: 24, modelAt: 41, verdict: 'disagrees', why: 'Hepatic PLP probably falls less.', expected: 'unchanged' },
      { id: 'gly', label: 'Glycine (liver)', unit: 'uM', observed: 'plasma +10 to +29%', article: 'article:davis-2005-b6-restriction-homocysteine', validation: 'D-b6-glycine', model: 2, modelAt: 41, verdict: 'disagrees', why: 'Same factor for SHMT and GCS.', expected: '+10..+29%' }
    ],
    steps: [
      { id: 'cbs', label: 'CBS (homocysteine to cystathionine)', k: 0.43, low: 0.3, high: 0.6, confidence: 'low', activity: 0.7 },
      { id: 'cth', label: 'CTH (cystathionine to cysteine)', k: 0.86, low: 0.43, high: 1.4, confidence: 'low', activity: 0.6 }
    ],
    load: { normal: { before: 7, peak: 11.7, increment: 4.7 }, restricted: { before: 8.7, peak: 15, increment: 6.3 } },
    warnings: []
  }
}

export function bileResult(controls = {}) {
  const glyX = 1 + (controls.glycineG ?? 0) / 30
  const share = ((3 * glyX) / (controls.taurineX ?? 1)) / (1 + (3 * glyX) / (controls.taurineX ?? 1))
  const grid = [0, 10, 20]
  return {
    glyX,
    share,
    ratio: `${(share / (1 - share)).toFixed(1)} : 1 glycine to taurine`,
    rates: { glycine: 6 * (share / 0.75), taurine: 2, total: 8 },
    grossGlycineG: 0.45,
    grid,
    hepaticGlycine: [1, 1.33, 1.6],
    curves: [0.5, 1, 2].map((tauX) => ({ tauX, values: grid.map((g) => 100 * ((3 * (1 + g / 30)) / tauX / (1 + (3 * (1 + g / 30)) / tauX))) })),
    warnings: []
  }
}
