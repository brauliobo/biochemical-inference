import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// The gut / histamine / B6 / bile-acid / TMA dashboards (docs/DASHBOARDS_B.md): accessibility in light, dark and on a
// phone, no console errors, no sideways page scroll, 44 px controls, the simulation code loading lazily, and the
// keyboard-only task "set the PPI to 60% and read the time with pH below 4". Runs against the static build.
const ROUTES = ['/#/dash/gut-acid', '/#/dash/histamine-night', '/#/dash/b6-gaba', '/#/dash/bile-acids', '/#/dash/tma-tmao']
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

/** Waits until the page has its model results, its lazy data and its maps (the dashboards draw their heading first). */
async function ready(page, route) {
  await page.goto(route)
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /^What the (model|numbers) says?$/ })).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('main').getByText(/^(Loading the|Running the)/)).toHaveCount(0, { timeout: 60_000 })
  await page.waitForLoadState('networkidle')
  await expect(page.locator('main figure[aria-labelledby$="-map-caption"]').first()).toBeVisible({ timeout: 60_000 })
}

for (const colorScheme of ['light', 'dark']) {
  test(`has no WCAG 2.2 AA violations on the five dashboards (${colorScheme})`, async ({ page }) => {
    test.setTimeout(240_000)
    await page.emulateMedia({ colorScheme })
    for (const route of ROUTES) {
      await ready(page, route)
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
      expect(violations.map((violation) => `${route}: ${violation.id} (${violation.nodes.length}) ${violation.nodes.slice(0, 2).map((node) => node.target.join(' ')).join(' | ')}`)).toEqual([])
    }
  })
}

test('has no WCAG violations with every disclosure open (notes, data tables, parameter sources)', async ({ page }) => {
  test.setTimeout(240_000)
  for (const route of ROUTES) {
    await ready(page, route)
    for (const summary of await page.locator('main details > summary').all()) await summary.click()
    const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
    expect(violations.map((violation) => `${route}: ${violation.id} (${violation.nodes.length})`)).toEqual([])
  }
})

test('logs no console errors or warnings and throws nothing while the dashboards load and a control moves', async ({ page }) => {
  test.setTimeout(240_000)
  const problems = []
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') problems.push(`${message.type()}: ${message.text()}`)
  })
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
  for (const route of ROUTES) {
    await ready(page, route)
    await page.locator('main input[type="range"]').first().focus()
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(600)
  }
  expect(problems).toEqual([])
})

test('never scrolls the page sideways (tables and charts scroll inside their own box)', async ({ page }) => {
  test.setTimeout(240_000)
  for (const route of ROUTES) {
    await ready(page, route)
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
    expect(scrollWidth, route).toBeLessThanOrEqual(clientWidth)
  }
})

test('buttons, sliders, selects and summaries on the dashboards are at least 44 px high', async ({ page }) => {
  test.setTimeout(240_000)
  for (const route of ROUTES) {
    await ready(page, route)
    for (const control of await page.locator('main button, main input[type="range"], main select, main summary').all()) {
      if (!(await control.isVisible())) continue
      const box = await control.boundingBox()
      expect(box.height, `${route}: ${await control.evaluate((node) => node.outerHTML.slice(0, 90))}`).toBeGreaterThanOrEqual(43.5)
    }
  }
})

test('the simulation engine and the models load lazily: they are not in the first chunks of the home page, and a dashboard fetches its own chunk after its heading', async ({ page }) => {
  const scripts = new Set()
  page.on('request', (request) => {
    if (request.resourceType() === 'script') scripts.add(new URL(request.url()).pathname)
  })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.waitForLoadState('networkidle')
  const home = [...scripts]
  expect(home.filter((path) => /gut-run|histamine-run|b6-run|bile-run|methylation|gastric|parameters-b/.test(path))).toEqual([])
  for (const path of home) {
    const body = await (await page.request.get(path)).text()
    expect(body, `${path} carries a model`).not.toMatch(/k_pump_rec|vmax_hnmt_s|kplp_cbs|rate_gly_diet/)
  }
  await page.goto('/#/dash/gut-acid')
  await expect(page.getByRole('heading', { level: 1, name: 'Gut, acid and belching' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'What the model says' })).toBeVisible({ timeout: 60_000 })
  expect([...scripts].some((path) => /gut-run/.test(path))).toBe(true)
})

test('keyboard only: set the PPI to 60% and read the time with pH below 4', async ({ page }) => {
  await page.goto('/#/dash/gut-acid')
  await expect(page.getByRole('heading', { level: 1, name: 'Gut, acid and belching' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'What the model says' })).toBeVisible({ timeout: 60_000 })
  // The tile prints its label and then its value; read both from the page text so the check does not depend on the tile markup.
  const main = page.locator('main')
  await expect(main).toContainText(/Time with stomach pH below 4\D{0,30}7\.2\s*h of 8/)

  // Tab to the PPI slider: skip link, navigation, the situation picker, then the first slider.
  let presses = 0
  while (presses < 30) {
    if (await page.evaluate(() => document.activeElement?.id === 'gut-ppi')) break
    await page.keyboard.press('Tab')
    presses += 1
  }
  await expect(page.getByLabel('PPI: acid pumps blocked')).toBeFocused()
  console.log(`MEASURE PPI slider reached with ${presses} Tab presses`)
  expect(presses).toBeLessThanOrEqual(14)

  for (let i = 0; i < 12; i += 1) await page.keyboard.press('ArrowRight') // 5% a press: 0 to 60%
  await expect(page.getByLabel('PPI: acid pumps blocked')).toHaveValue('60')
  await expect(page.getByLabel('PPI, 60% of pumps blocked')).toBeChecked() // the controls now equal that situation

  // The model re-runs (about half a second) and the tile reads the new time below pH 4: 3.9 or 4.0 h of 8 against 7.2 before.
  await expect(main).toContainText(/Time with stomach pH below 4\D{0,30}(3\.9|4\.0)\s*h of 8/, { timeout: 30_000 })
  await expect(main).toContainText(/Median pH\D{0,30}4\.\d/)
})

test('keyboard only: choose a hypothesis link of the causal map and follow it to the claim that backs it', async ({ page }) => {
  await ready(page, '/#/dash/gut-acid')
  const link = page.getByRole('link', { name: 'See the claim: Glycine powder to Belching' })
  await link.focus()
  await expect(link).toBeFocused()
  await expect(link.locator('xpath=ancestor::li')).toContainText('Unsupported')
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/evidence\/claim\/glycine-powder-low-dose-belching-reports$/)
})
