import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CHALLENGE_CONCLUSION_BOUNDARY, CHALLENGE_PINS } from '../../shared/challenge-contracts.js'

const api = vi.hoisted(() => ({
  discloseChallengeCommitment: vi.fn(),
  loadChallengeArtifact: vi.fn(),
  loadChallengeDiscovery: vi.fn(),
  loadChallengeReport: vi.fn(),
  loadChallengeRuns: vi.fn(),
  loadChallengeStatus: vi.fn(),
  prepareChallengeCommitment: vi.fn(),
  replayChallengeReport: vi.fn(),
  syncChallenge: vi.fn(),
  verifyChallengeIntegrity: vi.fn()
}))
vi.mock('../../src/api.js', () => api)

import ChallengeWorkbench from '../../src/components/ChallengeWorkbench.vue'

const commitmentDigest = 'a'.repeat(64)
const modelDigest = 'b'.repeat(64)
const diagnosticsDigest = 'c'.repeat(64)
const disclosureDigest = 'd'.repeat(64)
const resultDigest = 'e'.repeat(64)
const predictions = [
  { endpoint_id: 'endpoint:apap-cmax:reference', predicted_value: '2.9196477028', predicted_unit: 'mg/L', predicted_time_h: '1.5' },
  { endpoint_id: 'endpoint:apap-cmax:test', predicted_value: '2.9196477028', predicted_unit: 'mg/L', predicted_time_h: '1.5' }
]
const frozenCommitment = {
  consumer_id: 'consumer:biochemical-inference:apap-model-v1',
  consumer_model_digest: modelDigest,
  predictions
}
const receipt = {
  commitment_digest: commitmentDigest,
  created_at: '2026-07-14T00:00:00Z',
  committed_at: '2026-07-15T03:18:24Z'
}
const artifactRefs = {
  diagnostics: { kind: 'diagnostics', digest: diagnosticsDigest, bytes: 1024 },
  prediction: { kind: 'prediction', digest: 'f'.repeat(64), bytes: 256 }
}
const prepared = { frozenCommitment, receipt, artifacts: artifactRefs }
const locator = {
  source_object_id: 'source:zenodo:13358906:article',
  pdf_page: 5,
  printed_page: 711,
  section: 'Results',
  paragraph: 2,
  continuation: false
}
const observations = [
  {
    endpoint_id: 'endpoint:apap-cmax:reference',
    normalized_value: '5.206095',
    normalized_unit: 'mg/L',
    reported_value: '5206.095',
    reported_unit: 'ng/mL',
    transformation: 'mg/L = ng/mL * 0.001',
    n: 39,
    uncertainty_reported: false,
    validation_state: 'independently-reviewed-transcription',
    locator: { ...locator, source_object_id: 'source:zenodo:13358906:pdf', pdf_page: 4, printed_page: 710, section: 'Pharmacokinetics and statistical analysis', paragraph: 3 },
    n_locator: { ...locator, source_object_id: 'source:zenodo:13358906:pdf', section: 'Table 2 heading', paragraph: 1 }
  },
  {
    endpoint_id: 'endpoint:apap-cmax:test',
    normalized_value: '4.853221',
    normalized_unit: 'mg/L',
    reported_value: '4853.221',
    reported_unit: 'ng/mL',
    transformation: 'mg/L = ng/mL * 0.001',
    n: 39,
    uncertainty_reported: false,
    validation_state: 'independently-reviewed-transcription',
    locator: { ...locator, source_object_id: 'source:zenodo:13358906:pdf', section: 'Pharmacokinetics and statistical analysis', paragraph: 1, continuation: true },
    n_locator: { ...locator, source_object_id: 'source:zenodo:13358906:pdf', section: 'Table 2 heading', paragraph: 1 }
  }
]
const endpointResults = [
  { endpoint_id: predictions[0].endpoint_id, absolute_relative_error: '0.4391866259', threshold: '0.30', support_label: 'unsupported', diagnostic_status: 'evaluable' },
  { endpoint_id: predictions[1].endpoint_id, absolute_relative_error: '0.3984103129', threshold: '0.30', support_label: 'unsupported', diagnostic_status: 'evaluable' }
]
const notEvaluable = [
  'Tmax scoring/statistic',
  'absolute AUC',
  'BE ratio/CI/power',
  'sequence effect',
  'variance/CV',
  'full curve',
  'population/sex/BMI',
  'tramadol/safety'
].map((endpoint, index) => ({ id: `not-evaluable:goal13:${index + 1}`, endpoint, reason: `${endpoint} is outside the frozen two-endpoint Cmax contract.` }))

