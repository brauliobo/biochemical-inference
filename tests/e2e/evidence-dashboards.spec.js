import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// The evidence dashboards (docs/EVIDENCE_DASHBOARDS.md): accessibility in light, dark and on a phone,
// no horizontal overflow, target sizes, and the keyboard-only task "find the verdict for the claim that
// free glycine stimulates gastrin". Runs against the static build.
const ROUTES = [
  '/#/evidence',
  '/#/evidence/claims',
  '/#/evidence/claims?status=unsupported&topic=gastric&sort=index',
  '/#/evidence/literature',
  '/#/evidence/literature?design=RCT&from=1990&sort=informs',
  '/#/evidence/claim/free-glycine-stimulates-gastrin',
  '/#/evidence/claim/acid-bicarbonate-reaction-gives-co2-belching',
  '/#/evidence/claim/undermethylated-hypochlorhydria',
  '/#/evidence/article/lamers-2007-glycine-flux',
  '/#/evidence/article/melendez-hevia-2009-glycine-weak-link'
]
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

for (const colorScheme of ['light', 'dark']) {
  test(`has no WCAG 2.2 AA violations on the evidence routes (${colorScheme})`, async ({ page }) => {
    test.setTimeout(120_000)
    await page.emulateMedia({ colorScheme })
    for (const route of ROUTES) {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await page.waitForLoadState('networkidle')
      await expect(page.locator('main').getByText(/^Loading the /)).toHaveCount(0)
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
      expect(violations.map((violation) => `${route}: ${violation.id} (${violation.nodes.length})`)).toEqual([])
    }
  })
}

test('has no WCAG violations with the scoring help, the notes and the timeline legend open', async ({ page }) => {
  await page.goto('/#/evidence')
  await expect(page.getByRole('button', { name: /^11 Supported/ })).toBeVisible()
  for (const summary of await page.locator('main details > summary').all()) await summary.click()
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  expect(violations.map((violation) => `${violation.id} (${violation.nodes.length})`)).toEqual([])
})

test('never scrolls the page sideways (tables and charts scroll inside their own box)', async ({ page }) => {
  for (const route of ROUTES) {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.waitForLoadState('networkidle')
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }))
    expect(scrollWidth, route).toBeLessThanOrEqual(clientWidth)
  }
})

test('buttons and fields on the evidence pages are at least 44 px high', async ({ page }) => {
  for (const route of ['/#/evidence/claims', '/#/evidence/literature']) {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.waitForLoadState('networkidle')
    for (const control of await page.locator('main button, main input:not([type="checkbox"]), main select, main summary').all()) {
      if (!(await control.isVisible())) continue
      const box = await control.boundingBox()
      expect(box.height, `${route}: ${await control.evaluate((node) => node.outerHTML.slice(0, 80))}`).toBeGreaterThanOrEqual(43.5)
    }
  }
})

test('keyboard only: find the verdict for the claim that free glycine stimulates gastrin', async ({ page }) => {
  await page.goto('/#/evidence/claims')
  await expect(page.getByRole('heading', { level: 1, name: 'Claims audit' })).toBeVisible()
  await expect(page.getByRole('button', { name: /^11 Supported/ })).toBeVisible()

  // Tab to the claim search box.
  let presses = 0
  while (presses < 25) {
    if (await page.evaluate(() => document.activeElement?.id === 'cl-q')) break
    await page.keyboard.press('Tab')
    presses += 1
  }
  await expect(page.getByLabel('Find a claim')).toBeFocused()
  console.log(`MEASURE evidence claim search reached with ${presses} Tab presses`)
  expect(presses).toBeLessThanOrEqual(14)

  await page.keyboard.type('free glycine gastrin')
  const row = page.locator('main .ev-table tbody tr:not(.ev-group)')
  await expect(row).toHaveCount(1)
  // The verdict is in the row itself: status word, evidence counts and the verdict bar's sentence.
  await expect(row).toContainText('Unsupported')
  await expect(row).toContainText('Free glycine stimulates gastrin release')
  await expect(row.locator('.visually-hidden').filter({ hasText: /against 1\.2 from 2 articles/ })).toHaveCount(1)

  // Follow the link with Enter: the claim page states the same verdict.
  for (let i = 0; i < 24; i += 1) {
    if (await page.evaluate(() => document.activeElement?.matches('.ev-table a'))) break
    await page.keyboard.press('Tab')
  }
  await expect(row.getByRole('link')).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { level: 1, name: 'Free glycine stimulates gastrin release' })).toBeVisible()
  expect(new URL(page.url()).hash).toBe('#/kb/claim/free-glycine-stimulates-gastrin')
  await expect(page.locator('main')).toContainText('Unsupported')
})

test('keyboard only: sort the audit by contradicting articles and open the first claim', async ({ page }) => {
  await page.goto('/#/evidence/claims')
  await expect(page.getByRole('button', { name: /^11 Supported/ })).toBeVisible()
  await page.getByRole('button', { name: 'Against' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('main th[aria-sort="descending"]')).toContainText('Against')
  const first = page.locator('main .ev-table tbody tr:not(.ev-group)').first()
  await expect(first.locator('td').nth(3)).toHaveText('2')
})

test('the literature filters and pages are reachable and shareable by URL', async ({ page }) => {
  // The article count comes from the data, so read it from the page instead of hard-coding it.
  const status = page.locator('main').getByRole('status').first()
  const counts = async () => {
    const [, shown, total] = (await status.textContent()).match(/Showing (\d+) of (\d+) articles/)
    return { shown: Number(shown), total: Number(total) }
  }
  await page.goto('/#/evidence/literature?design=meta-analysis')
  await expect(status).toHaveText(/Showing \d+ of \d+ articles/)
  const filtered = await counts()
  expect(filtered.shown).toBeGreaterThan(0)
  expect(filtered.shown).toBeLessThan(filtered.total)
  await page.getByLabel('Study design', { exact: true }).selectOption('')
  await expect(status).toHaveText(`Showing ${filtered.total} of ${filtered.total} articles`)
  await expect(page).toHaveURL(/#\/evidence\/literature$/)
  await page.getByRole('button', { name: 'Next' }).click()
  await expect(page).toHaveURL(/page=2/)
})

test('the coverage heatmap opens the literature for a topic and design', async ({ page }) => {
  await page.goto('/#/evidence')
  const cell = page.getByRole('gridcell', { name: /^Histamine and sleep, Meta-analysis: 0/ })
  await cell.focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#\/evidence\/literature\?topic=histamine&design=meta-analysis/)
  await expect(page.locator('main').getByRole('status').first()).toHaveText(/Showing 0 of \d+ articles/)
})
