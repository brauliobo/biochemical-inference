// The nonce and timestamp of a commit-then-disclose request. Create it once
// per intent and keep reusing it, so a retried commitment is the same commitment.
export function newCommitmentIntent(fields = {}) {
  const bytes = crypto.getRandomValues(new Uint8Array(18))
  const nonce = btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
  const createdAt = new Date().toISOString().replace(/\.[0-9]{3}Z$/, 'Z')
  return { ...fields, nonce, createdAt }
}
