import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

// The visual entity pages in a real browser: accessibility in light and dark (the mobile project repeats it at
// 360 px), no sideways scrolling at 320 px, keyboard operation of the type listing, and the performance contract
// that the entity page, its maps and the kinetic parameters are separate lazy chunks that Home never loads.
//
//   npm run build:static && npm run test:e2e:static
const ENTITIES = [
  '/#/kb/compound/glycine',
  '/#/kb/compound/choline',
  '/#/kb/enzyme/gnmt',
  '/#/kb/reaction/gnmt-glycine-methylation',
  '/#/kb/pathway/methionine-cycle',
  '/#/kb/state/undermethylation',
  '/#/kb/disease/lpr',
  '/#/kb/outcome/belching',
  '/#/kb/system/vagal-tone',
  '/#/kb/intervention/glycine-powder',
  '/#/kb/intervention/choline-bitartrate'
]
const LISTINGS = ['/#/kb/compound', '/#/kb/reaction', '/#/kb/enzyme?sort=linked', '/#/kb/state', '/#/kb/claim?status=unsupported']
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']
const settle = (page) => page.waitForLoadState('networkidle')

for (const colorScheme of ['light', 'dark']) {
  test(`has no WCAG 2.2 AA violations on the visual entity pages and listings (${colorScheme})`, async ({ page }) => {
    test.setTimeout(240_000)
    await page.emulateMedia({ colorScheme })
    for (const route of [...ENTITIES, ...LISTINGS]) {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await settle(page)
      await page.waitForTimeout(400)
      const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
      expect(violations.map((violation) => `${route}: ${violation.id} (${violation.nodes.length}) ${violation.nodes[0]?.target.join(' ')}`)).toEqual([])
    }
  })
}

test('an entity page with every disclosure open (provenance, notes, signed-link table) has no violations', async ({ page }) => {
  await page.goto('/#/kb/enzyme/gnmt')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await settle(page)
  for (const summary of await page.locator('main details > summary').all()) await summary.click()
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  expect(violations.map((violation) => `${violation.id} (${violation.nodes.length}) ${violation.nodes[0]?.target.join(' ')}`)).toEqual([])
})

test('visual entity pages do not scroll sideways at 320 CSS px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  const overflowing = []
  for (const route of [...ENTITIES, ...LISTINGS]) {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await settle(page)
    const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
    if (widths.scroll > widths.client) overflowing.push(`${route}: ${widths.scroll} > ${widths.client}`)
  }
  expect(overflowing).toEqual([])
})

test('the entity page and its heavy parts are lazy: Home loads none of them, each page loads only what it draws', async ({ page }) => {
  const loaded = new Set()
  page.on('response', (response) => {
    const name = new URL(response.url()).pathname.split('/').pop()
    if (name.endsWith('.js')) loaded.add(name.replace(/-[A-Za-z0-9_-]{8}\.js$/, ''))
  })
  const has = (pattern) => [...loaded].some((name) => pattern.test(name))

  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await settle(page)
  // The home page draws the metabolic map hero (MetabolicMap and the core-methylation layout, lazily after the first heading;
  // docs/DASHBOARDS.md), so those two are expected there. Entity pages, the atlas, the layered graph and the kinetic parameters are not.
  expect(has(/Template|KbEntityView|AtlasView|AtlasCausalView|LayeredGraph|parameters-b[12]/), `Home loaded: ${[...loaded].join(', ')}`).toBe(false)

  await page.goto('/#/kb/compound/glycine')
  await expect(page.getByRole('heading', { level: 1, name: 'Glycine' })).toBeVisible()
  await expect(page.locator('[data-visual="metabolic-map"]')).toBeVisible()
  await settle(page)
  expect(has(/CompoundTemplate/)).toBe(true)
  expect(has(/core-methylation/)).toBe(true)
  expect(has(/parameters-b[12]/), 'a compound page does not need kinetic parameters').toBe(false)
  expect(has(/AtlasView|AtlasCausalView/)).toBe(false)

  await page.goto('/#/kb/enzyme/gnmt')
  await expect(page.getByRole('heading', { level: 1, name: /Glycine N-methyltransferase/ })).toBeVisible()
  await expect(page.getByTestId('mm-explorer')).toBeVisible()
  await settle(page)
  expect(has(/EnzymeTemplate/)).toBe(true)
  expect(has(/parameters-b[12]/)).toBe(true)
})

test('the type listing sorts from the keyboard and announces the sort', async ({ page }) => {
  await page.goto('/#/kb/compound')
  await expect(page.getByRole('heading', { level: 1, name: 'Compounds' })).toBeVisible()
  const links = page.getByRole('columnheader', { name: /Links/ })
  await links.getByRole('button').focus()
  await page.keyboard.press('Enter')
  await expect(links).toHaveAttribute('aria-sort', 'descending')
  await page.keyboard.press('Enter')
  await expect(links).toHaveAttribute('aria-sort', 'ascending')
  expect(new URL(page.url()).hash).toBe('#/kb/compound?sort=linked&dir=asc')
})

test('a key number opens to its source from the keyboard', async ({ page }) => {
  await page.goto('/#/kb/compound/choline')
  await expect(page.getByRole('heading', { level: 1, name: 'Choline' })).toBeVisible()
  const chip = page.locator('details.provenance').filter({ hasText: 'Molar mass' }).first()
  await chip.locator('summary').focus()
  await page.keyboard.press('Enter')
  await expect(chip.locator('.provenance__body')).toBeVisible()
})

test('the enzyme kinetics explorer responds to its sliders and states that it is illustrative', async ({ page }) => {
  await page.goto('/#/kb/enzyme/gnmt')
  const explorer = page.getByTestId('mm-explorer')
  await expect(explorer).toBeVisible()
  await expect(explorer).toContainText('Illustrative model')
  const sentence = explorer.locator('p[role="status"]')
  const before = await sentence.textContent()
  await explorer.locator('#mm-substrate').focus()
  for (let press = 0; press < 12; press += 1) await page.keyboard.press('ArrowRight')
  await expect(sentence).not.toHaveText(before)
})
