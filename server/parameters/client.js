import {
  PARAMETER_RELEASE_DIGEST,
  PARAMETER_RELEASE_ID,
  UpstreamParameterCandidatesResponseSchema,
  UpstreamParameterCatalogSchema,
  UpstreamParameterContextsResponseSchema,
  UpstreamParameterDatasetsResponseSchema
} from '../../shared/parameter-contracts.js'
import { createParameterFixtureClient } from './fixture.js'
import { defineProblemError } from '../commons/errors.js'

const DEFAULT_PARAMETER_URL = 'http://127.0.0.1:8000'

export const ParameterCompatibilityError = defineProblemError('ParameterCompatibilityError', { statusCode: 409, code: 'PARAMETER_INCOMPATIBLE' })

export function createParameterClient(env = process.env) {
  if (env.BIOCHEMICAL_PARAMETERS_USE_FIXTURE === 'true' || env.BIOCHEMICAL_INFERENCE_USE_FIXTURE === 'true') return createParameterFixtureClient()

  const baseUrl = (env.BIOCHEMICAL_PARAMETERS_URL ?? env.BIOCHEMICAL_DB_URL ?? DEFAULT_PARAMETER_URL).replace(/\/$/, '')
  const releaseId = env.BIOCHEMICAL_PARAMETERS_RELEASE_ID ?? PARAMETER_RELEASE_ID
  const expectedDigest = env.BIOCHEMICAL_PARAMETERS_EXPECTED_DIGEST ?? PARAMETER_RELEASE_DIGEST
  const timeoutMs = Number(env.BIOCHEMICAL_PARAMETERS_TIMEOUT_MS ?? 5000)
  if (!/^[a-f0-9]{64}$/.test(expectedDigest)) throw new ParameterCompatibilityError('BIOCHEMICAL_PARAMETERS_EXPECTED_DIGEST must be a lowercase SHA-256 digest')
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new ParameterCompatibilityError('BIOCHEMICAL_PARAMETERS_TIMEOUT_MS must be a positive number')
  const requestSignal = (signal) => signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs)

  async function fetchJson(path, signal) {
    try {
      const response = await fetch(`${baseUrl}${path}`, { headers: { accept: 'application/json' }, signal: requestSignal(signal) })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        const statusCode = response.status >= 400 && response.status < 500 ? response.status : 503
        throw new ParameterCompatibilityError(`Parameter service returned ${response.status} for ${path}`, { statusCode, code: response.status === 404 ? 'PARAMETER_NOT_FOUND' : 'PARAMETER_UPSTREAM_ERROR' })
      }
      return payload
    } catch (error) {
      if (error instanceof ParameterCompatibilityError) throw error
      const name = error && typeof error === 'object' && 'name' in error ? error.name : undefined
      if (name === 'TimeoutError' || name === 'AbortError') throw new ParameterCompatibilityError(`Parameter service timed out after ${timeoutMs} ms for ${path}`, { statusCode: 503, code: 'PARAMETER_TIMEOUT' })
      throw new ParameterCompatibilityError(`Parameter service is unavailable for ${path}`, { statusCode: 503, code: 'PARAMETER_UNAVAILABLE' })
    }
  }

  async function catalog(signal) {
    const parsed = UpstreamParameterCatalogSchema.safeParse(await fetchJson('/api/parameters/v1/releases', signal))
    if (!parsed.success) throw new ParameterCompatibilityError('Parameter release catalog schema is incompatible with 1.0.0')
    const release = parsed.data.releases.find((item) => item.release_id === releaseId)
    if (!release) throw new ParameterCompatibilityError(`Configured parameter release ${releaseId} was not returned`)
    if (release.release_digest !== expectedDigest) throw new ParameterCompatibilityError(`Digest mismatch for parameter release ${releaseId}`)
    return parsed.data
  }

  function verifyEnvelope(payload, description) {
    if (payload.release.id !== releaseId || payload.release.digest !== expectedDigest) throw new ParameterCompatibilityError(`Parameter ${description} does not match the pinned release and digest`)
    return payload
  }

  function queryString(filters) {
    const query = new URLSearchParams()
    for (const [key, value] of Object.entries(filters)) if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
    const encoded = query.toString()
    return encoded ? `?${encoded}` : ''
  }

  async function verified(path, schema, description, signal) {
    await catalog(signal)
    const parsed = schema.safeParse(await fetchJson(`/api/parameters/v1/releases/${encodeURIComponent(releaseId)}${path}`, signal))
    if (!parsed.success) throw new ParameterCompatibilityError(`Parameter ${description} schema is incompatible with 1.0.0`)
    return verifyEnvelope(parsed.data, description)
  }

  return {
    catalog,
    async candidates(filters = {}) {
      return verified(`/candidates${queryString({
        parameter_id: filters.parameterId,
        taxon_id: filters.taxonId,
        tissue_id: filters.tissueId,
        compartment_id: filters.compartmentId,
        assay_id: filters.assayId,
        evidence_class: filters.evidenceClass,
        status: filters.status,
        value_kind: filters.valueKind
      })}`, UpstreamParameterCandidatesResponseSchema, 'candidate response')
    },
    async datasets(filters = {}) {
      return verified(`/datasets${queryString({ dataset_id: filters.datasetId, parameter_id: filters.parameterId, context_id: filters.contextId, data_origin: filters.dataOrigin })}`, UpstreamParameterDatasetsResponseSchema, 'dataset response')
    },
    async contexts(signal) {
      return verified('/contexts', UpstreamParameterContextsResponseSchema, 'context response', signal)
    }
  }
}
