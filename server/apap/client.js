import {
  APAP_RELEASE_DIGEST,
  APAP_RELEASE_ID,
  UpstreamApapAssumptionsSchema,
  UpstreamApapCatalogSchema,
  UpstreamApapContextsSchema,
  UpstreamApapDetailSchema,
  UpstreamApapObservationsSchema,
  UpstreamApapLimitationsSchema,
  UpstreamApapParametersSchema,
  UpstreamApapProtocolsSchema,
  UpstreamApapValidationSchema
} from '../../shared/apap-contracts.js'
import { createApapFixtureClient } from './fixture.js'
import { defineProblemError } from '../commons/errors.js'

export const DEFAULT_APAP_URL = 'http://127.0.0.1:8000'

export const ApapCompatibilityError = defineProblemError('ApapCompatibilityError', { statusCode: 409, code: 'APAP_INCOMPATIBLE' })

export function createApapClient(env = process.env) {
  if (env.BIOCHEMICAL_APAP_USE_FIXTURE === 'true' || env.BIOCHEMICAL_INFERENCE_USE_FIXTURE === 'true') return createApapFixtureClient()

  const baseUrl = (env.BIOCHEMICAL_APAP_URL ?? env.BIOCHEMICAL_DB_URL ?? DEFAULT_APAP_URL).replace(/\/$/, '')
  const releaseId = env.BIOCHEMICAL_APAP_RELEASE_ID ?? APAP_RELEASE_ID
  const expectedDigest = env.BIOCHEMICAL_APAP_EXPECTED_DIGEST ?? APAP_RELEASE_DIGEST
  const timeoutMs = Number(env.BIOCHEMICAL_APAP_TIMEOUT_MS ?? 5000)
  if (releaseId !== APAP_RELEASE_ID) throw new ApapCompatibilityError(`Only ${APAP_RELEASE_ID} is supported`)
  if (expectedDigest !== APAP_RELEASE_DIGEST) throw new ApapCompatibilityError(`Configured APAP digest must equal the trusted ${APAP_RELEASE_ID} digest`)
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new ApapCompatibilityError('BIOCHEMICAL_APAP_TIMEOUT_MS must be positive')
  const requestSignal = (signal) => signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs)

  async function fetchJson(path, signal) {
    try {
      const response = await fetch(`${baseUrl}${path}`, { headers: { accept: 'application/json' }, signal: requestSignal(signal) })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        const statusCode = response.status >= 400 && response.status < 500 ? response.status : 503
        throw new ApapCompatibilityError(`APAP service returned ${response.status} for ${path}`, { statusCode, code: response.status === 404 ? 'APAP_NOT_FOUND' : 'APAP_UPSTREAM_ERROR' })
      }
      return payload
    } catch (error) {
      if (error instanceof ApapCompatibilityError) throw error
      const name = error && typeof error === 'object' && 'name' in error ? error.name : undefined
      if (name === 'TimeoutError' || name === 'AbortError') throw new ApapCompatibilityError(`APAP service timed out after ${timeoutMs} ms for ${path}`, { statusCode: 503, code: 'APAP_TIMEOUT' })
      throw new ApapCompatibilityError(`APAP service is unavailable for ${path}`, { statusCode: 503, code: 'APAP_UNAVAILABLE' })
    }
  }

  function verifyEnvelope(payload, description) {
    if (payload.release.id !== releaseId || payload.release.digest !== expectedDigest) throw new ApapCompatibilityError(`APAP ${description} does not match the pinned release and digest`)
    return payload
  }

  async function catalog(signal) {
    const parsed = UpstreamApapCatalogSchema.safeParse(await fetchJson('/api/benchmarks/apap/v1/releases', signal))
    if (!parsed.success) throw new ApapCompatibilityError('APAP release catalog schema is incompatible with 1.0.0')
    const release = parsed.data.releases.find((item) => item.release_id === releaseId)
    if (!release || release.release_digest !== expectedDigest) throw new ApapCompatibilityError(`APAP release ${releaseId} and its trusted digest were not returned`)
    return parsed.data
  }

  async function verified(path, schema, description, signal) {
    await catalog(signal)
    const parsed = schema.safeParse(await fetchJson(`/api/benchmarks/apap/v1/releases/${encodeURIComponent(releaseId)}${path}`, signal))
    if (!parsed.success) throw new ApapCompatibilityError(`APAP ${description} schema is incompatible with 1.0.0`)
    return verifyEnvelope(parsed.data, description)
  }

  async function detail() {
    return verified('', UpstreamApapDetailSchema, 'release detail')
  }

  return {
    catalog,
    detail,
    async contexts(signal) { return verified('/contexts', UpstreamApapContextsSchema, 'contexts', signal) },
    async parameters() { return verified('/parameters', UpstreamApapParametersSchema, 'parameters') },
    async protocols() { return verified('/protocols', UpstreamApapProtocolsSchema, 'protocols') },
    async observations() { return verified('/observations', UpstreamApapObservationsSchema, 'observations') },
    async validationMatrix() { return verified('/validation-matrix', UpstreamApapValidationSchema, 'validation matrix') },
    async assumptions() {
      const payload = await detail()
      return UpstreamApapAssumptionsSchema.parse({ release: payload.release, items: payload.benchmark.assumptions })
    },
    async limitations() {
      const payload = await detail()
      return UpstreamApapLimitationsSchema.parse({ release: payload.release, items: payload.benchmark.limitations })
    }
  }
}
