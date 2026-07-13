import Fastify from 'fastify'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { canonicalJson } from '../../shared/canonical-json.js'
import {
  DATA_PLANE_BASELINE_RELEASE_ID,
  DATA_PLANE_CANDIDATE_RELEASE_ID,
  DATA_PLANE_CATALOG_DIGEST,
  DATA_PLANE_NLM_COURTESY
} from '../../shared/data-plane-contracts.js'
import { RECORD_TYPES, sha256 } from '../../server/data-plane/verification.js'

const here = dirname(fileURLToPath(import.meta.url))
const DEFAULT_ROOT = resolve(here, 'data-plane', 'public')
const DEFAULT_SECRET = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
const FILTER_COLUMNS = {
  taxa: new Set(['id']),
  compounds: new Set(['id']),
  reactions: new Set(['id']),
  proteins: new Set(['id', 'taxon_id']),
  references: new Set(['id']),
  catalysis: new Set(['id', 'taxon_id', 'reaction_id', 'protein_id']),
  limitations: new Set(['id'])
}

function cursorSecret(value) {
  const decoded = Buffer.from(value, 'base64url')
  if (!/^[A-Za-z0-9_-]{43}$/.test(value) || decoded.length !== 32 || decoded.toString('base64url') !== value) throw new Error('Fixture factory cursor secret must be canonical base64url for 32 bytes.')
  return decoded
}

function encodeCursor(payload, secret) {
  const encoded = Buffer.from(canonicalJson(payload))
  return Buffer.concat([encoded, createHmac('sha256', secret).update(encoded).digest()]).toString('base64url')
}

function decodeCursor(value, secret) {
  try {
    if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length > 8192) throw new Error('shape')
    const raw = Buffer.from(value, 'base64url')
    if (raw.toString('base64url') !== value || raw.length <= 32) throw new Error('encoding')
    const encoded = raw.subarray(0, -32)
    if (!timingSafeEqual(raw.subarray(-32), createHmac('sha256', secret).update(encoded).digest())) throw new Error('signature')
    const payload = JSON.parse(encoded.toString('utf8'))
    if (canonicalJson(payload) !== encoded.toString('utf8')) throw new Error('canonical')
    return payload
  } catch {
    throw new Error('invalid or tampered cursor')
  }
}

function sendBytes(reply, bytes, digest, mediaType, extra = {}, immutable = true) {
  const headers = {
    'cache-control': immutable ? 'public, max-age=31536000, immutable' : 'public, max-age=60, must-revalidate',
    'content-type': mediaType,
    etag: `"sha256:${digest}"`,
    'x-content-sha256': digest,
    ...extra
  }
  reply.hijack()
  reply.raw.statusCode = 200
  for (const [name, value] of Object.entries(headers)) reply.raw.setHeader(name, value)
  reply.raw.setHeader('content-length', String(bytes.length))
  reply.raw.end(bytes)
  return reply
}

function sendCanonical(reply, value, digest = undefined, immutable = true) {
  const bytes = Buffer.from(canonicalJson(value))
  return sendBytes(reply, bytes, digest ?? sha256(bytes), 'application/json', {}, immutable)
}

