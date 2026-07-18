import { canonicalJson } from '../../shared/canonical-json.js'
import {
  CHALLENGE_API_VIEW_SPECS,
  CHALLENGE_ENVELOPE_DIGEST,
  CHALLENGE_PARTITION_DIGEST,
  CHALLENGE_RELEASE_DIGEST,
  CHALLENGE_RELEASE_ID,
  ChallengeCommitmentRequestSchema,
  ChallengeCommitmentResponseSchema,
  ChallengeDisclosureRequestSchema,
  ChallengeDisclosureResponseSchema,
  ChallengeResultResponseSchema,
  ChallengeResultSubmissionSchema
} from '../../shared/challenge-contracts.js'
import {
  MAX_CHALLENGE_METADATA_BYTES,
  MAX_CHALLENGE_PAGE_BYTES,
  ChallengeVerificationError,
  challengeDigest,
  challengeSha256,
  parseChallengeCanonical,
  verifyChallengeBundle,
  verifyChallengeCatalog,
  verifyChallengeDiscovery,
  verifyChallengeEnvelope,
  verifyChallengeDisclosureClosure,
  verifyChallengePage,
  verifyChallengeRelease,
  verifyChallengeTrust
} from './verification.js'

export const DEFAULT_CHALLENGE_URL = 'http://127.0.0.1:8000'

export class ChallengeUpstreamError extends ChallengeVerificationError {
  constructor(message, options = {}) {
    super(message, { code: options.code ?? 'CHALLENGE_UPSTREAM_FAILED', statusCode: options.statusCode ?? 503 })
    this.name = 'ChallengeUpstreamError'
  }
}

export function validateChallengeLoopbackUrl(value) {
  let url
  try {
    url = new URL(value)
  } catch {
    throw new ChallengeUpstreamError('Goal 13 upstream URL must be an absolute loopback HTTP origin.', { statusCode: 500, code: 'CHALLENGE_UPSTREAM_URL_INVALID' })
  }
  if (url.protocol !== 'http:' || !['127.0.0.1', '[::1]'].includes(url.hostname) || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) throw new ChallengeUpstreamError('Goal 13 upstream is restricted to an origin-only 127.0.0.1 or [::1] HTTP URL.', { statusCode: 500, code: 'CHALLENGE_UPSTREAM_URL_REJECTED' })
  return url.origin
}

export function validateChallengeProtectedConfig(env) {
  const origin = env.BIOCHEMICAL_CHALLENGE_ALLOWED_ORIGIN
  const token = env.BIOCHEMICAL_CHALLENGE_CSRF_TOKEN
  let parsed
  try {
    parsed = new URL(origin)
  } catch {
    throw new ChallengeUpstreamError('BIOCHEMICAL_CHALLENGE_ALLOWED_ORIGIN must be an exact HTTP(S) origin.', { statusCode: 500, code: 'CHALLENGE_UPSTREAM_ORIGIN_INVALID' })
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password || parsed.origin !== origin) throw new ChallengeUpstreamError('BIOCHEMICAL_CHALLENGE_ALLOWED_ORIGIN must be an exact HTTP(S) origin without credentials or path.', { statusCode: 500, code: 'CHALLENGE_UPSTREAM_ORIGIN_INVALID' })
  if (typeof token !== 'string' || token.length < 43 || token.length > 128 || !/^[A-Za-z0-9_-]+$/.test(token)) throw new ChallengeUpstreamError('BIOCHEMICAL_CHALLENGE_CSRF_TOKEN must be canonical unpadded base64url from 43 to 128 characters.', { statusCode: 500, code: 'CHALLENGE_UPSTREAM_CSRF_INVALID' })
  const decoded = Buffer.from(token, 'base64url')
  if (decoded.toString('base64url') !== token) throw new ChallengeUpstreamError('BIOCHEMICAL_CHALLENGE_CSRF_TOKEN is not canonical base64url.', { statusCode: 500, code: 'CHALLENGE_UPSTREAM_CSRF_INVALID' })
  return { origin, token }
}

function timeoutSignal(timeoutMs, signal) {
  const timeout = AbortSignal.timeout(timeoutMs)
  return signal ? AbortSignal.any([timeout, signal]) : timeout
}

