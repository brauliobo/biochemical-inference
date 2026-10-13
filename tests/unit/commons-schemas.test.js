import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  boundedIdentifierSchema,
  ChebiIdSchema,
  CoercedNonNegativeIntSchema,
  CursorSchema,
  DecimalTextSchema,
  FactoryRecordTypeSchema,
  FiniteNumberSchema,
  HumanMouseTaxonSchema,
  isCanonicalBase64Url,
  IsoDateSchema,
  JsonValueSchema,
  KebabIdSchema,
  NcbiTaxonIdSchema,
  NonEmptyStringSchema,
  NonNegativeIntSchema,
  OffsetDatetimeSchema,
  PageLimitSchema,
  pageLimitQuerySchema,
  pinnedCatalogEntrySchema,
  pinnedReleaseRefSchema,
  PositiveIntSchema,
  prefixedIdSchema,
  PubMedOrUniProtIdSchema,
  releaseItemsEnvelopeSchema,
  releaseRefSchema,
  ReleaseIdSchema,
  RheaIdSchema,
  SemverSchema,
  Sha256DigestSchema,
  Sha256HexSchema,
  ShortIdentifierSchema,
  SourceIdSchema,
  StrictEmptyObjectSchema,
  UniProtIdSchema,
  UtcDatetimeSchema,
  UtcInstantSchema
} from '../../shared/commons/schemas.js'

const HEX = 'a'.repeat(64)

function expectAccepts(schema, values) {
  for (const value of values) expect(schema.safeParse(value).success, `should accept ${JSON.stringify(value)}`).toBe(true)
}

function expectRejects(schema, values) {
  for (const value of values) expect(schema.safeParse(value).success, `should reject ${JSON.stringify(value)}`).toBe(false)
}

describe('commons digests and instants', () => {
  it('Sha256HexSchema accepts only 64 lowercase hex characters', () => {
    expectAccepts(Sha256HexSchema, [HEX, '0123456789abcdef'.repeat(4)])
    expectRejects(Sha256HexSchema, ['A'.repeat(64), 'a'.repeat(63), 'a'.repeat(65), `sha256:${HEX}`, `${HEX}\n`, '', 1, null])
  })

  it('Sha256DigestSchema requires the sha256: prefix', () => {
    expectAccepts(Sha256DigestSchema, [`sha256:${HEX}`])
    expectRejects(Sha256DigestSchema, [HEX, `SHA256:${HEX}`, `sha256:${'a'.repeat(63)}`, `sha256:${'g'.repeat(64)}`, `sha256: ${HEX}`])
  })

  it('UtcInstantSchema requires second precision and a Z suffix', () => {
    expectAccepts(UtcInstantSchema, ['2026-07-17T20:28:35Z'])
    expectRejects(UtcInstantSchema, ['2026-07-17T20:28:35.000Z', '2026-07-17T20:28:35+00:00', '2026-07-17', '2026-07-17 20:28:35Z', '2026-07-17T20:28Z'])
  })

  it('IsoDateSchema is a plain calendar-date shape', () => {
    expectAccepts(IsoDateSchema, ['2026-07-17', '0001-01-01'])
    expectRejects(IsoDateSchema, ['2026-7-17', '2026-07-17T00:00:00Z', '17-07-2026', ''])
  })

  it('datetime helpers keep zod semantics', () => {
    expectAccepts(OffsetDatetimeSchema, ['2026-07-17T20:28:35Z', '2026-07-17T20:28:35+02:00', '2026-07-17T20:28:35.123Z'])
    expectRejects(OffsetDatetimeSchema, ['2026-07-17', 'not-a-date'])
    expectAccepts(UtcDatetimeSchema, ['2026-07-17T20:28:35Z'])
    expectRejects(UtcDatetimeSchema, ['2026-07-17T20:28:35+02:00'])
  })
})

