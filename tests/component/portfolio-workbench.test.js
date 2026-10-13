import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { expectAccessible } from '../helpers/axe.js'
import { runOde } from '../../server/portfolio/engines/ode.js'
import { terminalResult } from '../../server/portfolio/execution.js'
import { runIdentity } from '../../server/portfolio/identity.js'
import { FBA_MODEL, ODE_MODEL, SSA_MODEL } from '../../server/portfolio/registry.js'
import { benchmarkExperiment } from '../fixtures/portfolio/experiments.js'

const api = vi.hoisted(() => ({ loadPortfolioModels: vi.fn(), runPortfolioExperiment: vi.fn() }))
vi.mock('../../src/api.js', () => api)

import PortfolioWorkbench from '../../src/components/PortfolioWorkbench.vue'

beforeEach(() => {
  vi.clearAllMocks()
  api.loadPortfolioModels.mockResolvedValue([ODE_MODEL, SSA_MODEL, FBA_MODEL])
  api.runPortfolioExperiment.mockImplementation(async (experiment) => {
    const execution = runOde(ODE_MODEL, experiment)
    const result = terminalResult(ODE_MODEL, experiment, runIdentity(ODE_MODEL, experiment), execution)
    return { runId: result.runId, lifecycle: 'terminal', outcome: result.outcome, result }
  })
})

describe('PortfolioWorkbench', () => {
  it('shows units and assumptions and renders an accessible ODE result table', async () => {
    render(PortfolioWorkbench)
    expect((await screen.findByLabelText('Model and engine')).value).toBe(ODE_MODEL.id)
    expect(screen.getByText('Reactant A concentration · mol/L')).toBeTruthy()
    expect(screen.getByText(ODE_MODEL.assumptions[0])).toBeTruthy()

    await fireEvent.submit(screen.getByRole('button', { name: 'Run ODE benchmark' }).closest('form'))
    await waitFor(() => expect(api.runPortfolioExperiment).toHaveBeenCalledOnce())
    expect(await screen.findByText('ODE final state')).toBeTruthy()
    expect(screen.getByRole('img', { name: /ODE reactant trajectory/ })).toBeTruthy()
    expect(screen.getByText(/terminal · successful/)).toBeTruthy()
  })

  it('changes controls for SSA and FBA without hiding their scientific boundaries', async () => {
    render(PortfolioWorkbench)
    const selector = await screen.findByLabelText('Model and engine')
    await fireEvent.update(selector, SSA_MODEL.id)
    expect(screen.getByLabelText('Replicates')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Run SSA benchmark' })).toBeTruthy()
    await fireEvent.update(selector, FBA_MODEL.id)
    expect(screen.queryByLabelText('Duration (s)')).toBeNull()
    expect(screen.getByRole('button', { name: 'Run FBA benchmark' })).toBeTruthy()
    expect(screen.getByText(FBA_MODEL.limitations[0])).toBeTruthy()
  })

  it('has no WCAG 2.2 AA violations with an ODE result', async () => {
    render(PortfolioWorkbench)
    await fireEvent.submit((await screen.findByRole('button', { name: 'Run ODE benchmark' })).closest('form'))
    await screen.findByText('ODE final state')
    await expectAccessible()
  })
})
