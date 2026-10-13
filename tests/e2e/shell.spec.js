import { expect, test } from '@playwright/test'

// Keyboard-only operability and landmarks of the app shell (docs/USABILITY.md).

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
