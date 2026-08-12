import { mkdir, mkdtemp, readFile, rename, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { canonicalJson } from '../../shared/canonical-json.js'
import { createDataPlaneObjectStore } from '../../server/data-plane/object-store.js'
import { createImportedMthfrSimulationSpecification, simulateImportedMthfr } from '../../server/entity-mention-handoff/simulation-specification.js'
import { importEntityMentionHandoff, reopenEntityMentionHandoff } from '../../server/entity-mention-handoff/store.js'
import { parseBoundedJson } from '../../server/entity-mention-handoff/bounded-json.js'
import { verifyEntityMentionHandoffBundle } from '../../server/entity-mention-handoff/verification.js'
import { extractProducerEntityMentionHandoffFixture, writeLocalSyntheticReviewedDispositionFixture } from '../fixtures/entity-mention-handoff.js'

const roots = []
afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))))

async function fixture(options) {
  const root = await mkdtemp(resolve(tmpdir(), 'entity-mention-consumer-'))
  roots.push(root)
  return { root, ...await (options?.producer ? extractProducerEntityMentionHandoffFixture(root) : writeLocalSyntheticReviewedDispositionFixture(root, options)) }
}

async function imported(options) {
  const value = await fixture(options)
  const storeRoot = resolve(value.root, 'store')
  const result = await importEntityMentionHandoff({ releaseRoot: value.releaseRoot, handoffPath: value.handoffPath, signaturePath: value.signaturePath, storeRoot, pins: value.pins })
  return { ...value, storeRoot, result, reopened: await reopenEntityMentionHandoff({ storeRoot, importId: result.importId, pins: value.pins }) }
}

async function storeMutatedImportRoot(storeRoot, record, mutate) {
  const value = structuredClone(record)
  mutate(value)
  const objects = await createDataPlaneObjectStore(storeRoot)
  try {
    const stored = await objects.put(Buffer.from(canonicalJson(value)))
    return `sha256:${stored.digest}`
  } finally { await objects.close() }
}

