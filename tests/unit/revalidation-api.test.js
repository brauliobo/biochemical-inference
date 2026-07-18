import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createRevalidationCampaign,
  loadRevalidationCampaign,
  loadRevalidationCampaignReport,
  loadRevalidationStatus
} from '../../src/api.js'
import { revalidationReport, revalidationStatus, revalidationView } from '../fixtures/revalidation.js'

const noStoreHeaders = { 'cache-control': 'no-store', 'content-type': 'application/json', pragma: 'no-cache' }

afterEach(() => vi.unstubAllGlobals())

function response(value, headers = noStoreHeaders) {
  return new Response(JSON.stringify(value), { status: 200, headers })
}

describe('Goal 15 frontend API', () => {
  it('requires exact no-store responses and sends only the fixed campaign CSRF request', async () => {
    const detail = await revalidationView()
    const fetch = vi.fn(async (path) => response(path.endsWith('/status') ? revalidationStatus() : detail))
    vi.stubGlobal('fetch', fetch)

    await expect(loadRevalidationStatus()).resolves.toEqual(revalidationStatus())
    await expect(createRevalidationCampaign({})).resolves.toEqual(detail)
    expect(fetch).toHaveBeenLastCalledWith('/api/v13/revalidation/campaigns', expect.objectContaining({
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-biochemical-csrf': 'revalidation-campaign-v1' },
      body: JSON.stringify({ name: 'goal15-local-revalidation', reason: 'Execute the pinned Goal 11 revalidation impact plan locally.' })
    }))
  })

  it('rejects cacheable responses and campaign identity drift', async () => {
    const detail = await revalidationView()
    vi.stubGlobal('fetch', vi.fn(async () => response(revalidationStatus(), { 'cache-control': 'public, max-age=60', pragma: 'no-cache' })))
    await expect(loadRevalidationStatus()).rejects.toMatchObject({ code: 'REVALIDATION_CACHE_POLICY_INVALID' })

    vi.stubGlobal('fetch', vi.fn(async () => response(detail)))
    await expect(loadRevalidationCampaign(`sha256:${'f'.repeat(64)}`)).rejects.toMatchObject({ code: 'REVALIDATION_IDENTITY_MISMATCH' })
  })

  it('loads a separately typed technical report without changing the scientific review boundary', async () => {
    const detail = await revalidationView({ terminal: true, submitted: 6 })
    const report = await revalidationReport(detail.campaign_id)
    vi.stubGlobal('fetch', vi.fn(async () => response(report)))
    await expect(loadRevalidationCampaignReport(detail.campaign_id)).resolves.toEqual(report)
    expect(report.technical_execution.resources.enforcement.runtime.observed_max_ms).toBe(42)
    expect(report.technical_execution.accepted_results.exactly_once).toBe(true)
    expect(report.scientific_review).toMatchObject({ support: 'unsupported', review_required: true, automatically_accepted: false })

    const unrecorded = structuredClone(report)
    unrecorded.technical_execution.resources.acceptance = { mode: 'mixed-or-unrecorded-evidence', evidence_only: true }
    vi.stubGlobal('fetch', vi.fn(async () => response(unrecorded)))
    await expect(loadRevalidationCampaignReport(detail.campaign_id)).resolves.toEqual(unrecorded)
  })
})
