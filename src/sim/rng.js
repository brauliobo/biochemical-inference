// Seeded PRNG (mulberry32, same generator as server/studies/algorithms.js) and sampling helpers.

/** Deterministic uniform [0,1) generator from an integer seed. */
export function createRng(seed = 1) {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 0x100000000
  }
}

/** Log-uniform sample in [low, high] (uniform when low <= 0). */
export function sampleRange(rng, low, high) {
  if (!(high > low)) return low
  if (low > 0) return Math.exp(Math.log(low) + rng() * (Math.log(high) - Math.log(low)))
  return low + rng() * (high - low)
}

/** Linear-interpolated quantile (q in [0,100]) of an array of numbers. */
export function quantile(values, q) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b)
  if (sorted.length === 0) return NaN
  const pos = (q / 100) * (sorted.length - 1)
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}
