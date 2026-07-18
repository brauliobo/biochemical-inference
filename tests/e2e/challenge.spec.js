import { expect, test } from '@playwright/test'

const protectedRead = /^\/api\/v11\/challenge\/(?:runs|reports\/|artifacts\/|integrity$)/
const notEvaluable = [
  'Tmax scoring/statistic',
  'absolute AUC',
  'BE ratio/CI/power',
  'sequence effect',
  'variance/CV',
  'full curve',
  'population/sex/BMI',
  'tramadol/safety'
]

test('accepts the real isolated Goal 13 workflow on desktop and mobile', async ({ page }) => {
  test.setTimeout(180_000)
  const challengeRequests = []
  const challengeResponses = []
  const responsePolicyFailures = []
  page.on('request', (request) => {
    const path = new URL(request.url()).pathname
    if (path.startsWith('/api/v11/challenge')) challengeRequests.push({
      method: request.method(),
      path,
      headers: request.headers(),
      body: request.postDataJSON?.() ?? null
    })
  })
  page.on('response', (response) => {
    const path = new URL(response.url()).pathname
    if (!path.startsWith('/api/v11/challenge')) return
    const headers = response.headers()
    challengeResponses.push({ path, status: response.status() })
    if (headers['cache-control'] !== 'private, no-store' || headers.pragma !== 'no-cache' || headers.etag !== undefined) {
      responsePolicyFailures.push({ path, headers })
    }
  })

  await page.route('**/api/v1/releases', (route) => route.fulfill({
    status: 503,
    contentType: 'application/json',
    body: JSON.stringify({ code: 'GOAL1_UNAVAILABLE', message: 'Goal 1 intentionally unavailable during Goal 13 acceptance.' })
  }))
  await page.goto('/')

  const workbench = page.locator('.challenge-workbench')
  await expect(workbench.getByRole('heading', { name: 'Frozen APAP challenge workbench' })).toBeVisible()
  await expect(page.getByText('Goal 1 intentionally unavailable during Goal 13 acceptance.')).toBeVisible()

  const sync = workbench.getByRole('button', { name: 'Synchronize signed challenge' })
  if (await sync.count()) {
    await sync.click()
    await expect(workbench.getByText('Verified local challenge snapshot ready')).toBeVisible({ timeout: 120_000 })
  } else {
    await expect(workbench.getByText('Verified local challenge snapshot ready')).toBeVisible()
  }

  let openReport = workbench.getByRole('button', { name: 'Open bounded report' }).first()
  if (await openReport.count()) {
    await openReport.click()
  } else {
    await workbench.getByTestId('challenge-freeze').click()
    await expect.poll(() => challengeRequests.find((request) => request.path === '/api/v11/challenge/commitments')).toBeTruthy()
    const freezeRequest = challengeRequests.find((request) => request.path === '/api/v11/challenge/commitments')
    expect(freezeRequest.method).toBe('POST')
    expect(freezeRequest.headers.origin).toBe('http://127.0.0.1:5173')
    expect(freezeRequest.headers['x-challenge-csrf']).toBe('goal13-challenge-v1')
    await expect.poll(() => challengeResponses.find((response) => response.path === '/api/v11/challenge/commitments')?.status).toBe(201)
    await expect(workbench.getByTestId('challenge-commitment')).toBeVisible({ timeout: 60_000 })
    await expect(workbench.getByText('2.9196477028 mg/L')).toHaveCount(2)
    await expect(workbench.getByText(/Measured outcomes remain undisclosed/)).toBeVisible()
    await expect(workbench.getByTestId('challenge-measured')).toHaveCount(0)
    await expect(workbench.getByText('5206.095 ng/mL')).toHaveCount(0)
    await expect(workbench.getByText('4.853221 mg/L')).toHaveCount(0)
    await expect(workbench.getByText('0.4391866259')).toHaveCount(0)
    expect(challengeRequests.some((request) => request.path.endsWith('/disclose'))).toBe(false)

    expect(Object.keys(freezeRequest.body).sort()).toEqual(['createdAt', 'nonce'])

    await workbench.getByTestId('challenge-disclose').click()
  }

  const result = workbench.getByTestId('challenge-result')
  await expect(result.getByRole('heading', { name: 'failed' })).toBeVisible({ timeout: 60_000 })
  await expect(workbench.getByText('5206.095 ng/mL')).toBeVisible()
  await expect(workbench.getByText('4853.221 ng/mL')).toBeVisible()
  await expect(workbench.getByText('5.206095 mg/L')).toBeVisible()
  await expect(workbench.getByText('4.853221 mg/L')).toBeVisible()
  await expect(workbench.getByText('0.4391866259')).toBeVisible()
  await expect(workbench.getByText('0.3984103129')).toBeVisible()
  await expect(workbench.getByText('Absent: not reported in source')).toHaveCount(2)
  const boundary = workbench.getByTestId('challenge-not-evaluable')
  await expect(boundary.getByRole('listitem')).toHaveCount(8)
  for (const label of notEvaluable) await expect(boundary.getByText(label, { exact: true })).toBeVisible()

  await workbench.getByTestId('challenge-integrity').click()
  await expect(workbench.getByTestId('challenge-integrity-result')).toContainText('valid', { timeout: 60_000 })
  await expect(workbench.getByTestId('challenge-integrity-result')).toContainText('12')
  await expect(workbench.getByTestId('challenge-integrity-result')).toContainText('1 / 1')

  await page.reload()
  await expect(workbench.getByRole('heading', { name: 'Frozen APAP challenge workbench' })).toBeVisible()
  openReport = workbench.getByRole('button', { name: 'Open bounded report' }).first()
  await expect(openReport).toBeVisible()
  await openReport.click()
  await expect(workbench.getByTestId('challenge-result').getByRole('heading', { name: 'failed' })).toBeVisible()
  await workbench.getByTestId('challenge-replay').click()
  await expect(workbench.getByTestId('challenge-replay-result')).toContainText('pass', { timeout: 60_000 })
  await expect(workbench.getByTestId('challenge-replay-result')).toContainText('disabled')

  const protectedGets = challengeRequests.filter((request) => request.method === 'GET' && protectedRead.test(request.path))
  expect(protectedGets.length).toBeGreaterThan(0)
  expect(protectedGets.every((request) => request.headers['x-challenge-csrf'] === 'goal13-challenge-v1')).toBe(true)
  const discloseRequest = challengeRequests.find((request) => request.path.endsWith('/disclose'))
  if (discloseRequest) {
    expect(discloseRequest.body.commitmentDigest).toBe(discloseRequest.path.split('/').at(-2))
    expect(discloseRequest.headers['x-challenge-csrf']).toBe('goal13-challenge-v1')
  }
  const replayRequest = challengeRequests.find((request) => request.path.endsWith('/replay'))
  expect(replayRequest.body).toEqual({})
  expect(responsePolicyFailures).toEqual([])
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1)
})
