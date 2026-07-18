import { createHash, createPublicKey, verify as verifyCrypto } from 'node:crypto'
import { TextDecoder } from 'node:util'
import { canonicalJson } from '../../shared/canonical-json.js'
import {
  CHALLENGE_API_VIEW_SPECS,
  CHALLENGE_CATALOG_DIGEST,
  CHALLENGE_ENVELOPE_DIGEST,
  CHALLENGE_ENDPOINT_IDS,
  CHALLENGE_MANIFEST_DIGEST,
  CHALLENGE_PARTITION_DIGEST,
  CHALLENGE_PUBLIC_RECORD_SCHEMAS,
  CHALLENGE_RELEASE_DIGEST,
  CHALLENGE_RELEASE_ID,
  CHALLENGE_SAMPLING_GRID_DIGEST,
  CHALLENGE_SAMPLING_LABELS,
  CHALLENGE_SIGNER_KEY_ID,
  CHALLENGE_TRUST_DIGEST,
  ChallengeCatalogSchema,
  ChallengeDiscoverySchema,
  ChallengeEnvelopeSchema,
  ChallengeManifestSchema,
  ChallengeDisclosureResponseSchema,
  ChallengePublicPageSchema,
  ChallengeReleaseResponseSchema,
  ChallengeTrustResponseSchema
} from '../../shared/challenge-contracts.js'

export const MAX_CHALLENGE_METADATA_BYTES = 8 * 1024 * 1024
export const MAX_CHALLENGE_PAGE_BYTES = 2 * 1024 * 1024
const utf8 = new TextDecoder('utf-8', { fatal: true })
const PARTITION_RECORD_TYPES = Object.freeze(['sources', 'rights', 'source_facts', 'studies', 'protocols', 'endpoints', 'mappings', 'metrics', 'thresholds', 'exclusions', 'not_evaluable', 'observations'])

export class ChallengeVerificationError extends Error {
  constructor(message, options = {}) {
    super(message)
    this.name = 'ChallengeVerificationError'
    this.code = options.code ?? 'CHALLENGE_VERIFICATION_FAILED'
    this.statusCode = options.statusCode ?? 409
  }
}

export function challengeSha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function challengeDigest(value) {
  return challengeSha256(Buffer.from(canonicalJson(value)))
}

export function canonicalChallengeNdjson(items) {
  return Buffer.from(items.map((item) => `${canonicalJson(item)}\n`).join(''))
}

export function parseChallengeCanonical(bytes, schema, label, expectedDigest) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > MAX_CHALLENGE_METADATA_BYTES) throw new ChallengeVerificationError(`${label} exceeds its bounded canonical JSON contract.`)
  if (expectedDigest && challengeSha256(bytes) !== expectedDigest) throw new ChallengeVerificationError(`${label} does not match its independent SHA-256 pin.`)
  let text
  let value
  try {
    text = utf8.decode(bytes)
    value = JSON.parse(text)
  } catch {
    throw new ChallengeVerificationError(`${label} is not strict UTF-8 JSON.`)
  }
  let canonical
  try {
    canonical = canonicalJson(value)
  } catch {
    throw new ChallengeVerificationError(`${label} cannot be RFC 8785 canonical JSON.`)
  }
  if (canonical !== text) throw new ChallengeVerificationError(`${label} is not RFC 8785 canonical JSON.`)
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new ChallengeVerificationError(`${label} does not match the strict Goal 13 contract.`)
  return parsed.data
}

function strictBase64Url(value, bytes, label) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]+$/.test(value) || value.includes('=')) throw new ChallengeVerificationError(`${label} is not strict unpadded base64url.`)
  const decoded = Buffer.from(value, 'base64url')
  if (decoded.length !== bytes || decoded.toString('base64url') !== value) throw new ChallengeVerificationError(`${label} has an invalid canonical encoding.`)
  return decoded
}

