import { canonicalJson } from '../../shared/canonical-json.js'
import { readBoundedBody, timeoutSignal, validateLoopbackOrigin } from '../commons/upstream.js'
import {
  MEASURED_SPATIAL_PINS,
  MEASURED_SPATIAL_RECORD_TYPES
} from '../../shared/measured-spatial-contracts.js'
import {
  MAX_MEASURED_SPATIAL_CHUNK_BYTES,
  MAX_MEASURED_SPATIAL_METADATA_BYTES,
  MAX_MEASURED_SPATIAL_PAGE_BYTES,
  MeasuredSpatialVerificationError,
  measuredSpatialSha256,
  reconstructMeasuredSpatialInventory,
  reconstructMeasuredSpatialMetadata,
  verifyMeasuredSpatialBundle,
  verifyMeasuredSpatialCatalog,
  verifyMeasuredSpatialChunkBytes,
  verifyMeasuredSpatialChunkPage,
  verifyMeasuredSpatialDiscovery,
  verifyMeasuredSpatialEnvelope,
  verifyMeasuredSpatialManifest,
  verifyMeasuredSpatialRecordPage,
  verifyMeasuredSpatialTrust
} from './verification.js'
import { defineProblemError } from '../commons/errors.js'

export const DEFAULT_MEASURED_SPATIAL_URL = 'http://127.0.0.1:8000'

export const MeasuredSpatialUpstreamError = defineProblemError('MeasuredSpatialUpstreamError', { statusCode: 503, code: 'MEASURED_SPATIAL_UPSTREAM_FAILED', parent: MeasuredSpatialVerificationError })

export function validateMeasuredSpatialLoopbackUrl(value) {
  return validateLoopbackOrigin(value, { ErrorClass: MeasuredSpatialUpstreamError, subject: 'Goal 14 upstream', codePrefix: 'MEASURED_SPATIAL_UPSTREAM' })
}

const boundedBody = (response, maximum, label) => readBoundedBody(response, { maximum, label, ErrorClass: MeasuredSpatialUpstreamError, allowEmpty: false })

function verifyJsonHeaders(response, bytes, { releaseBound = false, expectedDigest } = {}) {
  if (response.headers.get('content-type') !== 'application/json') throw new MeasuredSpatialUpstreamError('Goal 14 producer response has an incompatible content type.')
  const cacheControl = releaseBound ? 'public, max-age=31536000, immutable' : 'public, max-age=60, must-revalidate'
  const digest       = measuredSpatialSha256(bytes)
  if (response.headers.get('cache-control') !== cacheControl || response.headers.get('etag') !== `"sha256:${digest}"` || response.headers.get('x-content-sha256') !== digest || (expectedDigest && digest !== expectedDigest)) throw new MeasuredSpatialUpstreamError('Goal 14 producer response has an incompatible cache or content identity.')
  if (releaseBound && (response.headers.get('x-release-id') !== MEASURED_SPATIAL_PINS.releaseId || response.headers.get('x-release-digest') !== MEASURED_SPATIAL_PINS.releaseDigest)) throw new MeasuredSpatialUpstreamError('Goal 14 producer response has an incompatible release identity.')
}

