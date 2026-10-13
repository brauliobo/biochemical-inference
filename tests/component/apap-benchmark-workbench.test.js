import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { expectAccessible } from '../helpers/axe.js'
import { createApapFixtureClient } from '../../server/apap/fixture.js'
import { createApapRunService, loadApapClosure } from '../../server/apap/service.js'
import { APAP_RELEASE_ID } from '../../shared/apap-contracts.js'
import { spatialWorkspace } from '../fixtures/spatial.js'

const api = vi.hoisted(() => ({ loadApapWorkspace: vi.fn(), runApapBenchmark: vi.fn(), loadSpatialWorkspace: vi.fn() }))
vi.mock('../../src/api.js', () => api)

import APAPBenchmarkWorkbench from '../../src/components/APAPBenchmarkWorkbench.vue'

let workspace
let record
let spatial

function deferred() {
  let resolve
  const promise = new Promise((complete) => { resolve = complete })
  return { promise, resolve }
}

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
  spatial = await spatialWorkspace()
}, 30_000)

beforeEach(() => {
  vi.clearAllMocks()
  api.loadApapWorkspace.mockResolvedValue(workspace)
  api.runApapBenchmark.mockResolvedValue(record)
  api.loadSpatialWorkspace.mockResolvedValue(spatial)
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
    expect(screen.getByRole('group', { name: /adduct across 12 portal-to-central lobule bins/ })).toBeTruthy()
    expect(screen.getByText(/Accessible lobule state/)).toBeTruthy()
    expect(await screen.findByText('Synthetic lobule spatial view')).toBeTruthy()
    expect(screen.getByText('Synthetic geometry · HRA unavailable')).toBeTruthy()
    expect(screen.getByText('Conservation diagnostics')).toBeTruthy()
    expect(screen.getByText(/1x\/2x\/4x timestep refinement/)).toBeTruthy()
    expect(screen.getByText('Pass · zero-cyp')).toBeTruthy()
    expect(screen.getByText('Pass · zero-binding')).toBeTruthy()
    expect(screen.getByText('Pass · uniform-zonation')).toBeTruthy()
  })

  it('emits the completed record so the review workbench can submit it', async () => {
    const onCompleted = vi.fn()
    render(APAPBenchmarkWorkbench, { props: { onCompleted: () => onCompleted } })
    await fireEvent.click(await screen.findByRole('button', { name: 'Run APAP benchmark' }))

    await waitFor(() => expect(onCompleted).toHaveBeenCalledWith(record))
  })

  it('locks all request-defining controls and ignores a response after its generation ends', async () => {
    const pending = deferred()
    api.runApapBenchmark.mockReturnValue(pending.promise)
    const onCompleted = vi.fn()
    // Vapor reads root props as getters, so a listener is passed as () => listener.
    const view = render(APAPBenchmarkWorkbench, { props: { onCompleted: () => onCompleted } })
    await fireEvent.click(await screen.findByRole('button', { name: 'Run APAP benchmark' }))

    const cards = screen.getAllByRole('button').filter((button) => button.hasAttribute('aria-pressed'))
    expect(cards).toHaveLength(workspace.contexts.length + workspace.protocols.length)
    for (const control of cards) expect(control.disabled).toBe(true)
    expect(screen.getByRole('status').textContent).toMatch(/controls are locked/)
    for (const name of ['CYP activity', 'NAPQI adduct binding', 'Zonation amplitude', 'NAC-to-GSH term']) expect(screen.getByLabelText(name).disabled).toBe(true)

    view.unmount()
    pending.resolve(record)
    await Promise.resolve()
    expect(onCompleted).not.toHaveBeenCalled()
  })

  it('has no WCAG 2.2 AA violations with a completed run and the lobule view', async () => {
    render(APAPBenchmarkWorkbench)
    await fireEvent.click(await screen.findByRole('button', { name: 'Run APAP benchmark' }))
    await screen.findByText('Canonical APAP run identity')
    await screen.findByText('Synthetic lobule spatial view')
    await expectAccessible()
  })
})
