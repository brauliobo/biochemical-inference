import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// Keyboard-only operability, landmarks and automated WCAG checks of the app
// shell (docs/USABILITY.md). Add every new knowledge-site route to ROUTES.
const ROUTES = ['/#/', '/#/kb', '/#/kb/enzymes/mthfr', '/#/workbench', '/#/no/such/page']

for (const colorScheme of ['light', 'dark']) {
  test(`has no WCAG 2.2 AA violations on any shell route (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    for (const route of ROUTES) {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()
      expect(violations.map((violation) => `${route}: ${violation.id} (${violation.nodes.length})`)).toEqual([])
    }
  })
}

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
  await page.goto('/#/kb/enzymes/mthfr')
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'mthfr' })).toBeVisible()

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
