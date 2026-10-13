import { z } from 'zod'
import {
  DATA_PLANE_CSRF_HEADER,
  DATA_PLANE_CSRF_VALUE,
  DATA_PLANE_PINS,
  AuthorityClosureAuditRequestSchema,
  DataPlanePageQuerySchema,
  DataPlaneRecordTypeSchema,
  DataPlaneSyncRequestSchema,
  ReleaseIdSchema,
  Sha256Schema
} from '../../shared/data-plane-contracts.js'
import { DataPlaneRequestError } from '../data-plane/service.js'
import { createCsrfGuard } from '../http/guards.js'
import { problemReply } from '../http/replies.js'
import { createRouter, paramSchema } from '../http/routes.js'

const ReleaseParamSchema = paramSchema('releaseId', ReleaseIdSchema)
const RecordParamSchema = z.object({ releaseId: ReleaseIdSchema, recordType: DataPlaneRecordTypeSchema, recordId: z.string().min(1).max(200) }).strict()
const PageParamSchema = z.object({ releaseId: ReleaseIdSchema, recordType: DataPlaneRecordTypeSchema }).strict()
const DiffQuerySchema = z.object({ base_release_id: ReleaseIdSchema, candidate_release_id: ReleaseIdSchema }).strict()
const AuditParamSchema = paramSchema('reportDigest', Sha256Schema)

const invalidDataPlane = problemReply(422, 'INVALID_DATA_PLANE_REQUEST', 'Data-plane request does not match the strict v1 contract.')

export function registerDataPlaneRoutes(app, { dataPlane, allowedOrigins }) {
  const { get, post } = createRouter(app, invalidDataPlane)
  const mutation = {
    preHandler: createCsrfGuard(allowedOrigins, DATA_PLANE_CSRF_HEADER, DATA_PLANE_CSRF_VALUE,
      () => new DataPlaneRequestError('data_plane_csrf_rejected', 'Data-plane mutation requires a startup-allowlisted Origin and CSRF header.', 403))
  }

  get('/api/v9/data-plane', {}, () => ({
    contractVersion: '1.0.0',
    mode: 'local-verified-mirror',
    explicitSync: true,
    readNetworkAccess: false,
    pins: DATA_PLANE_PINS,
    status: dataPlane.status(),
    routes: {
      status: '/api/v9/data-plane/status',
      sync: '/api/v9/data-plane/sync',
      releases: '/api/v9/data-plane/releases',
      release: '/api/v9/data-plane/releases/{releaseId}',
      record: '/api/v9/data-plane/releases/{releaseId}/records/{recordType}/{recordId}',
      pages: '/api/v9/data-plane/releases/{releaseId}/pages/{recordType}',
      diff: '/api/v9/data-plane/diff',
      integrity: '/api/v9/data-plane/integrity',
      audits: '/api/v9/data-plane/audits',
      audit: '/api/v9/data-plane/audits/{reportDigest}'
    }
  }))
  get('/api/v9/data-plane/status', {}, () => dataPlane.status())
  post('/api/v9/data-plane/sync', { bodyOrEmpty: DataPlaneSyncRequestSchema, options: mutation, status: 200 }, () => dataPlane.sync())
  get('/api/v9/data-plane/releases', {}, () => dataPlane.listReleases())
  get('/api/v9/data-plane/releases/:releaseId', { params: ReleaseParamSchema }, ({ params }) => dataPlane.releaseDetail(params.releaseId))
  get('/api/v9/data-plane/releases/:releaseId/records/:recordType/:recordId', { params: RecordParamSchema },
    ({ params }) => dataPlane.record(params.releaseId, params.recordType, params.recordId))
  get('/api/v9/data-plane/releases/:releaseId/pages/:recordType', { params: PageParamSchema, query: DataPlanePageQuerySchema },
    ({ params, query }) => dataPlane.page(params.releaseId, params.recordType, query))
  get('/api/v9/data-plane/diff', { query: DiffQuerySchema }, ({ query }) => dataPlane.diff(query.base_release_id, query.candidate_release_id))
  get('/api/v9/data-plane/integrity', {}, () => dataPlane.integrity())
  post('/api/v9/data-plane/audits', { body: AuthorityClosureAuditRequestSchema, options: mutation, status: 201 },
    ({ body }) => dataPlane.audit(body.candidateReleaseId, body.baselineReleaseId))
  get('/api/v9/data-plane/audits', {}, () => dataPlane.listAudits())
  get('/api/v9/data-plane/audits/:reportDigest', { params: AuditParamSchema }, ({ params }) => dataPlane.auditDetail(params.reportDigest))
}