async function boundedBody(response, maximum, label) {
  const rawLength = response.headers.get('content-length')
  if (rawLength === null || !/^(?:0|[1-9][0-9]*)$/.test(rawLength) || Number(rawLength) > maximum) throw new ChallengeUpstreamError(`${label} has a missing, invalid, or excessive Content-Length.`)
  if (!response.body) throw new ChallengeUpstreamError(`${label} has no body.`)
  const chunks = []
  let total = 0
  const reader = response.body.getReader()
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      total += value.byteLength
      if (total > maximum || total > Number(rawLength)) throw new ChallengeUpstreamError(`${label} exceeded its declared byte boundary.`)
      chunks.push(Buffer.from(value))
    }
  } finally {
    reader.releaseLock()
  }
  if (total !== Number(rawLength)) throw new ChallengeUpstreamError(`${label} body length does not match Content-Length.`)
  return Buffer.concat(chunks, total)
}

function immutableHeaders(response, bytes, releaseBound) {
  if (response.headers.get('content-type') !== 'application/json') throw new ChallengeUpstreamError('Goal 13 public response has an incompatible content type.')
  const expectedCache = releaseBound ? 'public, max-age=31536000, immutable' : 'public, max-age=60'
  if (response.headers.get('cache-control') !== expectedCache || response.headers.get('etag') !== `"sha256:${challengeSha256(bytes)}"`) throw new ChallengeUpstreamError('Goal 13 public response has an incompatible cache identity.')
  if (releaseBound && response.headers.get('x-release-digest') !== CHALLENGE_RELEASE_DIGEST) throw new ChallengeUpstreamError('Goal 13 public response has an incompatible release header.')
}

export function verifyChallengeDisclosure(response, request, bundle) {
  if (!bundle) throw new ChallengeVerificationError('Goal 13 disclosure verification requires the verified signed public snapshot.')
  return verifyChallengeDisclosureClosure(bundle, response, request).response
}

export function verifyChallengeResult(response, submission) {
  const base = { ...response }
  delete base.result_digest
  if (challengeDigest(base) !== response.result_digest) throw new ChallengeVerificationError('Goal 13 producer result digest is invalid.')
  if (response.commitment_digest !== submission.commitment_digest || response.disclosure_digest !== submission.disclosure_digest || response.software_digest !== submission.software_digest || response.diagnostics_digest !== submission.diagnostics_digest || response.conclusion !== submission.submitted_conclusion) throw new ChallengeVerificationError('Goal 13 producer result does not bind the submitted identities.')
  return response
}

