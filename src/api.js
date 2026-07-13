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
import {
  APAP_RELEASE_ID,
  ApapDiscoverySchema,
  ApapRunRecordSchema,
  ApapRunRequestSchema,
  UpstreamApapAssumptionsSchema,
  UpstreamApapContextsSchema,
  UpstreamApapDetailSchema,
  UpstreamApapLimitationsSchema,
  UpstreamApapObservationsSchema,
  UpstreamApapParametersSchema,
  UpstreamApapProtocolsSchema,
  UpstreamApapValidationSchema
} from '../shared/apap-contracts.js'
import {
  SPATIAL_RELEASE_DIGEST,
  SPATIAL_RELEASE_ID,
  SpatialAssetsSchema,
  SpatialCatalogSchema,
  SpatialContentIdSchema,
  SpatialDescriptorsSchema,
  SpatialDetailSchema,
  SpatialDiscoverySchema,
  SpatialInventorySchema,
  SpatialMappingsSchema,
  SpatialSpacesSchema,
  SpatialStructuresSchema,
  SpatialTransformsSchema,
  SpatialAssetIdSchema
} from '../shared/spatial-contracts.js'
import { selectLod } from './spatial.js'
import {
  AssertionDetailSchema,
  AssertionEventsSchema,
  AssertionListSchema,
  BundleDetailSchema,
  BundleSubmitResponseSchema,
  DERIVED_CSRF_HEADER,
  DERIVED_CSRF_VALUE,
  DerivedHealthSchema,
  EventAppendResponseSchema,
  ImpactRequestSchema,
  ImpactResponseSchema,
  LayeredQueryResponseSchema,
  LayeredQuerySchema,
  MeasurementComparisonRequestSchema,
  MeasurementComparisonResponseSchema,
  ReproduceRequestSchema,
  ReviewEventRequestSchema
} from '../shared/derived-contracts.js'
import {
  ArtifactRecordSchema,
  AttemptDetailSchema,
  AttemptRecordSchema,
  BundleExportResponseSchema,
  ComparisonRecordSchema,
  ComparisonRequestSchema,
  ExperimentCreateRequestSchema,
  ExperimentDetailSchema,
  ExperimentRecordSchema,
  HistoryResponseSchema,
  ReportRecordSchema,
  ResourceProfileSchema,
  RevisionCreateRequestSchema,
  RevisionRecordSchema,
  SpecificationCheckpointSchema,
  WorkspaceEventSchema
} from '../shared/workspace-contracts.js'
import {
  ConformanceResultSchema,
  CouplingCreateRequestSchema,
  PHYSIOLOGY_CSRF_HEADER,
  PHYSIOLOGY_CSRF_VALUE,
  PackageValidationRequestSchema,
  PackageValidationResponseSchema,
  PhysiologyCouplingSchema,
  PhysiologyCoverageMatrixSchema,
  PhysiologyDiscoverySchema,
  PhysiologyEvidenceSchema,
  PhysiologyPackageSchema,
  PhysiologyRunRequestSchema,
  PhysiologyRunSchema,
  TrustKeySchema
} from '../shared/physiology-contracts.js'

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
const derivedMutationHeaders = { 'content-type': 'application/json', [DERIVED_CSRF_HEADER]: DERIVED_CSRF_VALUE }
const physiologyMutationHeaders = { 'content-type': 'application/json', [PHYSIOLOGY_CSRF_HEADER]: PHYSIOLOGY_CSRF_VALUE }

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

