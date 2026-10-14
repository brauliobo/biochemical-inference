import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// The atlas (/#/atlas): accessibility of each view in light and dark (the mobile project runs the same specs at
// 360 px), reflow at 320 px, and the keyboard task "from the Atlas find what mitigates belching and open it".
//
//   npm run build:static && npm run test:e2e:static
const ROUTES = [
  '/#/atlas',
  '/#/atlas?from=compound&to=enzyme',
  '/#/atlas/causal',
  '/#/atlas/causal?focus=outcome:belching',
  '/#/atlas/causal?topic=hub:state:undermethylation&sign=mitigate',
  '/#/atlas/network',
  '/#/atlas/network?map=gastric-acid',
  '/#/atlas/search?q=gnmt'
]
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const settle = (page) => page.waitForLoadState('networkidle')

for (const colorScheme of ['light', 'dark']) {
  test(`has no WCAG 2.2 AA violations on any atlas view (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme })
    for (const route of ROUTES) {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await settle(page)
      await page.waitForTimeout(400)
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
      expect(violations.map((violation) => `${route}: ${violation.id} (${violation.nodes.length}) ${violation.nodes[0]?.target.join(' ')}`)).toEqual([])
    }
  })
}

test('the atlas pages do not scroll sideways at 320 CSS px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  const overflowing = []
  for (const route of ROUTES) {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await settle(page)
    const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
    if (widths.scroll > widths.client) overflowing.push(`${route}: ${widths.scroll} > ${widths.client}`)
  }
  expect(overflowing).toEqual([])
})

test('keyboard task: from the Atlas find what mitigates belching and open it, without a pointer', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  let presses = 0
  const press = async (key) => {
    await page.keyboard.press(key)
    presses += 1
  }
  const tabTo = async (matches, limit = 60) => {
    for (let count = 0; count < limit; count += 1) {
      await press('Tab')
      if (await page.evaluate(matches)) return
    }
    throw new Error(`no matching control within ${limit} Tab presses`)
  }

  // Atlas in the primary navigation, then the causal map
  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Atlas', exact: true }).focus()
  await press('Enter')
  await expect(page.getByRole('heading', { level: 1, name: 'Atlas' })).toBeVisible()
  await expect(page.getByRole('main')).toBeFocused()
  await tabTo(() => document.activeElement?.getAttribute('href') === '#/atlas/causal')
  await press('Enter')
  await expect(page.getByRole('heading', { level: 1, name: 'Causal map' })).toBeVisible()

  // focus the search box, ask for belching, take the first match
  await tabTo(() => document.activeElement?.id?.startsWith('search') === true)
  await page.keyboard.type('belching')
  await page.keyboard.press('Enter') // chooses the best match
  presses += 9
  await expect(page.getByRole('heading', { level: 2, name: 'Belching (eructation)' })).toBeVisible()
  expect(new URL(page.url()).hash).toBe('#/atlas/causal?focus=outcome%3Abelching')

  // keep only what eases it, with the sign filter (a native select)
  await page.getByLabel('Sign').selectOption('mitigate')
  presses += 1
  const table = page.getByTestId('atlas-links').getByRole('table')
  const rows = table.getByRole('row')
  await expect(rows.nth(1)).toContainText('Mitigates')
  const count = await rows.count()
  for (let index = 1; index < count; index += 1) await expect(rows.nth(index)).toContainText('Mitigates')

  // open the first helper with Tab and Enter
  await tabTo(() => document.activeElement?.closest('[data-testid="atlas-links"] tbody') !== null && document.activeElement?.tagName === 'A')
  const href = await page.evaluate(() => document.activeElement.getAttribute('href'))
  expect(href).toMatch(/^#\/kb\/(intervention|compound|enzyme|pathway|state)\//)
  await press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(new URL(page.url()).hash).toBe(href)
  test.info().annotations.push({ type: 'measure', description: `keyboard presses, Atlas to what mitigates belching = ${presses}` })
  console.log(`MEASURE [${test.info().project.name}] keyboard presses from Home to the page of what mitigates belching = ${presses}`)
})

test('choosing a node of the causal map shows its card and the link to its page', async ({ page }) => {
  await page.goto('/#/atlas/causal?topic=hub:state:undermethylation')
  await expect(page.getByRole('heading', { level: 1, name: 'Causal map' })).toBeVisible()
  const graph = page.getByRole('group', { name: /causal map: graph with/ })
  await graph.focus()
  await page.keyboard.press('Home')
  await page.keyboard.press('Enter')
  const card = page.getByTestId('mini-card')
  await expect(card).toBeVisible()
  await expect(card.getByRole('link', { name: /^Open page: / })).toBeVisible()
})

test('the metabolic network offers a reaction card with its equation, enzyme and a link to the page', async ({ page }) => {
  await page.goto('/#/atlas/network')
  await expect(page.getByRole('heading', { level: 1, name: 'Metabolic network' })).toBeVisible()
  const map = page.getByRole('group', { name: /metabolic map with/ })
  await map.focus()
  await page.keyboard.press('Enter')
  const card = page.getByTestId('mini-card')
  await expect(card).toBeVisible()
  await expect(card.getByRole('link', { name: /^Open page: / })).toBeVisible()
})
