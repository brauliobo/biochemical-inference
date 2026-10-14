// Canned results of the dashboard runners, so component tests do not run the simulator. The numbers are synthetic
// (a dip and recovery) but have exactly the shape the real runners return (src/components/dash/*-dash-run.js).
const N = 37
const time = Array.from({ length: N }, (_, k) => (72 * k) / (N - 1))
const dip = (reference, depth) => time.map((t) => reference * (1 + (t < 8 ? 0 : -depth * Math.exp(-(t - 8) / 6) * (1 - Math.exp(-(t - 8) / 0.7)))))
const flat = (value) => time.map(() => value)

export function fakeMethylationResult({ ratioDepth = 0.12, label = 'Glycine load 10 g (single oral dose)' } = {}) {
  const reference = { samSahRatio: 6.16, sam: 24, sah: 3.9, tHcy: 7, mthf: 5.4, gly_p: 217, bet_p: 39.5, gly: 1500, sar: 20, bet: 1000, cho: 80, hcy: 3 }
  const series = Object.fromEntries(Object.entries(reference).map(([id, value]) => [id, id === 'samSahRatio' ? dip(value, ratioDepth) : id === 'sam' ? dip(value, ratioDepth * 0.8) : flat(value)]))
  const focus = series.samSahRatio.reduce((best, v, k) => (Math.abs(v / reference.samSahRatio - 1) > Math.abs(series.samSahRatio[best] / reference.samSahRatio - 1) ? k : best), 0)
  return {
    ok: true, warnings: [], ms: 12, label, time, series, reference,
    events: [{ x: 8, label: '10 g glycine' }],
    stages: [{ label: 'baseline', start: 0, end: 8 }, { label: 'scenario', start: 8, end: 72 }],
    focus: { index: focus, time: time[focus] },
    shares: {
      baseline: { gnmt: 0.437, pemt: 0.274, gamt: 0.253, dnmt: 0.02, nnmt: 0.004, other: 0.012 },
      scenario: { gnmt: 0.415, pemt: 0.287, gamt: 0.259, dnmt: 0.021, nnmt: 0.004, other: 0.014 },
      range: { gnmt: [0.178, 0.437], pemt: [0.23, 0.274], gamt: [0.253, 0.447], dnmt: [0.02, 0.025], nnmt: [0.004, 0.005], other: [0.013, 0.116] }
    },
    map: {
      baseFlux: { 'reaction:gnmt-glycine-methylation': 44, 'reaction:pemt-pe-to-pc': 27.5, 'reaction:mat-sam-synthesis': 100 },
      flux: { 'reaction:gnmt-glycine-methylation': 40, 'reaction:pemt-pe-to-pc': 28.7, 'reaction:mat-sam-synthesis': 100 },
      baseConc: { 'compound:sam': 24, 'compound:sah': 3.9, 'compound:glycine': 1500 },
      conc: { 'compound:sam': 22, 'compound:sah': 3.7, 'compound:glycine': 1980 }
    }
  }
}

export function fakeGlycineResult() {
  const pkTime = Array.from({ length: 41 }, (_, k) => k * 0.2)
  const plasma = pkTime.map((t) => 217 + 1800 * (Math.exp(-0.945 * t) - Math.exp(-4 * t)))
  const m = fakeMethylationResult()
  return {
    ok: true, warnings: [],
    pk: { time: pkTime, plasma, baseline: 217, peak: { value: Math.max(...plasma), time: 0.45 } },
    time: m.time,
    series: { samSahRatio: m.series.samSahRatio, sam: m.series.sam, gly: m.series.gly, sar: m.series.sar, gnmt: m.series.sam.map((v) => v * 1.8) },
    reference: { samSahRatio: 6.16, sam: 24, gly: 1500, sar: 20, gnmt: 43.9 },
    events: m.events
  }
}

export function fakeCholineResult() {
  const m = fakeMethylationResult({ ratioDepth: 0.03, label: 'Choline and betaine' })
  const pkTime = Array.from({ length: 41 }, (_, k) => k * 0.6)
  const curve = (base, peak) => pkTime.map((t) => base + peak * (Math.exp(-0.2 * t) - Math.exp(-2 * t)))
  return {
    ...m,
    thcyByKm: { reed100: m.series.tHcy.map((v) => v * 0.99), human2200: m.series.tHcy.map((v, k) => v * (1 - 0.14 * (k / (N - 1)))) },
    pk: { time: pkTime, betaine: curve(32, 900), betaineBase: 32, choline: curve(10, 4), cholineBetaine: curve(39.5, 20), cholineBase: 10, cholineBetaineBase: 39.5 }
  }
}