export async function loadApapWorkspace(signal) {
  const base = `/api/v4/apap/releases/${encodeURIComponent(APAP_RELEASE_ID)}`
  const [discovery, detail, contexts, parameters, protocols, observations, assumptions, limitations, validationMatrix] = await Promise.all([
    requestJson('/api/v4/apap', withSignal(signal)).then((payload) => ApapDiscoverySchema.parse(payload)),
    requestJson(base, withSignal(signal)).then((payload) => UpstreamApapDetailSchema.parse(payload)),
    requestJson(`${base}/contexts`, withSignal(signal)).then((payload) => UpstreamApapContextsSchema.parse(payload)),
    requestJson(`${base}/parameters`, withSignal(signal)).then((payload) => UpstreamApapParametersSchema.parse(payload)),
    requestJson(`${base}/protocols`, withSignal(signal)).then((payload) => UpstreamApapProtocolsSchema.parse(payload)),
    requestJson(`${base}/observations`, withSignal(signal)).then((payload) => UpstreamApapObservationsSchema.parse(payload)),
    requestJson(`${base}/assumptions`, withSignal(signal)).then((payload) => UpstreamApapAssumptionsSchema.parse(payload)),
    requestJson(`${base}/limitations`, withSignal(signal)).then((payload) => UpstreamApapLimitationsSchema.parse(payload)),
    requestJson(`${base}/validation-matrix`, withSignal(signal)).then((payload) => UpstreamApapValidationSchema.parse(payload))
  ])
  const envelopes = [detail, contexts, parameters, protocols, observations, assumptions, limitations, validationMatrix]
  if (discovery.releaseId !== detail.release.id || discovery.releaseDigest !== detail.release.digest || envelopes.some((item) => item.release.id !== detail.release.id || item.release.digest !== detail.release.digest)) {
    throw new Error('APAP responses do not match the independently pinned release and digest.')
  }
  return { discovery, detail, contexts: contexts.items, parameters: parameters.items, protocols: protocols.items, observations: observations.items, assumptions: assumptions.items, limitations: limitations.items, validationMatrix: validationMatrix.items }
}

