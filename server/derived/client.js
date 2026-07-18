import {
  AssertionDetailSchema,
  AssertionEventsSchema,
  AssertionListSchema,
  BundleDetailSchema,
  BundleSubmitResponseSchema,
  DerivedClassificationSchema,
  DerivedDigestSchema,
  DerivedHealthUpstreamSchema,
  EventAppendResponseSchema,
  ImpactRequestSchema,
  ImpactResponseSchema,
  LayeredQueryResponseSchema,
  LayeredQuerySchema,
  MeasurementComparisonRequestSchema,
  MeasurementComparisonResponseSchema,
  ReviewEventRequestSchema,
  ReviewStatusSchema,
  SourceRecordsResponseSchema,
  SourceSelectorSchema
} from '../../shared/derived-contracts.js'
import { verifyDerivedBundle } from './bundle.js'
import { createDerivedFixtureClient } from './fixture.js'

export const DEFAULT_DERIVED_URL = 'http://127.0.0.1:8000'

export class DerivedCompatibilityError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'DerivedCompatibilityError'
    this.statusCode = options.statusCode ?? 409
    this.code = options.code ?? 'DERIVED_INCOMPATIBLE'
  }
}

export function createDerivedClient(env = process.env) {
  if (env.BIOCHEMICAL_DERIVED_USE_FIXTURE === 'true' || env.BIOCHEMICAL_INFERENCE_USE_FIXTURE === 'true') return createDerivedFixtureClient()

  const baseUrl = (env.BIOCHEMICAL_DERIVED_URL ?? env.BIOCHEMICAL_DB_URL ?? DEFAULT_DERIVED_URL).replace(/\/$/, '')
  const writeToken = env.BIOCHEMICAL_DERIVED_WRITE_TOKEN
  const healthPath = env.BIOCHEMICAL_DERIVED_HEALTH_PATH ?? '/api/derived/v1/healthz'
  const timeoutMs = Number(env.BIOCHEMICAL_DERIVED_TIMEOUT_MS ?? 5000)
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new DerivedCompatibilityError('BIOCHEMICAL_DERIVED_TIMEOUT_MS must be positive')

  async function request(path, { method = 'GET', payload, schema, signal, write = false } = {}) {
    if (write && !writeToken) throw new DerivedCompatibilityError('Derived writes are disabled because no server write token is configured.', { statusCode: 503, code: 'DERIVED_WRITE_DISABLED' })
    const headers = { accept: 'application/json' }
    if (payload !== undefined) headers['content-type'] = 'application/json'
    if (write) headers.authorization = `Bearer ${writeToken}`
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: payload === undefined ? undefined : JSON.stringify(payload),
        signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs)
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        const detail = body && typeof body === 'object' && typeof body.detail === 'string' ? body.detail : `status ${response.status}`
        throw new DerivedCompatibilityError(`Derived service rejected ${method} ${path}: ${detail}`, {
          statusCode: response.status >= 400 && response.status < 500 ? response.status : 503,
          code: response.status === 404 ? 'DERIVED_NOT_FOUND' : response.status === 409 || response.status === 422 ? 'DERIVED_REQUEST_REJECTED' : 'DERIVED_UPSTREAM_ERROR'
        })
      }
      const parsed = schema.safeParse(body)
      if (!parsed.success) throw new DerivedCompatibilityError(`Derived service returned an incompatible v1 response for ${method} ${path}`)
      return parsed.data
    } catch (error) {
      if (error instanceof DerivedCompatibilityError) throw error
      const name = error && typeof error === 'object' && 'name' in error ? error.name : ''
      if (name === 'TimeoutError' || name === 'AbortError') throw new DerivedCompatibilityError(`Derived service timed out after ${timeoutMs} ms.`, { statusCode: 503, code: 'DERIVED_TIMEOUT' })
      throw new DerivedCompatibilityError('Derived service is unavailable.', { statusCode: 503, code: 'DERIVED_UNAVAILABLE' })
    }
  }

  return {
    async health(signal) {
      const upstream = await request(healthPath, { schema: DerivedHealthUpstreamSchema, signal })
      const { signing_key_id: _keyId, signing_public_key: _publicKey, ...safe } = upstream
      return safe
    },
    async submitBundle(input) {
      const submission = verifyDerivedBundle(input)
      return request('/api/derived/v1/bundles', { method: 'POST', payload: submission, schema: BundleSubmitResponseSchema, write: true })
    },
    async bundle(digest) {
      return request(`/api/derived/v1/bundles/${encodeURIComponent(DerivedDigestSchema.parse(digest))}`, { schema: BundleDetailSchema })
    },
    async assertions(filters = {}) {
      const query = new URLSearchParams()
      if (filters.subject_id) query.set('subject_id', filters.subject_id)
      if (filters.classification) query.set('classification', DerivedClassificationSchema.parse(filters.classification))
      if (filters.review_status) query.set('review_status', ReviewStatusSchema.parse(filters.review_status))
      const suffix = query.size ? `?${query}` : ''
      return request(`/api/derived/v1/assertions${suffix}`, { schema: AssertionListSchema })
    },
    async reviewedAssertions(filters = {}) {
      const query = new URLSearchParams()
      if (filters.subject_id) query.set('subject_id', filters.subject_id)
      if (filters.classification) query.set('classification', DerivedClassificationSchema.parse(filters.classification))
      const suffix = query.size ? `?${query}` : ''
      return request(`/api/derived/v1/reviewed-assertions${suffix}`, { schema: AssertionListSchema })
    },
    async assertion(digest) {
      return request(`/api/derived/v1/assertions/${encodeURIComponent(DerivedDigestSchema.parse(digest))}`, { schema: AssertionDetailSchema })
    },
    async events(digest) {
      return request(`/api/derived/v1/assertions/${encodeURIComponent(DerivedDigestSchema.parse(digest))}/events`, { schema: AssertionEventsSchema })
    },
    async appendEvent(digest, input) {
      return request(`/api/derived/v1/assertions/${encodeURIComponent(DerivedDigestSchema.parse(digest))}/events`, { method: 'POST', payload: ReviewEventRequestSchema.parse(input), schema: EventAppendResponseSchema, write: true })
    },
    async sourceRecords(input) {
      const selector = SourceSelectorSchema.parse(input)
      const query = new URLSearchParams({ family: selector.family, release_id: selector.release_id, collection: selector.collection })
      if (selector.record_id) query.set('record_id', selector.record_id)
      return request(`/api/derived/v1/source-records?${query}`, { schema: SourceRecordsResponseSchema })
    },
    async query(input) {
      return request('/api/derived/v1/query', { method: 'POST', payload: LayeredQuerySchema.parse(input), schema: LayeredQueryResponseSchema })
    },
    async impact(input) {
      return request('/api/derived/v1/impact', { method: 'POST', payload: ImpactRequestSchema.parse(input), schema: ImpactResponseSchema })
    },
    async compare(input) {
      return request('/api/derived/v1/measurements/compare', { method: 'POST', payload: MeasurementComparisonRequestSchema.parse(input), schema: MeasurementComparisonResponseSchema })
    }
  }
}
