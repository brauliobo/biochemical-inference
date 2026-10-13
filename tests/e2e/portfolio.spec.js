import { expect, test } from '@playwright/test'

test('runs the ODE, SSA, and FBA standards portfolio with inspectable terminal results', async ({ page }) => {
  await page.goto('/#/workbench/full')
  const portfolio = page.locator('.portfolio-panel')
  await expect(portfolio.getByRole('heading', { name: 'ODE · SSA · FBA workbench' })).toBeVisible()
  await expect(portfolio.getByText('Reactant A concentration · mol/L')).toBeVisible()

  const odeResponse = page.waitForResponse((response) => response.url().endsWith('/api/v2/runs') && response.request().method() === 'POST')
  await portfolio.getByRole('button', { name: 'Run ODE benchmark' }).click()
  const completedOde = await odeResponse
  expect(completedOde.ok(), await completedOde.text()).toBe(true)
  await expect(portfolio.getByText('ODE final state')).toBeVisible()
  await expect(portfolio.getByRole('img', { name: /ODE reactant trajectory/ })).toBeVisible()
  await expect(portfolio.getByText(/terminal · successful/)).toBeVisible()

  await portfolio.getByLabel('Model and engine').selectOption('first_order_ssa')
  await portfolio.getByLabel('Replicates').fill('64')
  await portfolio.getByRole('button', { name: 'Run SSA benchmark' }).click()
  await expect(portfolio.getByText('SSA final replicate summaries (n=64)')).toBeVisible()
  await expect(portfolio.getByText('gillespie-direct 1.0.0')).toBeVisible()

  await portfolio.getByLabel('Model and engine').selectOption('bounded_growth_fba')
  await portfolio.getByRole('button', { name: 'Run FBA benchmark' }).click()
  await expect(portfolio.getByText(/FBA optimum 10\.000000 mmol gDW/)).toBeVisible()
  await expect(portfolio.getByText('two-phase-simplex 1.0.0')).toBeVisible()
})

test('keeps all portfolio controls and result tables usable on mobile', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile', 'Mobile-specific portfolio workflow')
  await page.goto('/#/workbench/full')
  const portfolio = page.locator('.portfolio-panel')
  await portfolio.getByLabel('Model and engine').selectOption('bounded_growth_fba')
  await portfolio.getByRole('button', { name: 'Run FBA benchmark' }).click()
  await expect(portfolio.getByText(/FBA optimum 10\.000000/)).toBeVisible()
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(1)
})
