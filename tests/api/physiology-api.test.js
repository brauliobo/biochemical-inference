import { afterEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../server/app.js'
import { createPhysiologyClient } from '../../server/physiology/client.js'
import { createReferencePackages } from '../../server/physiology/reference.js'
import { PhysiologyCouplingSchema, PhysiologyEvidenceSchema, PhysiologyRunSchema } from '../../shared/physiology-contracts.js'

let app
afterEach(async () => app?.close())

const mutationHeaders = { origin: 'http://localhost', host: 'localhost', 'x-physiology-csrf': 'physiology-v1' }

async function createApp() {
  return buildApp({ serveClient: false, env: { NODE_ENV: 'test', BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true', BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN: 'http://localhost' } })
}

describe('physiology API v8', () => {
  it('proxies pinned evidence and exposes signed packages, trust, conformance, and complete coverage', async () => {
    app = await createApp()
    const discovery = await app.inject({ method: 'GET', url: '/api/v8/physiology' })
    const evidence = await app.inject({ method: 'GET', url: '/api/v8/physiology/evidence' })
    const packages = await app.inject({ method: 'GET', url: '/api/v8/physiology/packages' })
    const trust = await app.inject({ method: 'GET', url: '/api/v8/physiology/trust' })
    const coverage = await app.inject({ method: 'GET', url: '/api/v8/physiology/coverage' })
    const detailBefore = await app.inject({ method: 'GET', url: `/api/v8/physiology/packages/${encodeURIComponent(packages.json()[0].packageDigest)}` })
    const conformance = await app.inject({ method: 'POST', url: `/api/v8/physiology/packages/${encodeURIComponent(packages.json()[0].packageDigest)}/conformance`, headers: mutationHeaders, payload: {} })
    const packagesAfter = await app.inject({ method: 'GET', url: '/api/v8/physiology/packages' })
    const detailAfter = await app.inject({ method: 'GET', url: `/api/v8/physiology/packages/${encodeURIComponent(packages.json()[0].packageDigest)}` })

    expect(discovery.json()).toMatchObject({ releaseId: 'physiology-plugin-evidence-v1.0.0', releaseDigest: '8f7a14db2cebe4603772146b3d1f9f2a8ccafbf2452ef5c9ff856326584fadb8', scientificValidation: 'unsupported' })
    expect(PhysiologyEvidenceSchema.parse(evidence.json()).modelEvidence).toHaveLength(3)
    expect(packages.json()).toHaveLength(3)
    expect(packages.json().every((item) => item.trust.status === 'trusted' && item.certification.status === 'not-certified' && item.certification.checks.conformanceBenchmark === false && item.certification.scientificValidation === 'unsupported')).toBe(true)
    expect(detailBefore.json().certification).toMatchObject({ status: 'not-certified', checks: { conformanceBenchmark: false } })
    expect(trust.json()).toHaveLength(1)
    expect(coverage.json().items).toHaveLength(16)
    expect(coverage.json().items.filter((item) => item.coverage_status === 'contract-covered').every((item) => item.installed)).toBe(true)
    expect(conformance.json()).toMatchObject({ benchmark: { passed: true }, scientificValidation: 'unsupported' })
    expect(packagesAfter.json().filter((item) => item.certification.status === 'certified-conformant')).toHaveLength(1)
    expect(detailAfter.json().certification).toMatchObject({ status: 'certified-conformant', checks: { conformanceBenchmark: true }, scientificValidation: 'unsupported' })
  })

  it('creates deterministic coupling/run records and blocks unsupported taxa and malformed requests', async () => {
    app = await createApp()
    const packages = (await app.inject({ method: 'GET', url: '/api/v8/physiology/packages' })).json()
    const payload = { packageDigests: packages.map((item) => item.packageDigest), taxonId: 'NCBITaxon:9606', durationMinutes: 4, couplingCadenceMinutes: 1, interpolation: 'zero-order-hold', refinementFactors: [1, 2, 4], convergenceToleranceMg: 1e-9 }
    const couplingResponse = await app.inject({ method: 'POST', url: '/api/v8/physiology/couplings', headers: mutationHeaders, payload })
    const coupling = PhysiologyCouplingSchema.parse(couplingResponse.json())
    const runResponse = await app.inject({ method: 'POST', url: '/api/v8/physiology/runs', headers: mutationHeaders, payload: { couplingDigest: coupling.couplingDigest } })
    const run = PhysiologyRunSchema.parse(runResponse.json())
    const repeated = await app.inject({ method: 'POST', url: '/api/v8/physiology/runs', headers: mutationHeaders, payload: { couplingDigest: coupling.couplingDigest } })
    const mouse = await app.inject({ method: 'POST', url: '/api/v8/physiology/couplings', headers: mutationHeaders, payload: { ...payload, taxonId: 'NCBITaxon:10090' } })
    const malformed = await app.inject({ method: 'POST', url: '/api/v8/physiology/runs', headers: mutationHeaders, payload: { couplingDigest: coupling.couplingDigest, unexpected: true } })
    const csrf = await app.inject({ method: 'POST', url: '/api/v8/physiology/runs', payload: { couplingDigest: coupling.couplingDigest } })

    expect(couplingResponse.statusCode).toBe(201)
    expect(runResponse.statusCode).toBe(201)
    expect(run.runDigest).toBe(repeated.json().runDigest)
    expect(run.states.at(-1).massesMg).toEqual({ 'PLUGIN:CIRCULATION-REFERENCE': 50, 'PLUGIN:KIDNEY-REFERENCE': 20, 'PLUGIN:LIVER-REFERENCE': 30 })
    expect(run.diagnostics).toMatchObject({ massConserved: true, converged: true, convergenceMaximumDifferenceMg: 0 })
    expect(mouse).toMatchObject({ statusCode: 422 })
    expect(mouse.json().code).toBe('unsupported_extrapolation')
    expect(malformed.statusCode).toBe(422)
    expect(csrf.statusCode).toBe(403)
  })

  it('validates deterministic package bytes and applies trust revocation immediately', async () => {
    app = await createApp()
    const client = createPhysiologyClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' })
    const [reference] = await createReferencePackages(await client.evidence())
    const validated = await app.inject({ method: 'POST', url: '/api/v8/physiology/packages/validate', headers: mutationHeaders, payload: { packageBase64: reference.bytes.toString('base64') } })
    const keyId = validated.json().package.signature.keyId
    const trust = (await app.inject({ method: 'GET', url: '/api/v8/physiology/trust' })).json()[0]
    const importedTrust = await app.inject({ method: 'POST', url: '/api/v8/physiology/trust', headers: mutationHeaders, payload: { keyId: trust.keyId, algorithm: trust.algorithm, publisher: trust.publisher, publicKeySpkiBase64: trust.publicKeySpkiBase64 } })
    const revoked = await app.inject({ method: 'POST', url: `/api/v8/physiology/trust/${encodeURIComponent(keyId)}/revoke`, headers: mutationHeaders, payload: {} })
    const packages = await app.inject({ method: 'GET', url: '/api/v8/physiology/packages' })
    const revalidated = await app.inject({ method: 'POST', url: '/api/v8/physiology/packages/validate', headers: mutationHeaders, payload: { packageBase64: reference.bytes.toString('base64') } })

    expect(validated.json()).toMatchObject({ valid: true, installable: true })
    expect(importedTrust).toMatchObject({ statusCode: 201 })
    expect(revoked.json().status).toBe('revoked')
    expect(packages.json().every((item) => item.trust.status === 'revoked' && item.certification.status === 'not-certified')).toBe(true)
    expect(revalidated.json()).toMatchObject({ valid: false, installable: false, findings: [{ code: 'revoked_publisher' }] })
  })

  it('rechecks publisher trust before cached POST runs while retaining historical GET', async () => {
    app = await createApp()
    const packages = (await app.inject({ method: 'GET', url: '/api/v8/physiology/packages' })).json()
    const coupling = (await app.inject({ method: 'POST', url: '/api/v8/physiology/couplings', headers: mutationHeaders, payload: { packageDigests: packages.map((item) => item.packageDigest), taxonId: 'NCBITaxon:9606', durationMinutes: 4, couplingCadenceMinutes: 1, interpolation: 'zero-order-hold', refinementFactors: [1, 2, 4], convergenceToleranceMg: 1e-9 } })).json()
    const completed = await app.inject({ method: 'POST', url: '/api/v8/physiology/runs', headers: mutationHeaders, payload: { couplingDigest: coupling.couplingDigest } })
    const run = completed.json()
    await app.inject({ method: 'POST', url: `/api/v8/physiology/trust/${encodeURIComponent(packages[0].signature.keyId)}/revoke`, headers: mutationHeaders, payload: {} })
    const refused = await app.inject({ method: 'POST', url: '/api/v8/physiology/runs', headers: mutationHeaders, payload: { couplingDigest: coupling.couplingDigest } })
    const historical = await app.inject({ method: 'GET', url: `/api/v8/physiology/runs/${encodeURIComponent(run.runDigest)}` })

    expect(completed.statusCode).toBe(201)
    expect(refused).toMatchObject({ statusCode: 403 })
    expect(refused.json().code).toBe('trust_revoked')
    expect(historical.statusCode).toBe(200)
    expect(historical.json()).toEqual(run)
  })

  it('passes a valid >1 MiB package encoding to package validation', async () => {
    app = await createApp()
    const packageBase64 = Buffer.alloc(825_000).toString('base64')
    const response = await app.inject({ method: 'POST', url: '/api/v8/physiology/packages/validate', headers: mutationHeaders, payload: { packageBase64 } })

    expect(Buffer.byteLength(JSON.stringify({ packageBase64 }))).toBeGreaterThan(1_048_576)
    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ valid: false, installable: false })
  })
})
