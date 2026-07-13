import { describe, expect, it } from 'vitest'
import { attemptIdentity, engineIdentity, scientificRunIdentity, specificationIdentity } from '../../server/workspace/identity.js'
import { workspaceSpecification } from '../fixtures/workspace.js'

describe('workspace scientific and attempt identities', () => {
  it('keeps retries under one scientific identity while assigning unique attempt identities', () => {
    const specification = workspaceSpecification()
    const revision = {
      specificationDigest: specificationIdentity(specification),
      snapshotDigest: `sha256:${'a'.repeat(64)}`,
      modelDigests: [specification.entries[0].model.digest],
      engineDigests: [engineIdentity(specification.entries[0].experiment.engine)]
    }
    const runId = scientificRunIdentity(revision)

    expect(scientificRunIdentity({ ...revision })).toBe(runId)
    expect(attemptIdentity(runId, 1)).not.toBe(attemptIdentity(runId, 2))
    expect(scientificRunIdentity({ ...revision, specificationDigest: `sha256:${'b'.repeat(64)}` })).not.toBe(runId)
  })
})
