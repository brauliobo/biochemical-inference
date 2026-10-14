// Which ensemble questions the "What is robust?" strip answers, and how a row's verdict is read from its numbers.
// The numbers themselves are precomputed by scripts/precompute-robustness.js into data/robustness.json (n = 100 members,
// seed 7, the same sampler as docs/METHYLATION_MODEL.md); tests/unit/dash-precomputed.test.js checks the file is current.
// Used by the script and the tests, not by the browser.

export const ENSEMBLE_N = 100
export const ENSEMBLE_SEED = 7
/** A member counts as unchanged when its relative change is within this band. */
export const FLAT_BAND = 0.02

const ratio = (id, label, reduce, observable = 'samSahRatio') => ({ id, label, observable, reduce })
const below = (...xs) => xs.map((x) => ({ op: 'below', x: -x }))
const above = (...xs) => xs.map((x) => ({ op: 'above', x }))

const KM_GNMT = (km) => ({ params: { km_gnmt_gly: km } })
const KM_BHMT = (km) => ({ params: { km_bhmt_bet: km } })

/**
 * scenario: id in src/sim/scenarios.js, or an inline { id, stages } scenario. `fixed` pins sampled constants
 * (methylation-ensemble.js `fixed`). Every metric is a relative change of an observable or flux against the member's own
 * starting state: min / max / final over the run.
 */
