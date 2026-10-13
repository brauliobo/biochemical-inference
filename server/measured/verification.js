import { canonicalJson } from '../../shared/canonical-json.js'
import { canonicalSha256Hex, sha256Hex } from '../commons/digest.js'
import { defineProblemError } from '../commons/errors.js'
import { parseCanonicalBytes, verifyEd25519Signature } from '../commons/verification.js'
import {
  MEASURED_API_VIEW_SPECS,
  MEASURED_BASELINE_ENVELOPE_DIGEST,
  MEASURED_BASELINE_MANIFEST_DIGEST,
  MEASURED_BASELINE_RELEASE_DIGEST,
  MEASURED_BASELINE_RELEASE_ID,
  MEASURED_BASELINE_SIGNER_KEY_ID,
  MEASURED_BASELINE_SIGNER_PUBLIC_KEY,
  MEASURED_CATALOG_DIGEST,
  MEASURED_ENVELOPE_DIGEST,
  MEASURED_MANIFEST_DIGEST,
  MEASURED_RELEASE_DIGEST,
  MEASURED_RELEASE_ID,
  MEASURED_SIGNER_KEY_ID,
  MEASURED_SIGNER_PUBLIC_KEY,
  MEASURED_SELECTED_LINEAGE_IDS,
  MEASURED_SELECTED_LINEAGE_ROOT,
  MEASURED_TRUST_DIGEST,
  MeasuredCatalogSchema,
  MeasuredDiscoverySchema,
  MeasuredEnvelopeSchema,
  MeasuredLineageResponseSchema,
  MeasuredManifestSchema,
  MeasuredPageSchema,
  MeasuredReleaseResponseSchema,
  MeasuredTrustResponseSchema
} from '../../shared/measured-contracts.js'

export const MAX_MEASURED_METADATA_BYTES = 8 * 1024 * 1024
export const MAX_MEASURED_PAGE_BYTES = 2 * 1024 * 1024
export const MEASURED_PAGE_LIMIT = 100

export const MeasuredVerificationError = defineProblemError('MeasuredVerificationError', { statusCode: 409, code: 'MEASURED_VERIFICATION_FAILED' })

export function parseMeasuredCanonical(bytes, schema, label, expectedDigest) {
  return parseCanonicalBytes(bytes, schema, label, { ErrorClass: MeasuredVerificationError, maxBytes: MAX_MEASURED_METADATA_BYTES, expectedDigest, contract: 'measured' })
}

export function verifyMeasuredSignature(payload, signature, trust) {
  const key = trust.keys.find((candidate) => candidate.key_id === signature.key_id)
  if (!key) throw new MeasuredVerificationError(`Unknown measured signing key: ${signature.key_id}.`)
  if (key.status === 'revoked' || !['active', 'retired'].includes(key.status)) throw new MeasuredVerificationError(`Measured signing key is not trusted: ${signature.key_id}.`)
  const signedDate = signature.signed_at.slice(0, 10)
  if (signedDate < key.valid_from || (key.valid_until !== null && signedDate > key.valid_until)) throw new MeasuredVerificationError(`Measured signing key ${key.key_id} is outside its validity interval.`)
  verifyEd25519Signature({
    payload,
    signature,
    publicKey: key.public_key,
    ErrorClass: MeasuredVerificationError,
    labels: { publicKey: `Measured public key ${key.key_id}`, signature: `Measured signature ${key.key_id}` },
    invalidMessage: `Invalid measured Ed25519 signature for ${key.key_id}.`
  })
  return key
}

export function verifyMeasuredTrust(bytes) {
  const response = parseMeasuredCanonical(bytes, MeasuredTrustResponseSchema, 'Measured trust response')
  const trustBytes = Buffer.from(canonicalJson(response.trust))
  if (response.trust_digest !== MEASURED_TRUST_DIGEST || sha256Hex(trustBytes) !== MEASURED_TRUST_DIGEST) throw new MeasuredVerificationError('Measured trust response does not match the independent trust pin.')
  if (response.trust.keys.length !== 2) throw new MeasuredVerificationError('Measured trust store has an unexpected key closure.')
  const [baseline, key] = response.trust.keys
  if (baseline.key_id !== MEASURED_BASELINE_SIGNER_KEY_ID || baseline.public_key !== MEASURED_BASELINE_SIGNER_PUBLIC_KEY || baseline.algorithm !== 'Ed25519' || baseline.status !== 'retired' || baseline.valid_from !== '2026-07-14' || baseline.valid_until !== '2026-07-14') throw new MeasuredVerificationError('Measured trust store does not preserve the independently pinned v1.0.0 publication key.')
  if (key.key_id !== MEASURED_SIGNER_KEY_ID || key.public_key !== MEASURED_SIGNER_PUBLIC_KEY || key.algorithm !== 'Ed25519' || key.status !== 'retired' || key.valid_from !== '2026-07-14' || key.valid_until !== '2026-07-14') throw new MeasuredVerificationError('Measured trust store does not contain the independently pinned v1.0.1 rotation key.')
  return { response, trust: response.trust, trustBytes }
}

