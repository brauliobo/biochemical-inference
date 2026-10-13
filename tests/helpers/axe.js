// Automated WCAG 2.2 AA audit of a mounted component, in jsdom.
//
// Same rule tags as the browser scan in tests/e2e/shell.spec.js, plus axe's
// best practices (heading order, unique landmark names, ...). A component is
// audited without its page shell, so the rules that only make sense for a whole
// page are skipped unless `page: true`. jsdom has no layout engine, so colour
// contrast is never checked here: tests/unit/design-contrast.test.js covers every
// token pair and the browser scan covers the rendered routes.
import axe from 'axe-core'
import { expect } from 'vitest'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
const PAGE_RULES = ['region', 'page-has-heading-one', 'landmark-one-main', 'landmark-no-duplicate-main', 'landmark-main-is-top-level', 'landmark-complementary-is-top-level']

export async function accessibilityViolations(root = document.body, { page = false } = {}) {
  const skipped = ['color-contrast', ...(page ? [] : PAGE_RULES)]
  const { violations } = await axe.run(root, {
    runOnly: { type: 'tag', values: TAGS },
    rules: Object.fromEntries(skipped.map((id) => [id, { enabled: false }]))
  })
  return violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`)
}

export async function expectAccessible(root = document.body, options) {
  expect(await accessibilityViolations(root, options)).toEqual([])
}