describe('commons identifiers', () => {
  it('SemverSchema accepts dotted numeric triples only', () => {
    expectAccepts(SemverSchema, ['1.0.0', '10.20.300'])
    expectRejects(SemverSchema, ['1.0', '1.0.0.0', 'v1.0.0', '1.0.0-beta', '1.0.x'])
  })

  it('KebabIdSchema is lowercase alphanumerics joined by single hyphens', () => {
    expectAccepts(KebabIdSchema, ['a', 'goal11-release-2026', '0abc-1'])
    expectRejects(KebabIdSchema, ['-a', 'a-', 'a--b', 'A-b', 'a_b', ''])
  })

  it('ReleaseIdSchema ends in a -vX.Y.Z version', () => {
    expectAccepts(ReleaseIdSchema, ['apap-liver-benchmark-v1.0.0', 'x-v0.0.1'])
    expectRejects(ReleaseIdSchema, ['apap-liver-benchmark-1.0.0', 'apap-liver-benchmark-v1.0', 'Apap-v1.0.0', 'v1.0.0'])
  })

  it('SourceIdSchema is an upper-case token with underscores', () => {
    expectAccepts(SourceIdSchema, ['CHEBI', 'NCBI_TAXONOMY', 'A1'])
    expectRejects(SourceIdSchema, ['chebi', '_A', '1A', 'A-B', ''])
  })

  it('DecimalTextSchema accepts canonical decimal text up to 64 characters', () => {
    expectAccepts(DecimalTextSchema, ['0', '-1', '12.5', '-0.001', '100'])
    expectRejects(DecimalTextSchema, ['01', '1.', '.5', '1e3', '+1', '', `1${'0'.repeat(64)}`])
  })

  it('boundedIdentifierSchema enforces the supplied length cap', () => {
    const schema = boundedIdentifierSchema(10)
    expectAccepts(schema, ['a', 'abc:def', 'a.b-c'])
    expectRejects(schema, ['', 'A', '1a', 'abcdefghijk', 'a:', 'a::b'])
  })

  it('ShortIdentifierSchema caps at 64 characters', () => {
    expectAccepts(ShortIdentifierSchema, ['A', `a${'b'.repeat(63)}`, 'Mixed_Case.id-1'])
    expectRejects(ShortIdentifierSchema, ['', '1a', `a${'b'.repeat(64)}`, 'a b'])
  })

  it('CURIE helpers match their namespace grammar', () => {
    expectAccepts(NcbiTaxonIdSchema, ['NCBITaxon:9606'])
    expectRejects(NcbiTaxonIdSchema, ['NCBITaxon:0', 'NCBITaxon:01', 'NCBITaxon:', 'ncbitaxon:9606'])
    expectAccepts(ChebiIdSchema, ['CHEBI:15636'])
    expectRejects(ChebiIdSchema, ['CHEBI:0', 'CHEBI:abc', 'CHEBI:1 '])
    expectAccepts(RheaIdSchema, ['RHEA:19819'])
    expectRejects(RheaIdSchema, ['RHEA:0', 'RHEA:', 'MODEL:MAT'])
    expectAccepts(UniProtIdSchema, ['UniProtKB:P42898'])
    expectRejects(UniProtIdSchema, ['UniProtKB:p42898', 'UniProtKB:', 'UniProt:P42898'])
    expectAccepts(PubMedOrUniProtIdSchema, ['PubMed:123', 'UniProtKB:P42898'])
    expectRejects(PubMedOrUniProtIdSchema, ['PubMed:0', 'PubMed:123 UniProtKB:P1', 'PMID:1'])
  })

  it('prefixedIdSchema anchors both ends', () => {
    const schema = prefixedIdSchema('LICENSE', '[A-Z0-9.-]+')
    expectAccepts(schema, ['LICENSE:CC-BY-4.0'])
    expectRejects(schema, ['LICENSE:', 'XLICENSE:A', 'LICENSE:a', 'LICENSE:A B'])
  })

  it('enumerations list exactly their members', () => {
    expectAccepts(HumanMouseTaxonSchema, ['NCBITaxon:9606', 'NCBITaxon:10090'])
    expectRejects(HumanMouseTaxonSchema, ['NCBITaxon:7227', 9606])
    expectAccepts(FactoryRecordTypeSchema, ['taxa', 'compounds', 'reactions', 'proteins', 'references', 'catalysis', 'limitations'])
    expectRejects(FactoryRecordTypeSchema, ['taxon', 'Taxa', ''])
  })
})

