import { describe, expect, it } from 'vitest'
import { bundledKnowledgeSnapshot, verifyKnowledgeSnapshot } from '../../server/knowledge/snapshot.js'

describe('portable knowledge snapshot verification', () => {
  it('recomputes the RFC 8785 digest and rejects modified content', () => {
    const snapshot = bundledKnowledgeSnapshot(9606)
    expect(verifyKnowledgeSnapshot(snapshot).snapshot_digest).toBe(snapshot.snapshot_digest)

    const changed = structuredClone(snapshot)
    changed.network.compounds[0].name = 'Modified after digest'
    expect(() => verifyKnowledgeSnapshot(changed)).toThrow(/digest mismatch/)
  })
})
