import { expect, test } from '@playwright/test'

test('runs the pinned synthetic parameter study with inspectable partition and diagnostics', async ({ page }) => {
  await page.goto('/#/workbench/full')
  const workbench = page.locator('.parameter-study-panel')
  await expect(workbench.getByRole('heading', { name: 'Synthetic decay inference study' })).toBeVisible()
  await expect(workbench.getByText('CANDIDATE:DECAY-INCOMPATIBLE-UNIT')).toBeVisible()
  await expect(workbench.getByText('Calibration IDs (5)')).toBeVisible()
  await expect(workbench.getByText('Held-out validation IDs (3)')).toBeVisible()

  const responsePromise = page.waitForResponse((response) => response.url().endsWith('/api/v2/studies') && response.request().method() === 'POST')
  await workbench.getByRole('button', { name: 'Run inference study' }).click()
  const response = await responsePromise
  expect(response.ok(), await response.text()).toBe(true)
  await expect(workbench.getByText('0.10000000')).toBeVisible()
  await expect(workbench.getByText('identifiable')).toBeVisible()
  await expect(workbench.getByText(/3\/3 held-out observations covered/)).toBeVisible()
  await expect(workbench.getByText('Robustness matrix · robust')).toBeVisible()
  await expect(workbench.getByText(/terminal · successful/).first()).toBeVisible()
})

test('downgrades the robustness conclusion for an explicit misspecified model alternative', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Covered by the desktop stress workflow')
  await page.goto('/#/workbench/full')
  const workbench = page.locator('.parameter-study-panel')
  await workbench.getByLabel('Include misspecified offset model (assumption stress)').check()
  await workbench.getByRole('button', { name: 'Run inference study' }).click()
  await expect(workbench.getByText('Robustness matrix · downgraded')).toBeVisible()
  await expect(workbench.getByRole('row', { name: /structural-offset-stress/ })).toContainText('no')
})

test('keeps the complete parameter study audit usable on mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-specific parameter study workflow')
  await page.goto('/#/workbench/full')
  const workbench = page.locator('.parameter-study-panel')
  await workbench.getByRole('button', { name: 'Run inference study' }).click()
  await expect(workbench.getByText(/3\/3 held-out observations covered/)).toBeVisible()
  await expect(workbench.getByText('Parameter, solver, timestep, and model-form variation')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})
