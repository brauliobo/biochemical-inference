import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApapFixtureClient } from '../../server/apap/fixture.js'
import { createApapRunService, loadApapClosure } from '../../server/apap/service.js'
import { APAP_RELEASE_ID } from '../../shared/apap-contracts.js'

const api = vi.hoisted(() => ({ loadApapWorkspace: vi.fn(), runApapBenchmark: vi.fn() }))
vi.mock('../../src/api.js', () => api)

import APAPBenchmarkWorkbench from '../../src/components/APAPBenchmarkWorkbench.vue'

let workspace
let record

beforeAll(async () => {
  const client = createApapFixtureClient()
  const closure = await loadApapClosure(client)
  workspace = {
    discovery: { contractVersion: '1.0.0', releaseId: APAP_RELEASE_ID, releaseDigest: closure.detail.release.digest, modelId: 'MODEL:APAP-LIVER-MULTISCALE', modelVersion: '1.0.0', equationSetId: 'EQUATION-SET:APAP-LIVER-MULTISCALE-V1', engineVersion: 'fixed-step-rk4-1.0.0', routes: { release: '', contexts: '', parameters: '', protocols: '', observations: '', assumptions: '', limitations: '', validationMatrix: '', runs: '' }, warning: 'Synthetic, non-clinical algorithm benchmark. Not medical advice, treatment guidance, or validated human or mouse toxicology.' },
    ...closure,
    assumptions: closure.detail.benchmark.assumptions,
    limitations: closure.detail.benchmark.limitations
  }
  record = await createApapRunService(client).create({ releaseId: APAP_RELEASE_ID, contextId: 'CONTEXT:APAP-HUMAN-LIVER', protocolId: 'PROTOCOL:APAP-HUMAN-PK', stepHours: 0.01, outputEveryHours: 0.5, mechanismScales: { cypActivity: 1, adductBinding: 1, zonation: 1, nacGsh: 1 } })
}, 30_000)

beforeEach(() => {
  vi.clearAllMocks()
  api.loadApapWorkspace.mockResolvedValue(workspace)
  api.runApapBenchmark.mockResolvedValue(record)
})

describe('APAPBenchmarkWorkbench', () => {
  it('shows the persistent warning, protocol/context cards, unsupported validation, and species parameter records', async () => {
    render(APAPBenchmarkWorkbench)

    expect(await screen.findByText('APAP benchmark workbench')).toBeTruthy()
    expect(screen.getByLabelText('Persistent APAP scientific warning')).toBeTruthy()
    expect(await screen.findByText('Homo sapiens')).toBeTruthy()
    expect(screen.getByText('Mus musculus')).toBeTruthy()
    expect(screen.getByText('Bounded synthetic delayed NAC demonstration')).toBeTruthy()
    expect(screen.getAllByText('Unsupported')).toHaveLength(4)
    expect(screen.getByText('Human/mouse source parameter difference')).toBeTruthy()
  })

  it('runs and renders systemic outputs, accessible lobule data, limiting cases, and exact assumptions', async () => {
    render(APAPBenchmarkWorkbench)
    const button = await screen.findByRole('button', { name: 'Run APAP benchmark' })
    await fireEvent.submit(button.closest('form'))
    await waitFor(() => expect(api.runApapBenchmark).toHaveBeenCalledOnce())

    expect(await screen.findByText('Canonical APAP run identity')).toBeTruthy()
    expect(screen.getByRole('img', { name: /adduct across 12 portal-to-central lobule bins/ })).toBeTruthy()
    expect(screen.getByText(/Accessible lobule state/)).toBeTruthy()
    expect(screen.getByText('Conservation diagnostics')).toBeTruthy()
    expect(screen.getByText('Pass · zero-cyp')).toBeTruthy()
    expect(screen.getByText('Pass · zero-binding')).toBeTruthy()
    expect(screen.getByText('Pass · uniform-zonation')).toBeTruthy()
  })
})