export function verifyChallengeSignature(payload, signature, trust) {
  const key = trust.keys.find((candidate) => candidate.key_id === signature.key_id)
  if (!key || key.key_id !== CHALLENGE_SIGNER_KEY_ID || key.status !== 'retired') throw new ChallengeVerificationError('Goal 13 signature does not use the independently pinned publication key.')
  const signedDate = signature.signed_at.slice(0, 10)
  if (signedDate < key.valid_from || signedDate > key.valid_until) throw new ChallengeVerificationError('Goal 13 signature falls outside the publication key interval.')
  const publicKey = strictBase64Url(key.public_key, 32, 'Goal 13 public key')
  const signatureBytes = strictBase64Url(signature.value, 64, 'Goal 13 signature')
  const spki = Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), publicKey])
  const message = Buffer.from(canonicalJson({ payload, algorithm: signature.algorithm, key_id: signature.key_id, signed_at: signature.signed_at }))
  let valid = false
  try {
    valid = verifyCrypto(null, message, createPublicKey({ key: spki, format: 'der', type: 'spki' }), signatureBytes)
  } catch {
    valid = false
  }
  if (!valid) throw new ChallengeVerificationError('Goal 13 Ed25519 signature is invalid.')
  return key
}

function manifestDescriptors() {
  return CHALLENGE_API_VIEW_SPECS.map((spec) => ({
    root_schema_version: 'challenge-api-items-rfc8785-v1',
    view_id: spec.viewId,
    endpoint: `/api/challenges/v1/releases/${CHALLENGE_RELEASE_ID}/${spec.recordType}`,
    record_type: spec.recordType,
    sort: 'id:asc',
    count: spec.count,
    root_sha256: spec.root
  }))
}

function verifyManifest(manifest) {
  const identity = { ...manifest }
  delete identity.release_digest
  if (challengeDigest(identity) !== CHALLENGE_RELEASE_DIGEST) throw new ChallengeVerificationError('Goal 13 manifest release identity is invalid.')
  if (canonicalJson(manifest.api_views) !== canonicalJson(manifestDescriptors())) throw new ChallengeVerificationError('Goal 13 manifest does not contain the exact independently pinned public roots.')
  const recordTypes = manifest.files.map((item) => item.record_type)
  if (new Set(recordTypes).size !== 13 || !recordTypes.includes('observations') || manifest.files.some((item) => item.path !== `records/${item.record_type}.ndjson` || manifest.record_counts[item.record_type] !== item.record_count)) throw new ChallengeVerificationError('Goal 13 manifest file/count closure is invalid.')
  return manifest
}

export function challengeViewRoot(recordType, items) {
  return {
    root_schema_version: 'challenge-api-items-rfc8785-v1',
    endpoint: `/api/challenges/v1/releases/${CHALLENGE_RELEASE_ID}/${recordType}`,
    record_type: recordType,
    sort: 'id:asc',
    count: items.length,
    items
  }
}

function parseRecordClosure(records) {
  const parsed = {}
  for (const spec of CHALLENGE_API_VIEW_SPECS) {
    const values = records[spec.recordType]
    if (!Array.isArray(values) || values.length !== spec.count) throw new ChallengeVerificationError(`Goal 13 ${spec.recordType} public closure count is invalid.`)
    parsed[spec.recordType] = values.map((item) => {
      const result = CHALLENGE_PUBLIC_RECORD_SCHEMAS[spec.recordType].safeParse(item)
      if (!result.success) throw new ChallengeVerificationError(`Goal 13 ${spec.recordType} record does not match its strict contract.`)
      return result.data
    })
    const identifiers = parsed[spec.recordType].map((item) => item.id)
    if (identifiers.some((id, index) => index > 0 && id <= identifiers[index - 1])) throw new ChallengeVerificationError(`Goal 13 ${spec.recordType} records are not uniquely ordered.`)
    if (challengeDigest(challengeViewRoot(spec.recordType, parsed[spec.recordType])) !== spec.root) throw new ChallengeVerificationError(`Goal 13 independently pinned ${spec.viewId} root failed.`)
  }
  if (Object.keys(records).length !== CHALLENGE_API_VIEW_SPECS.length) throw new ChallengeVerificationError('Goal 13 public record closure is incomplete or excessive.')
  const protocol = parsed.protocols[0]
  if (protocol.sampling_grid_digest !== CHALLENGE_SAMPLING_GRID_DIGEST || challengeDigest({ unit: 'published-clock-label', times: [...CHALLENGE_SAMPLING_LABELS] }) !== CHALLENGE_SAMPLING_GRID_DIGEST) throw new ChallengeVerificationError('Goal 13 exact protocol sampling-grid root failed.')
  const publicText = canonicalJson(parsed)
  if (publicText.includes('"observations"') || publicText.includes('"normalized_value"') || publicText.includes('"reported_value"')) throw new ChallengeVerificationError('Goal 13 public closure exposed a held-out outcome field.')
  return parsed
}

