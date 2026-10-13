import {
  EVIDENCE_RANKING_EXPLANATIONS,
  EvidenceCandidateExtractionRequestSchema,
  EvidenceCandidateListResponseSchema,
  EvidenceCandidateResponseSchema,
  EvidenceDocumentResponseSchema,
  EvidenceHealthSchema,
  EvidenceSearchRequestSchema,
  EvidenceSearchResponseSchema,
  UpstreamEvidenceCandidateListResponseSchema,
  UpstreamEvidenceCandidateResponseSchema,
  UpstreamEvidenceDocumentResponseSchema,
  UpstreamEvidenceSearchResponseSchema
} from '../../shared/evidence-contracts.js'
import { createEvidenceFixtureClient, EVIDENCE_LICENSES } from './fixture.js'
import { defineProblemError } from '../commons/errors.js'

const DEFAULT_EVIDENCE_URL = 'http://127.0.0.1:8000'
export const DEFAULT_EVIDENCE_RELEASE_ID = 'mthfr-evidence-v1.0.0'
export const DEFAULT_EVIDENCE_RELEASE_DIGEST = '93662849ac8913c0953db9492364900a07ebd824020f6cd65d1fc9e47ac86701'

export const EvidenceCompatibilityError = defineProblemError('EvidenceCompatibilityError', { statusCode: 409, code: 'EVIDENCE_INCOMPATIBLE' })

function detailMessage(payload, fallback) {
  return payload && typeof payload === 'object' && 'detail' in payload && typeof payload.detail === 'string' ? payload.detail : fallback
}

function upstreamErrorCode(payload, status) {
  const explicit = payload && typeof payload === 'object' && 'code' in payload && typeof payload.code === 'string' ? payload.code : ''
  if (explicit === 'EVIDENCE_MODEL_UNAVAILABLE' || explicit === 'MODEL_UNAVAILABLE') return 'EVIDENCE_MODEL_UNAVAILABLE'
  const detail = detailMessage(payload, '')
  if (status === 503 && /^Ollama (?:capability is unavailable in this runtime|model is not installed|request failed:)/.test(detail)) return 'EVIDENCE_MODEL_UNAVAILABLE'
  if (status === 404) return 'EVIDENCE_NOT_FOUND'
  return 'EVIDENCE_UPSTREAM_ERROR'
}

