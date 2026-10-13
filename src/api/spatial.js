import {
  SPATIAL_RELEASE_DIGEST,
  SPATIAL_RELEASE_ID,
  SpatialAssetIdSchema,
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
  SpatialTransformsSchema
} from '../../shared/spatial-contracts.js'
import { selectLod } from '../spatial.js'
import { getJson, withSignal } from './core.js'

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
    getJson('/api/v5/spatial', SpatialDiscoverySchema, signal),
    getJson('/api/v5/spatial/releases', SpatialCatalogSchema, signal),
    getJson(base, SpatialDetailSchema, signal),
    getJson(`${base}/structures${query}`, SpatialStructuresSchema, signal),
    getJson(`${base}/spaces${query}`, SpatialSpacesSchema, signal),
    getJson(`${base}/transforms${query}`, SpatialTransformsSchema, signal),
    getJson(`${base}/assets${query}`, SpatialAssetsSchema, signal),
    getJson(`${base}/descriptors`, SpatialDescriptorsSchema, signal),
    getJson(`${base}/mappings`, SpatialMappingsSchema, signal),
    getJson(`${base}/inventory`, SpatialInventorySchema, signal)
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
