import { describe, expect, it } from 'vitest'
import {
  PRIMITIVE_FILE,
  SEMANTIC_FILE,
  SYSTEM_FILES,
  customProperties,
  fileViolations,
  literalViolations,
  read,
  sourceFiles,
  varReferences
} from '../helpers/css-tokens.js'

// The migration is finished: nothing may hold raw literals except
// tokens.primitive.css, so the allowlist stays empty.
const allowlist = JSON.parse(read('tests/unit/design-tokens.allowlist.json')).files

const primitives = customProperties(PRIMITIVE_FILE)
const semantics = customProperties(SEMANTIC_FILE)

function describeViolations(violations) {
  return violations.map(({ path, line, prop, value, reason }) => `${path}:${line} ${prop}: ${value} (${reason})`)
}

describe('literal detector', () => {
  it.each([
    ['color', '#fff', 'hex colour'],
    ['background', 'rgba(0, 0, 0, .5)', 'colour function'],
    ['border-color', 'red', 'named colour'],
    ['padding', '.5rem 1px', 'px/rem length'],
    ['margin', 'var(--space-2, 8px)', 'px/rem length'],
    ['font-family', 'Inter, sans-serif', 'font family'],
    ['font', '700 1em serif', 'font shorthand'],
    ['font-weight', '700', 'font weight'],
    ['line-height', '1.5', 'unitless line height']
  ])('flags %s: %s', (prop, value, reason) => {
    expect(literalViolations(prop, value)).toContain(reason)
  })

  it.each([
    ['color', 'var(--color-text)'],
    ['padding', '0 var(--space-3)'],
    ['width', '100%'],
    ['font-family', 'var(--font-body)'],
    ['font', 'inherit'],
    ['line-height', 'var(--leading-body)'],
    ['content', '"10px #fff"'],
    ['background', 'url(data:image/svg+xml;utf8,#fff) transparent'],
    ['inline-size', 'min(100%, var(--container-max))']
  ])('accepts %s: %s', (prop, value) => {
    expect(literalViolations(prop, value)).toEqual([])
  })
})

describe('design tokens', () => {
  const files = sourceFiles().filter((path) => path !== PRIMITIVE_FILE)

  it('keeps raw colour, px/rem and font literals out of every file except tokens.primitive.css', () => {
    expect(describeViolations(files.flatMap(fileViolations))).toEqual([])
  })

  it('has no exemptions: the allowlist is empty', () => {
    expect(allowlist).toEqual([])
  })

  it('has no legacy stylesheet', () => {
    expect(sourceFiles('src', ['.css']).filter((path) => /legacy/.test(path))).toEqual([])
  })

  it('defines semantic tokens only as references to primitives', () => {
    expect(semantics.size).toBeGreaterThan(40)
    for (const [name, value] of semantics) {
      const rest = value.replace(/var\(--[\w-]+\)/g, '').replace(/light-dark\(|calc\(|[(),*\s]|-?\d+/g, '')
      expect(rest, `${name}: ${value}`).toBe('')
      for (const reference of varReferences(value)) {
        expect(primitives.has(reference), `${name} references unknown primitive ${reference}`).toBe(true)
      }
    }
  })

  it('builds base, layout and components from semantic tokens only', () => {
    const local = new Set(SYSTEM_FILES.flatMap((path) => [...customProperties(path).keys()]))
    for (const path of SYSTEM_FILES) {
      for (const reference of varReferences(read(path).replace(/\/\*[\s\S]*?\*\//g, ''))) {
        expect(primitives.has(reference), `${path} uses primitive ${reference}; add a semantic token`).toBe(false)
        expect(semantics.has(reference) || local.has(reference), `${path} uses undefined ${reference}`).toBe(true)
      }
    }
  })

  it('names every semantic token that the shell needs', () => {
    for (const name of ['--color-text', '--color-surface', '--color-link', '--color-focus-ring', '--space-stack', '--text-body', '--target-min']) {
      expect(semantics.has(name), name).toBe(true)
    }
  })
})
