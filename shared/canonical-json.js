import { createHash } from 'node:crypto'

function assertUnicodeScalarString(value) {
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(index + 1)
      if (!Number.isInteger(next) || next < 0xdc00 || next > 0xdfff) throw new TypeError('Canonical JSON strings cannot contain unpaired surrogates')
      index += 1
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      throw new TypeError('Canonical JSON strings cannot contain unpaired surrogates')
    }
  }
}

function serialize(value, ancestors) {
  if (value === null) return 'null'
  if (typeof value === 'string') {
    assertUnicodeScalarString(value)
    return JSON.stringify(value)
  }
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new TypeError('Canonical JSON numbers must be finite')
    if (Number.isInteger(value) && !Number.isSafeInteger(value)) throw new TypeError('Canonical JSON integers must be within the IEEE 754 safe integer domain')
    return JSON.stringify(value)
  }
  if (typeof value !== 'object') throw new TypeError(`Canonical JSON does not support ${typeof value}`)
  if (ancestors.has(value)) throw new TypeError('Canonical JSON does not support cyclic values')

  ancestors.add(value)
  try {
    if (Array.isArray(value)) {
      if (Object.keys(value).length !== value.length) throw new TypeError('Canonical JSON arrays cannot be sparse or carry named properties')
      return `[${value.map((item) => serialize(item, ancestors)).join(',')}]`
    }
    const prototype = Object.getPrototypeOf(value)
    if (prototype !== Object.prototype && prototype !== null) throw new TypeError('Canonical JSON objects must be plain objects')
    const entries = Object.keys(value).sort().map((key) => {
      assertUnicodeScalarString(key)
      return `${JSON.stringify(key)}:${serialize(value[key], ancestors)}`
    })
    return `{${entries.join(',')}}`
  } finally {
    ancestors.delete(value)
  }
}

export function canonicalJson(value) {
  return serialize(value, new Set())
}

export function canonicalDigest(value) {
  return `sha256:${createHash('sha256').update(canonicalJson(value), 'utf8').digest('hex')}`
}