describe('commons numbers and strings', () => {
  it('number primitives enforce sign, integrality and finiteness', () => {
    expectAccepts(NonNegativeIntSchema, [0, 1, 1e9])
    expectRejects(NonNegativeIntSchema, [-1, 0.5, NaN, Infinity, '1'])
    expectAccepts(PositiveIntSchema, [1, 42])
    expectRejects(PositiveIntSchema, [0, -1, 1.5, '1'])
    expectAccepts(FiniteNumberSchema, [0, -1.5, 1e300])
    expectRejects(FiniteNumberSchema, [NaN, Infinity, -Infinity, '1'])
  })

  it('NonEmptyStringSchema rejects only the empty string', () => {
    expectAccepts(NonEmptyStringSchema, ['a', ' '])
    expectRejects(NonEmptyStringSchema, ['', null, 1])
  })

  it('StrictEmptyObjectSchema rejects extra keys', () => {
    expectAccepts(StrictEmptyObjectSchema, [{}])
    expectRejects(StrictEmptyObjectSchema, [{ a: 1 }, [], null, 'x'])
  })

  it('JsonValueSchema accepts nested finite JSON and rejects non-JSON values', () => {
    expectAccepts(JsonValueSchema, [null, true, 'x', 1, [1, [2, { a: null }]], { a: { b: [1, 'c'] } }])
    expectRejects(JsonValueSchema, [NaN, Infinity, undefined, [undefined], { a: Infinity }, () => 1])
  })
})

describe('commons pagination', () => {
  it('PageLimitSchema is 1..100', () => {
    expectAccepts(PageLimitSchema, [1, 100])
    expectRejects(PageLimitSchema, [0, 101, 1.5, '5'])
  })

  it('CursorSchema is URL-safe base64 text up to 8192 characters', () => {
    expectAccepts(CursorSchema, ['abc_-123', 'a'.repeat(8192)])
    expectRejects(CursorSchema, ['', 'a b', 'a=', 'a'.repeat(8193), 'a/b'])
  })

  it('pageLimitQuerySchema coerces, bounds and defaults', () => {
    const schema = pageLimitQuerySchema(25)
    expect(schema.parse(undefined)).toBe(25)
    expect(schema.parse('7')).toBe(7)
    expectRejects(schema, ['0', '101', '1.5', 'abc'])
    const wide = pageLimitQuerySchema(50, 200)
    expect(wide.parse('200')).toBe(200)
    expectRejects(wide, ['201'])
  })

  it('CoercedNonNegativeIntSchema parses numeric strings', () => {
    expect(CoercedNonNegativeIntSchema.parse('0')).toBe(0)
    expect(CoercedNonNegativeIntSchema.parse('12')).toBe(12)
    expectRejects(CoercedNonNegativeIntSchema, ['-1', '1.5', 'x'])
  })
})

