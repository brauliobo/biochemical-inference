import { createSpatialFixtureClient } from '../../server/spatial/fixture.js'

export async function spatialWorkspace(taxonId = 'NCBITaxon:9606') {
  const client = createSpatialFixtureClient()
  const [catalog, detail, structures, spaces, transforms, assets, descriptors, mappings, inventory] = await Promise.all([
    client.catalog(),
    client.detail(),
    client.structures(taxonId),
    client.spaces(taxonId),
    client.transforms(taxonId),
    client.assets({ taxonId }),
    client.descriptors(),
    client.mappings(),
    client.inventory()
  ])
  const instanceAsset = assets.items.find((asset) => asset.asset_type === 'instances')
  const instanceItem = inventory.items.find((item) => item.asset_id === instanceAsset.id)
  const content = await client.content(instanceAsset.id, instanceItem.id)
  const fieldAsset = assets.items.find((asset) => asset.asset_type === 'scalar-field')
  const fieldDescriptor = descriptors.items.find((descriptor) => descriptor.asset_id === fieldAsset.id)
  const fieldLevel = fieldDescriptor.levels[0]
  const field = await client.content(fieldAsset.id, fieldLevel.content_id)
  return {
    discovery: { contractVersion: '1.0.0', releaseId: detail.release.id, releaseDigest: detail.release.digest, maxContentBytes: 1_048_576, syntheticGeometry: true, hraAvailable: false, routes: { catalog: '', release: '', structures: '', spaces: '', transforms: '', assets: '', descriptors: '', mappings: '', inventory: '', content: '' } },
    catalog,
    detail,
    structures: structures.items,
    spaces: spaces.items,
    transforms: transforms.items,
    assets: assets.items,
    descriptors: descriptors.items,
    mappings: mappings.items,
    inventory: inventory.items,
    instanceContent: content.body.toString('utf8'),
    fieldContent: field.body.toString('utf8'),
    fieldLevel
  }
}
