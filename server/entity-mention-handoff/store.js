import { canonicalJson } from '../../shared/canonical-json.js'
import { EntityMentionStoredImportSchema } from '../../shared/entity-mention-handoff-contracts.js'
import { createDataPlaneObjectStore } from '../data-plane/object-store.js'
import { ENTITY_MENTION_HANDOFF_PINS } from './pins.js'
import { parseBoundedJson } from './bounded-json.js'
import { entityMentionSha256, verifyEntityMentionHandoffBundle, verifyStoredEntityMentionClosure } from './verification.js'

const separation = Object.freeze({
  producer_facts: 'entity-records/entities.json and entity-records/edges.json',
  article_mentions: 'entity-records/articles.json, entity-records/mentions.json, and entity-records/mention_resolutions.json',
  machine_assertions: 'entity-records/text_assertions.json and entity-records/model_provenance.json',
  consumer_inputs: 'derived-only; not a producer record',
  simulation_outputs: 'not present in imported closure'
})

function importDigest(value) {
  return `sha256:${entityMentionSha256(Buffer.from(canonicalJson(value)))}`
}

function verifiedReleaseIdentity(verified) {
  return {
    id:                    verified.manifest.release.id,
    manifest_sha256:       entityMentionSha256(verified.manifestBytes ?? verified.files.get('manifest.json')),
    entity_release_id:     verified.entityEnvelope.release_id,
    entity_release_digest: verified.entityEnvelope.release_digest
  }
}

export async function importEntityMentionHandoff({ releaseRoot, handoffPath, signaturePath = null, storeRoot, pins = ENTITY_MENTION_HANDOFF_PINS, limits, hooks }) {
  if (!storeRoot) throw new TypeError('A consumer store root is required.')
  const verified = await verifyEntityMentionHandoffBundle({ releaseRoot, handoffPath, signaturePath, pins, limits })
  const objects = await createDataPlaneObjectStore(storeRoot, hooks)
  try {
  const files = []
  for (const [path, bytes] of [...verified.files].sort(([left], [right]) => left.localeCompare(right))) {
    const stored = await objects.put(bytes)
    files.push({ path, object: { sha256: stored.digest, bytes: stored.bytes } })
  }
  const handoffObject = await objects.put(verified.handoffBytes)
  const signatureObject = verified.signatureBytes ? await objects.put(verified.signatureBytes) : null
  const record = EntityMentionStoredImportSchema.parse({
    schema: 'entity-mention-handoff-consumer-import/v1',
    trust: verified.trust,
    release: verifiedReleaseIdentity(verified),
    handoff: { id: verified.handoff.id, object: { sha256: handoffObject.digest, bytes: handoffObject.bytes } },
    signature: signatureObject ? { sha256: signatureObject.digest, bytes: signatureObject.bytes } : null,
    files,
    required_paths: Object.keys(pins.requiredFiles).sort(),
    separation
  })
  const importId = importDigest(record)
  const rootObject = await objects.put(Buffer.from(canonicalJson(record)))
  if (`sha256:${rootObject.digest}` !== importId) throw new Error('Stored import root identity is inconsistent.')
  return { importId, trust: record.trust, handoffId: record.handoff.id, release: record.release, storedObjectCount: files.length + 2 + Number(Boolean(signatureObject)) }
  } finally { await objects.close() }
}

export async function reopenEntityMentionHandoff({ storeRoot, importId, pins = ENTITY_MENTION_HANDOFF_PINS }) {
  if (!/^sha256:[a-f0-9]{64}$/.test(importId)) throw new TypeError('Import ID must be a content-addressed SHA-256 identity.')
  const objects = await createDataPlaneObjectStore(storeRoot)
  try {
  const rootBytes = await objects.get(importId.slice('sha256:'.length))
  let value
  try { value = parseBoundedJson(rootBytes, undefined, 'Stored import root') } catch { throw new Error('Stored import root is not bounded JSON.') }
  if (canonicalJson(value) !== rootBytes.toString('utf8') || importDigest(value) !== importId) throw new Error('Stored import root canonical identity is invalid.')
  const record = EntityMentionStoredImportSchema.parse(value)
  const files = new Map()
  for (const file of record.files) {
    const bytes = await objects.get(file.object.sha256, file.object.bytes)
    files.set(file.path, bytes)
  }
  const handoffBytes = await objects.get(record.handoff.object.sha256, record.handoff.object.bytes)
  const signatureBytes = record.signature ? await objects.get(record.signature.sha256, record.signature.bytes) : null
  if ((record.trust === 'workspace-local-signed') !== Boolean(signatureBytes) || (record.trust === 'official-pages-signed') !== files.has('envelope.json')) throw new Error('Stored trust label and signature closure disagree.')
  if (canonicalJson(record.required_paths) !== canonicalJson(Object.keys(pins.requiredFiles).sort())) throw new Error('Stored required-path closure disagrees with independent pins.')
  const verified = verifyStoredEntityMentionClosure(files, handoffBytes, signatureBytes, pins)
  const release = verifiedReleaseIdentity({ ...verified, files })
  if (canonicalJson(record.release) !== canonicalJson(release)) throw new Error('Stored import-root release identity disagrees with its verified closure.')
  if (record.trust !== verified.trust) throw new Error('Stored import-root trust identity disagrees with its verified closure.')
  if (verified.handoff.id !== record.handoff.id) throw new Error('Stored import-root handoff identity disagrees with its verified closure.')
  if (canonicalJson(record.separation) !== canonicalJson(separation)) throw new Error('Stored import-root trust-boundary identifiers are invalid.')
  return { importId, record, release, ...verified }
  } finally { await objects.close() }
}
