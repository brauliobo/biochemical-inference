import { expect, test } from '@playwright/test'

test('synchronizes, paginates, inspects lineage, isolates calibration, then explicitly discloses six GSH values', async ({ page }) => {
  const browserRequests = []
  let commitmentBody
  let evaluationBody
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname
    browserRequests.push(`${request.method()} ${path}`)
    if (path.endsWith('/api/v10/measured/commitments')) commitmentBody = request.postDataJSON()
    if (path.endsWith('/api/v10/measured/evaluation')) evaluationBody = request.postDataJSON()
  })
  await page.goto('/#/workbench/full')
  const workbench = page.locator('.measured-workbench')
  await expect(workbench).toBeVisible()
  await workbench.getByTestId('measured-sync').click()
  await expect(workbench.getByText('Verified local mirror ready')).toBeVisible({ timeout: 120_000 })
  await expect(workbench.getByTestId('measured-families')).toContainText('development')
  await expect(workbench.getByTestId('measured-families')).toContainText('calibration')
  await expect(workbench.getByTestId('measured-families')).toContainText('external-held-out')
  await expect(workbench).toContainText('Metadata visible; outcomes, uncertainties, summaries, defaults, and previews absent.')
  await expect(workbench).toContainText('CC BY 4.0')

  const firstId = await workbench.getByTestId('measured-table').locator('tbody tr').first().locator('code').textContent()
  await workbench.getByTestId('measured-next-page').click()
  await expect(workbench.getByTestId('measured-table').locator('tbody tr').first().locator('code')).not.toHaveText(firstId)
  await workbench.getByTestId('inspect-lineage').click()
  await expect(workbench.getByTestId('measured-lineage')).toContainText('not-reported')
  await expect(workbench.getByTestId('measured-lineage')).toContainText('source-verified')

  await workbench.getByTestId('run-measured-calibration').click()
  await expect(workbench.getByTestId('calibration-artifact')).toContainText('not-evaluable')
  await expect(workbench.getByTestId('calibration-artifact')).toContainText('development 0, validation 0, external-heldout 0')
  expect(browserRequests.some((request) => request.endsWith('/api/v10/measured/evaluation'))).toBe(false)
  await expect(workbench.getByTestId('disclosure-values')).toHaveCount(0)

  await workbench.getByTestId('freeze-measured').click()
  await expect(workbench.getByTestId('commitment-receipt')).toContainText('private, no-store')
  const commitmentDigest = await workbench.getByTestId('commitment-receipt').locator('code').textContent()
  await workbench.getByTestId('freeze-measured').click()
  await expect(workbench.getByTestId('commitment-receipt').locator('code')).toHaveText(commitmentDigest)
  const mismatch = await page.evaluate(async (request) => {
    const response = await fetch('/api/v10/measured/commitments', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-measured-csrf': 'measured-commons-v1' },
      body: JSON.stringify({ ...request, calibrationArtifactDigest: '9'.repeat(64) })
    })
    return { status: response.status, cacheControl: response.headers.get('cache-control') }
  }, commitmentBody)
  expect(mismatch).toEqual({ status: 409, cacheControl: 'private, no-store' })
  await expect(workbench.getByTestId('frozen-artifact-digests').locator('input')).toHaveCount(0)
  await expect(workbench.getByTestId('disclosure-values')).toHaveCount(0)
  await workbench.getByTestId('disclose-measured').click()
  const values = workbench.getByTestId('disclosure-values')
  await expect(values).toContainText('6 heldout renal GSH group values disclosed')
  await expect(values.locator('li')).toHaveCount(6)
  await expect(values).toContainText('group:zenodo7648975:d250')
  await expect(values).toContainText('2.700 mmol/g')
  await expect(values).toContainText('Labels remain external-held-out')
  const firstDisclosureTime = (await values.getByText(/Immutable disclosure receipt/).textContent()).match(/[0-9]{4}-[^.]+Z/)[0]
  await page.reload()
  const retry = await page.evaluate(async (request) => {
    const response = await fetch('/api/v10/measured/evaluation', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-measured-csrf': 'measured-commons-v1' },
      body: JSON.stringify(request)
    })
    return { status: response.status, cacheControl: response.headers.get('cache-control'), body: await response.json() }
  }, evaluationBody)
  expect(retry.status).toBe(200)
  expect(retry.cacheControl).toBe('private, no-store')
  expect(retry.body.disclosed_at).toBe(firstDisclosureTime)
  expect(retry.body.items).toHaveLength(6)
})