export async function buildFactoryFixtureServer(options = {}) {
  const root = resolve(options.root ?? DEFAULT_ROOT)
  const [catalogBytes, trustBytes, diffBytes] = await Promise.all([
    readFile(resolve(root, 'catalog.envelope.json')),
    readFile(resolve(root, 'trust.json')),
    readFile(resolve(root, 'diffs', `${DATA_PLANE_BASELINE_RELEASE_ID}--v2.0.1.json`))
  ])
  const catalog = JSON.parse(catalogBytes)
  const exactDiff = JSON.parse(diffBytes)
  const releases = new Map()
  for (const catalogEntry of catalog.payload.releases) {
    const releaseRoot = resolve(root, 'releases', catalogEntry.release_id)
    const [envelopeBytes, manifestBytes] = await Promise.all([
      readFile(resolve(releaseRoot, 'envelope.json')),
      readFile(resolve(releaseRoot, 'manifest.json'))
    ])
    const manifest = JSON.parse(manifestBytes)
    const release = { id: manifest.release_id, schema_version: manifest.schema_version, digest: manifest.release_digest }
    const partitions = new Map()
    const records = Object.fromEntries(RECORD_TYPES.map((type) => [type, []]))
    for (const entry of manifest.partitions) {
      const bytes = await readFile(resolve(releaseRoot, entry.path))
      partitions.set(`${entry.record_type}:${Number(entry.path.match(/part-([0-9]{5})/)[1])}`, { entry, bytes })
      records[entry.record_type].push(...bytes.toString('utf8').trimEnd().split('\n').map((line) => JSON.parse(line)))
    }
    releases.set(release.id, { release, manifest, manifestBytes, envelopeBytes, partitions, records })
  }
  const secret = cursorSecret(options.cursorSecret ?? process.env.BIOCHEMICAL_FACTORY_CURSOR_SECRET ?? DEFAULT_SECRET)
  const app = Fastify({ logger: false })

  app.get('/api/factory/v1', async (_request, reply) => sendCanonical(reply, {
    contract_version: '1.0.0',
    catalog_digest: DATA_PLANE_CATALOG_DIGEST,
    release_count: catalog.payload.releases.length,
    acknowledgments: [DATA_PLANE_NLM_COURTESY],
    routes: {
      releases: '/api/factory/v1/releases',
      envelope: '/api/factory/v1/releases/{release_id}/envelope',
      manifest: '/api/factory/v1/releases/{release_id}/manifest',
      partitions: '/api/factory/v1/releases/{release_id}/partitions/{record_type}/{part_number}',
      records: '/api/factory/v1/releases/{release_id}/records/{record_type}',
      diff: '/api/factory/v1/diff',
      trust: '/api/factory/v1/trust'
    }
  }, undefined, false))

  app.get('/api/factory/v1/releases', async (_request, reply) => {
    const bytes = options.transformArtifact?.('catalog', Buffer.from(catalogBytes)) ?? catalogBytes
    return sendBytes(reply, bytes, DATA_PLANE_CATALOG_DIGEST, 'application/json', {}, false)
  })
  app.get('/api/factory/v1/trust', async (_request, reply) => {
    const bytes = options.transformArtifact?.('trust', Buffer.from(trustBytes)) ?? trustBytes
    return sendBytes(reply, bytes, sha256(trustBytes), 'application/json', {}, false)
  })
  app.get('/api/factory/v1/releases/:releaseId/envelope', async (request, reply) => {
    const selected = releases.get(request.params.releaseId)
    if (!selected) return reply.status(404).send({ detail: 'Unknown factory release' })
    const bytes = options.transformArtifact?.('envelope', Buffer.from(selected.envelopeBytes), request.params.releaseId) ?? selected.envelopeBytes
    return sendBytes(reply, bytes, sha256(selected.envelopeBytes), 'application/json')
  })
  app.get('/api/factory/v1/releases/:releaseId/manifest', async (request, reply) => {
    const selected = releases.get(request.params.releaseId)
    if (!selected) return reply.status(404).send({ detail: 'Unknown factory release' })
    const bytes = options.transformArtifact?.('manifest', Buffer.from(selected.manifestBytes), request.params.releaseId) ?? selected.manifestBytes
    return sendBytes(reply, bytes, sha256(selected.manifestBytes), 'application/json', { 'x-release-digest': selected.manifest.release_digest })
  })
  app.get('/api/factory/v1/releases/:releaseId/partitions/:recordType/:partNumber', async (request, reply) => {
    const selectedRelease = releases.get(request.params.releaseId)
    if (!selectedRelease) return reply.status(404).send({ detail: 'Unknown factory release' })
    if (!/^(?:0|[1-9][0-9]{0,4})$/.test(request.params.partNumber)) return reply.status(422).send({ detail: 'part_number must be canonical decimal' })
    const selected = selectedRelease.partitions.get(`${request.params.recordType}:${Number(request.params.partNumber)}`)
    if (!selected) return reply.status(404).send({ detail: 'Unknown factory partition' })
    await options.beforePartition?.(selected.entry, request.params.releaseId)
    const bytes = options.transformArtifact?.(`partition:${selected.entry.path}`, Buffer.from(selected.bytes), request.params.releaseId) ?? selected.bytes
    return sendBytes(reply, bytes, selected.entry.sha256, 'application/x-ndjson', { 'x-release-digest': selectedRelease.manifest.release_digest, 'x-record-type': selected.entry.record_type })
  })

  app.get('/api/factory/v1/releases/:releaseId/records/:recordType', async (request, reply) => {
    const { releaseId, recordType } = request.params
    options.onRecordRequest?.(recordType, request.query, releaseId)
    const selectedRelease = releases.get(releaseId)
    if (!selectedRelease) return reply.status(404).send({ detail: 'Unknown factory release' })
    if (!FILTER_COLUMNS[recordType]) return reply.status(422).send({ detail: `unknown record type: ${recordType}` })
    const knownQuery = new Set(['limit', 'cursor', 'id', 'taxon_id', 'reaction_id', 'protein_id'])
    if (Object.keys(request.query).some((key) => !knownQuery.has(key))) return reply.status(422).send({ detail: 'unsupported query' })
    const limit = request.query.limit === undefined ? 50 : Number(request.query.limit)
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) return reply.status(422).send({ detail: 'limit must be between 1 and 100' })
    const filters = Object.fromEntries(Object.entries(request.query).filter(([key, value]) => FILTER_COLUMNS[recordType].has(key) && value).sort(([left], [right]) => left.localeCompare(right)))
    if (Object.keys(request.query).some((key) => ['id', 'taxon_id', 'reaction_id', 'protein_id'].includes(key) && !FILTER_COLUMNS[recordType].has(key))) return reply.status(422).send({ detail: `unsupported filter for ${recordType}` })
    const identity = { page_contract: 'factory-records-v1', release_id: selectedRelease.release.id, release_digest: selectedRelease.release.digest, schema_version: selectedRelease.release.schema_version, record_type: recordType, filters, sort: 'id:asc', limit }
    let afterId = ''
    if (request.query.cursor) {
      try {
        const decoded = decodeCursor(request.query.cursor, secret)
        const expected = { ...identity, after_id: decoded.after_id }
        if (typeof decoded.after_id !== 'string' || canonicalJson(decoded) !== canonicalJson(expected)) throw new Error('binding')
        afterId = decoded.after_id
      } catch {
        return reply.status(422).send({ detail: 'cursor is bound to a different release, schema, query, sort, or limit' })
      }
    }
    const selected = selectedRelease.records[recordType].filter((record) => record.id > afterId && Object.entries(filters).every(([field, value]) => record[field] === value))
    const items = selected.slice(0, limit)
    let page = {
      page_contract: 'factory-records-v1',
      release: selectedRelease.release,
      record_type: recordType,
      filters,
      sort: 'id:asc',
      limit,
      items,
      next_cursor: selected.length > limit ? encodeCursor({ ...identity, after_id: items.at(-1).id }, secret) : null
    }
    page = options.transformPage?.(recordType, page, request.query, releaseId) ?? page
    return sendCanonical(reply, page)
  })

  app.get('/api/factory/v1/diff', async (request, reply) => {
    if (request.query.base_release_id !== DATA_PLANE_BASELINE_RELEASE_ID || request.query.candidate_release_id !== DATA_PLANE_CANDIDATE_RELEASE_ID) return reply.status(404).send({ detail: 'Unknown factory release pair' })
    const value = options.transformDiff?.(structuredClone(exactDiff)) ?? exactDiff
    return sendCanonical(reply, value, value.diff_digest)
  })

  return app
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const app = await buildFactoryFixtureServer()
  const port = Number(process.env.PORT ?? 8010)
  await app.listen({ host: '127.0.0.1', port })
}
