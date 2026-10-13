import { expect, test } from '@playwright/test'

test('runs the signed synthetic physiology workbench on desktop and mobile', async ({ page }) => {
  await page.goto('/#/workbench/full')
  const panel = page.locator('.physiology-panel')
  await expect(panel.getByRole('heading', { name: 'Physiology plugin workbench' })).toBeVisible()
  await expect(panel.getByText('Synthetic / non-clinical')).toBeVisible()
  await expect(panel.getByText('Certification is not scientific validation')).toBeVisible()
  await expect(panel.getByText('physiology-plugin-evidence-v1.0.0')).toBeVisible()
  await expect(panel.getByText('8f7a14db2cebe4603772146b3d1f9f2a8ccafbf2452ef5c9ff856326584fadb8')).toBeVisible()
  await expect(panel.getByText('not-certified', { exact: true })).toHaveCount(3)
  await expect(panel.getByText('signed package installed')).toHaveCount(3)

  await panel.getByRole('button', { name: 'Create exact coupling' }).click()
  await expect(panel.getByRole('heading', { name: 'Immutable coupling contract' })).toBeVisible()
  await panel.getByRole('button', { name: 'Run coupled fixture' }).click()
  await expect(panel.getByText('100 → 100 mg')).toBeVisible()
  await expect(panel.getByText('Timestep convergence').locator('..').getByText('passed')).toBeVisible()
  await expect(panel.getByRole('row', { name: '4 50 mg 30 mg 20 mg 0 mg' })).toBeVisible()

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})

test('blocks mouse extrapolation while retaining signed catalog evidence', async ({ page }) => {
  await page.goto('/#/workbench/full')
  const panel = page.locator('.physiology-panel')
  await expect(panel.getByRole('heading', { name: 'Physiology plugin workbench' })).toBeVisible()
  await panel.getByLabel('Applicability taxon').selectOption('NCBITaxon:10090')
  await panel.getByRole('button', { name: 'Create exact coupling' }).click()
  await expect(panel.getByText(/mouse extrapolation is blocked/i)).toBeVisible()
  await expect(panel.getByRole('heading', { name: 'PLUGIN:CIRCULATION-REFERENCE' })).toBeVisible()
})