export function verifyChallengeBundle(value) {
  const discovery = ChallengeDiscoverySchema.parse(value.discovery)
  const trustResponse = ChallengeTrustResponseSchema.parse(value.trustResponse)
  const catalog = ChallengeCatalogSchema.parse(value.catalog)
  const releaseResponse = ChallengeReleaseResponseSchema.parse(value.releaseResponse)
  const envelope = ChallengeEnvelopeSchema.parse(value.envelope)
  if (challengeDigest(trustResponse.trust) !== CHALLENGE_TRUST_DIGEST) throw new ChallengeVerificationError('Goal 13 trust document does not match its independent pin.')
  if (challengeDigest(catalog) !== CHALLENGE_CATALOG_DIGEST) throw new ChallengeVerificationError('Goal 13 catalog does not match its independent pin.')
  verifyChallengeSignature(catalog.payload, catalog.signature, trustResponse.trust)
  const manifest = verifyManifest(releaseResponse.manifest)
  if (challengeDigest(manifest) !== CHALLENGE_MANIFEST_DIGEST || challengeDigest(envelope) !== CHALLENGE_ENVELOPE_DIGEST) throw new ChallengeVerificationError('Goal 13 manifest or envelope does not match its independent pin.')
  verifyChallengeSignature(envelope.payload, envelope.signature, trustResponse.trust)
  if (envelope.payload.source_lock_sha256 !== manifest.source_lock_sha256 || envelope.payload.recipe_sha256 !== manifest.recipe_sha256) throw new ChallengeVerificationError('Goal 13 envelope does not bind the source and recipe roots.')
  const records = parseRecordClosure(value.records)
  return { discovery, trustResponse, catalog, releaseResponse, envelope, records }
}

export function verifyChallengeDiscovery(bytes) {
  return parseChallengeCanonical(bytes, ChallengeDiscoverySchema, 'Goal 13 discovery')
}

export function verifyChallengeTrust(bytes) {
  const response = parseChallengeCanonical(bytes, ChallengeTrustResponseSchema, 'Goal 13 trust response')
  if (challengeDigest(response.trust) !== CHALLENGE_TRUST_DIGEST) throw new ChallengeVerificationError('Goal 13 trust response does not match its independent pin.')
  return response
}

export function verifyChallengeCatalog(bytes, trust) {
  const catalog = parseChallengeCanonical(bytes, ChallengeCatalogSchema, 'Goal 13 catalog', CHALLENGE_CATALOG_DIGEST)
  verifyChallengeSignature(catalog.payload, catalog.signature, trust)
  return catalog
}

export function verifyChallengeRelease(bytes) {
  const response = parseChallengeCanonical(bytes, ChallengeReleaseResponseSchema, 'Goal 13 release response')
  verifyManifest(parseChallengeCanonical(Buffer.from(canonicalJson(response.manifest)), ChallengeManifestSchema, 'Goal 13 manifest', CHALLENGE_MANIFEST_DIGEST))
  return response
}

export function verifyChallengeEnvelope(bytes, trust, manifest) {
  const envelope = parseChallengeCanonical(bytes, ChallengeEnvelopeSchema, 'Goal 13 envelope', CHALLENGE_ENVELOPE_DIGEST)
  verifyChallengeSignature(envelope.payload, envelope.signature, trust)
  if (envelope.payload.source_lock_sha256 !== manifest.source_lock_sha256 || envelope.payload.recipe_sha256 !== manifest.recipe_sha256) throw new ChallengeVerificationError('Goal 13 envelope source closure is invalid.')
  return envelope
}

