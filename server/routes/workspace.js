import { z } from 'zod'
import { Sha256Schema } from '../../shared/portfolio-contracts.js'
import {
  BundleImportRequestSchema,
  ComparisonRequestSchema,
  ExperimentCreateRequestSchema,
  HistoryFilterSchema,
  ReportRequestSchema,
  ResourceProfileSchema,
  RestartRequestSchema,
  RevisionCreateRequestSchema,
  WORKSPACE_BUNDLE_REQUEST_BODY_LIMIT,
  RunCreateRequestSchema
} from '../../shared/workspace-contracts.js'
import { RunIdParamSchema } from '../http/params.js'
import { conflict, problemReply } from '../http/replies.js'
import { createRouter, paramSchema } from '../http/routes.js'

const ExperimentParamSchema = paramSchema('experimentId', z.string().uuid())
const AttemptParamSchema = paramSchema('attemptId', Sha256Schema)
const CheckpointParamSchema = paramSchema('checkpointId', Sha256Schema)
const ArtifactParamSchema = paramSchema('artifactId', Sha256Schema)
const ComparisonParamSchema = paramSchema('comparisonId', Sha256Schema)
const ReportParamSchema = paramSchema('reportId', Sha256Schema)
const ReportFileParamSchema = z.object({ reportId: Sha256Schema, format: z.enum(['html', 'json', 'csv', 'svg']) }).strict()
const CloneRequestSchema = z.object({ name: z.string().trim().min(1).max(160).optional() }).strict()

const invalidWorkspace = problemReply(422, 'INVALID_WORKSPACE_REQUEST', 'Workspace request does not match the strict v1 contract.')

export function registerWorkspaceRoutes(app, { workspace }) {
  const { get, post } = createRouter(app, invalidWorkspace)

  get('/api/v7/workspace', {}, () => ({
    contractVersion: '1.0.0',
    checkpointMode: 'from-specification',
    statefulContinuation: false,
    objectAddressing: 'sha256',
    routes: {
      experiments: '/api/v7/workspace/experiments',
      runs: '/api/v7/workspace/runs',
      resourceProfiles: '/api/v7/workspace/resource-profiles',
      comparisons: '/api/v7/workspace/comparisons',
      reports: '/api/v7/workspace/reports'
    }
  }))
  get('/api/v7/workspace/resource-profiles', {}, () => workspace.listResourceProfiles())
  post('/api/v7/workspace/resource-profiles', { body: ResourceProfileSchema, status: 201 }, ({ body }) => workspace.createResourceProfile(body))
  get('/api/v7/workspace/experiments', {}, () => workspace.listExperiments())
  post('/api/v7/workspace/experiments', { body: ExperimentCreateRequestSchema, status: 201 }, ({ body }) => workspace.createExperiment(body))
  post('/api/v7/workspace/experiments/import', { body: BundleImportRequestSchema, options: { bodyLimit: WORKSPACE_BUNDLE_REQUEST_BODY_LIMIT }, status: 201 },
    ({ body }) => workspace.importExperiment(Buffer.from(body.bundleBase64, 'base64')))
  get('/api/v7/workspace/experiments/:experimentId', { params: ExperimentParamSchema }, ({ params }) => workspace.getExperiment(params.experimentId))
  post('/api/v7/workspace/experiments/:experimentId/revisions', { params: ExperimentParamSchema, body: RevisionCreateRequestSchema, status: 201 },
    ({ params, body }) => workspace.createRevision(params.experimentId, body))
  post('/api/v7/workspace/experiments/:experimentId/clone', { params: ExperimentParamSchema, bodyOrEmpty: CloneRequestSchema, status: 201 },
    ({ params, body }) => workspace.cloneExperiment(params.experimentId, body.name))
  get('/api/v7/workspace/experiments/:experimentId/export', { params: ExperimentParamSchema }, ({ params }) => workspace.exportExperiment(params.experimentId))
  get('/api/v7/workspace/runs', { query: HistoryFilterSchema }, ({ query }) => workspace.listHistory(query))
  post('/api/v7/workspace/runs', { body: RunCreateRequestSchema, status: 202 }, ({ body }) => workspace.queueRun(body))
  get('/api/v7/workspace/runs/scientific/:runId', { params: RunIdParamSchema }, ({ params }) => workspace.getRun(params.runId))
  get('/api/v7/workspace/runs/:attemptId', { params: AttemptParamSchema }, ({ params }) => workspace.getAttempt(params.attemptId))
  get('/api/v7/workspace/runs/:attemptId/events', { params: AttemptParamSchema }, ({ params }) => workspace.events(params.attemptId))
  post('/api/v7/workspace/runs/:attemptId/cancel', { params: AttemptParamSchema }, ({ params }, _request, reply) =>
    workspace.cancel(params.attemptId) ?? conflict(reply, 'ATTEMPT_NOT_CANCELLABLE', 'Run attempt is already terminal.'))
  get('/api/v7/workspace/runs/:attemptId/checkpoints', { params: AttemptParamSchema }, ({ params }) => workspace.checkpoints(params.attemptId))
  post('/api/v7/workspace/checkpoints/:checkpointId/restart', { params: CheckpointParamSchema, bodyOrEmpty: RestartRequestSchema, status: 202 },
    ({ params, body }) => workspace.restart(params.checkpointId, body.resourceProfileId))
  get('/api/v7/workspace/runs/:attemptId/artifacts', { params: AttemptParamSchema }, ({ params }) => workspace.artifacts(params.attemptId))
  get('/api/v7/workspace/artifacts/:artifactId', { params: ArtifactParamSchema }, async ({ params }, _request, reply) => {
    const { artifact, content } = await workspace.artifactContent(params.artifactId)
    return reply.headers({ 'content-type': artifact.mediaType, 'content-length': artifact.bytes, 'x-content-sha256': artifact.digest, 'content-disposition': `attachment; filename="${artifact.name}"` }).send(content)
  })
  post('/api/v7/workspace/comparisons', { body: ComparisonRequestSchema, status: 201 }, ({ body }) => workspace.compare(body))
  get('/api/v7/workspace/comparisons/:comparisonId', { params: ComparisonParamSchema }, ({ params }) => workspace.getComparison(params.comparisonId))
  post('/api/v7/workspace/reports', { body: ReportRequestSchema, status: 201 }, ({ body }) => workspace.createReport(body.attemptId))
  get('/api/v7/workspace/reports/:reportId', { params: ReportParamSchema }, ({ params }) => workspace.getReport(params.reportId))
  get('/api/v7/workspace/reports/:reportId/files/:format', { params: ReportFileParamSchema }, async ({ params }, _request, reply) => {
    const report = workspace.getReport(params.reportId)
    const artifact = report.artifacts.find((item) => item.kind === `report-${params.format}`)
    const content = await workspace.artifactContent(artifact.artifactId)
    const headers = params.format === 'html' ? { 'content-security-policy': report.csp } : {}
    return reply.headers({ ...headers, 'content-type': content.artifact.mediaType, 'x-content-sha256': content.artifact.digest }).send(content.content)
  })
}
