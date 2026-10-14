import { gzipSync } from 'node:zlib'
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// The home page and the simulator dashboards (docs/DASHBOARDS.md), against the static build: accessibility in light, dark and on a
// phone, no console errors, no sideways scrolling, 44 px controls, the uncertainty worker, the home JavaScript budget and the
// keyboard-only task "pick the glycine 10 g scenario on Methylation balance and read the SAM:SAH tile".
const ROUTES = ['/#/', '/#/dashboards', '/#/dash/methylation', '/#/dash/methylation?scenario=niacin-2g', '/#/dash/glycine', '/#/dash/choline']
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const ready = async (page) => {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.waitForLoadState('networkidle')
  await expect(page.locator('main .dash-skeleton')).toHaveCount(0, { timeout: 15_000 })
}

// Opens every closed disclosure that can be seen, nested ones included (a nested summary only appears once its parent is open).
async function openAllDisclosures(page) {
  for (let round = 0; round < 20; round += 1) {
    const closed = page.locator('main details:not([open]) > summary:visible')
    if (!(await closed.count())) return
    await closed.first().click()
  }
}

for (const colorScheme of ['light', 'dark']) {
  test(`has no WCAG 2.2 AA violations on the home page and the dashboards (${colorScheme})`, async ({ page }) => {
    test.setTimeout(150_000)
    await page.emulateMedia({ colorScheme })
    for (const route of ROUTES) {
      await page.goto(route)
      await ready(page)
      await page.waitForTimeout(400) // the hero map and the thumbnails load after the page is idle
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
      expect(violations.map((violation) => `${route}: ${violation.id} (${violation.nodes.length})`)).toEqual([])
    }
  })
}

test('has no violations with the disclosures of a dashboard open', async ({ page }) => {
  await page.goto('/#/dash/methylation')
  await ready(page)
  await openAllDisclosures(page)
  await page.waitForLoadState('networkidle')
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  expect(violations.map((violation) => `${violation.id} (${violation.nodes.length})`)).toEqual([])
})

test('logs no console error or warning and makes no failed request on any of them', async ({ page }) => {
  const problems = []
  page.on('console', (message) => { if (['error', 'warning'].includes(message.type())) problems.push(`${message.type()}: ${message.text()}`) })
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
  page.on('requestfailed', (request) => problems.push(`failed: ${request.url()}`))
  page.on('response', (response) => { if (response.status() >= 400) problems.push(`${response.status()}: ${response.url()}`) })
  for (const route of ROUTES) {
    await page.goto(route)
    await ready(page)
    await page.waitForTimeout(600)
  }
  expect(problems).toEqual([])
})

test('never scrolls the page sideways', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route)
    await ready(page)
    await page.waitForTimeout(400)
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
    expect(scrollWidth, route).toBeLessThanOrEqual(clientWidth)
  }
})

test('buttons, sliders, presets and summaries on the dashboards are at least 44 px high', async ({ page }) => {
  for (const route of ['/#/dash/methylation', '/#/dash/glycine', '/#/dash/choline']) {
    await page.goto(route)
    await ready(page)
    await openAllDisclosures(page)
    for (const control of await page.locator('main button, main summary, main input[type="range"], main label.dash-preset, main a.button').all()) {
      if (!(await control.isVisible())) continue
      const box = await control.boundingBox()
      expect(box.height, `${route}: ${await control.evaluate((node) => node.outerHTML.slice(0, 90))}`).toBeGreaterThanOrEqual(43.5)
    }
  }
})

test('the home page loads at most 100 kB of gzipped JavaScript before its first heading and no simulator at all', async ({ page }) => {
  const scripts = new Map()
  const reading = []
  let counting = true
  page.on('response', (response) => {
    if (!counting || !/\.js(\?|$)/.test(response.url()) || response.status() !== 200) return
    reading.push(response.body().then((body) => scripts.set(response.url(), gzipSync(body).length), () => {}))
  })
  await page.goto('/#/')
  await expect(page.getByRole('heading', { level: 1, name: 'Methylation, visualised' })).toBeVisible()
  counting = false // what arrives from here on is the lazy part: the knowledge data and the hero map
  await Promise.all(reading)
  const loaded = [...scripts.entries()]
  const total = loaded.reduce((sum, [, bytes]) => sum + bytes, 0)
  console.log(`MEASURE [${test.info().project.name}] home JS before the first heading = ${(total / 1024).toFixed(1)} kB gzip in ${loaded.length} files`)
  expect(total / 1024).toBeLessThanOrEqual(100)
  // after everything has settled the home page still has not fetched the simulator, the literature tables or the worker
  const names = []
  page.on('response', (response) => { if (/\.js(\?|$)/.test(response.url())) names.push(response.url().split('/').pop()) })
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Methylation, visualised' })).toBeVisible()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(2500)
  for (const pattern of [/^parameters-b/, /^methylation-run/, /^ensemble/, /^useModelRun/, /^MethylationBalance/, /^calculators/]) expect(names.filter((name) => pattern.test(name)), String(pattern)).toEqual([])
  expect(names.some((name) => /^core-methylation/.test(name))).toBe(true) // the hero map did load
  await expect(page.locator('figure[aria-labelledby="home-map-caption"]')).toBeVisible()
})

