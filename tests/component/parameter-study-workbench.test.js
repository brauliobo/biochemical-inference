import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createParameterFixtureClient } from '../../server/parameters/fixture.js'
import { loadParameterOptions } from '../../server/parameters/selection.js'
import { executeStudy } from '../../server/studies/service.js'

const api = vi.hoisted(() => ({ loadParameterOptions: vi.fn(), runParameterStudy: vi.fn() }))
vi.mock('../../src/api.js', () => api)

import ParameterStudyWorkbench from '../../src/components/ParameterStudyWorkbench.vue'

let options
let record

beforeAll(async () => {
  const client = createParameterFixtureClient()
  options = await loadParameterOptions(client)
  const result = await executeStudy(client, {})
  record = { studyId: result.studyId, lifecycle: 'terminal', outcome: result.outcome, result }
})

beforeEach(() => {
  vi.clearAllMocks()
  api.loadParameterOptions.mockResolvedValue(options)
  api.runParameterStudy.mockResolvedValue(record)
})

describe('ParameterStudyWorkbench', () => {
  it('shows selection rationale, exclusions, labels, and disjoint partition IDs', async () => {
    render(ParameterStudyWorkbench)
    expect(await screen.findByText('CANDIDATE:DECAY-POINT · 0.1 s^-1')).toBeTruthy()
    expect(screen.getByText(/Synthetic candidate selected/)).toBeTruthy()
    expect(screen.getByText('CANDIDATE:DECAY-INCOMPATIBLE-UNIT')).toBeTruthy()
    expect(screen.getByText('Calibration IDs (5)')).toBeTruthy()
    expect(screen.getByText('Held-out validation IDs (3)')).toBeTruthy()
    expect(screen.getByText(/contains no measured biology/)).toBeTruthy()
  })

  it('renders fit, identifiability, posterior, held-out coverage, uncertainty, and robustness', async () => {
    render(ParameterStudyWorkbench)
    const button = await screen.findByRole('button', { name: 'Run inference study' })
    await fireEvent.submit(button.closest('form'))
    await waitFor(() => expect(api.runParameterStudy).toHaveBeenCalledOnce())

    expect(await screen.findByText('0.10000000')).toBeTruthy()
    expect(screen.getByText('identifiable')).toBeTruthy()
    expect(screen.getByText(/R-hat 1\./)).toBeTruthy()
    expect(screen.getByText(/3\/3 held-out observations covered/)).toBeTruthy()
    expect(screen.getByText('Robustness matrix · robust')).toBeTruthy()
    expect(screen.getByText('measurement')).toBeTruthy()
  })
})
