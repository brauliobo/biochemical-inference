import { canonicalDigest } from '../../shared/canonical-json.js'

export const specificationIdentity = (specification) => canonicalDigest(specification)
export const engineIdentity = (engine) => canonicalDigest(engine)
export const revisionIdentity = (experimentId, ordinal, specificationDigest) => canonicalDigest({ experimentId, ordinal, specificationDigest })
export const scientificRunIdentity = (revision) => canonicalDigest({
  identityVersion: 'workspace-scientific-run-v1',
  specificationDigest: revision.specificationDigest,
  snapshotDigest: revision.snapshotDigest,
  modelDigests: [...revision.modelDigests].sort(),
  engineDigests: [...revision.engineDigests].sort()
})
export const attemptIdentity = (runId, attemptNumber) => canonicalDigest({ runId, attemptNumber })
export const checkpointIdentity = (attemptId, specificationDigest) => canonicalDigest({ attemptId, kind: 'specification', specificationDigest })
export const artifactIdentity = (attemptId, name, digest) => canonicalDigest({ attemptId, name, digest })
