import { canonicalJson } from '../../shared/canonical-json.js'
import { SPATIAL_REGISTRATION_PINS, SPATIAL_REGISTRATION_RECORD_TYPES, SPATIAL_REGISTRATION_RIGHTS_LINK } from '../../shared/spatial-registration-contracts.js'
import {
  MAX_SPATIAL_REGISTRATION_CHUNK_BYTES,
  MAX_SPATIAL_REGISTRATION_METADATA_BYTES,
  MAX_SPATIAL_REGISTRATION_PAGE_BYTES,
  SpatialRegistrationVerificationError,
  parseSpatialRegistrationCanonical,
  reconstructSpatialRegistrationInventory,
  reconstructSpatialRegistrationMetadata,
  spatialRegistrationSha256,
  verifySpatialRegistrationBundle,
  verifySpatialRegistrationCatalog,
  verifySpatialRegistrationChunkBytes,
  verifySpatialRegistrationChunkPage,
  verifySpatialRegistrationDiscovery,
  verifySpatialRegistrationEnvelope,
  verifySpatialRegistrationManifest,
  verifySpatialRegistrationRecordPage,
  verifySpatialRegistrationTrust
} from './verification.js'

export class SpatialRegistrationUpstreamError extends SpatialRegistrationVerificationError {
  constructor(message, options = {}) { super(message, { code: options.code ?? 'SPATIAL_REGISTRATION_UPSTREAM_FAILED', statusCode: options.statusCode ?? 503 }); this.name = 'SpatialRegistrationUpstreamError' }
}

export function validateSpatialRegistrationLoopbackUrl(value) {
  let url
  try { url = new URL(value) } catch { throw new SpatialRegistrationUpstreamError('Goal 14 registration upstream must be an absolute loopback HTTP origin.', { statusCode: 500 }) }
  if (url.protocol !== 'http:' || !['127.0.0.1', '[::1]'].includes(url.hostname) || url.username || url.password || url.search || url.hash || !['', '/'].includes(url.pathname)) throw new SpatialRegistrationUpstreamError('Goal 14 registration upstream is restricted to a loopback HTTP origin.', { statusCode: 500 })
  return url.origin
}

async function boundedBody(response, maximum, label) {
  const length = response.headers.get('content-length')
  if (length === null || !/^[1-9][0-9]*$/.test(length) || Number(length) > maximum) throw new SpatialRegistrationUpstreamError(`${label} has a missing, invalid, or excessive Content-Length.`)
  const bytes = Buffer.from(await response.arrayBuffer())
  if (bytes.length !== Number(length)) throw new SpatialRegistrationUpstreamError(`${label} body length differs from Content-Length.`)
  return bytes
}

function jsonHeaders(response, bytes, releaseBound) {
  const digest = spatialRegistrationSha256(bytes)
  if (response.headers.get('content-type') !== 'application/json' || response.headers.get('cache-control') !== (releaseBound ? 'public, max-age=31536000, immutable' : 'public, max-age=60, must-revalidate') || response.headers.get('etag') !== `"sha256:${digest}"` || response.headers.get('x-content-sha256') !== digest) throw new SpatialRegistrationUpstreamError('Goal 14 registration producer JSON headers are incompatible.')
  if (releaseBound && (response.headers.get('x-release-id') !== SPATIAL_REGISTRATION_PINS.releaseId || response.headers.get('x-release-digest') !== SPATIAL_REGISTRATION_PINS.releaseDigest || response.headers.get('link') !== SPATIAL_REGISTRATION_RIGHTS_LINK)) throw new SpatialRegistrationUpstreamError('Goal 14 registration producer release or rights headers are incompatible.')
}

