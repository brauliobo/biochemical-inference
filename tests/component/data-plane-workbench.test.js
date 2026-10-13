import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import {
  DATA_PLANE_BASELINE_RELEASE_ID,
  DATA_PLANE_CANDIDATE_RELEASE_ID,
  DATA_PLANE_PINS,
  FactoryManifestSchema,
  FactoryReleaseEnvelopeSchema
} from '../../shared/data-plane-contracts.js'

const api = vi.hoisted(() => ({
  loadAuthorityClosureAudit: vi.fn(),
  loadAuthorityClosureAudits: vi.fn(),
  loadDataPlaneDiscovery: vi.fn(),
  loadDataPlaneIntegrity: vi.fn(),
  loadDataPlanePage: vi.fn(),
  loadDataPlaneRelease: vi.fn(),
  loadDataPlaneReleases: vi.fn(),
  loadDataPlaneDiff: vi.fn(),
  runAuthorityClosureAudit: vi.fn(),
  syncDataPlane: vi.fn()
}))
vi.mock('../../src/api.js', () => api)

import DataPlaneWorkbench from '../../src/components/DataPlaneWorkbench.vue'

const fixtureRoot = resolve(process.cwd(), 'tests', 'fixtures', 'data-plane', 'public')
const candidateRoot = resolve(fixtureRoot, 'releases', DATA_PLANE_CANDIDATE_RELEASE_ID)
const baselineRelease = { id: DATA_PLANE_BASELINE_RELEASE_ID, schema_version: '2.0.0', digest: DATA_PLANE_PINS.baseline.releaseDigest }
const candidateRelease = { id: DATA_PLANE_CANDIDATE_RELEASE_ID, schema_version: '2.0.0', digest: DATA_PLANE_PINS.candidate.releaseDigest }
const emptyStatus = { contractVersion: '1.0.0', state: 'empty', localOnly: true, release: null, signerKeyId: null, lastSyncAt: null, lastError: null, integrity: 'empty' }
const readyStatus = { contractVersion: '1.0.0', state: 'ready', localOnly: true, release: candidateRelease, signerKeyId: DATA_PLANE_PINS.activeKey.keyId, lastSyncAt: '2026-07-13T12:00:00.000Z', lastError: null, integrity: 'valid' }
let manifest
let envelope
let records
let difference
let readyDiscovery
let detail
let report

beforeAll(async () => {
  manifest = FactoryManifestSchema.parse(JSON.parse(await readFile(resolve(candidateRoot, 'manifest.json'))))
  envelope = FactoryReleaseEnvelopeSchema.parse(JSON.parse(await readFile(resolve(candidateRoot, 'envelope.json'))))
  difference = JSON.parse(await readFile(resolve(fixtureRoot, 'diffs', `${DATA_PLANE_BASELINE_RELEASE_ID}--v2.0.1.json`)))
  records = Object.fromEntries(Object.keys(manifest.record_counts).map((type) => [type, []]))
  for (const partition of manifest.partitions) {
    const bytes = await readFile(resolve(candidateRoot, partition.path), 'utf8')
    records[partition.record_type].push(...bytes.trimEnd().split('\n').map((line) => JSON.parse(line)))
  }
  readyDiscovery = {
    contractVersion: '1.0.0', mode: 'local-verified-mirror', explicitSync: true, readNetworkAccess: false, pins: DATA_PLANE_PINS, status: readyStatus,
    routes: { status: '', sync: '', releases: '', release: '', record: '', pages: '', diff: '', integrity: '', audits: '', audit: '' }
  }
  detail = {
    release: candidateRelease,
    catalogDigest: DATA_PLANE_PINS.catalogDigest,
    trustDigest: DATA_PLANE_PINS.trustDigest,
    manifestDigest: DATA_PLANE_PINS.candidate.manifestDigest,
    envelopeDigest: DATA_PLANE_PINS.candidate.envelopeDigest,
    signer: { keyId: DATA_PLANE_PINS.activeKey.keyId, algorithm: 'Ed25519', signedAt: envelope.signature.signed_at, status: 'active' },
    manifest,
    envelope,
    syncedAt: readyStatus.lastSyncAt,
    storage: 'local-verified-mirror'
  }
  report = {
    reportDigest: 'a'.repeat(64),
    algorithmVersion: 'authority-closure-audit-v1.0.0',
    baseline: baselineRelease,
    release: candidateRelease,
    results: { totalRecords: 17, partitionCount: 10, sourceObjectCount: 11 },
    scientificValidation: 'unsupported'
  }
})

