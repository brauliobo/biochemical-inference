import { describe, expect, it } from 'vitest'
import { bundledKnowledgeSnapshot, snapshotDigest, verifyKnowledgeSnapshot } from '../../server/knowledge/snapshot.js'

describe('portable knowledge snapshot verification', () => {
  it('recomputes the RFC 8785 digest and rejects modified content', () => {
    const snapshot = bundledKnowledgeSnapshot(9606)
    expect(verifyKnowledgeSnapshot(snapshot).snapshot_digest).toBe(snapshot.snapshot_digest)

    const changed = structuredClone(snapshot)
    changed.network.compounds[0].name = 'Modified after digest'
    expect(() => verifyKnowledgeSnapshot(changed)).toThrow(/digest mismatch/)
  })

  it('rejects re-signed release-payload, projection, and fixture-source substitutions', () => {
    const payload = structuredClone(bundledKnowledgeSnapshot(9606))
    payload.release_payloads.compounds.records[0].name = 'Substituted authenticated payload'
    payload.snapshot_digest = snapshotDigest(payload)
    expect(() => verifyKnowledgeSnapshot(payload)).toThrow(/manifest file bytes and hash/)

    const projection = structuredClone(bundledKnowledgeSnapshot(9606))
    projection.network.compounds[0].name = 'Substituted projection'
    projection.snapshot_digest = snapshotDigest(projection)
    expect(() => verifyKnowledgeSnapshot(projection)).toThrow(/authenticated release payload closure/)

    const source = structuredClone(bundledKnowledgeSnapshot(9606))
    source.source_metadata.source_objects[0].artifact_commit = 'f'.repeat(40)
    source.snapshot_digest = snapshotDigest(source)
    expect(() => verifyKnowledgeSnapshot(source)).toThrow(/conflicts with .* provenance/)
  })
})
