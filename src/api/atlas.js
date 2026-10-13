import {
  AtlasClaimsResponseSchema,
  AtlasCoverageResponseSchema,
  AtlasEntityResponseSchema,
  AtlasNetworkSchema,
  AtlasReleaseDetailSchema,
  AtlasReleaseSchema,
  AtlasSubgraphSchema
} from '../../shared/atlas-contracts.js'
import { getJson, queryString } from './core.js'

function verifyAtlasEnvelope(payload, release) {
  if (payload.releaseId !== release.id || payload.releaseDigest !== release.digest) {
    throw new Error('Atlas response does not match the independently verified release and digest.')
  }
  return payload
}

const releasePath = (release) => `/api/v2/releases/${encodeURIComponent(release.id)}`
const entityPath = (base, entityId, taxonId) => `${base}/entities/${encodeURIComponent(entityId)}?${queryString({ taxon_id: taxonId })}`

export async function loadAtlasWorkspace(taxonId, signal) {
  const releases = await getJson('/api/v2/releases', AtlasReleaseSchema.array(), signal)
  const release = releases[0]
  if (!release) throw new Error('No verified contextual atlas release is available.')
  const base = releasePath(release)
  const taxonQuery = queryString({ taxon_id: taxonId })
  const [detail, network, claims, coverage] = await Promise.all([
    getJson(base, AtlasReleaseDetailSchema, signal),
    getJson(`${base}/network?${taxonQuery}`, AtlasNetworkSchema, signal),
    getJson(`${base}/claims?${taxonQuery}`, AtlasClaimsResponseSchema, signal),
    getJson(`${base}/coverage?${taxonQuery}`, AtlasCoverageResponseSchema, signal)
  ])
  if (detail.release.id !== release.id || detail.release.digest !== release.digest) {
    throw new Error('Atlas manifest does not match the independently verified release and digest.')
  }
  const verifiedNetwork = verifyAtlasEnvelope(network, release)
  const includedEntities = [...verifiedNetwork.entities]
  if (taxonId === 9606 && !includedEntities.some((entity) => entity.id === 'UniProtKB:P42898-2')) {
    const isoformPayload = await getJson(entityPath(base, 'UniProtKB:P42898-2', taxonId), AtlasEntityResponseSchema, signal)
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
  return verifyAtlasEnvelope(await getJson(entityPath(releasePath(release), entityId, taxonId), AtlasEntityResponseSchema, signal), release)
}

export async function loadAtlasSubgraph(release, rootId, taxonId, maxDepth, maxNodes, signal) {
  const query = queryString({ root_id: rootId, taxon_id: taxonId, max_depth: maxDepth, max_nodes: maxNodes })
  return verifyAtlasEnvelope(await getJson(`${releasePath(release)}/subgraph?${query}`, AtlasSubgraphSchema, signal), release)
}
