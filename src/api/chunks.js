// Browser-side verification of immutable gzip chunks (measured-spatial and
// spatial-registration): exact response identity headers, then encoded and
// decoded SHA-256 and byte counts against the pinned descriptor.
import { ApiError, IMMUTABLE_CACHE, fetchResponse, withSignal } from './core.js'

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, '0')).join('')
}

async function gunzip(encoded, message, code) {
  if (typeof DecompressionStream !== 'function') throw new ApiError(message, { status: 0, code, payload: null })
  const stream = new Blob([encoded]).stream().pipeThrough(new DecompressionStream('gzip'))
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

// `extraHeaders` adds producer-specific identity headers (release, array, ...).
// `messages` supplies the user-facing text for each failure class.
export async function loadVerifiedChunk(descriptor, { path, extraHeaders, codePrefix, messages, signal }) {
  const response = await fetchResponse(path, { cache: 'reload', ...withSignal(signal) })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new ApiError(payload?.message ?? `${messages.request} with status ${response.status}.`, { status: response.status, code: payload?.code ?? 'HTTP_ERROR', payload })
  }
  const headers = response.headers
  const expected = {
    'cache-control': IMMUTABLE_CACHE,
    'accept-ranges': 'none',
    'content-type': descriptor.media_type,
    'content-length': String(descriptor.encoded_bytes),
    etag: `"sha256:${descriptor.encoded_sha256}"`,
    'x-content-sha256': descriptor.encoded_sha256,
    'x-decoded-sha256': descriptor.decoded_sha256,
    'x-array-id': descriptor.array_id,
    'x-chunk-grid': descriptor.grid_zyx.join('.'),
    ...extraHeaders
  }
  if (Object.entries(expected).some(([name, value]) => headers.get(name) !== value)) {
    throw new ApiError(messages.identity, { status: response.status, code: `${codePrefix}_IDENTITY_MISMATCH`, payload: null })
  }
  const encoded = new Uint8Array(await response.arrayBuffer())
  if (encoded.byteLength !== descriptor.encoded_bytes || await sha256Hex(encoded) !== descriptor.encoded_sha256) {
    throw new ApiError(messages.encoded, { status: response.status, code: `${codePrefix}_ENCODED_HASH_FAILED`, payload: null })
  }
  const decoded = await gunzip(encoded, messages.codec, `${codePrefix}_CODEC_UNAVAILABLE`)
  if (decoded.byteLength !== descriptor.decoded_bytes || await sha256Hex(decoded) !== descriptor.decoded_sha256) {
    throw new ApiError(messages.decoded, { status: response.status, code: `${codePrefix}_DECODED_HASH_FAILED`, payload: null })
  }
  return { descriptor, encodedBytes: encoded.byteLength, decodedBytes: decoded.byteLength, cacheSource: headers.get('x-cache-source') }
}
