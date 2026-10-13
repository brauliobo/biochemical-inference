import {
  APAP_RELEASE_ID,
  ApapDiscoverySchema,
  ApapRunRecordSchema,
  ApapRunRequestSchema,
  UpstreamApapAssumptionsSchema,
  UpstreamApapContextsSchema,
  UpstreamApapDetailSchema,
  UpstreamApapLimitationsSchema,
  UpstreamApapObservationsSchema,
  UpstreamApapParametersSchema,
  UpstreamApapProtocolsSchema,
  UpstreamApapValidationSchema
} from '../../shared/apap-contracts.js'
import { getJson, postJson } from './core.js'

export async function loadApapWorkspace(signal) {
  const base = `/api/v4/apap/releases/${encodeURIComponent(APAP_RELEASE_ID)}`
  const [discovery, detail, contexts, parameters, protocols, observations, assumptions, limitations, validationMatrix] = await Promise.all([
    getJson('/api/v4/apap', ApapDiscoverySchema, signal),
    getJson(base, UpstreamApapDetailSchema, signal),
    getJson(`${base}/contexts`, UpstreamApapContextsSchema, signal),
    getJson(`${base}/parameters`, UpstreamApapParametersSchema, signal),
    getJson(`${base}/protocols`, UpstreamApapProtocolsSchema, signal),
    getJson(`${base}/observations`, UpstreamApapObservationsSchema, signal),
    getJson(`${base}/assumptions`, UpstreamApapAssumptionsSchema, signal),
    getJson(`${base}/limitations`, UpstreamApapLimitationsSchema, signal),
    getJson(`${base}/validation-matrix`, UpstreamApapValidationSchema, signal)
  ])
  const envelopes = [detail, contexts, parameters, protocols, observations, assumptions, limitations, validationMatrix]
  if (discovery.releaseId !== detail.release.id || discovery.releaseDigest !== detail.release.digest || envelopes.some((item) => item.release.id !== detail.release.id || item.release.digest !== detail.release.digest)) {
    throw new Error('APAP responses do not match the independently pinned release and digest.')
  }
  return { discovery, detail, contexts: contexts.items, parameters: parameters.items, protocols: protocols.items, observations: observations.items, assumptions: assumptions.items, limitations: limitations.items, validationMatrix: validationMatrix.items }
}

export async function runApapBenchmark(input, signal) {
  return postJson('/api/v4/apap/runs', ApapRunRequestSchema.parse(input), ApapRunRecordSchema, { signal })
}
