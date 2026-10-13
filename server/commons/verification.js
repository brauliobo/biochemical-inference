// Shared building blocks of the producer-release verifiers: strict base64url,
// bounded canonical-JSON parsing against a schema, and Ed25519 signature checks.
// `ErrorClass` is the domain verification error, constructed as `new ErrorClass(message)`.
import { createPublicKey, verify as verifyCrypto } from 'node:crypto'
import { TextDecoder } from 'node:util'
import { canonicalJson } from '../../shared/canonical-json.js'
import { sha256Hex } from './digest.js'

const utf8 = new TextDecoder('utf-8', { fatal: true })
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex')

// Unpadded base64url that decodes to exactly `bytes` bytes and re-encodes identically.
function strictBase64Url(value, bytes, label, ErrorClass, { lengthMessage = 'has an invalid canonical encoding.' } = {}) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value) || value.includes('=')) throw new ErrorClass(`${label} is not strict unpadded base64url.`)
  const decoded = Buffer.from(value, 'base64url')
  if (decoded.length !== bytes || decoded.toString('base64url') !== value) throw new ErrorClass(`${label} ${lengthMessage}`)
  return decoded
}

// Parses strict UTF-8 JSON that is byte-identical to its RFC 8785 form and
// satisfies `schema`. `contract` names the schema in the failure message;
// `issue` appends the first schema issue; `messages` overrides stock phrases.
export function parseCanonicalBytes(bytes, schema, label, { ErrorClass, maxBytes, expectedDigest, contract, issue = false, messages = {} }) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > maxBytes) throw new ErrorClass(`${label} ${messages.bounds ?? 'exceeds its bounded canonical JSON contract.'}`)
  if (expectedDigest && sha256Hex(bytes) !== expectedDigest) throw new ErrorClass(`${label} ${messages.pin ?? 'does not match its independent SHA-256 pin.'}`)
  let text
  let value
  try {
    text = utf8.decode(bytes)
    value = JSON.parse(text)
  } catch {
    throw new ErrorClass(`${label} is not strict UTF-8 JSON.`)
  }
  let canonical
  try {
    canonical = canonicalJson(value)
  } catch {
    throw new ErrorClass(`${label} cannot be RFC 8785 canonical JSON.`)
  }
  if (canonical !== text) throw new ErrorClass(`${label} is not RFC 8785 canonical JSON.`)
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new ErrorClass(`${label} does not match the strict ${contract} contract${issue ? `: ${parsed.error.issues[0].message}` : '.'}`)
  return parsed.data
}

// Verifies an Ed25519 signature over canonical({ payload, algorithm, key_id, signed_at }).
// `labels` names the key and signature in encoding failures; `invalidMessage` is thrown on mismatch.
export function verifyEd25519Signature({ payload, signature, publicKey, ErrorClass, labels, invalidMessage, lengthMessage }) {
  const publicBytes = strictBase64Url(publicKey, 32, labels.publicKey, ErrorClass, { lengthMessage })
  const signatureBytes = strictBase64Url(signature.value, 64, labels.signature, ErrorClass, { lengthMessage })
  const spki = Buffer.concat([ED25519_SPKI_PREFIX, publicBytes])
  const message = Buffer.from(canonicalJson({ payload, algorithm: signature.algorithm, key_id: signature.key_id, signed_at: signature.signed_at }))
  let valid = false
  try {
    valid = verifyCrypto(null, message, createPublicKey({ key: spki, format: 'der', type: 'spki' }), signatureBytes)
  } catch {
    valid = false
  }
  if (!valid) throw new ErrorClass(invalidMessage)
}
