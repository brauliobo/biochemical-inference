import { expect, test } from '@playwright/test'

test('verifies the integrated measured liver atlas on desktop/mobile and reloads from the completed local cache', async ({ page }) => {
  test.setTimeout(240_000)
  const chunkRequests = []
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname
    if (/\/api\/v12\/measured-spatial\/chunks\/[^/]+\/\d+\/\d+\/\d+\/\d+$/.test(path)) chunkRequests.push(path)
  })

  await page.goto('/')
  const atlas = page.locator('.measured-atlas')
  await expect(atlas).toBeVisible()
  const sync = atlas.getByTestId('measured-spatial-sync')
  if (await sync.isVisible().catch(() => false)) await sync.click()
  await expect(atlas.getByText('Verified local metadata ready')).toBeVisible({ timeout: 120_000 })
  await expect(atlas).toContainText('Whole-body atlas to lobule registration unavailable')
  await expect(atlas).toContainText('Creative Commons Attribution-ShareAlike 4.0 International')
  await expect(atlas).toContainText('Axis polarity unreported')
  await expect(atlas.locator('canvas')).toHaveCount(0)

  await expect(atlas.getByTestId('measured-spatial-chunk-map').getByRole('button')).toHaveCount(8)
  expect(chunkRequests).toHaveLength(0)
  await atlas.getByTestId('measured-spatial-chunk-map').getByRole('button').first().click()
  await expect(atlas.getByText('Encoded and decoded verification passed')).toBeVisible({ timeout: 60_000 })
  expect(chunkRequests).toHaveLength(1)

  if (await atlas.getByText(/offline incomplete/).isVisible().catch(() => false)) {
    await atlas.getByTestId('measured-spatial-complete').click()
    await expect(atlas.getByText(/offline complete/)).toBeVisible({ timeout: 180_000 })
  }
  await atlas.getByTestId('measured-spatial-integrity').click()
  await expect(atlas.getByTestId('measured-spatial-offline-result')).toContainText('Network during integrity')
  await expect(atlas.getByTestId('measured-spatial-offline-result')).toContainText('disabled')

  await page.reload()
  await expect(atlas.getByText('Verified local metadata ready')).toBeVisible({ timeout: 60_000 })
  await expect(atlas).toContainText('offline complete')
  const localResponse = page.waitForResponse((response) => /\/api\/v12\/measured-spatial\/chunks\/[^/]+\/\d+\/\d+\/\d+\/\d+$/.test(new URL(response.url()).pathname))
  await atlas.getByTestId('measured-spatial-chunk-map').getByRole('button').first().click()
  expect((await localResponse).headers()['x-cache-source']).toBe('local')
  await expect(atlas.getByText('Encoded and decoded verification passed')).toBeVisible()

  const viewport = page.viewportSize()
  if (viewport.width <= 360) {
    await expect(atlas.getByRole('table')).toBeVisible()
    await expect(atlas.getByRole('button', { name: 'Complete atlas for offline use' }).or(atlas.getByRole('button', { name: 'Reverify offline completion' }))).toBeVisible()
  } else {
    await expect(atlas.getByTestId('measured-spatial-summary').locator('article')).toHaveCount(3)
  }
})
