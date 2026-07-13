import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ODE_MODEL } from '../../server/portfolio/registry.js'
import { workspaceSpecification } from '../fixtures/workspace.js'

const api = vi.hoisted(() => ({
  cancelWorkspaceAttempt: vi.fn(),
  cloneWorkspaceExperiment: vi.fn(),
  compareWorkspaceAttempts: vi.fn(),
  createWorkspaceExperiment: vi.fn(),
  createWorkspaceReport: vi.fn(),
  createWorkspaceRevision: vi.fn(),
  exportWorkspaceExperiment: vi.fn(),
  importWorkspaceExperiment: vi.fn(),
  loadPortfolioModels: vi.fn(),
  loadWorkspaceArtifacts: vi.fn(),
  loadWorkspaceAttempt: vi.fn(),
  loadWorkspaceCheckpoints: vi.fn(),
  loadWorkspaceEvents: vi.fn(),
  loadWorkspaceExperiment: vi.fn(),
  loadWorkspaceExperiments: vi.fn(),
  loadWorkspaceHistory: vi.fn(),
  loadWorkspaceResourceProfiles: vi.fn(),
  queueWorkspaceRun: vi.fn(),
  restartWorkspaceCheckpoint: vi.fn()
}))
vi.mock('../../src/api.js', () => api)

import ExperimentWorkspace from '../../src/components/ExperimentWorkspace.vue'

const digest = (character) => `sha256:${character.repeat(64)}`
const timestamp = '2026-07-13T00:00:00.000Z'
const experiment = { experimentId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', name: 'Persisted experiment', description: 'Test', createdAt: timestamp, updatedAt: timestamp, latestRevisionId: digest('1') }
const revision = {
  revisionId: digest('1'),
  experimentId: experiment.experimentId,
  ordinal: 1,
  parentRevisionId: null,
  specificationDigest: digest('2'),
  specificationObjectDigest: digest('3'),
  snapshotDigest: digest('4'),
  snapshotObjectDigest: digest('5'),
  modelDigests: [ODE_MODEL.digest],
  engineDigests: [digest('6')],
  resourceProfileId: 'local-default',
  source: 'local',
  createdAt: timestamp,
  specification: workspaceSpecification()
}
const attempt = { attemptId: digest('7'), runId: digest('8'), revisionId: revision.revisionId, attemptNumber: 1, kind: 'initial', restartMode: null, checkpointId: digest('9'), state: 'terminal', outcome: 'successful', resourceProfileId: 'local-default', createdAt: timestamp, startedAt: timestamp, completedAt: timestamp, cancellationRequested: false, failure: null, resultArtifactId: digest('a'), rerunVerification: 'not-declared' }
const detail = { experiment, revisions: [revision] }

beforeEach(() => {
  vi.clearAllMocks()
  api.loadPortfolioModels.mockResolvedValue([ODE_MODEL])
  api.loadWorkspaceResourceProfiles.mockResolvedValue([{ id: 'local-default', name: 'Local bounded CPU', concurrency: 2, memoryMb: 96 }])
  api.loadWorkspaceExperiments.mockResolvedValue([])
  api.loadWorkspaceHistory.mockResolvedValue({ items: [], total: 0, limit: 50, offset: 0 })
  api.loadWorkspaceExperiment.mockResolvedValue(detail)
  api.createWorkspaceExperiment.mockResolvedValue(detail)
  api.queueWorkspaceRun.mockResolvedValue({ ...attempt, state: 'queued', outcome: null, resultArtifactId: null })
  api.loadWorkspaceAttempt.mockResolvedValue({ attempt, revision, experiment })
  api.loadWorkspaceEvents.mockResolvedValue([])
  api.loadWorkspaceArtifacts.mockResolvedValue([])
  api.loadWorkspaceCheckpoints.mockResolvedValue([{ checkpointId: digest('9') }])
  api.restartWorkspaceCheckpoint.mockResolvedValue({ ...attempt, attemptId: digest('b'), attemptNumber: 2, kind: 'restart', restartMode: 'from-specification', state: 'queued', outcome: null, resultArtifactId: null })
})

describe('ExperimentWorkspace', () => {
  it('creates an immutable experiment specification with resource and rerun controls', async () => {
    render(ExperimentWorkspace)
    expect(await screen.findByRole('heading', { name: 'Durable local research runs' })).toBeTruthy()
    await fireEvent.update(await screen.findByLabelText('Portfolio design'), 'ensemble')
    await fireEvent.update(screen.getByLabelText('Ensemble members'), '2')
    await fireEvent.click(screen.getByRole('button', { name: 'Create experiment' }))

    await waitFor(() => expect(api.createWorkspaceExperiment).toHaveBeenCalledOnce())
    expect(api.createWorkspaceExperiment.mock.calls[0][0]).toMatchObject({ specification: { design: { type: 'ensemble', members: 2 }, entries: [{ id: 'member_1' }, { id: 'member_2' }], numericalContract: { kind: 'exact' } } })
    expect(await screen.findByText(/immutable revision created/)).toBeTruthy()
  })

  it('labels restart as from-specification rather than stateful continuation', async () => {
    api.loadWorkspaceExperiments.mockResolvedValue([experiment])
    api.loadWorkspaceHistory.mockResolvedValue({ items: [{ attempt, experimentId: experiment.experimentId, experimentName: experiment.name, taxonId: 'NCBITaxon:9606', tissueId: null, modelIds: [ODE_MODEL.id], releaseIds: [ODE_MODEL.knowledgeRelease.id] }], total: 1, limit: 50, offset: 0 })
    render(ExperimentWorkspace)
    await fireEvent.click(await screen.findByRole('button', { name: experiment.name }))
    await fireEvent.click(await screen.findByRole('button', { name: 'Restart from specification' }))

    await waitFor(() => expect(api.restartWorkspaceCheckpoint).toHaveBeenCalledWith(digest('9'), 'local-default'))
    expect(await screen.findByText(/No engine state was continued/)).toBeTruthy()
  })
})
