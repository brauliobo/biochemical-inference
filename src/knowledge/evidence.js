// Evidence grades (how well an entity is supported) and claim statuses.
// `tone` is a semantic colour hint for badges: success | info | warning | muted | danger.

export const EVIDENCE_GRADES = Object.freeze({
  established: Object.freeze({
    grade: 'established',
    label: 'Established',
    tone: 'success',
    rank: 3,
    description: 'Well supported by the literature and broadly accepted. Requires at least one reference.'
  }),
  plausible: Object.freeze({
    grade: 'plausible',
    label: 'Plausible',
    tone: 'info',
    rank: 2,
    description: 'Mechanistically reasonable with partial or indirect support.'
  }),
  speculative: Object.freeze({
    grade: 'speculative',
    label: 'Speculative',
    tone: 'warning',
    rank: 1,
    description: 'A hypothesis with little or no direct support.'
  }),
  'conversation-only': Object.freeze({
    grade: 'conversation-only',
    label: 'Conversation only',
    tone: 'muted',
    rank: 0,
    description: 'Raised in the source conversation and not yet checked against the literature.'
  })
})

export const EVIDENCE_KEYS = Object.freeze(Object.keys(EVIDENCE_GRADES))

export function evidenceInfo(grade) {
  return EVIDENCE_GRADES[grade] ?? Object.freeze({ grade, label: String(grade), tone: 'muted', rank: -1, description: '' })
}

export const CLAIM_STATUSES = Object.freeze({
  supported: Object.freeze({ status: 'supported', label: 'Supported', tone: 'success' }),
  'partly-supported': Object.freeze({ status: 'partly-supported', label: 'Partly supported', tone: 'info' }),
  contested: Object.freeze({ status: 'contested', label: 'Contested', tone: 'warning' }),
  unsupported: Object.freeze({ status: 'unsupported', label: 'Unsupported', tone: 'danger' })
})

export const CLAIM_STATUS_KEYS = Object.freeze(Object.keys(CLAIM_STATUSES))
export const CLAIM_SOURCES = Object.freeze(['conversation', 'literature'])

export function claimStatusInfo(status) {
  return CLAIM_STATUSES[status] ?? Object.freeze({ status, label: String(status), tone: 'muted' })
}
