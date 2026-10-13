import { expect, test } from '@playwright/test'

test('verifies corrected Learn2Reg attribution, residual overlap, ROI-independent transforms, and offline replay', async ({ page }) => {
  test.setTimeout(240_000)
  await page.goto('/#/workbench/full')
  const workbench = page.getByRole('region', { name: 'Learn2Reg MR–CT prealigned pair' })
  await expect(workbench).toBeVisible()

  const sync = workbench.getByTestId('spatial-registration-sync')
  if (await sync.isVisible().catch(() => false)) await sync.click()
  await expect(workbench.getByText('Verified local registration ready')).toBeVisible({ timeout: 120_000 })
  await expect(workbench).toContainText('Goal 14 remains active')
  await expect(workbench).toContainText('Creative Commons Attribution 3.0 Unported')
  await expect(workbench).toContainText('deterministic chunking and compression')
  await expect(workbench).toContainText('repository software remains under its own license')
  await expect(workbench).toContainText('Source-prealigned, not recovered affine')
  await expect(workbench.locator('canvas')).toHaveCount(0)

  if (await workbench.getByText(/residual overlap pending/).isVisible().catch(() => false)) {
    await workbench.getByTestId('spatial-registration-residual-overlap').click()
    await expect(workbench).toContainText('residual overlap recomputed', { timeout: 120_000 })
  }
  await expect(workbench.getByRole('row', { name: /left kidney/ })).toContainText('not evaluable')
  await expect(workbench.getByRole('row', { name: /left kidney/ })).toContainText('18,285 / 0')

  await workbench.getByTestId('spatial-registration-transform').click()
  const transformed = workbench.getByTestId('spatial-registration-transform-result')
  await expect(transformed).toContainText('192, 160, 192')
  await expect(transformed).toContainText('inside (metric scope only)')

  await workbench.getByLabel('X mm').fill('0')
  await workbench.getByLabel('Y mm').fill('0')
  await workbench.getByLabel('Z mm').fill('0')
  await workbench.getByTestId('spatial-registration-transform').click()
  await expect(transformed).toContainText('outside (metric scope only)')
  await expect(transformed).toContainText('0, 0, 0')

  await workbench.getByLabel('X mm').fill('1')
  await workbench.getByTestId('spatial-registration-transform').click()
  await expect(transformed).toContainText('not-assessed-off-grid (metric scope only)')
  await workbench.getByTestId('spatial-registration-reverse').click()
  await workbench.getByTestId('spatial-registration-transform').click()
  await expect(transformed).toContainText('inverse')
  await expect(transformed).toContainText('1, 0, 0')

  const sameSpace = await page.evaluate(async () => {
    const response = await fetch('/api/v14/spatial-registration/transform', { method: 'POST', headers: { 'content-type': 'application/json', 'x-spatial-registration-csrf': 'goal14-spatial-registration-v1' }, body: JSON.stringify({ sourceSpaceId: 'SPACE:L2R-ABDOMEN-MRCT-0001-CT-PREALIGNED', targetSpaceId: 'SPACE:L2R-ABDOMEN-MRCT-0001-CT-PREALIGNED', pointXyzMm: [0, 0, 0] }) })
    return { status: response.status, body: await response.json() }
  })
  expect(sameSpace).toMatchObject({ status: 422, body: { code: 'SPATIAL_REGISTRATION_SAME_SPACE_REQUEST' } })

  await workbench.getByTestId('spatial-registration-chunk').click()
  await expect(workbench).toContainText('arrays/evaluation-roi/0/0.0.0')

  if (await workbench.getByText(/offline incomplete/).isVisible().catch(() => false)) {
    await workbench.getByTestId('spatial-registration-complete').click()
    await expect(workbench).toContainText('offline complete', { timeout: 180_000 })
  }
  await workbench.getByTestId('spatial-registration-integrity').click()
  await expect(workbench.getByTestId('spatial-registration-offline-result')).toContainText('disabled')

  await page.reload()
  await expect(workbench.getByText('Verified local registration ready')).toBeVisible({ timeout: 60_000 })
  await expect(workbench).toContainText('residual overlap recomputed')
  await expect(workbench).toContainText('offline complete')
})
