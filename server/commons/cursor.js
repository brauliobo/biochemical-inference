// Signed, canonical, opaque pagination cursors: base64url(canonicalJson(payload) || HMAC-SHA256).
import { createHmac, timingSafeEqual } from 'node:crypto'
import { canonicalJson } from '../../shared/canonical-json.js'

const SIGNATURE_BYTES = 32

// Decodes a canonical unpadded base64url 32-byte secret. `fail(reason)` throws
// the domain error; reason is 'shape' (not 43 base64url characters) or 'encoding'.
export function decodeSecret(value, fail) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(value)) fail('shape')
  const decoded = Buffer.from(value, 'base64url')
  if (decoded.length !== SIGNATURE_BYTES || decoded.toString('base64url') !== value) fail('encoding')
  return decoded
}

export function encodeCursor(payload, secret) {
  const encoded = Buffer.from(canonicalJson(payload))
  return Buffer.concat([encoded, createHmac('sha256', secret).update(encoded).digest()]).toString('base64url')
}

// Returns the payload, or throws via `fail()` for any malformed, tampered or
// non-canonical cursor. `strictLength` additionally rejects impossible base64 lengths.
export function decodeCursor(value, secret, fail, { strictLength = false } = {}) {
  try {
    if (typeof value !== 'string' || value.length > 8192 || (strictLength && value.length % 4 === 1) || !/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('shape')
    const raw = Buffer.from(value, 'base64url')
    if (raw.toString('base64url') !== value || raw.length <= SIGNATURE_BYTES) throw new Error('encoding')
    const encoded = raw.subarray(0, -SIGNATURE_BYTES)
    const signature = raw.subarray(-SIGNATURE_BYTES)
    if (!timingSafeEqual(signature, createHmac('sha256', secret).update(encoded).digest())) throw new Error('signature')
    const payload = JSON.parse(encoded.toString('utf8'))
    if (canonicalJson(payload) !== encoded.toString('utf8')) throw new Error('canonical')
    return payload
  } catch {
    return fail()
  }
}