export function createEvidenceClient(env = process.env) {
  if (env.BIOCHEMICAL_EVIDENCE_USE_FIXTURE === 'true') return createEvidenceFixtureClient()

  const baseUrl = (env.BIOCHEMICAL_EVIDENCE_URL ?? env.BIOCHEMICAL_DB_URL ?? DEFAULT_EVIDENCE_URL).replace(/\/$/, '')
  const releaseId = env.BIOCHEMICAL_EVIDENCE_RELEASE_ID ?? DEFAULT_EVIDENCE_RELEASE_ID
  const expectedDigest = env.BIOCHEMICAL_EVIDENCE_EXPECTED_DIGEST ?? DEFAULT_EVIDENCE_RELEASE_DIGEST
  const healthPath = env.BIOCHEMICAL_EVIDENCE_HEALTH_PATH ?? '/api/evidence/v1/healthz'
  const candidateOrigin = env.BIOCHEMICAL_EVIDENCE_ALLOWED_ORIGIN
  const candidateCsrfToken = env.BIOCHEMICAL_EVIDENCE_CSRF_TOKEN
  const timeoutMs = Number(env.BIOCHEMICAL_EVIDENCE_TIMEOUT_MS ?? 10000)
  if (!/^[a-f0-9]{64}$/.test(expectedDigest)) throw new EvidenceCompatibilityError('BIOCHEMICAL_EVIDENCE_EXPECTED_DIGEST must be a lowercase SHA-256 digest')
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) throw new EvidenceCompatibilityError('BIOCHEMICAL_EVIDENCE_TIMEOUT_MS must be a positive number')

  const requestSignal = (signal) => signal ? AbortSignal.any([signal, AbortSignal.timeout(timeoutMs)]) : AbortSignal.timeout(timeoutMs)

  async function fetchJson(path, init = {}) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...init,
        headers: { accept: 'application/json', ...init.headers },
        signal: requestSignal(init.signal)
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        const statusCode = response.status >= 400 && response.status < 500 ? response.status : 503
        const code = upstreamErrorCode(payload, response.status)
        throw new EvidenceCompatibilityError(detailMessage(payload, `Evidence service returned ${response.status} for ${path}`), { statusCode, code })
      }
      return payload
    } catch (error) {
      if (error instanceof EvidenceCompatibilityError) throw error
      const name = error && typeof error === 'object' && 'name' in error ? error.name : undefined
      if (name === 'TimeoutError' || name === 'AbortError') throw new EvidenceCompatibilityError(`Evidence service timed out after ${timeoutMs} ms for ${path}`, { statusCode: 503, code: 'EVIDENCE_TIMEOUT' })
      throw new EvidenceCompatibilityError(`Evidence service is unavailable for ${path}`, { statusCode: 503, code: 'EVIDENCE_UNAVAILABLE' })
    }
  }

  function verifyRelease(release, description) {
    if (release.id !== releaseId || release.digest !== expectedDigest) throw new EvidenceCompatibilityError(`Evidence ${description} does not match pinned release ${releaseId} and digest`)
    return release
  }

  function candidateHeaders() {
    if (!candidateOrigin || !candidateCsrfToken) throw new EvidenceCompatibilityError('Evidence candidate access is disabled because no fixed origin and CSRF token are configured.', { statusCode: 503, code: 'EVIDENCE_CANDIDATE_WRITE_DISABLED' })
    return { origin: candidateOrigin, 'x-csrf-token': candidateCsrfToken }
  }

  function verifyCandidate(candidate, description) {
    if (candidate.release_id !== releaseId || candidate.release_digest !== expectedDigest) throw new EvidenceCompatibilityError(`Evidence ${description} candidate provenance does not match the pinned release ${releaseId} and digest`)
    return candidate
  }

  async function health(signal) {
    const parsed = EvidenceHealthSchema.safeParse(await fetchJson(healthPath, { signal }))
    if (!parsed.success) throw new EvidenceCompatibilityError('Evidence health schema is incompatible with 1.0.0')
    verifyRelease(parsed.data.release, 'health response')
    return parsed.data
  }

  async function verifiedPayload(path, schema, description, init) {
    const verified = await health()
    const parsed = schema.safeParse(await fetchJson(path, init))
    if (!parsed.success) throw new EvidenceCompatibilityError(`Evidence ${description} schema is incompatible with 1.0.0`)
    if ('release' in parsed.data) verifyRelease(parsed.data.release, description)
    return { verified, payload: parsed.data }
  }

  return {
    health,
    async search(input) {
      const request = EvidenceSearchRequestSchema.parse(input)
      const { payload } = await verifiedPayload('/api/v1/search', UpstreamEvidenceSearchResponseSchema, 'search response', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(request)
      })
      if (payload.query !== request.query) throw new EvidenceCompatibilityError('Evidence search response does not match the requested query')
      if (request.use_vector && (payload.vector_metadata === null || payload.vector_metadata.release_digest !== expectedDigest)) throw new EvidenceCompatibilityError('Evidence vector metadata does not match the pinned release')
      if (!request.use_vector && payload.vector_metadata !== null) throw new EvidenceCompatibilityError('Evidence non-vector search unexpectedly returned vector metadata')
      return EvidenceSearchResponseSchema.parse({ ...payload, explanations: EVIDENCE_RANKING_EXPLANATIONS })
    },
    async document(identifier) {
      const { payload } = await verifiedPayload(`/api/v1/documents/${encodeURIComponent(identifier)}`, UpstreamEvidenceDocumentResponseSchema, 'document response')
      const licenseIds = new Set([...payload.sections, ...payload.spans].map((item) => item.license_id))
      const licenses = EVIDENCE_LICENSES.filter((license) => licenseIds.has(license.id))
      if (!licenses.length) licenses.push(payload.document.content_scope === 'metadata-only' ? EVIDENCE_LICENSES[0] : EVIDENCE_LICENSES[1])
      return EvidenceDocumentResponseSchema.parse({ ...payload, licenses })
    },
    async extract(input) {
      const request = EvidenceCandidateExtractionRequestSchema.parse(input)
      const { payload } = await verifiedPayload('/api/v1/candidates/extract', EvidenceCandidateResponseSchema, 'candidate extraction response', {
        method: 'POST', headers: { 'content-type': 'application/json', ...candidateHeaders() }, body: JSON.stringify(request)
      })
      verifyCandidate(payload.candidate, 'extraction response')
      return payload
    },
    async candidates() {
      const { verified, payload } = await verifiedPayload('/api/v1/candidates', UpstreamEvidenceCandidateListResponseSchema, 'candidate list response', { headers: candidateHeaders() })
      payload.items.forEach((candidate) => verifyCandidate(candidate, 'list response'))
      return EvidenceCandidateListResponseSchema.parse({ release: verified.release, items: payload.items })
    },
    async candidate(identifier) {
      const { verified, payload } = await verifiedPayload(`/api/v1/candidates/${encodeURIComponent(identifier)}`, UpstreamEvidenceCandidateResponseSchema, 'candidate detail response', { headers: candidateHeaders() })
      verifyCandidate(payload.candidate, 'detail response')
      return EvidenceCandidateResponseSchema.parse({ release: verified.release, candidate: payload.candidate })
    }
  }
}
