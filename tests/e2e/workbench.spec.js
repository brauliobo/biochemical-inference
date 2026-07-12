import { expect, test } from '@playwright/test'

test('loads provenance, runs baseline, compares reduced MTHFR, and inspects homocysteine', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: 'Verified knowledge workspace' })).toBeVisible()
  await expect(page.getByText(/one-carbon-(human-mouse-v1\.0\.0|demo-2026\.1)/)).toBeVisible()
  await expect(page.getByText(/^sha256:[a-f0-9]{64}$/)).toBeVisible()
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

test('validates controls before sending a simulation request', async ({ page }) => {
  let simulationRequests = 0
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.url().includes('/simulations')) simulationRequests += 1
  })
  await page.goto('/')
  await page.getByLabel('Duration').fill('100')
  await page.getByRole('button', { name: 'Run deterministic model' }).click()

  await expect(page.getByText('Enter a duration from 1 to 72 hours.')).toBeVisible()
  expect(simulationRequests).toBe(0)
})

test('has no essential horizontal overflow at 360px', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Run deterministic model' })).toBeVisible()
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
