import { ModelSchema, NetworkSchema, ProvenanceSchema, ReleaseSchema, SimulationResultSchema } from '../../shared/contracts.js'
import { getJson, postJson, requestJson, withSignal } from './core.js'

const networkPath = (releaseId, taxonId) => `/api/v1/releases/${encodeURIComponent(releaseId)}/network?taxon_id=${taxonId}`

export async function loadWorkspace(taxonId, signal) {
  const releasesPayload = await requestJson('/api/v1/releases', withSignal(signal))
  const releases = ReleaseSchema.array().parse(releasesPayload)
  const release = releases[0]
  if (!release) throw new Error('No verified biochemical knowledge release is available.')
  const [modelPayload, networkPayload] = await Promise.all([
    requestJson('/api/v1/models/one-carbon', withSignal(signal)),
    requestJson(networkPath(release.id, taxonId), withSignal(signal))
  ])
  return { release, model: ModelSchema.parse(modelPayload), network: NetworkSchema.parse(networkPayload) }
}

export async function loadNetwork(releaseId, taxonId, signal) {
  return getJson(networkPath(releaseId, taxonId), NetworkSchema, signal)
}

export async function loadProvenance(release, signal) {
  const provenance = await getJson(`/api/v1/releases/${encodeURIComponent(release.id)}/provenance`, ProvenanceSchema, signal)
  if (provenance.releaseId !== release.id || provenance.releaseDigest !== release.digest) {
    throw new Error('Build provenance does not match the verified release and digest.')
  }
  return provenance
}

export async function runSimulation(input) {
  return postJson('/api/v1/models/one-carbon/simulations', input, SimulationResultSchema)
}
