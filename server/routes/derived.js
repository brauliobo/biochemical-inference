import { z } from 'zod'
import {
  DERIVED_CSRF_HEADER,
  DERIVED_CSRF_VALUE,
  DerivedClassificationSchema,
  DerivedDigestSchema,
  ImpactRequestSchema,
  LayeredQuerySchema,
  MeasurementComparisonRequestSchema,
  QualifiedIdSchema,
  ReproduceRequestSchema,
  ReviewEventRequestSchema,
  ReviewStatusSchema,
  SourceSelectorSchema
} from '../../shared/derived-contracts.js'
import { DerivedRequestError } from '../derived/service.js'
import { createCsrfGuard } from '../http/guards.js'
import { RunIdParamSchema } from '../http/params.js'
import { parseOrReply, problemReply } from '../http/replies.js'
import { createRouter, paramSchema } from '../http/routes.js'

const DerivedAssertionParamSchema = paramSchema('assertionDigest', DerivedDigestSchema)
const DerivedBundleParamSchema = paramSchema('bundleDigest', DerivedDigestSchema)
const DerivedListQuerySchema = z.object({
  subject_id: QualifiedIdSchema.optional(),
  classification: DerivedClassificationSchema.optional(),
  review_status: ReviewStatusSchema.optional()
}).strict()
const ReviewedListQuerySchema = DerivedListQuerySchema.omit({ review_status: true })

const invalidDerived = problemReply(422, 'INVALID_DERIVED_REQUEST', 'Derived knowledge request does not match the strict v1 contract.')

export function registerDerivedRoutes(app, { derived, derivedRuns, allowedOrigins }) {
  const { get, post } = createRouter(app, invalidDerived)
  const requireMutation = createCsrfGuard(allowedOrigins, DERIVED_CSRF_HEADER, DERIVED_CSRF_VALUE,
    () => new DerivedRequestError('Derived mutation requires a startup-allowlisted Origin and CSRF header.', { statusCode: 403, code: 'DERIVED_CSRF_REJECTED' }))
  const mutation = { preHandler: requireMutation }

  get('/api/v6/derived/health', {}, () => derived.health())
  post('/api/v6/derived/apap-runs/:runId/bundles', { params: RunIdParamSchema, options: mutation, status: 201 }, ({ params }) => derivedRuns.submitApapRun(params.runId))
  get('/api/v6/derived/bundles/:bundleDigest', { params: DerivedBundleParamSchema }, ({ params }) => derived.bundle(params.bundleDigest))
  get('/api/v6/derived/assertions', { query: DerivedListQuerySchema }, ({ query }) => derived.assertions(query))
  get('/api/v6/derived/reviewed-assertions', { query: ReviewedListQuerySchema }, ({ query }) => derived.reviewedAssertions(query))
  get('/api/v6/derived/assertions/:assertionDigest', { params: DerivedAssertionParamSchema }, ({ params }) => derived.assertion(params.assertionDigest))
  get('/api/v6/derived/assertions/:assertionDigest/events', { params: DerivedAssertionParamSchema }, ({ params }) => derived.events(params.assertionDigest))
  post('/api/v6/derived/assertions/:assertionDigest/events', { params: DerivedAssertionParamSchema, body: ReviewEventRequestSchema, options: mutation, status: 201 },
    ({ params, body }) => derived.appendEvent(params.assertionDigest, body))
  post('/api/v6/derived/assertions/:assertionDigest/reproduce', { params: DerivedAssertionParamSchema, body: ReproduceRequestSchema, options: mutation, status: 201 },
    ({ params, body }) => derivedRuns.reproduce(params.assertionDigest, body))
  app.get('/api/v6/derived/source-records', async (request, reply) => {
    const selector = parseOrReply(reply, SourceSelectorSchema, { ...request.query, record_id: request.query.record_id ?? null }, invalidDerived)
    return selector === undefined ? reply : derived.sourceRecords(selector)
  })
  post('/api/v6/derived/query', { body: LayeredQuerySchema }, ({ body }) => derived.query(body))
  post('/api/v6/derived/impact', { body: ImpactRequestSchema }, ({ body }) => derived.impact(body))
  post('/api/v6/derived/measurements/compare', { body: MeasurementComparisonRequestSchema }, ({ body }) => derived.compare(body))
}
