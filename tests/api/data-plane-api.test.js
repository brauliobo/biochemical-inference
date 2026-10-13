// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest'
import { buildApp } from '../../server/app.js'
import { createFactoryClient } from '../../server/data-plane/client.js'
import { createDataPlaneService } from '../../server/data-plane/service.js'
import {
  DATA_PLANE_BASELINE_RELEASE_ID,
  DATA_PLANE_CANDIDATE_RELEASE_ID,
  DATA_PLANE_DIFF_DIGEST
} from '../../shared/data-plane-contracts.js'
import { buildFactoryFixtureServer } from '../fixtures/data-plane-server.js'

let app
let upstream
afterEach(async () => {
  await app?.close()
  await upstream?.close().catch(() => {})
  app = undefined
  upstream = undefined
})

const mutationHeaders = { origin: 'http://localhost', host: 'untrusted-host.example', 'x-data-plane-csrf': 'data-plane-v1' }

async function createApp() {
  upstream = await buildFactoryFixtureServer()
  await upstream.listen({ host: '127.0.0.1', port: 0 })
  const factoryUrl = `http://127.0.0.1:${upstream.server.address().port}`
  const env = { NODE_ENV: 'test', BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true', BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN: 'http://localhost', CORS_ORIGINS: 'https://listed.example', BIOCHEMICAL_FACTORY_URL: factoryUrl }
  const dataPlaneService = await createDataPlaneService({ env, client: createFactoryClient(env) })
  app = await buildApp({ serveClient: false, env, dataPlaneService })
}

describe('data-plane API v9', () => {
  it('rejects malformed configured origins before service startup', async () => {
    await expect(buildApp({ serveClient: false, env: { NODE_ENV: 'test', BIOCHEMICAL_INFERENCE_PUBLIC_ORIGIN: 'http://localhost/' } })).rejects.toThrow(/exact HTTP\(S\) origin/)
  })

  it('uses only the startup-fixed origin set for mutations and never trusts Host rebinding', async () => {
    await createApp()
    const discovery = await app.inject({ method: 'GET', url: '/api/v9/data-plane' })
    const emptyRead = await app.inject({ method: 'GET', url: `/api/v9/data-plane/releases/${DATA_PLANE_CANDIDATE_RELEASE_ID}/pages/compounds?limit=2` })
    const noOrigin = await app.inject({ method: 'POST', url: '/api/v9/data-plane/sync', headers: { 'x-data-plane-csrf': 'data-plane-v1' }, payload: {} })
    const rebound = await app.inject({ method: 'POST', url: '/api/v9/data-plane/sync', headers: { ...mutationHeaders, host: 'attacker.test', origin: 'http://attacker.test' }, payload: {} })
    const malformedOrigin = await app.inject({ method: 'POST', url: '/api/v9/data-plane/sync', headers: { ...mutationHeaders, origin: 'http://localhost/' }, payload: {} })
    const malformedBody = await app.inject({ method: 'POST', url: '/api/v9/data-plane/sync', headers: mutationHeaders, payload: { release: DATA_PLANE_CANDIDATE_RELEASE_ID } })
    const synced = await app.inject({ method: 'POST', url: '/api/v9/data-plane/sync', headers: { ...mutationHeaders, origin: 'https://listed.example' }, payload: {} })
    const rendered = JSON.stringify(discovery.json())

    expect(discovery.json()).toMatchObject({ contractVersion: '1.0.0', mode: 'local-verified-mirror', explicitSync: true, readNetworkAccess: false, status: { state: 'empty', localOnly: true } })
    expect(discovery.json().routes).toMatchObject({ audits: '/api/v9/data-plane/audits', audit: '/api/v9/data-plane/audits/{reportDigest}' })
    expect(rendered).not.toContain('BIOCHEMICAL_')
    expect(rendered).not.toContain('127.0.0.1')
    expect(rendered).not.toContain('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA')
    expect(emptyRead.statusCode).toBe(404)
    expect(noOrigin.statusCode).toBe(403)
    expect(rebound.statusCode).toBe(403)
    expect(malformedOrigin.statusCode).toBe(403)
    expect(malformedBody.statusCode).toBe(422)
    expect(synced.json()).toMatchObject({ state: 'ready', integrity: 'valid', release: { id: DATA_PLANE_CANDIDATE_RELEASE_ID } })
  })

  it('serves both releases, bound pages, pairwise diff, integrity, and idempotent audits offline', async () => {
    await createApp()
    await app.inject({ method: 'POST', url: '/api/v9/data-plane/sync', headers: mutationHeaders, payload: {} })
    await upstream.close()

    const releases = await app.inject({ method: 'GET', url: '/api/v9/data-plane/releases' })
    const baseline = await app.inject({ method: 'GET', url: `/api/v9/data-plane/releases/${DATA_PLANE_BASELINE_RELEASE_ID}` })
    const candidate = await app.inject({ method: 'GET', url: `/api/v9/data-plane/releases/${DATA_PLANE_CANDIDATE_RELEASE_ID}` })
    const record = await app.inject({ method: 'GET', url: `/api/v9/data-plane/releases/${DATA_PLANE_CANDIDATE_RELEASE_ID}/records/proteins/${encodeURIComponent('UniProtKB:P34896')}` })
    const first = await app.inject({ method: 'GET', url: `/api/v9/data-plane/releases/${DATA_PLANE_CANDIDATE_RELEASE_ID}/pages/compounds?limit=1` })
    const cursor = first.json().nextCursor
    const second = await app.inject({ method: 'GET', url: `/api/v9/data-plane/releases/${DATA_PLANE_CANDIDATE_RELEASE_ID}/pages/compounds?limit=1&cursor=${encodeURIComponent(cursor)}` })
    const changedLimit = await app.inject({ method: 'GET', url: `/api/v9/data-plane/releases/${DATA_PLANE_CANDIDATE_RELEASE_ID}/pages/compounds?limit=2&cursor=${encodeURIComponent(cursor)}` })
    const changedFilter = await app.inject({ method: 'GET', url: `/api/v9/data-plane/releases/${DATA_PLANE_CANDIDATE_RELEASE_ID}/pages/compounds?limit=1&id=${encodeURIComponent('CHEBI:15377')}&cursor=${encodeURIComponent(cursor)}` })
    const changedRelease = await app.inject({ method: 'GET', url: `/api/v9/data-plane/releases/${DATA_PLANE_BASELINE_RELEASE_ID}/pages/compounds?limit=1&cursor=${encodeURIComponent(cursor)}` })
    const tamperedCursor = `${cursor.slice(0, -1)}${cursor.endsWith('A') ? 'B' : 'A'}`
    const tampered = await app.inject({ method: 'GET', url: `/api/v9/data-plane/releases/${DATA_PLANE_CANDIDATE_RELEASE_ID}/pages/compounds?limit=1&cursor=${encodeURIComponent(tamperedCursor)}` })
    const diff = await app.inject({ method: 'GET', url: `/api/v9/data-plane/diff?base_release_id=${DATA_PLANE_BASELINE_RELEASE_ID}&candidate_release_id=${DATA_PLANE_CANDIDATE_RELEASE_ID}` })
    const sameRelease = await app.inject({ method: 'GET', url: `/api/v9/data-plane/diff?base_release_id=${DATA_PLANE_CANDIDATE_RELEASE_ID}&candidate_release_id=${DATA_PLANE_CANDIDATE_RELEASE_ID}` })
    const integrity = await app.inject({ method: 'GET', url: '/api/v9/data-plane/integrity' })
    const auditRequest = { baselineReleaseId: DATA_PLANE_BASELINE_RELEASE_ID, candidateReleaseId: DATA_PLANE_CANDIDATE_RELEASE_ID }
    const audit = await app.inject({ method: 'POST', url: '/api/v9/data-plane/audits', headers: mutationHeaders, payload: auditRequest })
    const repeatedAudit = await app.inject({ method: 'POST', url: '/api/v9/data-plane/audits', headers: mutationHeaders, payload: auditRequest })
    const audits = await app.inject({ method: 'GET', url: '/api/v9/data-plane/audits' })
    const auditDetail = await app.inject({ method: 'GET', url: `/api/v9/data-plane/audits/${audit.json().reportDigest}` })
    const rejectedAuditOrigin = await app.inject({ method: 'POST', url: '/api/v9/data-plane/audits', headers: { ...mutationHeaders, host: 'attacker.test', origin: 'http://attacker.test' }, payload: auditRequest })

    expect(releases.json()).toHaveLength(2)
    expect(releases.json()).toMatchObject([
      { release: { id: DATA_PLANE_BASELINE_RELEASE_ID }, signerKeyId: 'goal11-release-2026', active: false },
      { release: { id: DATA_PLANE_CANDIDATE_RELEASE_ID }, signerKeyId: 'goal11-release-2026-rotation-1', active: true }
    ])
    expect(baseline.json()).toMatchObject({ storage: 'local-verified-mirror', signer: { keyId: 'goal11-release-2026', status: 'retired' } })
    expect(candidate.json()).toMatchObject({ storage: 'local-verified-mirror', signer: { keyId: 'goal11-release-2026-rotation-1', status: 'active' } })
    expect(record.json()).toMatchObject({ source: 'local-mirror', item: { accession: 'P34896', taxon_id: 'NCBITaxon:9606' } })
    expect(first.json().items[0].id).toBe('CHEBI:15377')
    expect(second.json().items[0].id).toBe('CHEBI:15636')
    expect(changedLimit.statusCode).toBe(422)
    expect(changedFilter.statusCode).toBe(422)
    expect(changedRelease.statusCode).toBe(422)
    expect(tampered.statusCode).toBe(422)
    expect(diff.json()).toMatchObject({ diff_digest: DATA_PLANE_DIFF_DIGEST, counts: { unchanged: 16, added: 0, removed: 0, changed: 1 } })
    expect(sameRelease.statusCode).toBe(404)
    expect(integrity.json()).toMatchObject({ status: 'valid', releases: 2, records: 34, findings: [] })
    expect(audit.statusCode).toBe(201)
    expect(repeatedAudit.json()).toEqual(audit.json())
    expect(audits.json()).toHaveLength(1)
    expect(auditDetail.json()).toEqual(audit.json())
    expect(audit.json()).toMatchObject({ difference: { classes: { scientific: 1 } }, results: { allChecksPassed: true }, scientificValidation: 'unsupported' })
    expect(rejectedAuditOrigin.statusCode).toBe(403)
  })
})