export async function runApapBenchmark(input, signal) {
  const request = ApapRunRequestSchema.parse(input)
  return ApapRunRecordSchema.parse(await requestJson('/api/v4/apap/runs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function loadDerivedHealth(signal) {
  return DerivedHealthSchema.parse(await requestJson('/api/v6/derived/health', withSignal(signal)))
}

export async function loadDerivedAssertions(filters = {}, signal) {
  const query = queryString(filters)
  return AssertionListSchema.parse(await requestJson(`/api/v6/derived/assertions${query ? `?${query}` : ''}`, withSignal(signal)))
}

export async function loadReviewedDerivedAssertions(filters = {}, signal) {
  const query = queryString(filters)
  return AssertionListSchema.parse(await requestJson(`/api/v6/derived/reviewed-assertions${query ? `?${query}` : ''}`, withSignal(signal)))
}

export async function loadDerivedAssertion(assertionDigest, signal) {
  return AssertionDetailSchema.parse(await requestJson(`/api/v6/derived/assertions/${encodeURIComponent(assertionDigest)}`, withSignal(signal)))
}

export async function loadDerivedEvents(assertionDigest, signal) {
  return AssertionEventsSchema.parse(await requestJson(`/api/v6/derived/assertions/${encodeURIComponent(assertionDigest)}/events`, withSignal(signal)))
}

export async function loadDerivedBundle(bundleDigest, signal) {
  return BundleDetailSchema.parse(await requestJson(`/api/v6/derived/bundles/${encodeURIComponent(bundleDigest)}`, withSignal(signal)))
}

export async function submitApapDerivedBundle(runId, signal) {
  return BundleSubmitResponseSchema.parse(await requestJson(`/api/v6/derived/apap-runs/${encodeURIComponent(runId)}/bundles`, {
    method: 'POST',
    headers: derivedMutationHeaders,
    body: '{}',
    ...withSignal(signal)
  }))
}

export async function appendDerivedReviewEvent(assertionDigest, input, signal) {
  const request = ReviewEventRequestSchema.parse(input)
  return EventAppendResponseSchema.parse(await requestJson(`/api/v6/derived/assertions/${encodeURIComponent(assertionDigest)}/events`, {
    method: 'POST',
    headers: derivedMutationHeaders,
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function reproduceDerivedAssertion(assertionDigest, input, signal) {
  const request = ReproduceRequestSchema.parse(input)
  return EventAppendResponseSchema.parse(await requestJson(`/api/v6/derived/assertions/${encodeURIComponent(assertionDigest)}/reproduce`, {
    method: 'POST',
    headers: derivedMutationHeaders,
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function queryDerivedLayers(input, signal) {
  const request = LayeredQuerySchema.parse(input)
  return LayeredQueryResponseSchema.parse(await requestJson('/api/v6/derived/query', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function queryDerivedImpact(input, signal) {
  const request = ImpactRequestSchema.parse(input)
  return ImpactResponseSchema.parse(await requestJson('/api/v6/derived/impact', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function compareDerivedMeasurement(input, signal) {
  const request = MeasurementComparisonRequestSchema.parse(input)
  return MeasurementComparisonResponseSchema.parse(await requestJson('/api/v6/derived/measurements/compare', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

function verifySpatialEnvelope(payload) {
  if (payload.release.id !== SPATIAL_RELEASE_ID || payload.release.digest !== SPATIAL_RELEASE_DIGEST) throw new Error('Spatial response does not match the independently pinned release and digest.')
  return payload
}

export async function loadSpatialContent(assetId, contentId, signal) {
  const asset = SpatialAssetIdSchema.parse(assetId)
  const content = SpatialContentIdSchema.parse(contentId)
  const response = await fetch(`/api/v5/spatial/releases/${encodeURIComponent(SPATIAL_RELEASE_ID)}/assets/${encodeURIComponent(asset)}/content/${encodeURIComponent(content)}`, withSignal(signal))
  if (!response.ok) throw new Error(`Spatial content request failed with status ${response.status}`)
  if (response.headers.get('x-release-digest') !== SPATIAL_RELEASE_DIGEST) throw new Error('Spatial content does not match the pinned release digest.')
  return response.text()
}

export async function loadSpatialWorkspace(taxonId, signal, projectedCellPixels = 5) {
  const base = `/api/v5/spatial/releases/${encodeURIComponent(SPATIAL_RELEASE_ID)}`
  const query = `?taxon_id=${encodeURIComponent(taxonId)}`
  const [discovery, catalog, detail, structures, spaces, transforms, assets, descriptors, mappings, inventory] = await Promise.all([
    requestJson('/api/v5/spatial', withSignal(signal)).then((payload) => SpatialDiscoverySchema.parse(payload)),
    requestJson('/api/v5/spatial/releases', withSignal(signal)).then((payload) => SpatialCatalogSchema.parse(payload)),
    requestJson(base, withSignal(signal)).then((payload) => SpatialDetailSchema.parse(payload)),
    requestJson(`${base}/structures${query}`, withSignal(signal)).then((payload) => SpatialStructuresSchema.parse(payload)),
    requestJson(`${base}/spaces${query}`, withSignal(signal)).then((payload) => SpatialSpacesSchema.parse(payload)),
    requestJson(`${base}/transforms${query}`, withSignal(signal)).then((payload) => SpatialTransformsSchema.parse(payload)),
    requestJson(`${base}/assets${query}`, withSignal(signal)).then((payload) => SpatialAssetsSchema.parse(payload)),
    requestJson(`${base}/descriptors`, withSignal(signal)).then((payload) => SpatialDescriptorsSchema.parse(payload)),
    requestJson(`${base}/mappings`, withSignal(signal)).then((payload) => SpatialMappingsSchema.parse(payload)),
    requestJson(`${base}/inventory`, withSignal(signal)).then((payload) => SpatialInventorySchema.parse(payload))
  ])
  const envelopes = [structures, spaces, transforms, assets, descriptors, mappings, inventory]
  if (discovery.releaseDigest !== SPATIAL_RELEASE_DIGEST || catalog.releases[0]?.release_digest !== SPATIAL_RELEASE_DIGEST || detail.release.digest !== SPATIAL_RELEASE_DIGEST || envelopes.some((payload) => verifySpatialEnvelope(payload) !== payload)) {
    throw new Error('Spatial metadata does not match the independently pinned release and digest.')
  }
  const instanceAsset = assets.items.find((asset) => asset.asset_type === 'instances')
  const instanceItem = inventory.items.find((item) => item.asset_id === instanceAsset?.id && item.role === 'instances')
  const fieldAsset = assets.items.find((asset) => asset.asset_type === 'scalar-field')
  const fieldDescriptor = descriptors.items.find((descriptor) => descriptor.asset_id === fieldAsset?.id)
  if (!instanceAsset || !instanceItem || !fieldAsset || !fieldDescriptor) throw new Error('Pinned spatial instance or field content is unavailable for this taxon.')
  const fieldLevel = selectLod(fieldDescriptor.levels, projectedCellPixels)
  const [instanceContent, fieldContent] = await Promise.all([
    loadSpatialContent(instanceAsset.id, instanceItem.id, signal),
    loadSpatialContent(fieldAsset.id, fieldLevel.content_id, signal)
  ])
  return { discovery, catalog, detail, structures: structures.items, spaces: spaces.items, transforms: transforms.items, assets: assets.items, descriptors: descriptors.items, mappings: mappings.items, inventory: inventory.items, instanceContent, fieldContent, fieldLevel }
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

export async function loadWorkspaceResourceProfiles(signal) {
  return ResourceProfileSchema.array().parse(await requestJson('/api/v7/workspace/resource-profiles', withSignal(signal)))
}

export async function loadWorkspaceExperiments(signal) {
  return ExperimentRecordSchema.array().parse(await requestJson('/api/v7/workspace/experiments', withSignal(signal)))
}

export async function createWorkspaceExperiment(input, signal) {
  const request = ExperimentCreateRequestSchema.parse(input)
  return ExperimentDetailSchema.parse(await requestJson('/api/v7/workspace/experiments', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function loadWorkspaceExperiment(experimentId, signal) {
  return ExperimentDetailSchema.parse(await requestJson(`/api/v7/workspace/experiments/${encodeURIComponent(experimentId)}`, withSignal(signal)))
}

export async function createWorkspaceRevision(experimentId, input, signal) {
  const request = RevisionCreateRequestSchema.parse(input)
  return RevisionRecordSchema.parse(await requestJson(`/api/v7/workspace/experiments/${encodeURIComponent(experimentId)}/revisions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function cloneWorkspaceExperiment(experimentId, name, signal) {
  return ExperimentDetailSchema.parse(await requestJson(`/api/v7/workspace/experiments/${encodeURIComponent(experimentId)}/clone`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(name ? { name } : {}),
    ...withSignal(signal)
  }))
}

export async function queueWorkspaceRun(revisionId, resourceProfileId, signal) {
  return AttemptRecordSchema.parse(await requestJson('/api/v7/workspace/runs', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ revisionId, ...(resourceProfileId ? { resourceProfileId } : {}) }),
    ...withSignal(signal)
  }))
}

export async function loadWorkspaceHistory(filters = {}, signal) {
  const query = queryString(filters)
  return HistoryResponseSchema.parse(await requestJson(`/api/v7/workspace/runs${query ? `?${query}` : ''}`, withSignal(signal)))
}

export async function loadWorkspaceAttempt(attemptId, signal) {
  return AttemptDetailSchema.parse(await requestJson(`/api/v7/workspace/runs/${encodeURIComponent(attemptId)}`, withSignal(signal)))
}

export async function loadWorkspaceEvents(attemptId, signal) {
  return WorkspaceEventSchema.array().parse(await requestJson(`/api/v7/workspace/runs/${encodeURIComponent(attemptId)}/events`, withSignal(signal)))
}

export async function cancelWorkspaceAttempt(attemptId, signal) {
  return AttemptRecordSchema.parse(await requestJson(`/api/v7/workspace/runs/${encodeURIComponent(attemptId)}/cancel`, { method: 'POST', body: '{}', headers: { 'content-type': 'application/json' }, ...withSignal(signal) }))
}

export async function loadWorkspaceCheckpoints(attemptId, signal) {
  return SpecificationCheckpointSchema.array().parse(await requestJson(`/api/v7/workspace/runs/${encodeURIComponent(attemptId)}/checkpoints`, withSignal(signal)))
}

export async function restartWorkspaceCheckpoint(checkpointId, resourceProfileId, signal) {
  return AttemptRecordSchema.parse(await requestJson(`/api/v7/workspace/checkpoints/${encodeURIComponent(checkpointId)}/restart`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(resourceProfileId ? { resourceProfileId } : {}),
    ...withSignal(signal)
  }))
}

export async function loadWorkspaceArtifacts(attemptId, signal) {
  return ArtifactRecordSchema.array().parse(await requestJson(`/api/v7/workspace/runs/${encodeURIComponent(attemptId)}/artifacts`, withSignal(signal)))
}

export async function compareWorkspaceAttempts(input, signal) {
  const request = ComparisonRequestSchema.parse(input)
  return ComparisonRecordSchema.parse(await requestJson('/api/v7/workspace/comparisons', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function createWorkspaceReport(attemptId, signal) {
  return ReportRecordSchema.parse(await requestJson('/api/v7/workspace/reports', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ attemptId }),
    ...withSignal(signal)
  }))
}

export async function exportWorkspaceExperiment(experimentId, signal) {
  return BundleExportResponseSchema.parse(await requestJson(`/api/v7/workspace/experiments/${encodeURIComponent(experimentId)}/export`, withSignal(signal)))
}

export async function importWorkspaceExperiment(bundleBase64, signal) {
  return ExperimentDetailSchema.parse(await requestJson('/api/v7/workspace/experiments/import', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ bundleBase64 }),
    ...withSignal(signal)
  }))
}

export async function loadPhysiologyWorkbench(signal) {
  const [discovery, evidence, packages, trust, coverage, couplings, runs] = await Promise.all([
    requestJson('/api/v8/physiology', withSignal(signal)).then((payload) => PhysiologyDiscoverySchema.parse(payload)),
    requestJson('/api/v8/physiology/evidence', withSignal(signal)).then((payload) => PhysiologyEvidenceSchema.parse(payload)),
    requestJson('/api/v8/physiology/packages', withSignal(signal)).then((payload) => PhysiologyPackageSchema.array().parse(payload)),
    requestJson('/api/v8/physiology/trust', withSignal(signal)).then((payload) => TrustKeySchema.array().parse(payload)),
    requestJson('/api/v8/physiology/coverage', withSignal(signal)).then((payload) => PhysiologyCoverageMatrixSchema.parse(payload)),
    requestJson('/api/v8/physiology/couplings', withSignal(signal)).then((payload) => PhysiologyCouplingSchema.array().parse(payload)),
    requestJson('/api/v8/physiology/runs', withSignal(signal)).then((payload) => PhysiologyRunSchema.array().parse(payload))
  ])
  if (discovery.releaseId !== evidence.release.id || discovery.releaseDigest !== evidence.release.digest || coverage.release.digest !== evidence.release.digest) throw new Error('Physiology responses do not match the independently pinned evidence release and digest.')
  return { discovery, evidence, packages, trust, coverage, couplings, runs }
}

export async function validatePhysiologyPackage(packageBase64, signal) {
  const request = PackageValidationRequestSchema.parse({ packageBase64 })
  return PackageValidationResponseSchema.parse(await requestJson('/api/v8/physiology/packages/validate', {
    method: 'POST',
    headers: physiologyMutationHeaders,
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function installPhysiologyPackage(packageBase64, signal) {
  const request = PackageValidationRequestSchema.parse({ packageBase64 })
  return PhysiologyPackageSchema.parse(await requestJson('/api/v8/physiology/packages/install', {
    method: 'POST',
    headers: physiologyMutationHeaders,
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function runPhysiologyConformance(packageDigest, signal) {
  return ConformanceResultSchema.parse(await requestJson(`/api/v8/physiology/packages/${encodeURIComponent(packageDigest)}/conformance`, {
    method: 'POST',
    headers: physiologyMutationHeaders,
    body: '{}',
    ...withSignal(signal)
  }))
}

export async function createPhysiologyCoupling(input, signal) {
  const request = CouplingCreateRequestSchema.parse(input)
  return PhysiologyCouplingSchema.parse(await requestJson('/api/v8/physiology/couplings', {
    method: 'POST',
    headers: physiologyMutationHeaders,
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}

export async function runPhysiologyCoupling(couplingDigest, signal) {
  const request = PhysiologyRunRequestSchema.parse({ couplingDigest })
  return PhysiologyRunSchema.parse(await requestJson('/api/v8/physiology/runs', {
    method: 'POST',
    headers: physiologyMutationHeaders,
    body: JSON.stringify(request),
    ...withSignal(signal)
  }))
}