function page(recordType, query = {}) {
  const offset = recordType === 'compounds' && query.cursor === 'page-2' ? 2 : recordType === 'compounds' && query.cursor === 'page-3' ? 4 : 0
  const items = records[recordType].slice(offset, offset + 2)
  const nextCursor = offset + 2 < records[recordType].length ? offset === 0 ? 'page-2' : 'page-3' : null
  return { pageContract: 'data-plane-records-v1', release: candidateRelease, recordType, filters: {}, sort: 'id:asc', limit: 2, items, nextCursor, source: 'local-mirror' }
}

function deferred() {
  let resolvePromise
  let rejectPromise
  const promise = new Promise((resolveValue, rejectValue) => {
    resolvePromise = resolveValue
    rejectPromise = rejectValue
  })
  return { promise, resolve: resolvePromise, reject: rejectPromise }
}

beforeEach(() => {
  vi.clearAllMocks()
  const emptyDiscovery = { ...readyDiscovery, status: emptyStatus }
  api.loadDataPlaneDiscovery.mockResolvedValueOnce(emptyDiscovery).mockResolvedValue(readyDiscovery)
  api.syncDataPlane.mockResolvedValue(readyStatus)
  api.loadDataPlaneReleases.mockResolvedValue([
    { release: baselineRelease, signerKeyId: DATA_PLANE_PINS.historicalKey.keyId, signedAt: '2026-07-13T00:00:00Z', syncedAt: readyStatus.lastSyncAt, active: false },
    { release: candidateRelease, signerKeyId: DATA_PLANE_PINS.activeKey.keyId, signedAt: envelope.signature.signed_at, syncedAt: readyStatus.lastSyncAt, active: true }
  ])
  api.loadDataPlaneRelease.mockResolvedValue(detail)
  api.loadDataPlanePage.mockImplementation((_releaseId, recordType, query) => Promise.resolve(page(recordType, query)))
  api.loadDataPlaneDiff.mockResolvedValue(difference)
  api.loadDataPlaneIntegrity.mockResolvedValue({ status: 'valid', checkedAt: readyStatus.lastSyncAt, releases: 2, objects: 18, records: 34, findings: [] })
  api.loadAuthorityClosureAudits.mockResolvedValue([])
  api.runAuthorityClosureAudit.mockResolvedValue(report)
  api.loadAuthorityClosureAudit.mockResolvedValue(report)
})

