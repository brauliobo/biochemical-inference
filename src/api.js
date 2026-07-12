import { ModelSchema, NetworkSchema, ReleaseSchema, SimulationResultSchema } from '../shared/contracts.js'

async function requestJson(path, init) {
  const response = await fetch(path, init)
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload ? String(payload.message) : `Request failed with status ${response.status}`
    throw new Error(message)
  }
  return payload
}

const withSignal = (signal) => signal ? { signal } : {}

export async function loadWorkspace(taxonId, signal) {
  const releasesPayload = await requestJson('/api/v1/releases', withSignal(signal))
  const releases = ReleaseSchema.array().parse(releasesPayload)
  const release = releases[0]
  if (!release) throw new Error('No verified biochemical knowledge release is available.')
  const [modelPayload, networkPayload] = await Promise.all([
    requestJson('/api/v1/models/one-carbon', withSignal(signal)),
    requestJson(`/api/v1/releases/${encodeURIComponent(release.id)}/network?taxon_id=${taxonId}`, withSignal(signal))
  ])
  return { release, model: ModelSchema.parse(modelPayload), network: NetworkSchema.parse(networkPayload) }
}

export async function loadNetwork(releaseId, taxonId, signal) {
  return NetworkSchema.parse(await requestJson(`/api/v1/releases/${encodeURIComponent(releaseId)}/network?taxon_id=${taxonId}`, withSignal(signal)))
}

export async function runSimulation(input) {
  return SimulationResultSchema.parse(await requestJson('/api/v1/models/one-carbon/simulations', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input)
  }))
}
