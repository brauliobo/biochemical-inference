// Choline -> TMA -> TMAO output against choline intake (pure). The only human dose data are two numbers:
//   * a large FREE-choline bolus (15 mmol) came back as 63% (32-100%) urinary TMA + TMAO (Zhang 1999, pilot study);
//   * the yield from a habitual mixed diet was not measured: 5% (1-30%) is ASSUMED, bounded by "phosphatidylcholine
//     did not raise TMAO" (Cho 2020).
// The page scales both linearly with the daily dose. That is an assumption of this dashboard (no study measured
// the yield at 3.5 g or 30 g a day) and the chart says so. Constants mirror src/sim/data/parameters-b2.js
// (tma-fraction-free-choline-bolus, tma-fraction-habitual-diet); a unit test compares them.

export const CHOLINE_MOLAR_MASS = 104.17 // g/mol, cation (quant:choline-molar-mass)
export const TMA_YIELD = Object.freeze({
  bolus: Object.freeze({ id: 'bolus', label: 'Free choline (bolus-type)', value: 0.63, low: 0.32, high: 1, status: 'measured-once', paramId: 'tma-fraction-free-choline-bolus', article: 'article:zhang-1999-choline-tma-urine' }),
  habitual: Object.freeze({ id: 'habitual', label: 'Habitual diet (assumed)', value: 0.05, low: 0.01, high: 0.3, status: 'assumed', paramId: 'tma-fraction-habitual-diet', article: null })
})
export const URINARY_TMAO_RECOVERY = Object.freeze({ value: 0.96, article: 'article:taesuwan-2017-tmao-d9-elimination' })

/** mmol of choline in `grams` of choline cation. */
export const cholineMmol = (grams) => (grams * 1000) / CHOLINE_MOLAR_MASS

/** TMA + TMAO output (mmol/day) for a choline intake (g/day) and a yield fraction. */
export function tmaOutput(cholineG, fraction) {
  if (!(cholineG >= 0)) throw new RangeError('cholineG must be >= 0')
  return cholineMmol(cholineG) * fraction
}

/** Series for the dose-response chart over a grid of intakes (g/day): { x, series: [{ id, label, values, lower, upper }] }. */
export function doseResponse(grid) {
  return {
    x: grid,
    series: Object.values(TMA_YIELD).map((item) => ({
      id: item.id,
      label: item.label,
      values: grid.map((g) => tmaOutput(g, item.value)),
      lower: grid.map((g) => tmaOutput(g, item.low)),
      upper: grid.map((g) => tmaOutput(g, item.high))
    }))
  }
}

/** Plain words for where an intake sits against the IOM UL (3.5 g/day) and the LOAEL (7.5 g/day); EFSA set no UL. */
export function intakeWords(mg, { ul = 3500, loael = 7500 } = {}) {
  if (mg > loael) return { code: 'above-loael', word: `${(mg / ul).toFixed(1)} times the IOM UL, above the 7.5 g/day level where hypotension appeared` }
  if (mg > ul) return { code: 'above-ul', word: `${(mg / ul).toFixed(1)} times the IOM UL` }
  return { code: 'within', word: `${Math.round((mg / ul) * 100)}% of the IOM UL` }
}