export function verifyMeasuredDiscovery(bytes) {
  const value = parseMeasuredCanonical(bytes, MeasuredDiscoverySchema, 'Measured discovery')
  if (value.catalog_digest !== MEASURED_CATALOG_DIGEST || value.trust_digest !== MEASURED_TRUST_DIGEST || value.release_count !== 2) throw new MeasuredVerificationError('Measured discovery does not identify the pinned two-release closure.')
  if (!value.heldout_policy.includes('does not claim confidentiality')) throw new MeasuredVerificationError('Measured discovery omits the dataflow-isolation boundary.')
  return value
}

export function verifyMeasuredCatalog(bytes, trust) {
  const catalog = parseMeasuredCanonical(bytes, MeasuredCatalogSchema, 'Measured catalog', MEASURED_CATALOG_DIGEST)
  const key = verifyMeasuredSignature(catalog.payload, catalog.signature, trust)
  const [baseline, entry] = catalog.payload.releases
  if (catalog.payload.releases.length !== 2 || catalog.signature.key_id !== MEASURED_SIGNER_KEY_ID || !baseline || baseline.release_id !== MEASURED_BASELINE_RELEASE_ID || baseline.release_digest !== MEASURED_BASELINE_RELEASE_DIGEST || baseline.manifest_sha256 !== MEASURED_BASELINE_MANIFEST_DIGEST || baseline.envelope_sha256 !== MEASURED_BASELINE_ENVELOPE_DIGEST) throw new MeasuredVerificationError('Measured catalog does not preserve the immutable v1.0.0 baseline pins.')
  if (!entry || entry.release_id !== MEASURED_RELEASE_ID || entry.release_digest !== MEASURED_RELEASE_DIGEST || entry.manifest_sha256 !== MEASURED_MANIFEST_DIGEST || entry.envelope_sha256 !== MEASURED_ENVELOPE_DIGEST || canonicalJson(entry.record_counts) !== canonicalJson(baseline.record_counts)) throw new MeasuredVerificationError('Measured v1.0.1 catalog entry does not match all independent pins or baseline scientific counts.')
  return { catalog, baseline, entry, key }
}

export function verifyMeasuredRelease(bytes, entry) {
  const response = parseMeasuredCanonical(bytes, MeasuredReleaseResponseSchema, 'Measured release response')
  const manifestBytes = Buffer.from(canonicalJson(response.manifest))
  const manifest = parseMeasuredCanonical(manifestBytes, MeasuredManifestSchema, 'Measured manifest', MEASURED_MANIFEST_DIGEST)
  const digestValue = { ...manifest }
  delete digestValue.release_digest
  if (canonicalSha256Hex(digestValue) !== MEASURED_RELEASE_DIGEST) throw new MeasuredVerificationError('Measured manifest RFC 8785 release identity is invalid.')
  if (response.release.id !== MEASURED_RELEASE_ID || response.release.digest !== MEASURED_RELEASE_DIGEST || manifest.release_id !== response.release.id || manifest.release_digest !== response.release.digest || canonicalJson(manifest.record_counts) !== canonicalJson(entry.record_counts)) throw new MeasuredVerificationError('Measured release, manifest, and signed catalog disagree.')
  const types = manifest.files.map((file) => file.record_type)
  if (new Set(types).size !== types.length || manifest.files.some((file) => file.path !== `records/${file.record_type}.ndjson` || manifest.record_counts[file.record_type] !== file.record_count)) throw new MeasuredVerificationError('Measured manifest file/count closure is invalid.')
  const expectedViews = MEASURED_API_VIEW_SPECS.map((spec) => ({
    count: spec.count,
    endpoint: `/api/measured/v1/releases/${MEASURED_RELEASE_ID}/${spec.endpoint}`,
    query: spec.query,
    record_type: spec.recordType,
    root_schema_version: 'measured-api-items-rfc8785-v1',
    root_sha256: spec.root,
    sort: 'id:asc',
    view_id: spec.viewId
  }))
  if (canonicalJson(manifest.api_views) !== canonicalJson(expectedViews)) throw new MeasuredVerificationError('Measured manifest does not contain the exact ten independently pinned API-view descriptors.')
  if (canonicalJson(manifest.selected_lineage_view.measurement_ids) !== canonicalJson(MEASURED_SELECTED_LINEAGE_IDS) || manifest.selected_lineage_view.root_sha256 !== MEASURED_SELECTED_LINEAGE_ROOT) throw new MeasuredVerificationError('Measured manifest selected-lineage descriptor does not match the independent ID/root closure.')
  return { response, manifest, manifestBytes }
}

