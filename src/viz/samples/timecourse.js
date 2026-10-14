// ILLUSTRATIVE sample data for the gallery and tests only: a made-up
// baseline-vs-scenario time course with a p5-p95 band. Not physiology.

const round = (value, digits = 3) => Number(value.toFixed(digits))

export function timecourseSample() {
  const x = Array.from({ length: 49 }, (_, index) => index * 0.5)
  const baseline = x.map((t) => round(6 + 0.35 * Math.sin((t / 24) * 2 * Math.PI)))
  const dip = (t) => (t < 2 ? 0 : Math.exp(-(t - 2) / 6) - Math.exp(-(t - 2) / 0.9))
  const scenario = x.map((t, index) => round(baseline[index] * (1 - 0.55 * dip(t))))
  const lower = scenario.map((value, index) => round(value * (0.86 - 0.004 * x[index] / 2)))
  const upper = scenario.map((value, index) => round(value * (1.12 + 0.006 * x[index] / 2)))
  const methyl = x.map((t) => round(110 + 40 * (1 - Math.exp(-t / 5)) + 6 * Math.cos(t / 3)))
  return {
    x,
    series: [
      { id: 'baseline', label: 'Baseline', values: baseline, baseline: true, look: 6, unit: 'ratio' },
      { id: 'scenario', label: 'Glycine 5 g', values: scenario, lower, upper, unit: 'ratio' }
    ],
    events: [
      { x: 2, label: 'Glycine 5 g at t = 2 h' },
      { x: 12, label: 'Second dose' },
      { x: 14, label: 'Meal' }
    ],
    bands: [{ from: 4, to: 8, label: 'Typical range (sample)' }],
    refLines: [{ value: 3, label: 'Illustrative threshold' }],
    positive: { x, series: [{ id: 'sah', label: 'SAH (sample)', values: methyl, lower: methyl.map((v) => round(v * 0.8)), upper: methyl.map((v) => round(v * 1.25)), unit: 'nM' }] }
  }
}
