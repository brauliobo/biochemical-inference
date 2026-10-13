import { z } from 'zod'
import {
  CalibrationRequestSchema,
  DisclosureIntentSchema,
  FreezeIntentSchema,
  MEASURED_CSRF_HEADER,
  MEASURED_CSRF_VALUE,
  MeasuredLocalPageQuerySchema,
  MeasuredLocalRecordTypeSchema,
  MeasuredSyncRequestSchema,
  Sha256Schema
} from '../../shared/measured-contracts.js'
import { createCsrfGuard } from '../http/guards.js'
import { noStore, problemReply } from '../http/replies.js'
import { createRouter, paramSchema } from '../http/routes.js'
import { MeasuredRequestError } from '../measured/service.js'

const PageParamSchema = paramSchema('recordType', MeasuredLocalRecordTypeSchema)
const LineageParamSchema = paramSchema('measurementId', z.string().min(1).max(160))
const ArtifactParamSchema = paramSchema('artifactDigest', Sha256Schema)

const invalidMeasured = problemReply(422, 'INVALID_MEASURED_REQUEST', 'Measured request does not match the strict v1 contract.')

export function registerMeasuredRoutes(app, { measured, allowedOrigins }) {
  const { get, post } = createRouter(app, invalidMeasured)
  const requireMutation = createCsrfGuard(allowedOrigins, MEASURED_CSRF_HEADER, MEASURED_CSRF_VALUE,
    () => new MeasuredRequestError('MEASURED_CSRF_REJECTED', 'Measured mutation requires a startup-allowlisted Origin and browser CSRF header.', 403))
  const mutation = { preHandler: requireMutation }
  const protectedRoute = { onRequest: async (_request, reply) => { noStore(reply, { privateCache: true, dropEtag: false }) }, preHandler: requireMutation }

  get('/api/v10/measured', {}, () => measured.discovery())
  get('/api/v10/measured/status', {}, () => measured.status())
  post('/api/v10/measured/sync', { bodyOrEmpty: MeasuredSyncRequestSchema, options: mutation }, () => measured.sync())
  get('/api/v10/measured/pages/:recordType', { params: PageParamSchema, query: MeasuredLocalPageQuerySchema },
    ({ params, query }) => measured.page(params.recordType, query))
  get('/api/v10/measured/lineages/:measurementId', { params: LineageParamSchema }, ({ params }) => measured.lineage(params.measurementId))
  post('/api/v10/measured/calibrations', { body: CalibrationRequestSchema, options: mutation, status: 201 }, ({ body }) => measured.calibrate(body))
  get('/api/v10/measured/calibrations', {}, () => measured.listCalibrations())
  get('/api/v10/measured/calibrations/:artifactDigest', { params: ArtifactParamSchema }, ({ params }) => measured.calibration(params.artifactDigest))
  get('/api/v10/measured/integrity', {}, () => measured.integrity())
  post('/api/v10/measured/commitments', { body: FreezeIntentSchema, options: protectedRoute }, ({ body }, request) => measured.freeze(body, request.raw.signal))
  post('/api/v10/measured/evaluation', { body: DisclosureIntentSchema, options: protectedRoute }, ({ body }, request) => measured.disclose(body, request.raw.signal))
}