test('the uncertainty switch runs the ensemble in a worker and draws the ribbons', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('/#/dash/methylation?scenario=niacin-500mg')
  await ready(page)
  const summary = page.locator('summary', { hasText: 'Scenario and controls' })
  if (!(await page.locator('details[open] > summary', { hasText: 'Scenario and controls' }).count())) await summary.click()
  await page.getByLabel('Show parameter uncertainty').check()
  await expect(page.getByText(/^Ribbons: 5th to 95th percentile of the response over \d+ parameter sets/)).toBeVisible({ timeout: 60_000 })
  await expect(page.locator('figure[aria-labelledby="dash-time-chart-caption"]')).toBeVisible()
  await expect(page.locator('figure[aria-labelledby="dash-time-chart-caption"] path.viz-ribbon').first()).toBeAttached()
  // switching it off removes the note
  await page.getByLabel('Show parameter uncertainty').uncheck()
  await expect(page.getByText(/^Ribbons:/)).toHaveCount(0)
})

test('keyboard only: on Methylation balance pick the glycine 10 g scenario and read the SAM:SAH tile', async ({ page }) => {
  await page.goto('/#/dash/methylation?scenario=baseline-fed')
  await ready(page)
  const tile = page.getByTestId('tile-samSahRatio')
  await expect(tile).toContainText('6.16')
  await expect(tile).toContainText('unchanged')

  // Tab to the scenario radio group (opening the controls first on a phone, where they start closed).
  let presses = 0
  while (presses < 60) {
    await page.keyboard.press('Tab')
    presses += 1
    const active = await page.evaluate(() => ({ tag: document.activeElement?.tagName, type: document.activeElement?.type, text: document.activeElement?.textContent ?? '', open: document.activeElement?.parentElement?.open }))
    if (active.tag === 'SUMMARY' && /^Scenario and controls/.test(active.text) && !active.open) await page.keyboard.press('Enter')
    if (active.tag === 'INPUT' && active.type === 'radio') break
  }
  console.log(`MEASURE [${test.info().project.name}] Tab presses from page load to the scenario list = ${presses}`)
  expect(presses).toBeLessThanOrEqual(30)
  await expect(page.getByRole('radio', { name: /^Baseline/ })).toBeFocused()

  for (let i = 0; i < 5; i += 1) await page.keyboard.press('ArrowDown')
  await expect(page.getByRole('radio', { name: /^Glycine 10 g \(single dose\)/ })).toBeFocused()
  await expect(page.getByRole('radio', { name: /^Glycine 10 g \(single dose\)/ })).toBeChecked()
  await expect(page).toHaveURL(/scenario=glycine-10g/)

  // The tile now shows a change and the hour of the largest change; read it aloud as a sentence.
  await expect(tile).toContainText('vs reference')
  await expect(tile).not.toContainText('unchanged')
  const sentence = (await tile.innerText()).replace(/\s+/g, ' ')
  console.log(`MEASURE [${test.info().project.name}] SAM:SAH tile reads: ${sentence}`)
  expect(sentence).toMatch(/SAM:SAH \d\.\d+ ratio [▲▼] [−+]\d/)
  await expect(page.getByText('Hypothesis', { exact: true }).first()).toBeVisible() // the evidence chip is read with the scenario
  await expect(page.getByText(/No human study measured SAM, SAH, sarcosine or SAM:SAH after glycine/)).toBeVisible()
})

test('every question card on the home page opens its dashboard', async ({ page }) => {
  await page.goto('/#/')
  await expect(page.getByRole('heading', { level: 2, name: 'Questions this site answers' })).toBeVisible()
  for (const [name, hash] of [['Who spends the methyl groups?', '#/dash/methylation'], ['Can choline replace 10 g of glycine?', '#/dash/choline']]) {
    await page.goto('/#/')
    await page.getByRole('link', { name }).click()
    expect(new URL(page.url()).hash).toBe(hash)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  }
})