describe('commons canonical base64url', () => {
  it('requires exact length and zero trailing bits', () => {
    // 32 bytes -> 43 chars, last char must carry two zero bits (index % 4 === 0)
    expect(isCanonicalBase64Url('A'.repeat(43), 32)).toBe(true)
    expect(isCanonicalBase64Url(`${'A'.repeat(42)}B`, 32)).toBe(false)
    expect(isCanonicalBase64Url('A'.repeat(42), 32)).toBe(false)
    // 64 bytes -> 86 chars, last char index % 16 === 0
    expect(isCanonicalBase64Url('A'.repeat(86), 64)).toBe(true)
    expect(isCanonicalBase64Url(`${'A'.repeat(85)}B`, 64)).toBe(false)
    // 3-byte multiples have no trailing bits
    expect(isCanonicalBase64Url('AAAA', 3)).toBe(true)
  })

  it('rejects padding, foreign characters and non-strings', () => {
    expect(isCanonicalBase64Url(`${'A'.repeat(42)}=`, 32)).toBe(false)
    expect(isCanonicalBase64Url(`${'A'.repeat(42)}+`, 32)).toBe(false)
    expect(isCanonicalBase64Url(null, 32)).toBe(false)
    expect(isCanonicalBase64Url(undefined, 32)).toBe(false)
  })
})

describe('commons release builders', () => {
  const digest = 'b'.repeat(64)

  it('releaseRefSchema is strict and composes the supplied id and digest schemas', () => {
    const schema = releaseRefSchema(ReleaseIdSchema, '2.0.0', Sha256HexSchema)
    expectAccepts(schema, [{ id: 'x-v1.0.0', schema_version: '2.0.0', digest }])
    expectRejects(schema, [
      { id: 'x-v1.0.0', schema_version: '1.0.0', digest },
      { id: 'x', schema_version: '2.0.0', digest },
      { id: 'x-v1.0.0', schema_version: '2.0.0', digest: 'sha256:' + digest },
      { id: 'x-v1.0.0', schema_version: '2.0.0', digest, extra: true },
      { id: 'x-v1.0.0', schema_version: '2.0.0' }
    ])
  })

  it('pinnedReleaseRefSchema accepts only the pinned literals', () => {
    const schema = pinnedReleaseRefSchema('demo-v1.0.0', '1.0.0', digest)
    expectAccepts(schema, [{ id: 'demo-v1.0.0', schema_version: '1.0.0', digest }])
    expectRejects(schema, [
      { id: 'demo-v1.0.1', schema_version: '1.0.0', digest },
      { id: 'demo-v1.0.0', schema_version: '1.0.1', digest },
      { id: 'demo-v1.0.0', schema_version: '1.0.0', digest: 'c'.repeat(64) }
    ])
  })

  it('pinnedCatalogEntrySchema pins the manifest path to the release id', () => {
    const schema = pinnedCatalogEntrySchema({ releaseId: 'demo-v1.0.0', schemaVersion: '1.0.0', releaseDigest: digest, title: NonEmptyStringSchema })
    const entry = { release_id: 'demo-v1.0.0', title: 'Demo', schema_version: '1.0.0', release_digest: digest, manifest_path: 'demo-v1.0.0/manifest.json' }
    expectAccepts(schema, [entry])
    expectRejects(schema, [
      { ...entry, title: '' },
      { ...entry, manifest_path: 'other/manifest.json' },
      { ...entry, release_digest: 'c'.repeat(64) },
      { ...entry, extra: 1 }
    ])
    const literalTitle = pinnedCatalogEntrySchema({ releaseId: 'demo-v1.0.0', schemaVersion: '1.0.0', releaseDigest: digest, title: z.literal('Demo') })
    expectAccepts(literalTitle, [entry])
    expectRejects(literalTitle, [{ ...entry, title: 'Other' }])
  })

  it('releaseItemsEnvelopeSchema wraps a release and a typed item list', () => {
    const release = pinnedReleaseRefSchema('demo-v1.0.0', '1.0.0', digest)
    const schema = releaseItemsEnvelopeSchema(release, z.object({ id: z.string() }).strict())
    const ref = { id: 'demo-v1.0.0', schema_version: '1.0.0', digest }
    expectAccepts(schema, [{ release: ref, items: [] }, { release: ref, items: [{ id: 'a' }] }])
    expectRejects(schema, [{ release: ref, items: [{ id: 1 }] }, { release: ref }, { items: [] }, { release: ref, items: [], extra: true }])
  })
})
