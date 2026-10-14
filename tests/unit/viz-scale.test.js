import { describe, expect, it } from 'vitest'
import { clamp, extentOf, formatNumber, invertLinear, joinWords, logTicks, nearestIndex, niceTicks, sampleEvenly, scaleFor, textWidth, truncate, withUnit } from '../../src/viz/scale.js'

describe('niceTicks', () => {
  it('covers the range with round steps', () => {
    const { ticks, min, max } = niceTicks(0, 9.3, 5)
    expect(ticks[0]).toBe(0)
    expect(ticks.at(-1)).toBeGreaterThanOrEqual(9.3)
    expect(min).toBe(0)
    expect(max).toBe(ticks.at(-1))
    const steps = ticks.slice(1).map((tick, index) => Math.round((tick - ticks[index]) * 1e6) / 1e6)
    expect(new Set(steps).size).toBe(1)
  })

  it('handles equal ends, negatives and non-finite input', () => {
    expect(niceTicks(5, 5).ticks.length).toBeGreaterThan(1)
    expect(niceTicks(-3, 7).ticks).toContain(0)
    expect(niceTicks(Number.NaN, 1).ticks).toEqual([0, 1])
  })

  it('does not leak floating point noise', () => {
    const { ticks } = niceTicks(0, 0.7, 8)
    expect(ticks.every((tick) => String(tick).length < 6)).toBe(true)
  })
})

describe('logTicks and scaleFor', () => {
  it('puts ticks on powers of ten (with 2 and 5 for a short span)', () => {
    expect(logTicks(1, 100).ticks).toEqual([1, 2, 5, 10, 20, 50, 100])
    expect(logTicks(1, 1e6).ticks).toEqual([1, 10, 100, 1000, 10000, 100000, 1000000])
  })

  it('maps linearly and logarithmically and inverts', () => {
    const linear = scaleFor({ domain: [0, 10], range: [0, 100] })
    expect(linear(5)).toBe(50)
    expect(invertLinear({ domain: [0, 10], range: [0, 100] }, 25)).toBe(2.5)
    const log = scaleFor({ domain: [1, 100], range: [0, 200], type: 'log' })
    expect(log(10)).toBeCloseTo(100)
    expect(log(100)).toBeCloseTo(200)
  })
})

describe('helpers', () => {
  it('finds extents, ignoring non-numbers', () => {
    expect(extentOf([3, null, 1], undefined, [Number.NaN, 7])).toEqual([1, 7])
    expect(extentOf([])).toBeNull()
  })

  it('clamps and finds the nearest index', () => {
    expect(clamp(5, 0, 3)).toBe(3)
    expect(nearestIndex([0, 1, 2, 4], 3.1)).toBe(3)
    expect(nearestIndex([0, 1, 2, 4], -5)).toBe(0)
    expect(nearestIndex([], 1)).toBe(-1)
  })

  it('formats numbers compactly', () => {
    expect([0, 1200, 25000, 3.14159, 0.5, 0.00031, 2500000, null].map((value) => formatNumber(value))).toEqual(['0', '1200', '25k', '3.14', '0.5', '3.1e-4', '2.5M', 'n/a'])
    expect(withUnit(4.2, 'uM')).toBe('4.2 uM')
    expect(withUnit(4.2, '')).toBe('4.2')
  })

  it('samples evenly keeping both ends, and joins words', () => {
    const picked = sampleEvenly(Array.from({ length: 100 }, (_, index) => index), 10)
    expect(picked).toHaveLength(10)
    expect(picked[0].index).toBe(0)
    expect(picked.at(-1).index).toBe(99)
    expect(sampleEvenly([1, 2], 10)).toHaveLength(2)
    expect(joinWords(['a', 'b', 'c'])).toBe('a, b and c')
    expect(joinWords(['a'])).toBe('a')
  })

  it('truncates and estimates text width', () => {
    expect(truncate('abcdefghij', 5)).toBe('abcd…')
    expect(truncate('abc', 5)).toBe('abc')
    expect(textWidth('abcd', 10)).toBeGreaterThan(20)
  })
})
