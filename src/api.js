import { ModelSchema, NetworkSchema, ProvenanceSchema, ReleaseSchema, SimulationResultSchema } from '../shared/contracts.js'
import {
  AtlasClaimsResponseSchema,
  AtlasCoverageResponseSchema,
  AtlasEntityResponseSchema,
  AtlasNetworkSchema,
  AtlasReleaseDetailSchema,
  AtlasReleaseSchema,
  AtlasSubgraphSchema
} from '../shared/atlas-contracts.js'
import {
  EvidenceCandidateExtractionRequestSchema,
  EvidenceCandidateListResponseSchema,
  EvidenceCandidateResponseSchema,
  EvidenceDocumentResponseSchema,
  EvidenceHealthSchema,
  EvidenceSearchRequestSchema,
  EvidenceSearchResponseSchema
} from '../shared/evidence-contracts.js'
import { ExperimentSchema, PortfolioModelSchema, RunRecordSchema } from '../shared/portfolio-contracts.js'
import { ParameterOptionsResponseSchema, StudyRecordSchema, StudyRequestSchema } from '../shared/parameter-contracts.js'

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

function queryString(values) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== null && value !== '') query.set(key, String(value))
  }
  return query.toString()
}

function verifyAtlasEnvelope(payload, release) {
  if (payload.releaseId !== release.id || payload.releaseDigest !== release.digest) {
    throw new Error('Atlas response does not match the independently verified release and digest.')
  }
  return payload
}

function verifyEvidenceEnvelope(payload, release) {
  if (payload.release.id !== release.id || payload.release.digest !== release.digest) {
    throw new Error('Evidence response does not match the independently verified release and digest.')
  }
  return payload
}

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

export async function loadProvenance(release, signal) {
  const provenance = ProvenanceSchema.parse(await requestJson(`/api/v1/releases/${encodeURIComponent(release.id)}/provenance`, withSignal(signal)))
  if (provenance.releaseId !== release.id || provenance.releaseDigest !== release.digest) {
    throw new Error('Build provenance does not match the verified release and digest.')
  }
  return provenance
}

export async function runSimulation(input) {
  return SimulationResultSchema.parse(await requestJson('/api/v1/models/one-carbon/simulations', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(input)
  }))
}

export async function loadPortfolioModels(signal) {
  return PortfolioModelSchema.array().parse(await requestJson('/api/v2/models', withSignal(signal)))
}

export async function runPortfolioExperiment(input, signal) {
  const experiment = ExperimentSchema.parse(input)
  return RunRecordSchema.parse(await requestJson('/api/v2/runs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ experiment }),
    ...withSignal(signal)
  }))
}

export async function loadParameterOptions(signal) {
  return ParameterOptionsResponseSchema.parse(await requestJson('/api/v2/parameter-options', withSignal(signal)))
}

export async function runParameterStudy(input, signal) {
  const request = StudyRequestSchema.parse(input)
  return StudyRecordSchema.parse(await requestJson('/api/v2/studies', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function loadAtlasWorkspace(taxonId, signal) {
  const releases = AtlasReleaseSchema.array().parse(await requestJson('/api/v2/releases', withSignal(signal)))
  const release = releases[0]
  if (!release) throw new Error('No verified contextual atlas release is available.')
  const base = `/api/v2/releases/${encodeURIComponent(release.id)}`
  const [detail, network, claims, coverage] = await Promise.all([
    requestJson(base, withSignal(signal)).then((payload) => AtlasReleaseDetailSchema.parse(payload)),
    requestJson(`${base}/network?${queryString({ taxon_id: taxonId })}`, withSignal(signal)).then((payload) => AtlasNetworkSchema.parse(payload)),
    requestJson(`${base}/claims?${queryString({ taxon_id: taxonId })}`, withSignal(signal)).then((payload) => AtlasClaimsResponseSchema.parse(payload)),
    requestJson(`${base}/coverage?${queryString({ taxon_id: taxonId })}`, withSignal(signal)).then((payload) => AtlasCoverageResponseSchema.parse(payload))
  ])
  if (detail.release.id !== release.id || detail.release.digest !== release.digest) {
    throw new Error('Atlas manifest does not match the independently verified release and digest.')
  }
  const verifiedNetwork = verifyAtlasEnvelope(network, release)
  const includedEntities = [...verifiedNetwork.entities]
  if (taxonId === 9606 && !includedEntities.some((entity) => entity.id === 'UniProtKB:P42898-2')) {
    const isoformPayload = AtlasEntityResponseSchema.parse(await requestJson(
      `${base}/entities/${encodeURIComponent('UniProtKB:P42898-2')}?${queryString({ taxon_id: taxonId })}`,
      withSignal(signal)
    ))
    includedEntities.push(verifyAtlasEnvelope(isoformPayload, release).entity)
  }
  return {
    release,
    detail,
    network: verifiedNetwork,
    includedEntities,
    claims: verifyAtlasEnvelope(claims, release),
    coverage: verifyAtlasEnvelope(coverage, release)
  }
}

export async function loadAtlasEntity(release, entityId, taxonId, signal) {
  const query = queryString({ taxon_id: taxonId })
  const payload = AtlasEntityResponseSchema.parse(await requestJson(
    `/api/v2/releases/${encodeURIComponent(release.id)}/entities/${encodeURIComponent(entityId)}?${query}`,
    withSignal(signal)
  ))
  return verifyAtlasEnvelope(payload, release)
}

export async function loadAtlasSubgraph(release, rootId, taxonId, maxDepth, maxNodes, signal) {
  const query = queryString({ root_id: rootId, taxon_id: taxonId, max_depth: maxDepth, max_nodes: maxNodes })
  const payload = AtlasSubgraphSchema.parse(await requestJson(
    `/api/v2/releases/${encodeURIComponent(release.id)}/subgraph?${query}`,
    withSignal(signal)
  ))
  return verifyAtlasEnvelope(payload, release)
}

export async function loadEvidenceHealth(signal) {
  return EvidenceHealthSchema.parse(await requestJson('/api/v3/evidence/health', withSignal(signal)))
}

export async function searchEvidence(release, input, signal) {
  const request = EvidenceSearchRequestSchema.parse(input)
  const payload = EvidenceSearchResponseSchema.parse(await requestJson('/api/v3/evidence/search', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
  return verifyEvidenceEnvelope(payload, release)
}

export async function loadEvidenceDocument(release, identifier, signal) {
  const payload = EvidenceDocumentResponseSchema.parse(await requestJson(`/api/v3/evidence/documents/${encodeURIComponent(identifier)}`, withSignal(signal)))
  return verifyEvidenceEnvelope(payload, release)
}

export async function extractEvidenceCandidate(release, input, signal) {
  const request = EvidenceCandidateExtractionRequestSchema.parse(input)
  const payload = EvidenceCandidateResponseSchema.parse(await requestJson('/api/v3/evidence/candidates/extract', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
  return verifyEvidenceEnvelope(payload, release)
}

export async function loadEvidenceCandidates(release, signal) {
  const payload = EvidenceCandidateListResponseSchema.parse(await requestJson('/api/v3/evidence/candidates', withSignal(signal)))
  return verifyEvidenceEnvelope(payload, release)
}

export async function loadEvidenceCandidate(release, candidateId, signal) {
  const payload = EvidenceCandidateResponseSchema.parse(await requestJson(`/api/v3/evidence/candidates/${encodeURIComponent(candidateId)}`, withSignal(signal)))
  return verifyEvidenceEnvelope(payload, release)
}