export function verifyChallengePage(bytes, spec) {
  const page = parseChallengeCanonical(bytes, ChallengePublicPageSchema, `Goal 13 ${spec.recordType} page`)
  if (page.record_type !== spec.recordType || page.limit !== 100 || page.next_cursor !== null || page.items.length !== spec.count) throw new ChallengeVerificationError(`Goal 13 ${spec.recordType} page binding is invalid.`)
  return page.items
}

function decimalShiftThousand(value) {
  const [integer, fraction = ''] = value.split('.')
  const digits = `${integer}${fraction}`.padStart(fraction.length + 4, '0')
  const point = digits.length - fraction.length - 3
  return `${digits.slice(0, point)}.${digits.slice(point)}`.replace(/^0+(?=[0-9])/, '').replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1')
}

export function challengeObservationDescriptor(bundle) {
  const descriptors = bundle.releaseResponse.manifest.files.filter((item) => item.record_type === 'observations')
  if (descriptors.length !== 1) throw new ChallengeVerificationError('Goal 13 signed manifest must contain exactly one observations descriptor.')
  return descriptors[0]
}

export function verifyChallengeDisclosureClosure(bundle, input, request) {
  const response = ChallengeDisclosureResponseSchema.parse(input)
  if (request.commitment_digest !== challengeDigest(request.frozen_commitment) || response.commitment_digest !== request.commitment_digest) throw new ChallengeVerificationError('Goal 13 disclosure does not bind the exact frozen commitment.')
  const disclosureBase = { ...response }
  delete disclosureBase.disclosure_digest
  if (challengeDigest(disclosureBase) !== response.disclosure_digest) throw new ChallengeVerificationError('Goal 13 disclosure digest is invalid.')

  const partition = bundle.records.partitions[0]
  const identifiers = response.observations.map((item) => item.id)
  const endpointIds = response.observations.map((item) => item.endpoint_id)
  if (canonicalJson(identifiers) !== canonicalJson(partition.observation_ids) || canonicalJson(endpointIds) !== canonicalJson(CHALLENGE_ENDPOINT_IDS)) throw new ChallengeVerificationError('Goal 13 disclosure observation identity or order differs from the signed partition.')
  for (const observation of response.observations) {
    if (Number(observation.normalized_value) <= 0 || decimalShiftThousand(observation.reported_value) !== observation.normalized_value) throw new ChallengeVerificationError('Goal 13 disclosure contains an invalid exact unit normalization.')
  }

  const descriptor = challengeObservationDescriptor(bundle)
  const ndjson = canonicalChallengeNdjson(response.observations)
  if (descriptor.path !== 'records/observations.ndjson' || descriptor.record_count !== response.observations.length || descriptor.bytes !== ndjson.length || descriptor.sha256 !== challengeSha256(ndjson)) throw new ChallengeVerificationError('Goal 13 disclosed observations do not match the signed canonical NDJSON descriptor.')
  const closureRecords = Object.fromEntries(PARTITION_RECORD_TYPES.map((kind) => [kind, kind === 'observations' ? response.observations : bundle.records[kind]]))
  const closureDigest = challengeDigest({ role: 'external-held-out', records: closureRecords })
  if (partition.closure_digest !== CHALLENGE_PARTITION_DIGEST || closureDigest !== partition.closure_digest) throw new ChallengeVerificationError('Goal 13 disclosed observations do not reproduce the exact producer partition closure.')
  return {
    response,
    verification: {
      observation_count: response.observations.length,
      observations_ndjson_bytes: ndjson.length,
      observations_ndjson_sha256: challengeSha256(ndjson),
      partition_closure_digest: closureDigest,
      producer_builder_algorithm: 'sha256-rfc8785({role:"external-held-out",records:{all-record-types-except-partitions}})'
    }
  }
}
