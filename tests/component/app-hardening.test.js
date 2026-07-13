import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BUNDLED_PROVENANCE, BUNDLED_RELEASE, bundledNetwork } from '../../server/knowledge/fixture.js'
import { MODEL } from '../../server/model.js'
import { simulate } from '../../server/simulation.js'

const api = vi.hoisted(() => ({
  loadWorkspace: vi.fn(),
  loadNetwork: vi.fn(),
  loadProvenance: vi.fn(),
  runSimulation: vi.fn(),
  loadPortfolioModels: vi.fn(),
  runPortfolioExperiment: vi.fn()
}))

vi.mock('../../src/api.js', () => api)

import App from '../../src/App.vue'

function deferred() {
  let resolve
  const promise = new Promise((complete) => { resolve = complete })
  return { promise, resolve }
}

beforeEach(() => {
  vi.clearAllMocks()
  api.loadWorkspace.mockResolvedValue({ release: BUNDLED_RELEASE, model: MODEL, network: bundledNetwork(9606) })
  api.loadProvenance.mockResolvedValue(BUNDLED_PROVENANCE)
  api.runSimulation.mockImplementation(async (request) => simulate(request, BUNDLED_RELEASE, bundledNetwork(request.taxonId)))
  api.loadPortfolioModels.mockResolvedValue([])
})

describe('workbench request hardening', () => {
  it('hides the stale network and ignores out-of-order taxon responses', async () => {
    const mouse = deferred()
    const human = deferred()
    api.loadNetwork.mockImplementation((_releaseId, taxonId) => taxonId === 10090 ? mouse.promise : human.promise)
    render(App)
    const taxon = await screen.findByLabelText('Taxon and protein evidence')

    await fireEvent.update(taxon, '10090')
    await waitFor(() => expect(api.loadNetwork).toHaveBeenCalledWith(BUNDLED_RELEASE.id, 10090, expect.any(AbortSignal)))
    expect(screen.getByText(/previous network is hidden/)).toBeTruthy()

    await fireEvent.update(taxon, '9606')
    await waitFor(() => expect(api.loadNetwork).toHaveBeenCalledWith(BUNDLED_RELEASE.id, 9606, expect.any(AbortSignal)))
    human.resolve(bundledNetwork(9606))
    expect(await screen.findByText('MTR')).toBeTruthy()

    mouse.resolve(bundledNetwork(10090))
    await Promise.resolve()
    expect(screen.queryByText('Mtr')).toBeNull()
    expect(taxon.value).toBe('9606')
  })

  it('locks every request-defining control during a run and marks edited activity as custom', async () => {
    const completed = deferred()
    api.runSimulation.mockReturnValue(completed.promise)
    render(App)
    const activity = await screen.findByLabelText('MTHFR relative activity')
    const taxon = screen.getByLabelText('Taxon and protein evidence')
    const preset = screen.getByLabelText('Perturbation preset')
    const duration = screen.getByLabelText('Duration')

    await fireEvent.update(activity, '0.8')
    expect(preset.value).toBe('custom')
    await fireEvent.click(screen.getByRole('button', { name: 'Run deterministic model' }))
    for (const control of [taxon, preset, activity, duration]) expect(control.disabled).toBe(true)

    completed.resolve(simulate({
      releaseId: BUNDLED_RELEASE.id,
      taxonId: 9606,
      preset: 'custom',
      mthfrActivity: 0.8,
      durationHours: 24,
      stepHours: 0.05
    }, BUNDLED_RELEASE, bundledNetwork(9606)))
    expect(await screen.findByText('Stable run identity')).toBeTruthy()
  })

  it('does not permit a simulation while taxon evidence is loading', async () => {
    const mouse = deferred()
    api.loadNetwork.mockReturnValue(mouse.promise)
    render(App)
    const taxon = await screen.findByLabelText('Taxon and protein evidence')

    await fireEvent.update(taxon, '10090')
    const runButton = screen.getByRole('button', { name: 'Run deterministic model' })
    expect(runButton.disabled).toBe(true)
    await fireEvent.click(runButton)
    expect(api.runSimulation).not.toHaveBeenCalled()

    mouse.resolve(bundledNetwork(10090))
    await waitFor(() => expect(runButton.disabled).toBe(false))
  })

  it('identifies a provenance request failure without claiming reproducibility or disabling a verified release', async () => {
    api.loadProvenance.mockRejectedValue(new Error('provenance digest mismatch'))
    render(App)

    expect(await screen.findByText('provenance digest mismatch')).toBeTruthy()
    expect(screen.getByText('Reproducibility is not established from the information currently available.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Run deterministic model' }).disabled).toBe(false)
  })
})