describe('independent Entity Mention Atlas handoff consumer', () => {
  // Full-tree verification hashes and validates all 1,699 transport files; 30s is the measured gate budget, not a retry or fallback.
  const REAL_RELEASE_CONSUMER_TIMEOUT_MS = 30_000
  it('bounds JSON depth, nodes, strings, keys, fields, arrays, and duplicate keys before decoding', () => {
    const limits = { maximumArrayLength: 2, maximumDepth: 2, maximumKeyBytes: 3, maximumNodes: 5, maximumObjectFields: 2, maximumStringBytes: 3 }
    expect(parseBoundedJson('{"abc":[1,2]}', limits)).toEqual({ abc: [1, 2] })
    expect(() => parseBoundedJson('[[[]]]', limits)).toThrow(/nesting-depth/)
    expect(() => parseBoundedJson('[1,2,3]', limits)).toThrow(/element bound/)
    expect(() => parseBoundedJson('[1,2,[]]', { ...limits, maximumArrayLength: 3, maximumNodes: 3 })).toThrow(/node bound/)
    expect(() => parseBoundedJson('{"abcd":1}', limits)).toThrow(/key exceeds/)
    expect(() => parseBoundedJson('{"a":"abcd"}', limits)).toThrow(/string exceeds/)
    expect(() => parseBoundedJson('{"a":1,"b":2,"c":3}', limits)).toThrow(/field bound/)
    expect(() => parseBoundedJson('{"a":1,"a":2}', limits)).toThrow(/duplicate key/)
    expect(() => parseBoundedJson(Buffer.from([0xff]), limits)).toThrow()
  })

  it('rejects the actual release and retained unauthorized handoff under production pins', async () => {
    const value = await fixture({ producer: true })
    await expect(verifyEntityMentionHandoffBundle({ releaseRoot: value.releaseRoot, handoffPath: value.handoffPath, pins: value.pins })).rejects.toThrow(/canonical byte|Handoff release binding|External legal blocker/i)
  }, REAL_RELEASE_CONSUMER_TIMEOUT_MS)

  it('verifies self-contained local signatures only on the explicit synthetic reviewed-disposition fixture', async () => {
    const local = await fixture({ signed: true })
    expect(local.fixtureKind).toBe('local-synthetic-reviewed-rights-disposition')
    await expect(verifyEntityMentionHandoffBundle({ releaseRoot: local.releaseRoot, handoffPath: local.handoffPath, signaturePath: local.signaturePath, pins: local.pins })).resolves.toMatchObject({ trust: 'workspace-local-signed' })
    const storeRoot = resolve(local.root, 'signed-store')
    const stored = await importEntityMentionHandoff({ releaseRoot: local.releaseRoot, handoffPath: local.handoffPath, signaturePath: local.signaturePath, storeRoot, pins: local.pins })
    await expect(reopenEntityMentionHandoff({ storeRoot, importId: stored.importId, pins: local.pins })).resolves.toMatchObject({ record: { trust: 'workspace-local-signed' }, signature: { official: false } })
    const official = await fixture({ signed: true, official: true })
    await expect(verifyEntityMentionHandoffBundle({ releaseRoot: official.releaseRoot, handoffPath: official.handoffPath, signaturePath: official.signaturePath, pins: official.pins })).rejects.toThrow(/strict contract|Official trust/)
  })

  it('accepts only the synthetic signed-tree envelope extra under an explicitly supplied independent test pin', async () => {
    const signed = await fixture({ pagesEnvelope: true })
    await expect(verifyEntityMentionHandoffBundle({ releaseRoot: signed.releaseRoot, handoffPath: signed.handoffPath, pins: signed.pins })).resolves.toMatchObject({ trust: 'official-pages-signed' })
    const storeRoot = resolve(signed.root, 'official-store')
    const stored = await importEntityMentionHandoff({ releaseRoot: signed.releaseRoot, handoffPath: signed.handoffPath, storeRoot, pins: signed.pins })
    await expect(reopenEntityMentionHandoff({ storeRoot, importId: stored.importId, pins: signed.pins })).resolves.toMatchObject({ trust: 'official-pages-signed', pagesEnvelope: { artifact_kind: 'nutrient-reaction-pages-manifest-signature' } })

    const unpinned = await fixture({ pagesEnvelope: true, unpinnedPagesEnvelope: true })
    await expect(verifyEntityMentionHandoffBundle({ releaseRoot: unpinned.releaseRoot, handoffPath: unpinned.handoffPath, pins: unpinned.pins })).rejects.toThrow(/Unsupported official trust/)

    const tampered = await fixture({ pagesEnvelope: true })
    const envelopePath = resolve(tampered.releaseRoot, 'envelope.json')
    const envelope = JSON.parse(await readFile(envelopePath, 'utf8'))
    envelope.signature = `${envelope.signature[0] === 'A' ? 'B' : 'A'}${envelope.signature.slice(1)}`
    await writeFile(envelopePath, canonicalJson(envelope))
    await expect(verifyEntityMentionHandoffBundle({ releaseRoot: tampered.releaseRoot, handoffPath: tampered.handoffPath, pins: tampered.pins })).rejects.toThrow(/signature verification failed/)
  })

  it('rejects canonical, digest, closed-tree, and signature tampering', async () => {
    const noncanonical = await fixture()
    const handoff = JSON.parse(await readFile(noncanonical.handoffPath, 'utf8'))
    await writeFile(noncanonical.handoffPath, `${JSON.stringify(handoff, null, 2)}\n`)
    await expect(verifyEntityMentionHandoffBundle({ releaseRoot: noncanonical.releaseRoot, handoffPath: noncanonical.handoffPath, pins: noncanonical.pins })).rejects.toThrow(/canonical byte/)

    const digest = await fixture()
    const entitiesPath = resolve(digest.releaseRoot, 'entity-records/entities.json')
    const bytes = await readFile(entitiesPath); bytes[0] ^= 1; await writeFile(entitiesPath, bytes)
    await expect(verifyEntityMentionHandoffBundle({ releaseRoot: digest.releaseRoot, handoffPath: digest.handoffPath, pins: digest.pins })).rejects.toThrow(/transport closure/)

    const extra = await fixture()
    await writeFile(resolve(extra.releaseRoot, 'extra.json'), '{}')
    await expect(verifyEntityMentionHandoffBundle({ releaseRoot: extra.releaseRoot, handoffPath: extra.handoffPath, pins: extra.pins })).rejects.toThrow(/inventory/)

    const signed = await fixture({ signed: true })
    const signature = JSON.parse(await readFile(signed.signaturePath, 'utf8')); signature.signature = `${'A'.repeat(86)}==`; await writeFile(signed.signaturePath, JSON.stringify(signature))
    await expect(verifyEntityMentionHandoffBundle({ releaseRoot: signed.releaseRoot, handoffPath: signed.handoffPath, signaturePath: signed.signaturePath, pins: signed.pins })).rejects.toThrow(/verification failed/)
  })

  it('enforces traversal, file-count, and byte bounds before import', async () => {
    const traversal = await fixture()
    await symlink('/tmp', resolve(traversal.releaseRoot, 'unsafe'))
    await expect(verifyEntityMentionHandoffBundle({ releaseRoot: traversal.releaseRoot, handoffPath: traversal.handoffPath, pins: traversal.pins })).rejects.toThrow(/symbolic link|Unsafe/)
    const bounded = await fixture()
    await expect(verifyEntityMentionHandoffBundle({ releaseRoot: bounded.releaseRoot, handoffPath: bounded.handoffPath, pins: bounded.pins, limits: { files: 2, depth: 3, manifestBytes: 1024 * 1024, handoffBytes: 1024 * 1024, signatureBytes: 1024, fileBytes: 1024 * 1024, contentBytes: 1024 * 1024, totalTransportBytes: 1024 * 1024, totalContentBytes: 1024 * 1024 } })).rejects.toThrow(/file-count/)
  })

  it('rejects descriptor and aggregate record-count drift even under local mutation pins', async () => {
    const descriptor = await fixture({ invalidRecordCount: true })
    await expect(verifyEntityMentionHandoffBundle({ releaseRoot: descriptor.releaseRoot, handoffPath: descriptor.handoffPath, pins: descriptor.pins })).rejects.toThrow(/record count/)
    const aggregate = await fixture({ invalidAggregateCount: true })
    await expect(verifyEntityMentionHandoffBundle({ releaseRoot: aggregate.releaseRoot, handoffPath: aggregate.handoffPath, pins: aggregate.pins })).rejects.toThrow(/count closure/)
  })

  it.each([
    ['nonempty gzip type index', 'entity-index-reaction.json.gz', 'remove'],
    ['zero gzip type index', 'entity-index-assay.json.gz', 'add'],
    ['nonempty plain linked projection', 'entity-linked-sources.json', 'remove'],
    ['zero plain linked projection', 'entity-linked-facets.json', 'add']
  ])('rejects a consistent same-lie mutation in both manifests for %s', async (_label, path, operation) => {
    const value = await fixture({ projectionMutation: { path, operation } })
    await expect(verifyEntityMentionHandoffBundle({ releaseRoot: value.releaseRoot, handoffPath: value.handoffPath, pins: value.pins })).rejects.toThrow(/static count verification|exact canonical|selected identities/)
  })

  it('fails closed when the named release root is replaced after descriptor pinning', async () => {
    const value = await fixture()
    const moved = resolve(value.root, 'release-pinned')
    const attacker = resolve(value.root, 'attacker')
    await mkdir(attacker)
    await expect(verifyEntityMentionHandoffBundle({
      releaseRoot: value.releaseRoot,
      handoffPath: value.handoffPath,
      pins: value.pins,
      hooks: { afterInventory: async () => {
        await rename(value.releaseRoot, moved)
        await symlink(attacker, value.releaseRoot)
      } }
    })).rejects.toThrow(/symbolic links|no longer identifies/)
    expect((await readFile(resolve(moved, 'manifest.json'))).length).toBeGreaterThan(0)
    expect(await readFile(resolve(attacker, 'manifest.json')).catch((error) => error.code)).toBe('ENOENT')
  })

  it.each([
    [{ trustedAssertion: true }, /Machine assertions/],
    [{ restrictedRights: true }, /not redistributable/],
    [{ withoutReviewedDisposition: true }, /External legal blocker/],
    [{ missingRights: true }, /Missing selected rights/],
    [{ unresolvedIdentity: true }, /exact candidate|strict contract|participant identity/],
    [{ contextualDiseaseMention: true }, /mentions were resolved/],
    [{ conclusionEligible: true }, /Machine assertions/],
    [{ coMention: true, coMentionAsEvidence: true }, /strict contract|trusted simulation evidence/],
    [{ omitUnknowns: true }, /strict contract/],
    [{ omitLimitation: true }, /limitation closure/],
    [{ promoteBroad: true }, /Broad-discovery/]
  ])('rejects ineligible epistemic, rights, unknown, limitation, and broad-discovery state %#', async (options, message) => {
    const value = await fixture(options)
    await expect(verifyEntityMentionHandoffBundle({ releaseRoot: value.releaseRoot, handoffPath: value.handoffPath, pins: value.pins })).rejects.toThrow(message)
  })

  it('stores and reopens the explicit local synthetic reviewed-disposition closure', async () => {
    const value = await imported()
    const first = createImportedMthfrSimulationSpecification(value.reopened)
    const secondReopen = await reopenEntityMentionHandoff({ storeRoot: value.storeRoot, importId: value.result.importId, pins: value.pins })
    const second = createImportedMthfrSimulationSpecification(secondReopen)
    expect(second).toEqual(first)
    expect(first.artifactId).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(value.reopened.record.files).toHaveLength(value.manifest.files.length + 1)
    expect(JSON.stringify(value.reopened.record)).not.toContain(value.root)
    expect(first.provenance).toMatchObject({ trustedKnowledgeEligible: false, canSupportBiologicalConclusion: false, automaticPromotion: false, sourceDeclaredUnknowns: ['disease', 'drug', 'pathogen'] })
  }, 30_000)

  it('binds each duplicated stored-root release and trust identifier to the fully verified closure', async () => {
    const value = await imported()
    const mutations = [
      ['release id', (record) => { record.release.id += '-mutated' }],
      ['manifest digest', (record) => { record.release.manifest_sha256 = '0'.repeat(64) }],
      ['entity release id', (record) => { record.release.entity_release_id += '-mutated' }],
      ['entity release digest', (record) => { record.release.entity_release_digest = '0'.repeat(64) }],
      ['trust label', (record) => { record.trust = 'workspace-local-signed' }],
      ['handoff id', (record) => { record.handoff.id = `sha256:${'0'.repeat(64)}` }],
      ['required path closure', (record) => { record.required_paths.pop() }],
      ['trust-boundary identity', (record) => { record.separation.consumer_inputs = 'mutated' }]
    ]
    for (const [label, mutate] of mutations) {
      const importId = await storeMutatedImportRoot(value.storeRoot, value.reopened.record, mutate)
      await expect(reopenEntityMentionHandoff({ storeRoot: value.storeRoot, importId, pins: value.pins }), label).rejects.toThrow(/release identity|trust label|trust identity|handoff identity|required-path|Invalid literal/)
    }
    expect(value.reopened.release).toEqual({
      id: value.reopened.manifest.release.id,
      manifest_sha256: value.pins.servingManifestSha256,
      entity_release_id: value.reopened.entityEnvelope.release_id,
      entity_release_digest: value.reopened.entityEnvelope.release_digest
    })
  }, 30_000)

  it('uses only explicit RHEA identity for the local synthetic reviewed-disposition simulation', async () => {
    const value = await imported()
    const request = { preset: 'baseline', mthfrActivity: 1, durationHours: 1, stepHours: 0.05 }
    const artifact = simulateImportedMthfr(request, value.reopened)
    expect(artifact.input.numericalMapping).toMatchObject({ modelReactionId: 'RHEA:19819', mapping: 'explicit-identity', omittedExplicitParticipants: ['CHEBI:15378', 'CHEBI:57783', 'CHEBI:58349'] })
    expect(artifact.output.status).toBe('successful')
    expect(artifact.output).not.toHaveProperty('producerFacts')
    expect(artifact.artifactId).toMatch(/^sha256:[a-f0-9]{64}$/)
    expect(artifact.output.release.id).toBe(value.reopened.manifest.release.id)
    expect(artifact.output.taxonId).toBe(9606)
    expect(artifact.output.proteinAssociations).toEqual([expect.objectContaining({ id: 'UniProtKB:P42898', taxonId: 9606 })])
    expect(simulateImportedMthfr(request, value.reopened)).toEqual(artifact)
    expect(() => simulateImportedMthfr({ ...request, releaseId: 'override' }, value.reopened)).toThrow(/numerical intent only/)
    expect(() => simulateImportedMthfr({ ...request, taxonId: 10090 }, value.reopened)).toThrow(/numerical intent only/)
    expect(() => simulateImportedMthfr({ ...request, tissueId: 'UBERON:override' }, value.reopened)).toThrow(/numerical intent only/)
    expect(() => simulateImportedMthfr({ ...request, network: {} }, value.reopened)).toThrow(/numerical intent only/)
  }, 30_000)

  it('uses CAS no-replace semantics when a destination object appears concurrently', async () => {
    const value = await fixture()
    const storeRoot = resolve(value.root, 'race-store')
    let injected = false
    const result = await importEntityMentionHandoff({
      releaseRoot: value.releaseRoot, handoffPath: value.handoffPath, storeRoot, pins: value.pins,
      hooks: { beforePublish: async ({ destination, staged }) => {
        if (injected) return
        injected = true
        await mkdir(resolve(destination, '..'), { recursive: true })
        await writeFile(destination, await readFile(staged), { flag: 'wx' })
      } }
    })
    await expect(reopenEntityMentionHandoff({ storeRoot, importId: result.importId, pins: value.pins })).resolves.toMatchObject({ importId: result.importId })
  })
})
