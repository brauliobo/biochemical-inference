import { expect, test } from '@playwright/test'

test('loads provenance, runs baseline, compares reduced MTHFR, and inspects homocysteine', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Verified knowledge workspace' })).toBeVisible()
  await expect(page.locator('.provenance-grid dd').filter({ hasText: /^one-carbon-(human-mouse-v1\.0\.0|demo-2026\.1)$/ })).toBeVisible()
  await expect(page.locator('.status-panel .provenance-grid .digest')).toHaveText(/^sha256:[a-f0-9]{64}$/)
  await page.getByText('Build provenance', { exact: true }).click()
  await expect(page.getByText('Recipe', { exact: true })).toBeVisible()
  await expect(page.getByText('Source lock', { exact: true })).toBeVisible()
  await expect(page.getByText('normalized-json 1.0.0')).toBeVisible()
  await expect(page.getByText('mvp-scientific 1.0.0')).toBeVisible()
  await expect(page.getByText('Source namespaces')).toBeVisible()
  await expect(page.getByText('License IDs')).toBeVisible()
  await expect(page.locator('.source-objects article')).toHaveCount(7)
  await expect(page.getByLabel('Taxon and protein evidence')).toContainText('Human')
  await expect(page.getByLabel('Taxon and protein evidence')).toContainText('Mouse')

  await page.getByRole('button', { name: 'Run deterministic model' }).click()
  await expect(page.getByText('Stable run identity')).toBeVisible()
  const baselineRunId = await page.locator('.run-header code').textContent()
  await expect(page.getByText('Integration diagnostics')).toBeVisible()
  await expect(page.getByText('Final concentration and flux values')).toBeVisible()

  await page.getByLabel('Perturbation preset').selectOption('reduced-mthfr')
  await page.getByRole('button', { name: 'Run deterministic model' }).click()
  await expect(page.getByText('Reduced-MTHFR directional comparison')).toBeVisible()
  await expect(page.getByText(/Homocysteine is higher and the SAM:SAH ratio is lower/)).toBeVisible()
  await expect(page.locator('.run-header code')).not.toHaveText(baselineRunId ?? '')

  await page.getByRole('button', { name: /CHEBI:58199/ }).click()
  await expect(page.getByText('Final model value')).toBeVisible()
  await expect(page.getByRole('img', { name: /Homocysteine concentration over time/ })).toBeVisible()
})

test('explores human atlas traversal, identity ambiguity, mouse orthology, gaps, and species isolation', async ({ page }) => {
  await page.goto('/')

  const atlas = page.locator('.atlas-panel')
  await expect(atlas.getByRole('heading', { name: 'MTHFR evidence atlas' })).toBeVisible()
  await expect(atlas.getByText('contextual-mthfr-human-mouse-v2.0.0')).toBeVisible()
  await expect(atlas.locator('.digest')).toHaveText('sha256:79c9cb88780e71898b1efa7470ef314d5de5ff8ca89815f461b381cfa6b2d65f')
  await expect(atlas.locator('.atlas-entity-list')).toContainText('HGNC:7436')
  await expect(atlas.locator('.atlas-entity-list')).not.toContainText('MGI:106639')
  await expect(atlas.getByText(/Ambiguous candidates: UniProtKB:P42898-1, UniProtKB:P42898-2/)).toBeVisible()

  await page.getByLabel('Taxon and protein evidence').selectOption('10090')
  await expect(atlas.locator('.atlas-provenance')).toContainText('Mouse · Mus musculus')
  await expect(atlas.locator('.atlas-entity-list')).toContainText('MGI:106639')
  await expect(atlas.locator('.atlas-entity-list')).not.toContainText('HGNC:7436')
  await expect(atlas.locator('.derivation-orthology-transferred').first()).toBeVisible()
  await expect(atlas.getByText('Unknown / measured gap · isoform')).toBeVisible()
  await expect(atlas.getByText('Unknown / measured gap · disease')).toBeVisible()
  await expect(atlas.getByText('Unknown / measured gap · cell')).toBeVisible()

  const transformation = atlas.locator('.transformation-details').first()
  await transformation.locator('summary').click()
  await expect(transformation).toContainText('orthology')
  await expect(transformation).toContainText(/not direct mouse|taxon-neutral|related rather than an identity mapping/)

  await atlas.getByLabel('Seed CURIE or unique label').fill('Mthfr')
  await atlas.getByLabel('Seed CURIE or unique label').press('Enter')
  await expect(atlas.locator('.atlas-entity-list')).toContainText('MGI:106639')
})

test('fails atlas verification visibly on a browser digest mismatch without disabling simulation', async ({ page }) => {
  await page.route('**/api/v2/releases', async (route) => {
    const response = await route.fetch()
    const payload = await response.json()
    await route.fulfill({ response, json: payload.map((release) => ({ ...release, digest: `sha256:${'0'.repeat(64)}` })) })
  })
  await page.goto('/')

  const atlas = page.locator('.atlas-panel')
  await expect(atlas.getByText('Context atlas unavailable')).toBeVisible()
  await expect(atlas.getByText('Atlas manifest does not match the independently verified release and digest.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Run deterministic model' })).toBeEnabled()
})

test('rejects mismatched browser provenance without overstating reproducibility', async ({ page }) => {
  await page.route('**/api/v1/releases/*/provenance', async (route) => {
    const response = await route.fetch()
    const payload = await response.json()
    await route.fulfill({ response, json: { ...payload, releaseDigest: `sha256:${'0'.repeat(64)}` } })
  })
  await page.goto('/')

  await expect(page.getByText('Build provenance unavailable')).toBeVisible()
  await expect(page.getByText('Build provenance does not match the verified release and digest.')).toBeVisible()
  await expect(page.getByText('Reproducibility is not established from the information currently available.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Run deterministic model' })).toBeEnabled()
})

test('validates controls before sending a simulation request', async ({ page }) => {
  let simulationRequests = 0
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/simulations')) simulationRequests += 1
  })
  await page.goto('/')
  await page.getByLabel('Duration', { exact: true }).fill('100')
  await page.getByRole('button', { name: 'Run deterministic model' }).click()

  await expect(page.getByText('Enter a duration from 1 to 72 hours.')).toBeVisible()
  expect(simulationRequests).toBe(0)
})

test('has no essential horizontal overflow at 360px', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Run deterministic model' })).toBeVisible()
  await expect(page.locator('.atlas-panel').getByRole('button', { name: 'Traverse bounded graph' })).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})

test('supports the complete mobile post-run inspection workflow', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-specific workflow')
  await page.goto('/')
  await page.getByRole('button', { name: 'Run deterministic model' }).click()
  await expect(page.getByText('Stable run identity')).toBeVisible()

  await page.getByRole('button', { name: /Homocysteine.*CHEBI:58199/ }).click()
  await expect(page.getByText('Final model value')).toBeVisible()
  await expect(page.getByRole('img', { name: /Homocysteine concentration over time/ })).toBeVisible()
  await expect(page.getByText('Net represented-pool change')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  const overflowing = await page.evaluate(() => [...document.querySelectorAll('body *')]
    .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
    .map((element) => ({ tag: element.tagName, className: element.className.toString(), right: Math.round(element.getBoundingClientRect().right), scrollWidth: element.scrollWidth }))
    .sort((a, b) => b.right - a.right)
    .slice(0, 10))
  expect(overflow, JSON.stringify(overflowing)).toBeLessThanOrEqual(1)
})
