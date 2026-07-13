import { describe, expect, it } from 'vitest'
import { executeInWorker } from '../../server/portfolio/execution.js'
import { ODE_MODEL } from '../../server/portfolio/registry.js'
import { benchmarkExperiment } from '../fixtures/portfolio/experiments.js'

describe('isolated portfolio worker protocol', () => {
  it('validates bounded JSON IPC and enforces the parent output budget', async () => {
    const execution = executeInWorker(ODE_MODEL, benchmarkExperiment(ODE_MODEL), { maxOutputBytes: 100 })
    const result = await execution.promise
    expect(result).toMatchObject({ lifecycle: 'terminal', outcome: 'resource-exhausted', failure: { code: 'output_limit' } })
  })

  it('exposes cancellation as a distinct terminal outcome', async () => {
    const execution = executeInWorker(ODE_MODEL, benchmarkExperiment(ODE_MODEL))
    expect(execution.cancel()).toBe(true)
    const result = await execution.promise
    expect(result).toMatchObject({ lifecycle: 'terminal', outcome: 'cancelled', failure: { code: 'cancelled_by_request' } })
    expect(execution.cancel()).toBe(false)
  })
})
