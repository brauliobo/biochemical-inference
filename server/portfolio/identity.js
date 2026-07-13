import { createHash } from 'node:crypto'

export function canonicalize(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value).sort(([left], [right]) => left.localeCompare(right)).map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

export function digest(value) {
  return `sha256:${createHash('sha256').update(canonicalize(value)).digest('hex')}`
}

export function modelDigest(model) {
  const { digest: _digest, ...content } = model
  return digest(content)
}

export function runIdentity(model, experiment) {
  return digest({ modelDigest: model.digest, experiment })
}
