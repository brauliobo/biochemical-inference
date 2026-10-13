import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { workbenches } from '../../src/workbenches.js'

// Keyboard-only operability, landmarks and automated WCAG checks of the app
// shell (docs/USABILITY.md). Add every new knowledge-site route to ROUTES;
// every registered workbench is included automatically (in this static build
// each shows its API-required notice; their working states are audited in
// tests/component/*workbench*.test.js).
const ROUTES = [
  '/#/',
  '/#/kb',
  '/#/kb/compound',
  '/#/kb/claim',
  '/#/kb/claim?status=unsupported',
  '/#/kb/reaction',
  '/#/kb/enzyme/gnmt',
  '/#/kb/reaction/gnmt-glycine-methylation',
  '/#/kb/state/undermethylation',
  '/#/kb/claim/belching-mostly-swallowed-air',
  '/#/kb/compound/glycine?to=outcome%3Abelching',
  '/#/kb/map',
  '/#/kb/map?id=compound%3Aglycine',
  '/#/kb/state/no-such-entry',
  '/#/kb/not-a-type',
  '/#/workbench',
  ...workbenches.map((item) => `/#/workbench/${item.name}`),
  '/#/workbench/no-such-workbench',
  '/#/no/such/page'
]

for (const colorScheme of ['light', 'dark']) {
  test(`has no WCAG 2.2 AA violations on any shell route (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    for (const route of ROUTES) {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.waitForLoadState('networkidle') // lazy chunks (knowledge data) have rendered
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
      expect(violations.map((violation) => `${route}: ${violation.id} (${violation.nodes.length})`)).toEqual([])
    }
  })
}

test('has no WCAG 2.2 AA violations with search results, expanded lists and filters open', async ({ page }) => {
  const scan = async (label) => {
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
    expect(violations.map((violation) => `${label}: ${violation.id} (${violation.nodes.length})`)).toEqual([])
  }
  await page.goto('/#/')
  await page.getByRole('searchbox').fill('glycine')
  await expect(page.getByRole('main').getByRole('link', { name: 'Glycine', exact: true }).first()).toBeVisible()
  await scan('home search results')

  await page.goto('/#/kb/compound/glycine')
  await expect(page.getByRole('heading', { level: 1, name: 'Glycine' })).toBeVisible()
  for (const summary of await page.locator('main details > summary').all()) await summary.click()
  await scan('entity page, every disclosure open')

  await page.goto('/#/kb/claim?grade=plausible&sort=evidence')
  await expect(page.getByRole('heading', { level: 1, name: 'Claims' })).toBeVisible()
  await scan('claim listing, filtered and sorted')
})

test('skip link and primary navigation work from the keyboard alone', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

  await page.keyboard.press('Tab')
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
  expect(new URL(page.url()).hash).toBe('')

  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Knowledge base' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1, name: 'Knowledge base' })).toBeVisible()
  await expect(page.getByRole('main')).toBeFocused()
  await expect(page.getByRole('link', { name: 'Knowledge base', exact: true })).toHaveAttribute('aria-current', 'page')
})

test('deep links survive a reload and unknown routes show a way out', async ({ page }) => {
  await page.goto('/#/kb/enzyme/gnmt')
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: /Glycine N-methyltransferase/ })).toBeVisible()

  await page.goto('/#/no/such/page')
  await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Go to the home page' })).toBeVisible()
})

test('navigation controls meet the 44 px target size', async ({ page }) => {
  await page.goto('/')
  for (const control of await page.locator('.site-nav a, .site-title').all()) {
    const box = await control.boundingBox()
    expect(box.height).toBeGreaterThanOrEqual(44)
  }
})
