// Maps a state word to the tone used by badges and notices ('success' |
// 'warning' | 'danger' | ''). One place, so every workbench shows the same
// state in the same colour. The word itself is always printed too: colour is
// never the only signal.
const DANGER = new Set(['failed', 'blocked', 'unavailable', 'error', 'invalid', 'rejected', 'resource-exhausted', 'underidentified'])
const WARNING = new Set(['incompatible', 'previous', 'unknown', 'non-converged', 'downgraded', 'unsupported', 'stale', 'pending', 'cancelled', 'empty', 'not-evaluable'])
const SUCCESS = new Set(['ready', 'available', 'valid', 'succeeded', 'successful', 'accepted', 'passed', 'identifiable', 'trusted', 'supported-within-boundary'])

export function statusTone(word) {
  const key = String(word ?? '').toLowerCase()
  if (DANGER.has(key)) return 'danger'
  if (WARNING.has(key)) return 'warning'
  if (SUCCESS.has(key)) return 'success'
  return ''
}