function reportFixture(overrides = {}) {
  const conclusion = overrides.conclusion ?? 'failed'
  const results = overrides.endpointResults ?? endpointResults
  const boundedConclusion = conclusion === 'failed'
    ? 'The model remains unsupported for at least one frozen challenge endpoint within this boundary; no clinical, treatment, or bioequivalence claim is made.'
    : 'The model is not evaluable under the frozen mapping or diagnostics boundary; no clinical, treatment, or bioequivalence claim is made.'
  return {
    scientific_boundary: 'aggregate parent-APAP Cmax for the two frozen oral formulations and exact published sampling grid only',
    pins: CHALLENGE_PINS,
    artifact_refs: artifactRefs,
    frozen_commitment: frozenCommitment,
    commitment_receipt: receipt,
    disclosure: { disclosure_digest: disclosureDigest, observations },
    endpoint_diagnostics: predictions.map((prediction) => ({
      endpoint_id: prediction.endpoint_id,
      status: conclusion === 'not-evaluable' ? 'invalid-diagnostics' : 'evaluable'
    })),
    independent_scoring: {
      metric: 'abs(predicted-measured)/measured',
      threshold: '<=0.30',
      rounding: 'decimal ROUND_HALF_EVEN to 10 places',
      endpoint_results: results,
      conclusion,
      bounded_conclusion: boundedConclusion
    },
    producer_result: { conclusion, bounded_conclusion: boundedConclusion, result_digest: resultDigest },
    not_evaluable: notEvaluable,
    lineage: { disclosed_at: '2026-07-15T03:18:25Z' }
  }
}

const discovery = {
  pins: CHALLENGE_PINS
}
const readyStatus = { state: 'ready', integrity: 'valid', releaseId: CHALLENGE_PINS.releaseId, lastError: null }
const diagnosticArtifact = {
  artifactDigest: diagnosticsDigest,
  content: {
    diagnostics: {
      passed: true,
      sampling_grid: { points: Array.from({ length: 20 }, () => ({ matched: true })), passed: true },
      mass: { passed: true, residual: 0, tolerance: 1e-9 },
      state: { passed: true, finite: true, non_negative: true }
    }
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  api.loadChallengeDiscovery.mockResolvedValue(discovery)
  api.loadChallengeStatus.mockResolvedValue(readyStatus)
  api.loadChallengeRuns.mockResolvedValue({ items: [], limit: 20 })
  api.prepareChallengeCommitment.mockResolvedValue(prepared)
  api.loadChallengeArtifact.mockResolvedValue(diagnosticArtifact)
  api.discloseChallengeCommitment.mockResolvedValue(reportFixture())
  api.verifyChallengeIntegrity.mockResolvedValue({ status: 'valid', artifacts: 12, commitments: 1, disclosureEpochs: 1, disclosures: 1, reports: 1 })
  api.replayChallengeReport.mockResolvedValue({ verification: 'pass', network_access: false, report: reportFixture() })
})

async function completeChallenge() {
  render(ChallengeWorkbench)
  await fireEvent.click(await screen.findByTestId('challenge-freeze'))
  await fireEvent.click(await screen.findByTestId('challenge-disclose'))
  return screen.findByTestId('challenge-result')
}

