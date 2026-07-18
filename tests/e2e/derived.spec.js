import { expect, test } from '@playwright/test'

test('submits, accepts, reproduces, and inspects an APAP derived assertion without mixing layers', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'The complete desktop review workflow covers signed mutation sequencing')
  await page.goto('/')
  const apap = page.locator('.apap-panel')
  const review = page.locator('.review-panel')
  await apap.getByRole('button', { name: 'Run APAP benchmark' }).click()
  await expect(review.getByText('Completed APAP run is ready for content-addressed submission.')).toBeVisible()

  const submission = page.waitForResponse((response) => response.url().includes('/api/v6/derived/apap-runs/') && response.request().method() === 'POST')
  await review.getByRole('button', { name: 'Submit immutable bundle' }).click()
  expect((await submission).ok()).toBe(true)
  await expect(review.getByText('Claim')).toBeVisible()
  await expect(review.getByText('Source vs reviewed-derived')).toBeVisible()
  await expect(review.getByText(/No eligible verified parameter measurement/)).toBeVisible()
  await expect(review.getByRole('heading', { name: 'Lineage', exact: true })).toBeVisible()
  await expect(review.getByText('Full scientific context')).toBeVisible()
  await expect(review.getByText('Unsupported limitations')).toBeVisible()

  await review.getByRole('button', { name: 'Accept' }).click()
  await expect(review.getByText('accepted · predicted')).toBeVisible()
  await expect(review.getByText(/currently accepted prediction/)).toContainText('1 currently accepted prediction')

  await review.getByRole('button', { name: 'Reproduce exact APAP run' }).click()
  await expect(review.getByText('Exact APAP specification reproduced the canonical result; signed verification appended.')).toBeVisible()
  await expect(review.getByText('Event 2 · reproduction-verified · Local scientific reviewer')).toBeVisible()
  await review.getByText('Signature and event chain').last().click()
  await expect(review.getByText(/^signature /).last()).toBeVisible()
})