export function createChallengeClient(env = process.env, options = {}) {
  const baseUrl = validateChallengeLoopbackUrl(env.BIOCHEMICAL_CHALLENGE_URL ?? env.BIOCHEMICAL_DB_URL ?? DEFAULT_CHALLENGE_URL)
  const protectedConfig = validateChallengeProtectedConfig(env)
  const timeoutMs = Number(env.BIOCHEMICAL_CHALLENGE_TIMEOUT_MS ?? 10_000)
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 30_000) throw new ChallengeUpstreamError('BIOCHEMICAL_CHALLENGE_TIMEOUT_MS must be an integer from 100 to 30000.', { statusCode: 500, code: 'CHALLENGE_TIMEOUT_INVALID' })
  const fetchImpl = options.fetchImpl ?? fetch
  let verifiedBundle = null

  async function request(path, { method = 'GET', body, maximum = MAX_CHALLENGE_METADATA_BYTES, signal, privateResponse = false, releaseBound = path.includes(`/releases/${CHALLENGE_RELEASE_ID}`) } = {}) {
    let response
    try {
      response = await fetchImpl(`${baseUrl}${path}`, {
        method,
        body,
        headers: { accept: 'application/json', ...(body === undefined ? {} : { 'content-type': 'application/json', origin: protectedConfig.origin, 'x-csrf-token': protectedConfig.token }) },
        redirect: 'manual',
        signal: timeoutSignal(timeoutMs, signal)
      })
    } catch (error) {
      if (error instanceof ChallengeVerificationError) throw error
      if (signal?.aborted) throw signal.reason ?? new DOMException('Goal 13 request was cancelled.', 'AbortError')
      throw new ChallengeUpstreamError(`Goal 13 upstream is unavailable for ${path}.`, { code: 'CHALLENGE_UPSTREAM_UNAVAILABLE' })
    }
    if (response.status >= 300 && response.status < 400) throw new ChallengeUpstreamError(`Goal 13 upstream redirect was refused for ${path}.`, { code: 'CHALLENGE_REDIRECT_REFUSED' })
    if (privateResponse && (response.headers.get('content-type') !== 'application/json' || response.headers.get('cache-control') !== 'private, no-store' || response.headers.get('pragma') !== 'no-cache' || response.headers.has('etag'))) throw new ChallengeUpstreamError('Goal 13 protected response has incompatible no-store headers.')
    if (response.status !== 200) throw new ChallengeUpstreamError(`Goal 13 upstream returned ${response.status} for ${path}.`, { code: 'CHALLENGE_UPSTREAM_STATUS', statusCode: privateResponse && response.status >= 400 && response.status <= 599 ? response.status : 503 })
    if (privateResponse && response.headers.get('x-release-digest') !== CHALLENGE_RELEASE_DIGEST) throw new ChallengeUpstreamError('Goal 13 protected success response has an incompatible release identity.')
    const bytes = await boundedBody(response, maximum, `Goal 13 ${path}`)
    if (!privateResponse) immutableHeaders(response, bytes, releaseBound)
    return bytes
  }

  const releasePath = `/api/challenges/v1/releases/${encodeURIComponent(CHALLENGE_RELEASE_ID)}`
  const protectedRequest = async (suffix, schema, value, signal) => {
    const parsed = schema.parse(value)
    return request(`${releasePath}/${suffix}`, { method: 'POST', body: canonicalJson(parsed), privateResponse: true, signal })
  }

  return {
    baseUrl,
    async synchronize(signal) {
      const discovery = verifyChallengeDiscovery(await request('/api/challenges/v1', { signal }))
      const trustResponse = verifyChallengeTrust(await request('/api/challenges/v1/trust', { signal }))
      const catalog = verifyChallengeCatalog(await request('/api/challenges/v1/releases', { signal }), trustResponse.trust)
      const releaseResponse = verifyChallengeRelease(await request(releasePath, { signal }))
      const envelope = verifyChallengeEnvelope(await request(`${releasePath}/envelope`, { signal }), trustResponse.trust, releaseResponse.manifest)
      const records = {}
      for (const spec of CHALLENGE_API_VIEW_SPECS) {
        records[spec.recordType] = verifyChallengePage(await request(`${releasePath}/${spec.recordType}?limit=100`, { maximum: MAX_CHALLENGE_PAGE_BYTES, signal }), spec)
      }
      verifiedBundle = verifyChallengeBundle({ discovery, trustResponse, catalog, releaseResponse, envelope, records })
      return verifiedBundle
    },
    async commit(input, signal) {
      const frozen = ChallengeCommitmentRequestSchema.parse(input)
      const response = parseChallengeCanonical(await protectedRequest('commitments', ChallengeCommitmentRequestSchema, frozen, signal), ChallengeCommitmentResponseSchema, 'Goal 13 commitment response')
      if (response.commitment_digest !== challengeDigest(frozen) || response.created_at !== frozen.created_at || response.partition_digest !== CHALLENGE_PARTITION_DIGEST) throw new ChallengeVerificationError('Goal 13 commitment receipt does not bind the exact frozen request.')
      return response
    },
    async disclose(input, signal, publicBundle = verifiedBundle) {
      const requestValue = ChallengeDisclosureRequestSchema.parse(input)
      const response = parseChallengeCanonical(await protectedRequest('disclosures', ChallengeDisclosureRequestSchema, requestValue, signal), ChallengeDisclosureResponseSchema, 'Goal 13 disclosure response')
      return verifyChallengeDisclosure(response, requestValue, publicBundle)
    },
    async submitResult(input, signal) {
      const submission = ChallengeResultSubmissionSchema.parse(input)
      const response = parseChallengeCanonical(await protectedRequest('results', ChallengeResultSubmissionSchema, submission, signal), ChallengeResultResponseSchema, 'Goal 13 result response')
      return verifyChallengeResult(response, submission)
    }
  }
}

export { CHALLENGE_ENVELOPE_DIGEST, CHALLENGE_RELEASE_DIGEST, CHALLENGE_RELEASE_ID }
