import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createEvidenceFixtureClient } from '../../server/evidence/fixture.js'

const api = vi.hoisted(() => ({
  loadEvidenceHealth: vi.fn(),
  searchEvidence: vi.fn(),
  loadEvidenceDocument: vi.fn(),
  extractEvidenceCandidate: vi.fn(),
  loadEvidenceCandidates: vi.fn(),
  loadEvidenceCandidate: vi.fn()
}))

vi.mock('../../src/api.js', () => api)

import EvidencePanel from '../../src/components/EvidencePanel.vue'

let fixture

function deferred() {
  let resolve
  const promise = new Promise((complete) => { resolve = complete })
  return { promise, resolve }
}

beforeEach(() => {
  vi.clearAllMocks()
  fixture = createEvidenceFixtureClient()
  api.loadEvidenceHealth.mockImplementation(() => fixture.health())
  api.searchEvidence.mockImplementation((_release, input) => fixture.search(input))
  api.loadEvidenceDocument.mockImplementation((_release, identifier) => fixture.document(identifier))
  api.extractEvidenceCandidate.mockImplementation((_release, input) => fixture.extract(input))
  api.loadEvidenceCandidates.mockImplementation(() => fixture.candidates())
  api.loadEvidenceCandidate.mockImplementation((_release, identifier) => fixture.candidate(identifier))
})

async function openLicensedDocument() {
  render(EvidencePanel, { props: { suggestedQuery: 'Homocysteine CHEBI:58199' } })
  await fireEvent.click(await screen.findByRole('button', { name: /Structural basis/ }))
  return screen.findByRole('heading', { name: 'License and redistribution policy' })
}

describe('EvidencePanel', () => {
  it('shows ranking, license policy, exact locations, and the candidate trust boundary', async () => {
    await openLicensedDocument()

    expect(screen.getByText(/Creative Commons Attribution 4.0/)).toBeTruthy()
    expect(screen.getAllByText(/source \[17004, 17236\)/)).toHaveLength(2)
    expect(screen.getByText(/Gene · 5,10-methylenetetrahydrofolate reductase · NCBIGene:4524/)).toBeTruthy()
    const span = screen.getByLabelText(/Phosphorylation has been identified/)
    await fireEvent.click(span)
    await fireEvent.click(screen.getByRole('button', { name: 'Extract unreviewed candidate' }))

    expect(await screen.findByText(/MTHFR phosphorylation · increases sensitivity to · SAM inhibition/)).toBeTruthy()
    expect(screen.getAllByText(/Unreviewed, not trusted knowledge/i).length).toBeGreaterThan(1)
    expect(screen.getByText(/cannot enter the atlas or trusted release/)).toBeTruthy()
  })

  it('raises a lifecycle warning for corrected evidence', async () => {
    api.loadEvidenceDocument.mockImplementation(async (_release, identifier) => {
      const response = await fixture.document(identifier)
      return {
        ...response,
        document: { ...response.document, publication_status: 'corrected' },
        lifecycle: [...response.lifecycle, { id: 'LIFECYCLE:PMID-29891918-CORRECTED', document_id: response.document.id, event_type: 'corrected', occurred_at: '2020-01-01', source_id: 'PUBMED', source_record_id: '29891918', note: 'Correction published.' }]
      }
    })
    await openLicensedDocument()

    expect(screen.getByText('Publication lifecycle warning')).toBeTruthy()
    expect(screen.getByText(/record is corrected/)).toBeTruthy()
  })

  it('makes vector failure visible and retryable without showing lexical fallback results', async () => {
    api.searchEvidence.mockImplementation((_release, input) => input.use_vector ? Promise.reject(new Error('embedding model is not installed')) : fixture.search(input))
    render(EvidencePanel)
    await screen.findByRole('button', { name: /Structural basis/ })
    await fireEvent.click(screen.getByLabelText('Add local Ollama vector rank'))
    await fireEvent.submit(screen.getByLabelText('PMID, PMCID, DOI, ontology ID, or text').closest('form'))

    expect(await screen.findByText('Vector search failed; no lexical fallback was substituted')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Retry vector search' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /Structural basis/ })).toBeNull()
  })

  it('reports generation unavailability and creates no candidate', async () => {
    api.extractEvidenceCandidate.mockRejectedValue(Object.assign(new Error('generation model qwen3:4b is not installed'), { name: 'ApiError', status: 503, code: 'EVIDENCE_MODEL_UNAVAILABLE' }))
    await openLicensedDocument()
    await fireEvent.click(screen.getByLabelText(/Phosphorylation has been identified/))
    await fireEvent.click(screen.getByRole('button', { name: 'Extract unreviewed candidate' }))

    const alert = await screen.findByRole('alert')
    expect(within(alert).getByText('Ollama generation unavailable; no candidate was created')).toBeTruthy()
    expect(within(alert).getByText(/qwen3:4b is not installed/)).toBeTruthy()
    await waitFor(() => expect(screen.getByText('No unreviewed candidates have been persisted in this workspace.')).toBeTruthy())
  })

  it('aborts and ignores document work when a new search begins', async () => {
    const pending = deferred()
    let staleSignal
    api.loadEvidenceDocument.mockImplementation((_release, _identifier, signal) => {
      staleSignal = signal
      return pending.promise
    })
    render(EvidencePanel)
    await fireEvent.click(await screen.findByRole('button', { name: /Structural basis/ }))
    await waitFor(() => expect(staleSignal).toBeInstanceOf(AbortSignal))
    await fireEvent.update(screen.getByLabelText('PMID, PMCID, DOI, ontology ID, or text'), 'MTHFR')
    await fireEvent.click(screen.getByRole('button', { name: 'Search evidence' }))
    pending.resolve(await fixture.document('PMCID:PMC5995969'))

    await waitFor(() => expect(staleSignal.aborted).toBe(true))
    expect(screen.queryByText('Selected document')).toBeNull()
  })

  it('aborts and ignores candidate generation when a new search begins', async () => {
    const pending = deferred()
    let staleSignal
    let candidateInput
    await openLicensedDocument()
    api.extractEvidenceCandidate.mockImplementation((_release, input, signal) => {
      candidateInput = input
      staleSignal = signal
      return pending.promise
    })
    await fireEvent.click(screen.getByLabelText(/Phosphorylation has been identified/))
    await fireEvent.click(screen.getByRole('button', { name: 'Extract unreviewed candidate' }))
    await waitFor(() => expect(staleSignal).toBeInstanceOf(AbortSignal))
    await fireEvent.click(screen.getByRole('button', { name: 'Search evidence' }))
    pending.resolve(await fixture.extract(candidateInput))

    await waitFor(() => expect(staleSignal.aborted).toBe(true))
    expect(screen.queryByText(/MTHFR phosphorylation · increases sensitivity to · SAM inhibition/)).toBeNull()
  })

  it('does not label a generic extraction error as Ollama unavailable', async () => {
    api.extractEvidenceCandidate.mockRejectedValue(new Error('Candidate response failed schema validation.'))
    await openLicensedDocument()
    await fireEvent.click(screen.getByLabelText(/Phosphorylation has been identified/))
    await fireEvent.click(screen.getByRole('button', { name: 'Extract unreviewed candidate' }))

    expect(await screen.findByText('Candidate response failed schema validation.')).toBeTruthy()
    expect(screen.queryByText('Ollama generation unavailable; no candidate was created')).toBeNull()
  })
})
