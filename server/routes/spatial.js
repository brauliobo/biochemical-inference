import { z } from 'zod'
import {
  SPATIAL_CONTRACT_VERSION,
  SPATIAL_MAX_CONTENT_BYTES,
  SPATIAL_RELEASE_DIGEST,
  SPATIAL_RELEASE_ID,
  SpatialAssetIdSchema,
  SpatialContentIdSchema
} from '../../shared/spatial-contracts.js'
import { notFound, problemReply } from '../http/replies.js'
import { parseSpatialRange } from '../spatial/range.js'

const SPATIAL_IMMUTABLE_CACHE = 'public, max-age=31536000, immutable'
const SpatialReleaseParamSchema = z.object({ releaseId: z.literal(SPATIAL_RELEASE_ID) }).strict()
const SpatialContentParamSchema = z.object({ releaseId: z.literal(SPATIAL_RELEASE_ID), assetId: SpatialAssetIdSchema, contentId: SpatialContentIdSchema }).strict()
const TaxonIdEnum = z.enum(['NCBITaxon:9606', 'NCBITaxon:10090'])
const SpatialTaxonQuerySchema = z.object({ taxon_id: TaxonIdEnum.optional() }).strict()
const SpatialAssetQuerySchema = z.object({
  taxon_id: TaxonIdEnum.optional(),
  structure_id: z.string().regex(/^STRUCTURE:(?:HUMAN|MOUSE)-(?:LIVER|HEPATOCYTE)$/).optional(),
  asset_type: z.enum(['geometry', 'instances', 'scalar-field']).optional()
}).strict()
const SpatialDescriptorQuerySchema = z.object({ asset_id: SpatialAssetIdSchema.optional() }).strict()

const invalidSpatialQuery = problemReply(400, 'INVALID_SPATIAL_QUERY', 'Spatial query parameters are invalid.')
const contentNotFound = (reply, message) => notFound(reply, 'SPATIAL_CONTENT_NOT_FOUND', message)

const spatialMetadata = (reply) => reply.headers({ 'cache-control': SPATIAL_IMMUTABLE_CACHE, etag: `"sha256:${SPATIAL_RELEASE_DIGEST}"`, 'x-release-digest': SPATIAL_RELEASE_DIGEST })

export function registerSpatialRoutes(app, { spatial }) {
  // Pinned-release views: reject other releases, validate the optional query, then send immutable release headers.
  const releaseView = (segment, query, call) => app.get(`/api/v5/spatial/releases/:releaseId${segment}`, async (request, reply) => {
    if (!SpatialReleaseParamSchema.safeParse(request.params).success) {
      return notFound(reply, 'SPATIAL_RELEASE_NOT_FOUND', 'Only the pinned spatial benchmark release is supported.')
    }
    let parsed
    if (query) {
      parsed = query.safeParse(request.query)
      if (!parsed.success) return invalidSpatialQuery(reply, parsed)
    }
    spatialMetadata(reply)
    return call(parsed?.data)
  })

  app.get('/api/v5/spatial', async () => ({
    contractVersion: SPATIAL_CONTRACT_VERSION,
    releaseId: SPATIAL_RELEASE_ID,
    releaseDigest: SPATIAL_RELEASE_DIGEST,
    maxContentBytes: SPATIAL_MAX_CONTENT_BYTES,
    syntheticGeometry: true,
    hraAvailable: false,
    routes: {
      catalog: '/api/v5/spatial/releases',
      release: `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}`,
      structures: `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}/structures`,
      spaces: `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}/spaces`,
      transforms: `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}/transforms`,
      assets: `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}/assets`,
      descriptors: `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}/descriptors`,
      mappings: `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}/mappings`,
      inventory: `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}/inventory`,
      content: `/api/v5/spatial/releases/${SPATIAL_RELEASE_ID}/assets/{assetId}/content/{contentId}`
    }
  }))
  app.get('/api/v5/spatial/releases', async () => spatial.catalog())
  releaseView('', null, () => spatial.detail())
  releaseView('/structures', SpatialTaxonQuerySchema, (query) => spatial.structures(query.taxon_id))
  releaseView('/spaces', SpatialTaxonQuerySchema, (query) => spatial.spaces(query.taxon_id))
  releaseView('/transforms', SpatialTaxonQuerySchema, (query) => spatial.transforms(query.taxon_id))
  releaseView('/assets', SpatialAssetQuerySchema, (query) => spatial.assets({ taxonId: query.taxon_id, structureId: query.structure_id, assetType: query.asset_type }))
  releaseView('/descriptors', SpatialDescriptorQuerySchema, (query) => spatial.descriptors(query.asset_id))
  releaseView('/mappings', null, () => spatial.mappings())
  releaseView('/inventory', null, () => spatial.inventory())

  app.get('/api/v5/spatial/releases/:releaseId/assets/:assetId/content/:contentId', async (request, reply) => {
    const parsed = SpatialContentParamSchema.safeParse(request.params)
    if (!parsed.success) return contentNotFound(reply, 'Spatial content identifier is unknown.')
    const inventory = await spatial.inventory()
    const item = inventory.items.find((candidate) => candidate.asset_id === parsed.data.assetId && candidate.id === parsed.data.contentId)
    if (!item) return contentNotFound(reply, 'Spatial content does not belong to this asset.')
    const range = parseSpatialRange(request.headers.range, item.bytes)
    const etag = `"sha256:${item.sha256}"`
    const headers = { 'accept-ranges': 'bytes', 'cache-control': SPATIAL_IMMUTABLE_CACHE, etag, 'x-content-sha256': item.sha256, 'x-release-digest': SPATIAL_RELEASE_DIGEST }
    if (!range && request.headers['if-none-match'] === etag) return reply.headers(headers).status(304).send()
    const content = await spatial.content(parsed.data.assetId, parsed.data.contentId, range)
    if (!content) return contentNotFound(reply, 'Spatial content does not belong to this asset.')
    if (range) headers['content-range'] = `bytes ${range.start}-${range.end}/${item.bytes}`
    return reply.headers(headers).type(item.media_type).status(content.statusCode).send(content.body)
  })
}
