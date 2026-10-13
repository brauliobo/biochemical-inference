import { createHash } from 'node:crypto'
import { canonicalJson } from '../../shared/canonical-json.js'

// Lower-case hex SHA-256 of bytes (or a string, hashed as UTF-8).
export const sha256Hex = (value) => createHash('sha256').update(value).digest('hex')

// "sha256:<hex>" content identifier.
export const sha256Prefixed = (value) => `sha256:${sha256Hex(value)}`

// Hex SHA-256 of the RFC 8785 canonical JSON of a value.
export const canonicalSha256Hex = (value) => sha256Hex(canonicalJson(value))

// Order-sensitive UTF-8 byte comparison (the sort order canonical JSON uses).
export const compareUtf8 = (left, right) => Buffer.compare(Buffer.from(left, 'utf8'), Buffer.from(right, 'utf8'))
