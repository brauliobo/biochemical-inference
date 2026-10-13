import { expect, test } from '@playwright/test'

const useFixture = process.env.E2E_USE_FIXTURE === 'true'

test('performs real non-vector evidence search and inspects licensed exact spans', async ({ page }) => {
  test.skip(useFixture, 'Requires the real evidence service')
  await page.goto('/#/workbench/full')

  const evidence = page.getByRole('region', { name: 'Search exact evidence' })
  await expect(evidence.getByText('mthfr-evidence-v1.0.0')).toBeVisible()
  await expect(evidence.getByText('sha256:93662849ac8913c0953db9492364900a07ebd824020f6cd65d1fc9e47ac86701', { exact: true })).toBeVisible()
  await expect(evidence.getByLabel('Add local Ollama vector rank')).not.toBeChecked()
  await evidence.getByLabel('PMID, PMCID, DOI, ontology ID, or text').fill('PMCID:PMC5995969')
  await evidence.getByRole('button', { name: 'Search evidence' }).click()

  const result = evidence.getByRole('button', { name: /Structural basis for the regulation/ })
  await expect(result).toBeVisible()
  await expect(evidence.getByLabel('Ranking channels and scores')).toContainText('exact rank 1')
  await result.click()
  await expect(evidence.getByText(/Creative Commons Attribution 4.0 International/)).toBeVisible()
  await expect(evidence.getByText(/licensed-excerpts/)).toBeVisible()
  await expect(evidence.getByText(/SPAN:PMID-29891918-RESULTS-SUPPORT/)).toBeVisible()
  await expect(evidence.getByText(/local \[0, 232\).*source \[17004, 17236\)/)).toBeVisible()
  await expect(evidence.getByText(/NCBIGene:4524/).first()).toBeVisible()
})

test('extracts and reopens a fixture candidate without crossing the trust boundary', async ({ page }) => {
  test.skip(!useFixture, 'Uses deterministic extraction without live generation')
  await page.goto('/#/workbench/full')

  const evidence = page.getByRole('region', { name: 'Search exact evidence' })
  await evidence.getByRole('button', { name: /Structural basis for the regulation/ }).click()
  await evidence.getByLabel(/Phosphorylation has been identified/).check()
  await evidence.getByRole('button', { name: 'Extract unreviewed candidate' }).click()

  await expect(evidence.getByText(/MTHFR phosphorylation · increases sensitivity to · SAM inhibition/).first()).toBeVisible()
  await expect(evidence.getByText('Unreviewed, not trusted knowledge').first()).toBeVisible()
  await expect(evidence.getByText(/cannot enter the atlas or trusted release/)).toBeVisible()
  const persisted = evidence.getByRole('region', { name: 'Unreviewed candidate workspace' }).getByRole('button').first()
  await expect(persisted).toContainText('Unreviewed, not trusted knowledge')
  await persisted.click()
  await expect(evidence.getByText('Supporting spans: SPAN:PMID-29891918-RESULTS-SUPPORT')).toBeVisible()
})
