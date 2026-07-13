import { canonicalDigest, canonicalJson } from '../../shared/canonical-json.js'

export const canonicalize = canonicalJson

export function digest(value) {
  return canonicalDigest(value)
}

export function modelDigest(model) {
  const { digest: _digest, ...content } = model
  return digest(content)
}

export function runIdentity(model, experiment) {
  return digest({ modelDigest: model.digest, experiment })
}
