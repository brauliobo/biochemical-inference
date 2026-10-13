import { describe, expect, it } from 'vitest'
import { PRIMITIVE_FILE, SEMANTIC_FILE, customProperties } from '../helpers/css-tokens.js'

// WCAG 2.2: 1.4.3 text contrast (4.5:1), 1.4.11 non-text contrast (3:1).
const TEXT = 4.5
const UI = 3

const primitives = customProperties(PRIMITIVE_FILE)
const semantics = customProperties(SEMANTIC_FILE)

function hex(name) {
  const value = primitives.get(name)
  if (!/^#[0-9a-f]{6}$/i.test(value ?? '')) throw new Error(`${name} is not a 6-digit hex primitive`)
  return value
}

// Resolve a semantic colour token for one scheme (0 = light, 1 = dark).
function colour(token, scheme) {
  const value = semantics.get(token)
  if (!value) throw new Error(`unknown semantic token ${token}`)
  const [light, dark] = [...value.matchAll(/var\((--[\w-]+)\)/g)].map((match) => match[1])
  return hex(scheme === 0 ? light : dark)
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

const STATUSES = ['success', 'warning', 'danger', 'info']
const surfaces = ['--color-surface', '--color-surface-raised', '--color-surface-sunken']

const pairs = [
  ...surfaces.flatMap((surface) => [['--color-text', surface, TEXT], ['--color-text-muted', surface, TEXT]]),
  ...['--color-surface', '--color-surface-raised'].flatMap((surface) => [
    ['--color-link', surface, TEXT],
    ['--color-link-hover', surface, TEXT],
    ['--color-link-visited', surface, TEXT],
    ['--color-focus-ring', surface, UI],
    ['--color-border-strong', surface, UI],
    ['--color-accent', surface, UI]
  ]),
  ['--color-accent-text', '--color-accent', TEXT],
  ['--color-accent-text', '--color-accent-hover', TEXT],
  ['--color-text', '--color-selection', TEXT],
  ...STATUSES.map((status) => [`--color-${status}-text`, `--color-${status}-surface`, TEXT])
]

describe('semantic colour contrast', () => {
  for (const [scheme, label] of [[0, 'light'], [1, 'dark']]) {
    describe(label, () => {
      it.each(pairs)('%s on %s is at least %s:1', (foreground, background, minimum) => {
        expect(contrast(colour(foreground, scheme), colour(background, scheme))).toBeGreaterThanOrEqual(minimum)
      })
    })
  }
})