describe('DataPlaneWorkbench', () => {
  it('shows both releases, key rotation, complete pins, attributed diff, and an idempotent offline audit', async () => {
    render(DataPlaneWorkbench)
    expect(await screen.findByText('Empty local mirror')).toBeTruthy()
    await fireEvent.click(screen.getByRole('button', { name: /Sync release pair/ }))

    expect((await screen.findAllByText(DATA_PLANE_CANDIDATE_RELEASE_ID)).length).toBeGreaterThan(0)
    expect(screen.getAllByText(DATA_PLANE_BASELINE_RELEASE_ID).length).toBeGreaterThan(0)
    expect(screen.getByText(DATA_PLANE_PINS.historicalKey.publicKey)).toBeTruthy()
    expect(screen.getByText(DATA_PLANE_PINS.activeKey.publicKey)).toBeTruthy()
    expect((await screen.findAllByText('Authority response')).length).toBe(9)
    expect(screen.getAllByText('Repository curation').length).toBe(2)
    expect(screen.getByText('Courtesy of the U.S. National Library of Medicine.')).toBeTruthy()
    expect(screen.getByText(/SHMT1 · Serine hydroxymethyltransferase/)).toBeTruthy()
    expect(screen.getByText('CHEBI:15377')).toBeTruthy()
    expect(screen.getByText('1 changes')).toBeTruthy()
    expect(screen.getByText(/adapter:pubmed-esummary-json-doi@1.1.0/)).toBeTruthy()
    expect(screen.getAllByText(DATA_PLANE_PINS.candidate.manifestDigest).length).toBeGreaterThan(0)
    expect(screen.getAllByText(DATA_PLANE_PINS.candidate.envelopeDigest).length).toBeGreaterThan(0)

    const pagination = screen.getByRole('navigation', { name: 'Record pagination' })
    await fireEvent.click(within(pagination).getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('CHEBI:33384')).toBeTruthy()
    await fireEvent.click(within(pagination).getByRole('button', { name: 'Next' }))
    expect(await screen.findByText('CHEBI:57453')).toBeTruthy()
    expect(screen.getByText('Page 3')).toBeTruthy()

    await fireEvent.click(screen.getByRole('button', { name: 'Run offline audit' }))
    expect(await screen.findByText(report.reportDigest)).toBeTruthy()
    expect(screen.getByText('authority-closure-audit-v1.0.0')).toBeTruthy()
    expect(screen.getByText('17 records · 10 partitions')).toBeTruthy()
    expect(api.runAuthorityClosureAudit).toHaveBeenCalledWith({ baselineReleaseId: DATA_PLANE_BASELINE_RELEASE_ID, candidateReleaseId: DATA_PLANE_CANDIDATE_RELEASE_ID }, expect.any(AbortSignal))
  })

  it('shows failed sync without publishing stale record content', async () => {
    api.syncDataPlane.mockRejectedValue(new Error('partition digest mismatch'))
    api.loadDataPlaneDiscovery.mockReset().mockResolvedValueOnce({ ...readyDiscovery, status: emptyStatus }).mockResolvedValue({ ...readyDiscovery, status: { ...emptyStatus, state: 'failed', lastError: 'partition digest mismatch' } })
    render(DataPlaneWorkbench)
    await fireEvent.click(await screen.findByRole('button', { name: /Sync release pair/ }))

    expect(await screen.findByText('partition digest mismatch')).toBeTruthy()
    expect(screen.queryByText('CHEBI:15377')).toBeNull()
    await waitFor(() => expect(api.loadDataPlaneRelease).not.toHaveBeenCalled())
  })

  it('commits page and cursor state only after a successful request', async () => {
    api.loadDataPlaneDiscovery.mockReset().mockResolvedValue(readyDiscovery)
    render(DataPlaneWorkbench)
    expect(await screen.findByText('CHEBI:15377')).toBeTruthy()
    const pagination = screen.getByRole('navigation', { name: 'Record pagination' })
    api.loadDataPlanePage.mockRejectedValueOnce(new Error('page unavailable'))
    await fireEvent.click(within(pagination).getByRole('button', { name: 'Next' }))

    expect(await screen.findByText('page unavailable')).toBeTruthy()
    expect(screen.getByText('Page 1')).toBeTruthy()
    expect(screen.getByText('CHEBI:15377')).toBeTruthy()
  })

  it('ignores stale rapid page and record-type responses with dedicated request ownership', async () => {
    api.loadDataPlaneDiscovery.mockReset().mockResolvedValue(readyDiscovery)
    render(DataPlaneWorkbench)
    expect(await screen.findByText('CHEBI:15377')).toBeTruthy()
    const slowPage = deferred()
    const currentType = deferred()
    api.loadDataPlanePage.mockImplementationOnce(() => slowPage.promise).mockImplementationOnce(() => currentType.promise)
    const pagination = screen.getByRole('navigation', { name: 'Record pagination' })
    fireEvent.click(within(pagination).getByRole('button', { name: 'Next' }))
    await fireEvent.update(screen.getByLabelText('Local record collection'), 'proteins')
    currentType.resolve(page('proteins'))
    expect(await screen.findByRole('region', { name: 'proteins from the local verified mirror, sorted by ID' })).toBeTruthy()
    slowPage.resolve(page('compounds', { cursor: 'page-2' }))
    await new Promise((settle) => setTimeout(settle))

    expect(screen.queryByText('CHEBI:33384')).toBeNull()
    expect(screen.getByRole('region', { name: 'proteins from the local verified mirror, sorted by ID' })).toBeTruthy()
    expect(screen.getByText('Page 1')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Next' }).disabled).toBe(true)
  })
})