export function verifyMeasuredEnvelope(bytes, entry, manifest, trust) {
  const envelope = parseMeasuredCanonical(bytes, MeasuredEnvelopeSchema, 'Measured release envelope', MEASURED_ENVELOPE_DIGEST)
  const key = verifyMeasuredSignature(envelope.payload, envelope.signature, trust)
  if (envelope.signature.key_id !== MEASURED_SIGNER_KEY_ID || envelope.payload.release_id !== MEASURED_RELEASE_ID || envelope.payload.release_digest !== MEASURED_RELEASE_DIGEST || envelope.payload.manifest_sha256 !== MEASURED_MANIFEST_DIGEST || envelope.payload.manifest_sha256 !== entry.manifest_sha256 || envelope.payload.source_lock_sha256 !== manifest.source_lock_sha256 || envelope.payload.recipe_sha256 !== manifest.recipe_sha256) throw new MeasuredVerificationError('Measured envelope does not bind the pinned manifest and source closure.')
  return { envelope, key }
}

export function verifyMeasuredPage(bytes, expected) {
  const page = parseMeasuredCanonical(bytes, MeasuredPageSchema, `Measured ${expected.endpoint} page`)
  if (page.release.id !== MEASURED_RELEASE_ID || page.release.digest !== MEASURED_RELEASE_DIGEST || page.record_type !== expected.recordType || page.limit !== expected.limit || page.sort !== 'id:asc' || canonicalJson(page.query) !== canonicalJson(expected.query)) throw new MeasuredVerificationError(`Measured ${expected.endpoint} page query binding is invalid.`)
  if (page.items.length > expected.limit || (page.next_cursor !== null && page.items.length === 0)) throw new MeasuredVerificationError(`Measured ${expected.endpoint} page has an invalid continuation.`)
  return page
}

export function verifyMeasuredLineage(bytes, measurement) {
  const response = parseMeasuredCanonical(bytes, MeasuredLineageResponseSchema, `Measured lineage ${measurement.id}`)
  if (response.release.id !== MEASURED_RELEASE_ID || response.release.digest !== MEASURED_RELEASE_DIGEST || canonicalJson(response.lineage.measurement) !== canonicalJson(measurement) || !['development', 'calibration'].includes(response.lineage.measurement.role)) throw new MeasuredVerificationError(`Measured lineage ${measurement.id} does not bind the requested non-heldout measurement.`)
  return response
}

export function measuredApiViewRoot(spec, items) {
  const identifiers = items.map((item) => item.id)
  if (identifiers.length !== spec.count || identifiers.some((id, index) => index > 0 && id <= identifiers[index - 1])) throw new MeasuredVerificationError(`Signed measured view ${spec.viewId} has an invalid count, duplicate, or order.`)
  return {
    root_schema_version: 'measured-api-items-rfc8785-v1',
    endpoint: `/api/measured/v1/releases/${MEASURED_RELEASE_ID}/${spec.endpoint}`,
    record_type: spec.recordType,
    query: Object.fromEntries(Object.entries(spec.query).sort(([left], [right]) => left.localeCompare(right))),
    sort: 'id:asc',
    count: items.length,
    items
  }
}

export function verifyMeasuredSignedViews(manifest, traversals, lineages) {
  if (manifest.api_views.length !== 10 || traversals.size !== 10) throw new MeasuredVerificationError('Measured signed API-view closure is incomplete or excessive.')
  for (const spec of MEASURED_API_VIEW_SPECS) {
    const items = traversals.get(spec.viewId)
    if (!items) throw new MeasuredVerificationError(`Measured signed API view is missing: ${spec.viewId}.`)
    const root = measuredApiViewRoot(spec, items)
    const digest = canonicalSha256Hex(root)
    const descriptor = manifest.api_views.find((item) => item.view_id === spec.viewId)
    if (!descriptor || digest !== spec.root || digest !== descriptor.root_sha256) throw new MeasuredVerificationError(`Measured signed API root failed for ${spec.viewId}.`)
  }
  const ordered = [...lineages.entries()].sort(([left], [right]) => left.localeCompare(right))
  const ids = ordered.map(([id]) => id)
  if (canonicalJson(ids) !== canonicalJson(MEASURED_SELECTED_LINEAGE_IDS) || ordered.length !== 35) throw new MeasuredVerificationError('Measured selected lineage traversal does not contain the exact signed IDs and order.')
  const descriptor = manifest.selected_lineage_view
  const root = {
    root_schema_version: 'measured-selected-lineages-rfc8785-v1',
    endpoint_template: `/api/measured/v1/releases/${MEASURED_RELEASE_ID}/lineage/{measurement_id}`,
    selection: descriptor.selection,
    sort: 'measurement_id:asc',
    count: ordered.length,
    measurement_ids: ids,
    items: ordered.map(([measurement_id, item]) => ({ measurement_id, lineage: item.value }))
  }
  const digest = canonicalSha256Hex(root)
  if (digest !== MEASURED_SELECTED_LINEAGE_ROOT || digest !== descriptor.root_sha256) throw new MeasuredVerificationError('Measured selected-lineage signed root failed.')
  return { apiViews: 10, selectedLineages: 35, selectedLineageRoot: digest }
}
