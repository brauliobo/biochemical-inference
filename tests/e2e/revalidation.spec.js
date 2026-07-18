import { expect, test } from '@playwright/test'

test('executes and resumes the signed Goal 15 campaign on desktop and mobile', async ({ page }) => {
  test.setTimeout(300_000)
  const requests = []
  const responsePolicyFailures = []
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname
    if (path.startsWith('/api/v13/revalidation')) requests.push({ method: request.method(), path, request, body: request.postDataJSON?.() ?? null })
  })
  page.on('response', (response) => {
    const path = new URL(response.url()).pathname
    if (!path.startsWith('/api/v13/revalidation')) return
    const headers = response.headers()
    if (headers['cache-control'] !== 'no-store' || headers.pragma !== 'no-cache' || headers.etag !== undefined) responsePolicyFailures.push({ path, headers })
  })

  await page.goto('/')
  const workbench = page.locator('.revalidation-workbench')
  await expect(workbench.getByRole('heading', { name: 'Signed impact execution ledger' })).toBeVisible()
  await expect(workbench).toContainText('Terminal software outcomes do not become scientific conclusions.')
  await expect(workbench).toContainText('Automatic reviewdisabled')

  if (!await workbench.getByTestId('revalidation-campaign-summary').isVisible().catch(() => false)) {
    await workbench.getByRole('button', { name: 'Create and execute campaign' }).click()
  }
  await expect(workbench.getByText('1024 / 1024 terminal')).toBeVisible({ timeout: 240_000 })
  await expect(workbench.getByText('1024 / 1024', { exact: true })).toBeVisible({ timeout: 240_000 })
  await expect(workbench.getByText('Review required · not automatically accepted')).toHaveCount(50)
  await expect(workbench.getByRole('button', { name: /accept|label|approve/i })).toHaveCount(0)

  const creation = requests.find((request) => request.method === 'POST' && request.path === '/api/v13/revalidation/campaigns')
  if (creation) {
    const headers = await creation.request.allHeaders()
    expect(headers.origin).toBe('http://127.0.0.1:5173')
    expect(headers['x-biochemical-csrf']).toBe('revalidation-campaign-v1')
    expect(Object.keys(creation.body).sort()).toEqual(['name', 'reason'])
  }

  await workbench.getByRole('button', { name: 'Verify full integrity' }).click()
  await expect(workbench.getByText(/Integrity valid/)).toBeVisible({ timeout: 60_000 })
  await workbench.getByRole('button', { name: 'Load signed audit' }).click()
  await expect(workbench.getByText(/locally persisted, signature-verified producer events/)).toBeVisible()
  await workbench.getByRole('button', { name: 'Load technical report' }).click()
  await expect(workbench.getByRole('heading', { name: 'Bounded campaign report' })).toBeVisible({ timeout: 60_000 })
  await expect(workbench.getByText('unsupported · review required')).toBeVisible()
  await expect(workbench.getByText('verified', { exact: true })).toBeVisible()
  expect(responsePolicyFailures).toEqual([])

  await page.reload()
  await expect(workbench.getByText('1024 / 1024 terminal')).toBeVisible({ timeout: 60_000 })
  await expect(workbench).toContainText('acceptance disabled')
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})
