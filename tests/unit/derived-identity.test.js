import { beforeAll, describe, expect, it } from 'vitest'
import { createApapFixtureClient } from '../../server/apap/fixture.js'
import { createApapRunService } from '../../server/apap/service.js'
import { buildApapDerivedBundle, verifyDerivedBundle } from '../../server/derived/bundle.js'
import { canonicalDigest, canonicalJson } from '../../shared/canonical-json.js'

let record
let submission
let mouseSubmission

beforeAll(async () => {
  record = await createApapRunService(createApapFixtureClient()).create({})
  submission = buildApapDerivedBundle(record)
  const mouse = await createApapRunService(createApapFixtureClient()).create({ contextId: 'CONTEXT:APAP-MOUSE-LIVER', protocolId: 'PROTOCOL:APAP-MOUSE-TOXIC-DOSE' })
  mouseSubmission = buildApapDerivedBundle(mouse)
}, 30_000)

describe('RFC 8785 canonical JSON identity', () => {
  it('matches the database producer cross-language fixture', () => {
    const value = { b: 1.0, a: ['µ', true, null], nested: { z: 1e-7, y: -0.0 } }

    expect(canonicalJson(value)).toBe('{"a":["µ",true,null],"b":1,"nested":{"y":0,"z":1e-7}}')
    expect(canonicalDigest(value)).toBe('sha256:315657b82bc168a991a715920757e3ee7fa33e99003b1b2750aa61b66c4edcae')
  })

  it('rejects values outside the RFC 8785 JSON domain', () => {
    expect(() => canonicalJson({ value: Number.NaN })).toThrow(/finite/)
    expect(() => canonicalJson({ value: 2 ** 60 })).toThrow(/safe integer/)
    expect(() => canonicalJson({ value: undefined })).toThrow(/does not support/)
    expect(() => canonicalJson('\ud800')).toThrow(/unpaired surrogate/)
  })
})

describe('APAP reviewed-derived bundle', () => {
  it('closes model, exact protocol, canonical result, context, uncertainty, and limitations', () => {
    const assertion = submission.bundle.assertions[0].assertion
    const dependencyTypes = new Set(assertion.dependencies.map((item) => item.type))

    expect(submission.bundle.objects.map((item) => item.kind)).toEqual(['model', 'artifact', 'artifact'])
    expect(dependencyTypes).toEqual(new Set(['release', 'model', 'artifact']))
    expect(assertion.classification).toBe('predicted')
    expect(assertion.context).toMatchObject({ taxon_id: 'NCBITaxon:9606', tissue_id: 'UBERON:0002107', cell_type_id: 'CL:0000182', biological_sex: 'unknown', route: 'oral' })
    expect(assertion.applicability.status).toBe('bounded')
    expect(assertion.uncertainty.components.map((item) => item.category)).toEqual(['biological', 'measurement', 'structural', 'contextual', 'numerical'])
    expect(assertion.uncertainty.components.every((item) => item.representation === 'qualitative')).toBe(true)
    expect(assertion.limitations.some((item) => item.includes('explicitly synthetic and unsupported'))).toBe(true)
    expect(submission.bundle.objects.find((item) => item.object_id.includes('protocol')).content.specification).toEqual(record.specification)
    expect(() => verifyDerivedBundle(submission)).not.toThrow()
  })

  it('preserves the complete separate mouse context without taxon transfer', () => {
    const context = mouseSubmission.bundle.assertions[0].assertion.context

    expect(context).toMatchObject({ taxon_id: 'NCBITaxon:10090', tissue_id: 'UBERON:0002107', cell_type_id: 'CL:0000182', biological_sex: 'male', strain: 'C57BL/6J', route: 'intraperitoneal' })
    expect(context.dose).toMatchObject({ value: 300, unit: { id: 'milligram-per-kilogram', symbol: 'mg/kg', scale_to_si: 1e-6 } })
    expect(mouseSubmission.bundle.assertions[0].assertion.applicability.exclusions).toContain('No clinical, diagnostic, treatment, population-PK, measured toxicology, or cross-species interpretation.')
  })

  it.each(['object', 'assertion', 'bundle'])('rejects a changed %s digest before submission', (target) => {
    const changed = structuredClone(submission)
    if (target === 'object') changed.bundle.objects[0].digest = `sha256:${'0'.repeat(64)}`
    if (target === 'assertion') changed.bundle.assertions[0].digest = `sha256:${'1'.repeat(64)}`
    if (target === 'bundle') changed.digest = `sha256:${'2'.repeat(64)}`

    expect(() => verifyDerivedBundle(changed)).toThrow()
  })

  it.each([
    ['kind', (object) => { object.kind = 'transform' }],
    ['object ID', (object) => { object.object_id = 'substituted-model' }],
    ['version', (object) => { object.version = '9.9.9' }]
  ])('rejects a digest-matching object with a substituted dependency %s', (_label, mutate) => {
    const changed = structuredClone(submission)
    mutate(changed.bundle.objects[0])
    changed.digest = canonicalDigest(changed.bundle)

    expect(() => verifyDerivedBundle(changed)).toThrow(/dependency identity/)
  })
})