describe('ChallengeWorkbench', () => {
  it('presents the honest failed result, both endpoint errors, threshold, and exact terminal pins', async () => {
    const result = await completeChallenge()

    expect(within(result).getByRole('heading', { name: 'failed' })).toBeTruthy()
    expect(screen.getByText('0.4391866259')).toBeTruthy()
    expect(screen.getByText('0.3984103129')).toBeTruthy()
    expect(screen.getAllByText('<= 0.30')).toHaveLength(2)
    expect(screen.getByText(modelDigest)).toBeTruthy()
    expect(screen.getAllByText(commitmentDigest).length).toBeGreaterThan(0)
    expect(screen.getByText(disclosureDigest)).toBeTruthy()
    expect(screen.getByText(resultDigest)).toBeTruthy()
    expect(screen.getByText(CHALLENGE_CONCLUSION_BOUNDARY)).toBeTruthy()
    expect(document.activeElement).toBe(result)
  })

  it('shows all not-evaluable endpoints and reasons when diagnostics prevent scoring', async () => {
    const notEvaluableResults = endpointResults.map((item) => ({ ...item, absolute_relative_error: null, support_label: 'not-evaluable', diagnostic_status: 'invalid-diagnostics' }))
    api.discloseChallengeCommitment.mockResolvedValue(reportFixture({ conclusion: 'not-evaluable', endpointResults: notEvaluableResults }))
    await completeChallenge()

    expect(screen.getByRole('heading', { name: 'not-evaluable' })).toBeTruthy()
    const excluded = screen.getByTestId('challenge-not-evaluable')
    expect(within(excluded).getAllByRole('listitem')).toHaveLength(8)
    for (const item of notEvaluable) {
      expect(within(excluded).getByText(item.endpoint)).toBeTruthy()
      expect(within(excluded).getByText(item.reason)).toBeTruthy()
    }
    expect(screen.getAllByText('Not evaluable')).toHaveLength(2)
  })

  it('does not render measured values, uncertainty, scores, or result before explicit disclosure', async () => {
    render(ChallengeWorkbench)
    await fireEvent.click(await screen.findByTestId('challenge-freeze'))
    await screen.findByTestId('challenge-commitment')

    expect(screen.getAllByText('2.9196477028 mg/L')).toHaveLength(2)
    expect(screen.getByText(/Measured outcomes remain undisclosed/)).toBeTruthy()
    expect(screen.queryByTestId('challenge-measured')).toBeNull()
    expect(screen.queryByText('5206.095 ng/mL')).toBeNull()
    expect(screen.queryByText('0.4391866259')).toBeNull()
    expect(screen.queryByTestId('challenge-result')).toBeNull()
    expect(api.discloseChallengeCommitment).not.toHaveBeenCalled()
  })

  it('provides mobile-friendly named regions, lists, and full-width semantic controls without a data table', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360 })
    await completeChallenge()

    expect(screen.getByRole('region', { name: 'Frozen predictions' })).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Measured observations' })).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Errors against the frozen threshold' })).toBeTruthy()
    expect(screen.getByRole('region', { name: 'All not-evaluable endpoints' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Verify local integrity' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Replay result offline' })).toBeTruthy()
    expect(screen.queryByRole('table')).toBeNull()
    await waitFor(() => expect(screen.getByTestId('challenge-measured').querySelectorAll('li')).toHaveLength(2))
  })

  it('uses valid definition-list children and keeps digest values inside their definitions', async () => {
    render(ChallengeWorkbench)
    await screen.findByText(CHALLENGE_PINS.releaseId)

    for (const group of screen.getByLabelText('Challenge identity pins').children) {
      expect([...group.children].map((item) => item.tagName)).toEqual(['DT', 'DD'])
      expect(group.querySelector('dd code')).toBeTruthy()
    }
  })
})