export const ROBUSTNESS_ROWS = [
  { id: 'g10-all', scenario: 'glycine-10g', group: 'glycine', label: '10 g glycine, single dose', note: 'All constants sampled over their literature ranges', metrics: [{ ...ratio('trough', 'Trough SAM:SAH', 'min'), thresholds: below(0.05, 0.1, 0.2) }, { ...ratio('sam', 'Trough SAM', 'min', 'sam'), thresholds: below(0.05) }, { ...ratio('gnmt', 'Peak GNMT flux', 'max', 'gnmt'), thresholds: above(0.05) }, { ...ratio('sar', 'Peak hepatic sarcosine', 'max', 'sar'), thresholds: above(0.05) }] },
  { id: 'g10-reed', scenario: 'glycine-10g', group: 'glycine', label: '10 g glycine, GNMT Km(glycine) 130 uM', note: 'Reed value: enzyme already glycine-saturated', fixed: KM_GNMT(130), metrics: [{ ...ratio('trough', 'Trough SAM:SAH', 'min'), thresholds: below(0.05, 0.1) }, { ...ratio('gnmt', 'Peak GNMT flux', 'max', 'gnmt'), thresholds: above(0.05) }] },
  { id: 'g10-luka', scenario: 'glycine-10g', group: 'glycine', label: '10 g glycine, GNMT Km(glycine) 2 mM', note: 'Luka-style value: flux follows hepatic glycine', fixed: KM_GNMT(2000), metrics: [{ ...ratio('trough', 'Trough SAM:SAH', 'min'), thresholds: below(0.05, 0.1, 0.2) }, { ...ratio('gnmt', 'Peak GNMT flux', 'max', 'gnmt'), thresholds: above(0.05) }] },
  { id: 'g5-all', scenario: 'glycine-5g', group: 'glycine', label: '5 g glycine, single dose', metrics: [{ ...ratio('trough', 'Trough SAM:SAH', 'min'), thresholds: below(0.05, 0.1) }] },
  { id: 'g3-all', scenario: 'glycine-3g', group: 'glycine', label: '3 g glycine, single dose', metrics: [{ ...ratio('trough', 'Trough SAM:SAH', 'min'), thresholds: below(0.05) }] },
  { id: 'g10day-all', scenario: 'glycine-10g-day', group: 'glycine', label: '10 g glycine per day, chronic', metrics: [{ ...ratio('final', 'Final SAM:SAH', 'final'), thresholds: [...below(0.05), ...above(0.05)] }, { ...ratio('thcy', 'Final plasma tHcy', 'final', 'tHcy'), thresholds: below(0.05) }] },
  { id: 'g10-low-folate', scenario: 'glycine-low-folate', group: 'glycine', label: '10 g glycine per day, low folate', metrics: [{ ...ratio('final', 'Final SAM:SAH', 'final'), thresholds: [...below(0.05), ...above(0.05)] }] },
  { id: 'niacin2', scenario: 'niacin-2g', group: 'niacin', label: 'Niacin 2 g per day', metrics: [{ ...ratio('final', 'Final SAM:SAH', 'final'), thresholds: below(0.2) }, { ...ratio('thcy', 'Final plasma tHcy', 'final', 'tHcy'), thresholds: above(0.05) }] },
  { id: 'niacin05', scenario: 'niacin-500mg', group: 'niacin', label: 'Niacin 500 mg per day', metrics: [{ ...ratio('final', 'Final SAM:SAH', 'final'), thresholds: below(0.05, 0.1) }] },
  { id: 'mthfr', scenario: 'mthfr-677tt', group: 'folate', label: 'MTHFR at 0.4x (677TT-like)', metrics: [{ ...ratio('mthf', 'Final 5-MTHF', 'final', 'mthf'), thresholds: below(0.2) }, { ...ratio('thcy', 'Final plasma tHcy', 'final', 'tHcy'), thresholds: above(0.2) }, { ...ratio('trough', 'Trough SAM:SAH', 'min'), thresholds: below(0.05) }] },
  { id: 'b12', scenario: 'b12-deficiency', group: 'folate', label: 'B12 deficiency (synthase at 0.2x)', metrics: [{ ...ratio('thcy', 'Final plasma tHcy', 'final', 'tHcy'), thresholds: above(0.2) }, { ...ratio('mthf', 'Final 5-MTHF', 'final', 'mthf'), thresholds: above(0.2) }, { ...ratio('final', 'Final SAM:SAH', 'final'), thresholds: [...below(0.05), ...above(0.05)] }] },
  { id: 'b6', scenario: 'b6-restriction', group: 'b6', label: 'B6 restriction (PLP at 41%)', metrics: [{ ...ratio('cysta', 'Final cystathionine', 'final', 'cysta'), thresholds: above(0.2) }, { ...ratio('thcy', 'Final plasma tHcy', 'final', 'tHcy'), thresholds: above(0.05) }] },
  { id: 'bet6-all', scenario: 'betaine-6g-day', group: 'choline', label: 'Betaine 6 g per day', note: 'All constants sampled (BHMT Km(betaine) 23 uM to 2.2 mM)', metrics: [{ ...ratio('thcy', 'Final plasma tHcy', 'final', 'tHcy'), thresholds: below(0.05, 0.1) }] },
  { id: 'bet6-human', scenario: 'betaine-6g-day', group: 'choline', label: 'Betaine 6 g per day, BHMT Km(betaine) 2.2 mM', note: 'Human recombinant enzyme', fixed: KM_BHMT(2200), metrics: [{ ...ratio('thcy', 'Final plasma tHcy', 'final', 'tHcy'), thresholds: below(0.05, 0.1) }] },
  { id: 'bet6-reed', scenario: 'betaine-6g-day', group: 'choline', label: 'Betaine 6 g per day, BHMT Km(betaine) 100 uM', note: 'Reed value: enzyme already saturated', fixed: KM_BHMT(100), metrics: [{ ...ratio('thcy', 'Final plasma tHcy', 'final', 'tHcy'), thresholds: below(0.05) }] },
  { id: 'bet3', scenario: 'betaine-3g', group: 'choline', label: 'Betaine 3 g, single dose', metrics: [{ ...ratio('thcy', 'Lowest plasma tHcy', 'min', 'tHcy'), thresholds: below(0.02, 0.05) }, { ...ratio('bhmt', 'Peak BHMT flux', 'max', 'bhmt'), thresholds: above(0.1) }] },
  { id: 'choline2', scenario: 'choline-2g', group: 'choline', label: 'Choline 2 g, single dose', metrics: [{ ...ratio('bet', 'Peak hepatic betaine', 'max', 'bet'), thresholds: above(0.1) }, { ...ratio('thcy', 'Lowest plasma tHcy', 'min', 'tHcy'), thresholds: below(0.02) }] },
  { id: 'pemt2', scenario: 'pemt-upregulation', group: 'choline', label: 'PEMT at 2x', metrics: [{ ...ratio('final', 'Final SAM:SAH', 'final'), thresholds: below(0.05, 0.1) }] },
  { id: 'gnmt-ko', scenario: { id: 'gnmt-ko', label: 'GNMT knockout', stages: [{ label: 'baseline', hours: 8 }, { label: 'GNMT at 0', hours: 64, controls: { gnmtActivity: 0 } }] }, group: 'consumers', label: 'GNMT activity at 0 (knockout)', note: 'Human GNMT deficiency: SAM x28-47. The model cannot reach it', metrics: [{ ...ratio('sam', 'Final SAM', 'final', 'sam'), thresholds: above(0.5, 9) }] }
]

/** Reads a row's numbers into a verdict word: robust (>= 90% of members agree), mostly (>= 70%) or parameter-dependent. */
export function verdictOf({ fracDown, fracUp }) {
  const flat = 1 - fracDown - fracUp
  const classes = [['down', fracDown], ['up', fracUp], ['flat', flat]].sort((a, b) => b[1] - a[1])
  const [word, share] = classes[0]
  const phrase = { down: 'falls', up: 'rises', flat: 'does not change' }[word]
  if (share >= 0.9) return { key: `robust-${word}`, text: `robustly ${phrase}`, share }
  if (share >= 0.7) return { key: `mostly-${word}`, text: `mostly ${phrase}`, share }
  return { key: 'mixed', text: 'parameter-dependent', share }
}
