// Maps a workbench state word to the badge/notice tone used by the design
// system ('success' | 'warning' | 'danger' | ''). One place, so every
// workbench shows the same state in the same colour. The word itself is always
// printed too: colour is never the only signal.
const DANGER = new Set(['failed', 'blocked', 'unavailable', 'error', 'invalid', 'rejected', 'resource-exhausted', 'underidentified'])
const WARNING = new Set(['incompatible', 'previous', 'unknown', 'non-converged', 'downgraded', 'unsupported', 'stale', 'pending'])
const SUCCESS = new Set(['ready', 'available', 'valid', 'succeeded', 'successful', 'accepted', 'passed', 'identifiable'])

export function statusTone(word) {
  const key = String(word ?? '').toLowerCase()
  if (DANGER.has(key)) return 'danger'
  if (WARNING.has(key)) return 'warning'
  if (SUCCESS.has(key)) return 'success'
  return ''
}

// Class string for a .badge carrying that tone.
export function badgeClass(word) {
  const tone = statusTone(word)
  return tone ? `badge badge--${tone}` : 'badge'
}
