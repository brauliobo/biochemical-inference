import { createHash, generateKeyPairSync, sign } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { canonicalDigest } from '../../shared/canonical-json.js'
import { BppManifestSchema, BppSignatureSchema } from '../../shared/physiology-contracts.js'
import { createPhysiologyClient } from '../../server/physiology/client.js'
import { createBppArchive, digestBuffer, validateBppPackage } from '../../server/physiology/package.js'
import { createReferencePackages, REFERENCE_KEY_ID, REFERENCE_PUBLIC_KEY_SPKI_BASE64, REFERENCE_PUBLISHER, unsignedReferenceDefinitions } from '../../server/physiology/reference.js'

const referenceTrust = (status = 'trusted') => ({ keyId: REFERENCE_KEY_ID, status, publisher: REFERENCE_PUBLISHER, publicKeySpkiBase64: REFERENCE_PUBLIC_KEY_SPKI_BASE64 })

function replaceAllBytes(buffer, source, replacement) {
  const result = Buffer.from(buffer)
  const from = Buffer.from(source)
  const to = Buffer.from(replacement)
  if (from.length !== to.length) throw new Error('replacement must preserve ZIP field lengths')
  let offset = 0
  while ((offset = result.indexOf(from, offset)) !== -1) {
    to.copy(result, offset)
    offset += to.length
  }
  return result
}

async function fixture() {
  const evidence = await createPhysiologyClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' }).evidence()
  const packages = await createReferencePackages(evidence)
  return { evidence, package: packages[0] }
}

describe('safe signed .bpp packages', () => {
  it('verifies deterministic Ed25519 signatures, canonical descriptors, evidence, and exact package digests', async () => {
    const { evidence, package: reference } = await fixture()
    const first = await validateBppPackage(reference.bytes, { evidence, trustKey: () => referenceTrust(), processSandboxAvailable: false, builtIn: true })
    const rebuilt = await createBppArchive(reference)

    expect(first.response).toMatchObject({ valid: true, installable: true, findings: [], package: { trust: { status: 'trusted' }, certification: { status: 'certified-conformant', scientificValidation: 'unsupported' } } })
    expect(first.response.package.packageDigest).toBe(digestBuffer(reference.bytes))
    expect(rebuilt).toEqual(reference.bytes)
  })

  it('rejects content and signature tampering, revoked trust, traversal, and oversized archives', async () => {
    const { evidence, package: reference } = await fixture()
    const tamperedModel = { ...reference.model, state: { ...reference.model.state, initial: 81 } }
    const tampered = await createBppArchive({ ...reference, model: tamperedModel })
    const contentResult = await validateBppPackage(tampered, { evidence, trustKey: () => referenceTrust(), processSandboxAvailable: false })
    const badSignature = await createBppArchive({ ...reference, signature: { ...reference.signature, signature: `A${reference.signature.signature.slice(1)}` } })
    const signatureResult = await validateBppPackage(badSignature, { evidence, trustKey: () => referenceTrust(), processSandboxAvailable: false })
    const revoked = await validateBppPackage(reference.bytes, { evidence, trustKey: () => referenceTrust('revoked'), processSandboxAvailable: false })
    const traversal = await validateBppPackage(replaceAllBytes(reference.bytes, 'model.json', '../evil.js'), { evidence, trustKey: () => referenceTrust(), processSandboxAvailable: false })
    const oversized = await validateBppPackage(Buffer.alloc(1_000_001), { evidence, trustKey: () => referenceTrust(), processSandboxAvailable: false })

    expect(contentResult.response.findings[0].code).toBe('content_digest_mismatch')
    expect(signatureResult.response.findings[0].code).toBe('signature_invalid')
    expect(revoked.response.findings[0].code).toBe('revoked_publisher')
    expect(traversal.response.findings[0].code).toMatch(/unsafe_path|invalid_zip/)
    expect(oversized.response.findings[0].code).toBe('archive_size')
  })

  it('recognizes a correctly signed process package but fails installation closed without Bubblewrap', async () => {
    const evidence = await createPhysiologyClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' }).evidence()
    const { privateKey, publicKey } = generateKeyPairSync('ed25519')
    const spki = publicKey.export({ format: 'der', type: 'spki' })
    const keyId = `ed25519:${createHash('sha256').update(spki).digest('hex').slice(0, 16)}`
    const definition = unsignedReferenceDefinitions(evidence, { keyId, algorithm: 'Ed25519' })[0]
    const process = Buffer.from("process.stdin.resume()\n")
    const manifest = BppManifestSchema.parse({
      ...definition.manifest,
      pluginKind: 'process',
      entrypoints: { ...definition.manifest.entrypoints, process: 'process/plugin.mjs' },
      contents: [...definition.manifest.contents, { path: 'process/plugin.mjs', sha256: digestBuffer(process).slice(7), bytes: process.length, mediaType: 'application/javascript' }]
    })
    const signedDigest = canonicalDigest(manifest)
    const signature = BppSignatureSchema.parse({ schemaVersion: '1.0.0', algorithm: 'Ed25519', keyId, signedDigest, signature: sign(null, Buffer.from(signedDigest), privateKey).toString('base64') })
    const archive = await createBppArchive({ ...definition, manifest, signature, process })
    const trust = { keyId, status: 'trusted', publisher: 'Ephemeral test publisher', publicKeySpkiBase64: spki.toString('base64') }
    const result = await validateBppPackage(archive, { evidence, trustKey: () => trust, processSandboxAvailable: false })

    expect(result.response).toMatchObject({ valid: true, installable: false, package: { manifest: { pluginKind: 'process' }, certification: { status: 'not-certified' } }, findings: [{ code: 'process_sandbox_unavailable' }] })
  })
})
