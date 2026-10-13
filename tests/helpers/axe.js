// Automated WCAG 2.2 AA audit of a mounted component, in jsdom.
//
// Same rule tags as the browser scan in tests/e2e/shell.spec.js, plus axe's
// best practices (heading order, unique landmark names, ...) except the rules
// that only make sense for a whole page. jsdom has no layout engine, so the rules
// that need rendered geometry are skipped here: colour contrast (covered for
// every token pair by tests/unit/design-contrast.test.js and for the rendered
// routes by the browser scan).
import axe from 'axe-core'
import { expect } from 'vitest'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
const PAGE_LEVEL_OR_LAYOUT = ['color-contrast', 'region', 'page-has-heading-one', 'landmark-one-main', 'landmark-no-duplicate-main', 'landmark-main-is-top-level', 'landmark-complementary-is-top-level']

export async function accessibilityViolations(root = document.body) {
  const { violations } = await axe.run(root, {
    runOnly: { type: 'tag', values: TAGS },
    rules: Object.fromEntries(PAGE_LEVEL_OR_LAYOUT.map((id) => [id, { enabled: false }]))
  })
  return violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`)
}

export async function expectAccessible(root = document.body) {
  expect(await accessibilityViolations(root)).toEqual([])
}
