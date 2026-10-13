import {
  ArtifactRecordSchema,
  AttemptDetailSchema,
  AttemptRecordSchema,
  BundleExportResponseSchema,
  ComparisonRecordSchema,
  ComparisonRequestSchema,
  ExperimentCreateRequestSchema,
  ExperimentDetailSchema,
  ExperimentRecordSchema,
  HistoryResponseSchema,
  ReportRecordSchema,
  ResourceProfileSchema,
  RevisionCreateRequestSchema,
  RevisionRecordSchema,
  SpecificationCheckpointSchema,
  WorkspaceEventSchema
} from '../../shared/workspace-contracts.js'
import { getJson, postJson, withQuery } from './core.js'

const BASE = '/api/v7/workspace'
const experimentPath = (experimentId) => `${BASE}/experiments/${encodeURIComponent(experimentId)}`
const attemptPath = (attemptId) => `${BASE}/runs/${encodeURIComponent(attemptId)}`

export async function loadWorkspaceResourceProfiles(signal) {
  return getJson(`${BASE}/resource-profiles`, ResourceProfileSchema.array(), signal)
}

export async function loadWorkspaceExperiments(signal) {
  return getJson(`${BASE}/experiments`, ExperimentRecordSchema.array(), signal)
}

export async function createWorkspaceExperiment(input, signal) {
  return postJson(`${BASE}/experiments`, ExperimentCreateRequestSchema.parse(input), ExperimentDetailSchema, { signal })
}

export async function loadWorkspaceExperiment(experimentId, signal) {
  return getJson(experimentPath(experimentId), ExperimentDetailSchema, signal)
}

export async function createWorkspaceRevision(experimentId, input, signal) {
  return postJson(`${experimentPath(experimentId)}/revisions`, RevisionCreateRequestSchema.parse(input), RevisionRecordSchema, { signal })
}

export async function cloneWorkspaceExperiment(experimentId, name, signal) {
  return postJson(`${experimentPath(experimentId)}/clone`, name ? { name } : {}, ExperimentDetailSchema, { signal })
}

export async function queueWorkspaceRun(revisionId, resourceProfileId, signal) {
  return postJson(`${BASE}/runs`, { revisionId, ...(resourceProfileId ? { resourceProfileId } : {}) }, AttemptRecordSchema, { signal })
}

export async function loadWorkspaceHistory(filters = {}, signal) {
  return getJson(withQuery(`${BASE}/runs`, filters), HistoryResponseSchema, signal)
}

export async function loadWorkspaceAttempt(attemptId, signal) {
  return getJson(attemptPath(attemptId), AttemptDetailSchema, signal)
}

export async function loadWorkspaceEvents(attemptId, signal) {
  return getJson(`${attemptPath(attemptId)}/events`, WorkspaceEventSchema.array(), signal)
}

export async function cancelWorkspaceAttempt(attemptId, signal) {
  return postJson(`${attemptPath(attemptId)}/cancel`, {}, AttemptRecordSchema, { signal })
}

export async function loadWorkspaceCheckpoints(attemptId, signal) {
  return getJson(`${attemptPath(attemptId)}/checkpoints`, SpecificationCheckpointSchema.array(), signal)
}

export async function restartWorkspaceCheckpoint(checkpointId, resourceProfileId, signal) {
  return postJson(`${BASE}/checkpoints/${encodeURIComponent(checkpointId)}/restart`, resourceProfileId ? { resourceProfileId } : {}, AttemptRecordSchema, { signal })
}

export async function loadWorkspaceArtifacts(attemptId, signal) {
  return getJson(`${attemptPath(attemptId)}/artifacts`, ArtifactRecordSchema.array(), signal)
}

export async function compareWorkspaceAttempts(input, signal) {
  return postJson(`${BASE}/comparisons`, ComparisonRequestSchema.parse(input), ComparisonRecordSchema, { signal })
}

export async function createWorkspaceReport(attemptId, signal) {
  return postJson(`${BASE}/reports`, { attemptId }, ReportRecordSchema, { signal })
}

export async function exportWorkspaceExperiment(experimentId, signal) {
  return getJson(`${experimentPath(experimentId)}/export`, BundleExportResponseSchema, signal)
}

export async function importWorkspaceExperiment(bundleBase64, signal) {
  return postJson(`${BASE}/experiments/import`, { bundleBase64 }, ExperimentDetailSchema, { signal })
}
