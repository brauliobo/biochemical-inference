import { expect, test } from '@playwright/test'

test('runs APAP with inspectable outputs, unsupported validation, and limiting diagnostics', async ({ page }) => {
  await page.goto('/')
  const workbench = page.locator('.apap-panel')
  await expect(workbench.getByRole('heading', { name: 'APAP benchmark workbench' })).toBeVisible()
  await expect(workbench.getByLabel('Persistent APAP scientific warning')).toContainText('Synthetic')
  await expect(workbench.getByText('Bounded synthetic human PK demonstration')).toBeVisible()
  await expect(workbench.getByText('Bounded synthetic mouse toxic-dose demonstration')).toBeVisible()
  await expect(workbench.getByText('Bounded synthetic delayed NAC demonstration')).toBeVisible()
  await expect(workbench.locator('.unsupported-badge')).toHaveCount(4)

  const responsePromise = page.waitForResponse((response) => response.url().endsWith('/api/v4/apap/runs') && response.request().method() === 'POST')
  await workbench.getByRole('button', { name: 'Run APAP benchmark' }).click()
  const response = await responsePromise
  expect(response.ok(), await response.text()).toBe(true)
  await expect(workbench.getByText('Canonical APAP run identity')).toBeVisible()
  await expect(workbench.getByRole('group', { name: /adduct across 12 portal-to-central lobule bins/ })).toBeVisible()
  await expect(workbench.getByText('Pass · zero-cyp')).toBeVisible()
  await expect(workbench.getByText('Pass · zero-binding')).toBeVisible()
  await expect(workbench.getByText('Pass · uniform-zonation')).toBeVisible()
  await expect(workbench.getByText(/Accessible lobule state/)).toBeVisible()
})

test('compares visible human and mouse bindings without taxon equation branches', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Covered by the desktop context-comparison workflow')
  await page.goto('/')
  const workbench = page.locator('.apap-panel')
  await workbench.getByRole('button', { name: 'Run APAP benchmark' }).click()
  await expect(workbench.getByText('Canonical APAP run identity')).toBeVisible()
  await workbench.getByRole('button', { name: /Mus musculus/ }).click()
  await workbench.getByRole('button', { name: 'Run APAP benchmark' }).click()
  await expect(workbench.getByText('Exact effective human/mouse parameter differences')).toBeVisible()
  await expect(workbench.getByText('Differences arise from visible context bindings, not taxon branches')).toBeVisible()
  await expect(workbench.getByRole('row', { name: /cypRate/ })).toBeVisible()
})

test('keeps the complete APAP semantic workflow usable at 360px', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-specific APAP workflow')
  await page.goto('/')
  const workbench = page.locator('.apap-panel')
  await workbench.getByRole('button', { name: 'Run APAP benchmark' }).click()
  await expect(workbench.getByText(/Accessible lobule state/)).toBeVisible()
  await expect(workbench.getByText('Systemic time series')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})
