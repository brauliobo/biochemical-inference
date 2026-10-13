import {
  AssertionDetailSchema,
  AssertionEventsSchema,
  AssertionListSchema,
  BundleDetailSchema,
  BundleSubmitResponseSchema,
  DERIVED_CSRF_HEADER,
  DERIVED_CSRF_VALUE,
  DerivedHealthSchema,
  EventAppendResponseSchema,
  ImpactRequestSchema,
  ImpactResponseSchema,
  LayeredQueryResponseSchema,
  LayeredQuerySchema,
  MeasurementComparisonRequestSchema,
  MeasurementComparisonResponseSchema,
  ReproduceRequestSchema,
  ReviewEventRequestSchema
} from '../../shared/derived-contracts.js'
import { csrfHeaders, getJson, postJson, withQuery } from './core.js'

const mutationHeaders = csrfHeaders(DERIVED_CSRF_HEADER, DERIVED_CSRF_VALUE)
const assertionPath = (assertionDigest) => `/api/v6/derived/assertions/${encodeURIComponent(assertionDigest)}`

export async function loadDerivedHealth(signal) {
  return getJson('/api/v6/derived/health', DerivedHealthSchema, signal)
}

export async function loadDerivedAssertions(filters = {}, signal) {
  return getJson(withQuery('/api/v6/derived/assertions', filters), AssertionListSchema, signal)
}

export async function loadReviewedDerivedAssertions(filters = {}, signal) {
  return getJson(withQuery('/api/v6/derived/reviewed-assertions', filters), AssertionListSchema, signal)
}

export async function loadDerivedAssertion(assertionDigest, signal) {
  return getJson(assertionPath(assertionDigest), AssertionDetailSchema, signal)
}

export async function loadDerivedEvents(assertionDigest, signal) {
  return getJson(`${assertionPath(assertionDigest)}/events`, AssertionEventsSchema, signal)
}

export async function loadDerivedBundle(bundleDigest, signal) {
  return getJson(`/api/v6/derived/bundles/${encodeURIComponent(bundleDigest)}`, BundleDetailSchema, signal)
}

export async function submitApapDerivedBundle(runId, signal) {
  return postJson(`/api/v6/derived/apap-runs/${encodeURIComponent(runId)}/bundles`, {}, BundleSubmitResponseSchema, { signal, headers: mutationHeaders })
}

export async function appendDerivedReviewEvent(assertionDigest, input, signal) {
  const request = ReviewEventRequestSchema.parse(input)
  return postJson(`${assertionPath(assertionDigest)}/events`, request, EventAppendResponseSchema, { signal, headers: mutationHeaders })
}

export async function reproduceDerivedAssertion(assertionDigest, input, signal) {
  const request = ReproduceRequestSchema.parse(input)
  return postJson(`${assertionPath(assertionDigest)}/reproduce`, request, EventAppendResponseSchema, { signal, headers: mutationHeaders })
}

export async function queryDerivedLayers(input, signal) {
  return postJson('/api/v6/derived/query', LayeredQuerySchema.parse(input), LayeredQueryResponseSchema, { signal })
}

export async function queryDerivedImpact(input, signal) {
  return postJson('/api/v6/derived/impact', ImpactRequestSchema.parse(input), ImpactResponseSchema, { signal })
}

export async function compareDerivedMeasurement(input, signal) {
  return postJson('/api/v6/derived/measurements/compare', MeasurementComparisonRequestSchema.parse(input), MeasurementComparisonResponseSchema, { signal })
}
