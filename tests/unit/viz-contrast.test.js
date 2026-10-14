import { describe, expect, it } from 'vitest'
import { PRIMITIVE_FILE, SEMANTIC_FILE, customProperties } from '../helpers/css-tokens.js'

// WCAG 2.2: 1.4.3 text (4.5:1) and 1.4.11 non-text (3:1) for the chart roles
// (categorical series, sequential and diverging bins, signed edges, grades).
const TEXT = 4.5
const UI = 3

const primitives = customProperties(PRIMITIVE_FILE)
const semantics = customProperties(SEMANTIC_FILE)

function colour(token, scheme) {
  const value = semantics.get(token)
  if (!value) throw new Error(`unknown semantic token ${token}`)
  const [light, dark] = [...value.matchAll(/var\((--[\w-]+)\)/g)].map((match) => match[1])
  const hex = primitives.get(scheme === 0 ? light : dark)
  if (!/^#[0-9a-f]{6}$/i.test(hex ?? '')) throw new Error(`${token} resolves to ${hex}`)
  return hex
}

function luminance(color) {
  const [r, g, b] = [1, 3, 5].map((index) => {
    const channel = parseInt(color.slice(index, index + 2), 16) / 255
    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a, b) {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (high + 0.05) / (low + 0.05)
}

const SURFACES = ['--color-surface', '--color-surface-raised', '--color-surface-sunken']
const SERIES = Array.from({ length: 8 }, (_, index) => `--color-viz-${index + 1}`)
const EDGES = ['increase', 'decrease', 'mitigate', 'aggravate', 'neutral', 'hypothesis'].map((sign) => `--color-edge-${sign}`)
const GRADES = ['established', 'plausible', 'speculative', 'conversation'].map((grade) => `--color-grade-${grade}`)
const FLUX = [1, 2, 3].map((bin) => `--color-viz-flux-${bin}`)
const SEQ = Array.from({ length: 6 }, (_, index) => `--color-viz-seq-${index + 1}`)
const DIV = ['n3', 'n2', 'n1', '0', 'p1', 'p2', 'p3'].map((bin) => `--color-viz-div-${bin}`)

// Strokes and glyphs that carry data: 3:1 on every surface they can sit on.
const strokes = [...SERIES, ...EDGES, ...GRADES, ...FLUX]
// Cells and swatches carry their value as text on top, so the fill needs only text contrast with that text.
const fills = [...SEQ, ...DIV]

describe('chart colour roles', () => {
  for (const [scheme, label] of [[0, 'light'], [1, 'dark']]) {
    describe(label, () => {
      it.each(strokes.flatMap((token) => SURFACES.map((surface) => [token, surface])))('%s is at least 3:1 on %s', (token, surface) => {
        expect(contrast(colour(token, scheme), colour(surface, scheme))).toBeGreaterThanOrEqual(UI)
      })

      it.each(fills)('%s has readable text (4.5:1) in %s-on', (token) => {
        expect(contrast(colour(token, scheme), colour(`${token}-on`, scheme))).toBeGreaterThanOrEqual(TEXT)
      })

      it.each(SERIES)('%s carries inverse text (segment labels) at 4.5:1', (token) => {
        expect(contrast(colour(token, scheme), colour('--color-text-inverse', scheme))).toBeGreaterThanOrEqual(TEXT)
      })

      it('keeps the eight series distinct from each other', () => {
        const values = SERIES.map((token) => colour(token, scheme))
        expect(new Set(values).size).toBe(values.length)
      })

      it('keeps the sequential bins ordered by lightness', () => {
        const values = SEQ.map((token) => luminance(colour(token, scheme)))
        const ordered = scheme === 0 ? [...values].sort((a, b) => b - a) : [...values].sort((a, b) => a - b)
        expect(values).toEqual(ordered)
      })
    })
  }
})
