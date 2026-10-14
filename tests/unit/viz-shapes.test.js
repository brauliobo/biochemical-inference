import { describe, expect, it } from 'vitest'
import { edgeSign, endMarker, gradeStyle, isOpenMarker, markerPath, MARKER_SHAPES, NODE_SHAPES, SERIES_COUNT, seriesLook, shapePath, SIGN_IDS, signGlyph, signWords, typeLook } from '../../src/viz/shapes.js'

describe('series look', () => {
  it('gives every series a distinct colour class, dash class and marker shape', () => {
    const looks = Array.from({ length: SERIES_COUNT }, (_, index) => seriesLook(index))
    expect(new Set(looks.map((look) => look.colorClass)).size).toBe(SERIES_COUNT)
    expect(new Set(looks.map((look) => look.dashClass)).size).toBe(SERIES_COUNT)
    expect(new Set(looks.map((look) => look.shape)).size).toBe(SERIES_COUNT)
  })

  it('wraps around and handles negative indexes', () => {
    expect(seriesLook(8)).toEqual(seriesLook(0))
    expect(seriesLook(-1)).toEqual(seriesLook(7))
  })
})

describe('marker and node paths', () => {
  it.each(MARKER_SHAPES)('draws a %s marker', (shape) => {
    const d = markerPath(shape, 10, 10, 4)
    expect(d).toMatch(/^M/)
    expect(d).not.toMatch(/NaN/)
  })

  it('knows which markers are strokes only', () => {
    expect(isOpenMarker('cross')).toBe(true)
    expect(isOpenMarker('circle')).toBe(false)
  })

  it.each(NODE_SHAPES)('draws a closed %s outline inside its box', (shape) => {
    const d = shapePath(shape, 100, 40)
    expect(d).toMatch(/^M.*Z$/)
    expect(d).not.toMatch(/NaN/)
    const numbers = d.match(/-?\d+(\.\d+)?/g).map(Number)
    expect(Math.max(...numbers.map(Math.abs))).toBeLessThanOrEqual(100)
  })

  it('maps knowledge types to a shape and series, with a fallback and overrides', () => {
    expect(typeLook('enzyme').shape).toBe('hexagon')
    expect(typeLook('unknown-type').shape).toBe('rounded')
    expect(typeLook('compound', { compound: { shape: 'diamond', series: 3 } })).toEqual({ shape: 'diamond', series: 3 })
  })
})

describe('signed edges', () => {
  it('gives each sign its own marker, glyph and words', () => {
    const markers = SIGN_IDS.map((sign) => endMarker(sign === 'neutral' ? 'dot' : { increase: 'arrow', decrease: 'bar', mitigate: 'open-arrow', aggravate: 'diamond' }[sign], 0, 0, 0).d)
    expect(new Set(markers).size).toBe(SIGN_IDS.length)
    expect(new Set(SIGN_IDS.map((sign) => signGlyph({ sign }))).size).toBeGreaterThanOrEqual(4)
    expect(signWords({ sign: 'decrease' })).toBe('Decreases')
  })

  it('marks hypotheses in words and glyph, and treats unknown signs as neutral', () => {
    expect(signWords({ sign: 'decrease', hypothesis: true })).toBe('Decreases (hypothesis)')
    expect(signGlyph({ sign: 'increase', hypothesis: true })).toBe('+?')
    expect(edgeSign({ sign: 'hypothesis' })).toEqual({ sign: 'neutral', hypothesis: true })
    expect(edgeSign({ sign: 'nonsense' }).sign).toBe('neutral')
    expect(edgeSign(undefined).sign).toBe('neutral')
  })

  it('points the marker along the edge direction', () => {
    const right = endMarker('arrow', 10, 0, 0)
    const down = endMarker('arrow', 0, 10, Math.PI / 2)
    expect(right.d.startsWith('M10 0')).toBe(true)
    expect(down.d.startsWith('M0 10')).toBe(true)
    expect(right.filled).toBe(true)
    expect(endMarker('bar', 0, 0, 0).filled).toBe(false)
  })
})

describe('evidence grade badge', () => {
  it('uses a letter as well as a colour class', () => {
    expect(gradeStyle('established')).toMatchObject({ letter: 'E', cls: 'viz-grade-established' })
    expect(gradeStyle('conversation-only')).toMatchObject({ letter: 'C', cls: 'viz-grade-conversation' })
    expect(gradeStyle('mystery')).toMatchObject({ letter: '?', cls: 'viz-grade-conversation' })
  })
})