export function createSpatialRegistrationClient(env = process.env, options = {}) {
  const baseUrl = validateSpatialRegistrationLoopbackUrl(env.BIOCHEMICAL_SPATIAL_REGISTRATION_URL ?? env.BIOCHEMICAL_DB_URL ?? 'http://127.0.0.1:8000')
  const fetchImpl = options.fetchImpl ?? fetch
  const now = options.now ?? (() => new Date())
  const timeoutMs = Number(env.BIOCHEMICAL_SPATIAL_REGISTRATION_TIMEOUT_MS ?? 30_000)
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 120_000) throw new SpatialRegistrationUpstreamError('Goal 14 registration timeout must be from 100 through 120000 milliseconds.', { statusCode: 500 })
  async function request(path, { maximum = MAX_SPATIAL_REGISTRATION_METADATA_BYTES, releaseBound = false, mediaType = 'application/json', signal } = {}) {
    let response
    try { response = await fetchImpl(`${baseUrl}${path}`, { method: 'GET', headers: { accept: mediaType }, redirect: 'manual', signal: signal ? AbortSignal.any([AbortSignal.timeout(timeoutMs), signal]) : AbortSignal.timeout(timeoutMs) }) } catch (error) { if (error instanceof SpatialRegistrationVerificationError) throw error; throw new SpatialRegistrationUpstreamError(`Goal 14 registration producer is unavailable for ${path}.`) }
    if (response.status !== 200) throw new SpatialRegistrationUpstreamError(`Goal 14 registration producer returned ${response.status} for ${path}.`)
    const bytes = await boundedBody(response, maximum, path)
    return { response, bytes, verifyJson: () => jsonHeaders(response, bytes, releaseBound) }
  }
  const releasePath = `/api/spatial-registration/v1/releases/${encodeURIComponent(SPATIAL_REGISTRATION_PINS.releaseId)}`
  return {
    baseUrl,
    async synchronize(signal) {
      const roots = await Promise.all([request('/api/spatial-registration/v1', { signal }), request('/api/spatial-registration/v1/trust', { signal }), request('/api/spatial-registration/v1/catalog', { signal }), request(releasePath, { signal, releaseBound: true }), request(`${releasePath}/envelope`, { signal, releaseBound: true })])
      roots.forEach((item) => item.verifyJson())
      const discovery = verifySpatialRegistrationDiscovery(roots[0].bytes)
      const trust = verifySpatialRegistrationTrust(roots[1].bytes)
      const catalog = verifySpatialRegistrationCatalog(roots[2].bytes, trust, now)
      const manifest = verifySpatialRegistrationManifest(roots[3].bytes, now)
      const envelope = verifySpatialRegistrationEnvelope(roots[4].bytes, trust, now)
      const recordResponses = await Promise.all(SPATIAL_REGISTRATION_RECORD_TYPES.map((type) => request(`${releasePath}/records/${type}?offset=0&limit=100`, { maximum: MAX_SPATIAL_REGISTRATION_PAGE_BYTES, releaseBound: true, signal })))
      const chunkResponses = await Promise.all([0, 100, 200, 300].map((offset) => request(`${releasePath}/chunks?offset=${offset}&limit=100`, { maximum: MAX_SPATIAL_REGISTRATION_PAGE_BYTES, releaseBound: true, signal })))
      ;[...recordResponses, ...chunkResponses].forEach((item) => item.verifyJson())
      const records = Object.fromEntries(recordResponses.map((response, index) => [SPATIAL_REGISTRATION_RECORD_TYPES[index], verifySpatialRegistrationRecordPage(response.bytes, SPATIAL_REGISTRATION_RECORD_TYPES[index])]))
      const metadata = reconstructSpatialRegistrationMetadata(records)
      const inventory = reconstructSpatialRegistrationInventory(chunkResponses.map((response, index) => verifySpatialRegistrationChunkPage(response.bytes, index * 100)))
      return verifySpatialRegistrationBundle({ discovery, trust, catalog, manifest, envelope, metadata, inventory }, now)
    },
    async chunk(descriptor, signal) {
      const path = `${releasePath}/chunks/${descriptor.array_id}/${descriptor.grid_zyx.join('/')}`
      const selected = await request(path, { maximum: Math.min(MAX_SPATIAL_REGISTRATION_CHUNK_BYTES, descriptor.encoded_bytes), mediaType: descriptor.media_type, releaseBound: true, signal })
      const headers = selected.response.headers
      if (headers.get('content-type') !== descriptor.media_type || headers.get('cache-control') !== 'public, max-age=31536000, immutable' || headers.get('accept-ranges') !== 'none' || headers.get('etag') !== `"sha256:${descriptor.encoded_sha256}"` || headers.get('x-content-sha256') !== descriptor.encoded_sha256 || headers.get('x-decoded-sha256') !== descriptor.decoded_sha256 || headers.get('x-release-id') !== SPATIAL_REGISTRATION_PINS.releaseId || headers.get('x-release-digest') !== SPATIAL_REGISTRATION_PINS.releaseDigest || headers.get('link') !== SPATIAL_REGISTRATION_RIGHTS_LINK || headers.get('x-array-id') !== descriptor.array_id || headers.get('x-level') !== '0' || headers.get('x-chunk-grid') !== descriptor.grid_zyx.join('.')) throw new SpatialRegistrationUpstreamError('Goal 14 registration chunk release, rights, or content headers are incompatible.')
      return verifySpatialRegistrationChunkBytes(selected.bytes, descriptor).encoded
    }
  }
}

export function encodeSpatialRegistrationBundle(bundle, now = () => new Date()) { return Buffer.from(canonicalJson(verifySpatialRegistrationBundle(bundle, now))) }
