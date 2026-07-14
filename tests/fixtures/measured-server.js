import { createHash } from 'node:crypto'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { canonicalJson } from '../../shared/canonical-json.js'
import { ConsumerCommitmentSchema, EvaluationRequestSchema } from '../../shared/measured-contracts.js'

const root = resolve(dirname(fileURLToPath(import.meta.url)), 'measured/public')
const index = JSON.parse(await readFile(resolve(root, 'index.json'), 'utf8'))
const port = Number(process.env.PORT ?? 8011)
const allowedOrigin = process.env.MEASURED_FIXTURE_ALLOWED_ORIGIN ?? 'http://127.0.0.1:5173'
const csrf = process.env.MEASURED_FIXTURE_CSRF ?? 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
const requests = []
const commitments = new Map()
const nonces = new Map()
const disclosures = new Map()

const release = { digest: '6a1f81b41d89e52d666e38a26943955ed3fdb008adb7ae23bb2c353abc0cd496', id: 'measured-apap-observation-commons-v1.0.1', schema_version: '1.0.0' }
const partition = { closure_digest: 'f3e7c59a1ff0cb3fe4fd7c9712711ed88ea682482af109e8a239f9dd2afc39b6', family_ids: ['family:zenodo:7648975'], id: 'partition:external-held-out:zenodo7648975', role: 'external-held-out', study_ids: ['study:zenodo:7648975'] }
const heldout = [
  ['c', '2.63', '2.63', 'ab', '0.04'],
  ['d200', '2.74', '2.74', 'a', '0.05'],
  ['d250', '2.700', '2.7', 'a', '0.06'],
  ['prc-d200', '2.57', '2.57', 'ab', '0.04'],
  ['prc-d250', '2.49', '2.49', 'b', '0.05'],
  ['prc', '2.47', '2.47', 'b', '0.05']
].map(([group, reported, normalized, annotation, sem]) => ({
  family_id: 'family:zenodo:7648975',
  group_id: `group:zenodo7648975:${group}`,
  measurement_id: `measurement:zenodo7648975:${group}:gsh`,
  normalized: { scientific_origin: 'derived-measurement', transformation_id: 'transformation:mmol-g-identity', unit: 'mmol/g', value: normalized },
  observable_id: 'observable:renal-gsh',
  reported_annotations: [annotation],
  reported_unit: 'mmol/g',
  reported_value: reported,
  study_id: 'study:zenodo:7648975',
  uncertainty: { id: `uncertainty:zenodo7648975:${group}:gsh`, kind: 'sem', measurement_id: `measurement:zenodo7648975:${group}:gsh`, n: 6, unit: 'mmol/g', value: sem }
}))

const sha256 = (value) => createHash('sha256').update(value).digest('hex')
const timestamp = () => new Date().toISOString().replace(/\.[0-9]{3}Z$/, 'Z')

function send(res, status, body, headers = {}) {
  const bytes = Buffer.isBuffer(body) ? body : Buffer.from(canonicalJson(body))
  res.writeHead(status, { 'content-type': 'application/json', 'content-length': bytes.length, ...headers })
  res.end(bytes)
}

function privateSend(res, status, body) {
  send(res, status, body, { 'cache-control': 'private, no-store', pragma: 'no-cache', 'x-release-digest': release.digest })
}

async function body(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > 64 * 1024) throw new Error('body too large')
    chunks.push(chunk)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`)
  const key = `${url.pathname}${url.search}`
  requests.push({ method: request.method, path: key })
  if (request.method === 'GET' && url.pathname === '/__requests') return send(response, 200, { requests })
  if (request.method === 'GET' && index[key]) {
    const bytes = await readFile(resolve(root, index[key]))
    const releaseBound = url.pathname.includes(`/releases/${release.id}`)
    return send(response, 200, bytes, {
      'cache-control': releaseBound ? 'public, max-age=31536000, immutable' : 'public, max-age=60',
      etag: `"sha256:${sha256(bytes)}"`,
      ...(releaseBound ? { 'x-release-digest': release.digest } : {})
    })
  }
  if (request.method === 'GET' && url.searchParams.has('cursor')) return send(response, 422, { detail: 'cursor is bound to a different measured release, query, sort, or limit' })
  const protectedRoute = url.pathname.endsWith('/commitments') || url.pathname.endsWith('/evaluation')
  if (protectedRoute && (request.headers.origin !== allowedOrigin || request.headers['x-csrf-token'] !== csrf)) return privateSend(response, 403, { detail: 'origin or CSRF validation failed' })
  try {
    if (request.method === 'POST' && url.pathname.endsWith('/commitments')) {
      const parsed = ConsumerCommitmentSchema.safeParse(await body(request))
      if (!parsed.success) return privateSend(response, 422, { detail: 'invalid strict commitment' })
      const value = parsed.data
      if (value.release_id !== release.id || value.release_digest !== release.digest || value.target_partition_id !== partition.id || value.target_partition_digest !== partition.closure_digest || value.target_partition_role !== partition.role || canonicalJson(value.family_ids) !== canonicalJson(partition.family_ids) || canonicalJson(value.observable_ids) !== canonicalJson(['observable:renal-gsh'])) return privateSend(response, 409, { detail: 'commitment selection mismatch' })
      const encoded = canonicalJson(value)
      const digest = sha256(encoded)
      const nonceKey = `${value.consumer_id}\0${value.nonce}`
      const existingDigest = nonces.get(nonceKey)
      if (existingDigest && existingDigest !== digest) return privateSend(response, 409, { detail: 'consumer nonce is already bound to a different commitment' })
      if (!commitments.has(digest)) commitments.set(digest, { encoded, committedAt: timestamp() })
      nonces.set(nonceKey, digest)
      const stored = commitments.get(digest)
      return privateSend(response, 200, { commitment_contract: 'consumer-measured-commitment-v1', commitment_digest: digest, committed_at: stored.committedAt, created_at: value.created_at, target_partition_digest: partition.closure_digest })
    }
    if (request.method === 'POST' && url.pathname.endsWith('/evaluation')) {
      const parsed = EvaluationRequestSchema.safeParse(await body(request))
      if (!parsed.success) return privateSend(response, 422, { detail: 'invalid strict evaluation' })
      const value = parsed.data
      const encoded = canonicalJson(value.frozen_request)
      if (sha256(encoded) !== value.commitment_digest || commitments.get(value.commitment_digest)?.encoded !== encoded) return privateSend(response, 409, { detail: 'evaluation does not match a persisted frozen commitment' })
      const requestDigest = sha256(canonicalJson(value))
      const existing = disclosures.get(value.commitment_digest)
      if (existing && existing.requestDigest !== requestDigest) return privateSend(response, 409, { detail: 'commitment was disclosed for a different evaluation request' })
      if (!existing) disclosures.set(value.commitment_digest, { requestDigest, disclosedAt: timestamp() })
      return privateSend(response, 200, { commitment_digest: value.commitment_digest, disclosed_at: disclosures.get(value.commitment_digest).disclosedAt, evaluation_contract: 'consumer-measured-disclosure-v1', items: heldout, partition, release })
    }
  } catch {
    return privateSend(response, 422, { detail: 'invalid protected request' })
  }
  send(response, 404, { detail: 'not found' })
}).listen(port, '127.0.0.1')