export function createMeasuredSpatialClient(env = process.env, options = {}) {
  const baseUrl   = validateMeasuredSpatialLoopbackUrl(env.BIOCHEMICAL_MEASURED_SPATIAL_URL ?? env.BIOCHEMICAL_DB_URL ?? DEFAULT_MEASURED_SPATIAL_URL)
  const timeoutMs = Number(env.BIOCHEMICAL_MEASURED_SPATIAL_TIMEOUT_MS ?? 30_000)
  const fetchImpl = options.fetchImpl ?? fetch
  if (!Number.isInteger(timeoutMs) || timeoutMs < 100 || timeoutMs > 120_000) throw new MeasuredSpatialUpstreamError('BIOCHEMICAL_MEASURED_SPATIAL_TIMEOUT_MS must be an integer from 100 to 120000.', { statusCode: 500, code: 'MEASURED_SPATIAL_TIMEOUT_INVALID' })

  async function request(path, { maximum = MAX_MEASURED_SPATIAL_METADATA_BYTES, signal, releaseBound = false, expectedDigest, mediaType = 'application/json' } = {}) {
    let response
    try {
      response = await fetchImpl(`${baseUrl}${path}`, { method: 'GET', headers: { accept: mediaType }, redirect: 'manual', signal: timeoutSignal(timeoutMs, signal) })
    } catch (error) {
      if (error instanceof MeasuredSpatialVerificationError) throw error
      if (signal?.aborted) throw signal.reason ?? new DOMException('Goal 14 request was cancelled.', 'AbortError')
      throw new MeasuredSpatialUpstreamError(`Goal 14 producer is unavailable for ${path}.`, { code: 'MEASURED_SPATIAL_UPSTREAM_UNAVAILABLE' })
    }
    if (response.status >= 300 && response.status < 400) throw new MeasuredSpatialUpstreamError(`Goal 14 producer redirect was refused for ${path}.`, { code: 'MEASURED_SPATIAL_REDIRECT_REFUSED' })
    if (response.status !== 200) throw new MeasuredSpatialUpstreamError(`Goal 14 producer returned ${response.status} for ${path}.`, { code: 'MEASURED_SPATIAL_UPSTREAM_STATUS' })
    const bytes = await boundedBody(response, maximum, `Goal 14 ${path}`)
    return { response, bytes, verifyJson: () => verifyJsonHeaders(response, bytes, { releaseBound, expectedDigest }) }
  }

  const releasePath = `/api/measured-spatial/v1/releases/${encodeURIComponent(MEASURED_SPATIAL_PINS.releaseId)}`

  return {
    baseUrl,
    async synchronize(signal) {
      const [discoveryResult, trustResult, catalogResult, manifestResult, envelopeResult] = await Promise.all([
        request('/api/measured-spatial/v1', { signal }),
        request('/api/measured-spatial/v1/trust', { signal, expectedDigest: MEASURED_SPATIAL_PINS.trustDigest }),
        request('/api/measured-spatial/v1/catalog', { signal, expectedDigest: MEASURED_SPATIAL_PINS.catalogDigest }),
        request(releasePath, { signal, releaseBound: true, expectedDigest: MEASURED_SPATIAL_PINS.manifestDigest }),
        request(`${releasePath}/envelope`, { signal, releaseBound: true, expectedDigest: MEASURED_SPATIAL_PINS.envelopeDigest })
      ])
      for (const result of [discoveryResult, trustResult, catalogResult, manifestResult, envelopeResult]) result.verifyJson()
      const discovery = verifyMeasuredSpatialDiscovery(discoveryResult.bytes)
      const trust     = verifyMeasuredSpatialTrust(trustResult.bytes)
      const catalog   = verifyMeasuredSpatialCatalog(catalogResult.bytes, trust)
      const manifest  = verifyMeasuredSpatialManifest(manifestResult.bytes)
      const envelope  = verifyMeasuredSpatialEnvelope(envelopeResult.bytes, trust, manifest)
      const recordResults = await Promise.all(MEASURED_SPATIAL_RECORD_TYPES.map((recordType) => request(`${releasePath}/records/${recordType}?offset=0&limit=100`, { maximum: MAX_MEASURED_SPATIAL_PAGE_BYTES, signal, releaseBound: true })))
      const chunkResults  = await Promise.all([0, 100, 200, 300].map((offset) => request(`${releasePath}/chunks?offset=${offset}&limit=100`, { maximum: MAX_MEASURED_SPATIAL_PAGE_BYTES, signal, releaseBound: true })))
      for (const result of [...recordResults, ...chunkResults]) result.verifyJson()
      const records = Object.fromEntries(recordResults.map((result, index) => {
        const recordType = MEASURED_SPATIAL_RECORD_TYPES[index]
        return [recordType, verifyMeasuredSpatialRecordPage(result.bytes, recordType)]
      }))
      const metadata  = reconstructMeasuredSpatialMetadata(records)
      const inventory = reconstructMeasuredSpatialInventory(chunkResults.map((result, index) => verifyMeasuredSpatialChunkPage(result.bytes, index * 100)))
      return verifyMeasuredSpatialBundle({ discovery, trust, catalog, manifest, envelope, metadata, inventory })
    },
    async chunk(descriptor, signal) {
      const [z, y, x] = descriptor.grid_zyx
      const path = `${releasePath}/chunks/${descriptor.array_id}/${descriptor.level}/${z}/${y}/${x}`
      const { response, bytes } = await request(path, { maximum: Math.min(MAX_MEASURED_SPATIAL_CHUNK_BYTES, descriptor.encoded_bytes), signal, releaseBound: true, mediaType: descriptor.media_type })
      if (response.headers.get('content-type') !== descriptor.media_type || response.headers.get('cache-control') !== 'public, max-age=31536000, immutable' || response.headers.get('accept-ranges') !== 'none' || response.headers.get('etag') !== `"sha256:${descriptor.encoded_sha256}"` || response.headers.get('x-content-sha256') !== descriptor.encoded_sha256 || response.headers.get('x-decoded-sha256') !== descriptor.decoded_sha256 || response.headers.get('x-array-id') !== descriptor.array_id || response.headers.get('x-level') !== String(descriptor.level) || response.headers.get('x-chunk-grid') !== descriptor.grid_zyx.join('.') || response.headers.get('x-release-id') !== MEASURED_SPATIAL_PINS.releaseId || response.headers.get('x-release-digest') !== MEASURED_SPATIAL_PINS.releaseDigest) throw new MeasuredSpatialUpstreamError('Goal 14 chunk response has incompatible codec, cache, array, grid, or release identities.')
      return verifyMeasuredSpatialChunkBytes(bytes, descriptor).encoded
    }
  }
}

export function encodeMeasuredSpatialBundle(bundle) {
  return Buffer.from(canonicalJson(verifyMeasuredSpatialBundle(bundle)))
}
