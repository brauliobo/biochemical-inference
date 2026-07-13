import { expect, test } from '@playwright/test'
import { modelDigest } from '../../server/portfolio/identity.js'
import { ODE_MODEL } from '../../server/portfolio/registry.js'
import { workspaceSpecification } from '../fixtures/workspace.js'

test('persists, runs, reports, and exports a controlled experiment', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Desktop workflow is covered separately from the mobile layout check')
  await page.goto('/')
  const workspace = page.locator('.experiment-workspace')
  await expect(workspace.getByRole('heading', { name: 'Durable local research runs' })).toBeVisible()
  await workspace.getByLabel('Existing experiment').selectOption('')
  await workspace.getByLabel('Name').fill(`E2E workspace ${Date.now()}`)
  const createResponse = page.waitForResponse((response) => response.url().endsWith('/api/v7/workspace/experiments') && response.request().method() === 'POST')
  await workspace.getByRole('button', { name: 'Create experiment' }).click()
  expect((await createResponse).ok()).toBe(true)
  await expect(workspace.getByText(/immutable revision created/)).toBeVisible()

  const runResponse = page.waitForResponse((response) => response.url().endsWith('/api/v7/workspace/runs') && response.request().method() === 'POST')
  await workspace.getByRole('button', { name: 'Queue latest revision' }).click()
  expect((await runResponse).status()).toBe(202)
  await expect(workspace.locator('.attempt-inspector .status-chip')).toHaveText('successful', { timeout: 20_000 })
  await workspace.getByRole('button', { name: 'Generate offline report' }).click()
  await expect(workspace.getByText('Static offline report')).toBeVisible()
  await workspace.getByRole('button', { name: 'Export portable ZIP' }).click()
  await expect(workspace.getByRole('link', { name: /Download .*\.zip/ })).toBeVisible()
})

test('keeps the controlled experiment workflow within a mobile viewport', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-specific workspace workflow')
  await page.goto('/')
  const workspace = page.locator('.experiment-workspace')
  await expect(workspace.getByLabel('Portfolio design')).toBeVisible()
  await workspace.getByLabel('Existing experiment').selectOption('')
  await workspace.getByLabel('Portfolio design').selectOption('intervention-schedule')
  await expect(workspace.getByLabel('Assignment target')).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})

test('imports an exact external model as inspectable, exportable, read-only state', async ({ page, request }, testInfo) => {
  test.skip(testInfo.project.name === 'mobile', 'Desktop import workflow')
  const content = { ...ODE_MODEL, name: 'E2E external exact ODE', assumptions: [...ODE_MODEL.assumptions, 'E2E external immutable model variant.'] }
  const externalModel = { ...content, digest: modelDigest(content) }
  const createdResponse = await request.post('/api/v7/workspace/experiments', { data: { name: `External E2E ${Date.now()}`, description: 'Exact external model import.', specification: workspaceSpecification({ model: externalModel }), resourceProfileId: 'local-default' } })
  expect(createdResponse.ok()).toBe(true)
  const created = await createdResponse.json()
  const exportedResponse = await request.get(`/api/v7/workspace/experiments/${encodeURIComponent(created.experiment.experimentId)}/export`)
  expect(exportedResponse.ok()).toBe(true)
  const exported = await exportedResponse.json()

  await page.goto('/')
  const workspace = page.locator('.experiment-workspace')
  await expect(workspace.getByText(/not in the exact local registry/)).toBeVisible()
  await workspace.locator('#workspace-import').setInputFiles({ name: exported.fileName, mimeType: 'application/zip', buffer: Buffer.from(exported.bundleBase64, 'base64') })

  await expect(workspace.getByText(/Portable bundle imported/)).toBeVisible()
  await expect(workspace.getByLabel('Portfolio model')).toHaveValue(`${externalModel.id}|${externalModel.digest}`)
  await expect(workspace.getByRole('button', { name: 'Create immutable revision' })).toBeDisabled()
  await expect(workspace.getByRole('button', { name: 'Queue latest revision' })).toBeDisabled()
  await expect(workspace.getByRole('button', { name: 'Export portable ZIP' })).toBeEnabled()
})
