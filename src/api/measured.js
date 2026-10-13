import {
  CalibrationArtifactSchema,
  CalibrationRequestSchema,
  DisclosureIntentSchema,
  EvaluationResponseSchema,
  FreezeIntentSchema,
  FreezeResponseSchema,
  MEASURED_CSRF_HEADER,
  MEASURED_CSRF_VALUE,
  MeasuredLocalDiscoverySchema,
  MeasuredLocalLineageResponseSchema,
  MeasuredLocalPageSchema,
  MeasuredStatusSchema
} from '../../shared/measured-contracts.js'
import { createStrictClient, csrfHeaders, getJson, policyError, postJson, withQuery, withSignal } from './core.js'

const BASE = '/api/v10/measured'
const mutate = (signal) => ({ signal, headers: csrfHeaders(MEASURED_CSRF_HEADER, MEASURED_CSRF_VALUE) })

const protectedRequest = createStrictClient({
  verify(response) {
    if (response.headers.get('cache-control') !== 'private, no-store') {
      throw policyError(response, 'Protected measured response did not preserve the required no-store policy.', 'MEASURED_CACHE_POLICY_INVALID')
    }
  }
})

const protectedPost = (path, body, schema, signal) => protectedRequest(path, {
  init: { method: 'POST', headers: csrfHeaders(MEASURED_CSRF_HEADER, MEASURED_CSRF_VALUE), body: JSON.stringify(body), ...withSignal(signal) },
  schema,
  withCacheControl: true
})

export async function loadMeasuredDiscovery(signal) {
  return getJson(BASE, MeasuredLocalDiscoverySchema, signal)
}

export async function loadMeasuredStatus(signal) {
  return getJson(`${BASE}/status`, MeasuredStatusSchema, signal)
}

export async function syncMeasured(signal) {
  return postJson(`${BASE}/sync`, {}, MeasuredStatusSchema, mutate(signal))
}

export async function loadMeasuredPage(recordType, query = {}, signal) {
  return getJson(withQuery(`${BASE}/pages/${encodeURIComponent(recordType)}`, query), MeasuredLocalPageSchema, signal)
}

export async function loadMeasuredLineage(measurementId, signal) {
  return getJson(`${BASE}/lineages/${encodeURIComponent(measurementId)}`, MeasuredLocalLineageResponseSchema, signal)
}

export async function runMeasuredCalibration(input, signal) {
  return postJson(`${BASE}/calibrations`, CalibrationRequestSchema.parse(input), CalibrationArtifactSchema, mutate(signal))
}

export async function freezeMeasuredCommitment(input, signal) {
  return protectedPost(`${BASE}/commitments`, FreezeIntentSchema.parse(input), FreezeResponseSchema, signal)
}

export async function discloseMeasuredEvaluation(input, signal) {
  return protectedPost(`${BASE}/evaluation`, DisclosureIntentSchema.parse(input), EvaluationResponseSchema, signal)
}
