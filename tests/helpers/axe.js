// Automated WCAG 2.2 AA audit of a mounted component, in jsdom.
//
// Same rule tags as the browser scan in tests/e2e/shell.spec.js, plus axe's
// best practices (heading order, unique landmark names, ...). A component is
// audited without its page shell, so the rules that only make sense for a whole
// page are skipped unless `page: true`. jsdom has no layout engine, so colour
// contrast and target size cannot be checked here: tests/unit/design-contrast.test.js
// covers every token pair, and the populated states audited here can be replayed in a
// real browser with those rules on (see "Populated states" in docs/USABILITY.md):
// set A11Y_SNAPSHOT_DIR and every audited state is also written there as HTML.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import axe from 'axe-core'
import { expect } from 'vitest'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']
const PAGE_RULES = ['region', 'page-has-heading-one', 'landmark-one-main', 'landmark-no-duplicate-main', 'landmark-main-is-top-level', 'landmark-complementary-is-top-level']
let captured = 0

export async function accessibilityViolations(root = document.body, { page = false } = {}) {
  const skipped = ['color-contrast', ...(page ? [] : PAGE_RULES)]
  const { violations } = await axe.run(root, {
    runOnly: { type: 'tag', values: TAGS },
    rules: Object.fromEntries(skipped.map((id) => [id, { enabled: false }]))
  })
  return violations.map((violation) => `${violation.id}: ${violation.nodes.map((node) => node.target.join(' ')).join(' | ')}`)
}

function capture(root) {
  const directory = process.env.A11Y_SNAPSHOT_DIR
  if (!directory || root !== document.body) return
  mkdirSync(directory, { recursive: true })
  const name = (expect.getState().currentTestName ?? 'state').replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 90)
  writeFileSync(join(directory, `${String((captured += 1)).padStart(3, '0')}-${name}.html`), document.body.innerHTML)
}

export async function expectAccessible(root = document.body, options) {
  capture(root)
  expect(await accessibilityViolations(root, options)).toEqual([])
}
