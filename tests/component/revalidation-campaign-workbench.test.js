import { fireEvent, render, screen, waitFor } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { expectAccessible } from '../helpers/axe.js'
import RevalidationCampaignWorkbench from '../../src/components/RevalidationCampaignWorkbench.vue'
import { revalidationReport, revalidationStatus, revalidationView } from '../fixtures/revalidation.js'

const api = vi.hoisted(() => ({
  cancelRevalidationCampaign: vi.fn(),
  createRevalidationCampaign: vi.fn(),
  loadRevalidationCampaign: vi.fn(),
  loadRevalidationCampaignPage: vi.fn(),
  loadRevalidationCampaignReport: vi.fn(),
  loadRevalidationCampaigns: vi.fn(),
  loadRevalidationEvents: vi.fn(),
  loadRevalidationStatus: vi.fn(),
  reconcileRevalidationCampaign: vi.fn(),
  verifyRevalidationIntegrity: vi.fn()
}))

vi.mock('../../src/api.js', () => api)

beforeEach(() => {
  vi.clearAllMocks()
  api.loadRevalidationStatus.mockResolvedValue(revalidationStatus())
  api.loadRevalidationCampaigns.mockResolvedValue([])
  api.loadRevalidationEvents.mockResolvedValue([])
  api.verifyRevalidationIntegrity.mockResolvedValue({ status: 'valid', campaigns: 1, accepted_results: 6, producer: 'valid', event_heads: [] })
  api.loadRevalidationCampaignReport.mockImplementation((campaignId) => revalidationReport(campaignId))
})

describe('Goal 15 revalidation campaign workbench', () => {
  it('does not require scientific review before technical work is terminal', async () => {
    const detail = await revalidationView({ terminal: false, submitted: 0 })
    api.loadRevalidationStatus.mockResolvedValue(revalidationStatus(1))
    api.loadRevalidationCampaigns.mockResolvedValue([{ local_campaign_id: detail.campaign_id, producer_campaign_id: detail.producer.producer_campaign_id, event_head: detail.producer.event_head }])
    api.loadRevalidationCampaign.mockResolvedValue(detail)
    render(RevalidationCampaignWorkbench)

    expect(await screen.findAllByText('Technical execution pending · review not yet required')).toHaveLength(6)
    expect(screen.queryByText('Review required · not automatically accepted')).toBeNull()
  })

  it('creates a campaign while preserving the explicit scientific review boundary', async () => {
    const detail = await revalidationView({ terminal: true, submitted: 6 })
    api.createRevalidationCampaign.mockResolvedValue(detail)
    api.loadRevalidationStatus.mockResolvedValue(revalidationStatus(1))
    api.loadRevalidationCampaigns
      .mockResolvedValueOnce([])
      .mockResolvedValue([{ local_campaign_id: detail.campaign_id, producer_campaign_id: detail.producer.producer_campaign_id, event_head: detail.producer.event_head }])
    render(RevalidationCampaignWorkbench)

    expect(await screen.findByText('Signed impact execution ledger')).toBeTruthy()
    expect(screen.getByText('Terminal software outcomes do not become scientific conclusions.')).toBeTruthy()
    await fireEvent.submit(screen.getByRole('button', { name: /create and execute campaign/i }).closest('form'))
    await screen.findByTestId('revalidation-campaign-summary')
    expect(api.createRevalidationCampaign).toHaveBeenCalledWith({ name: 'goal15-local-revalidation', reason: 'Execute the pinned Goal 11 revalidation impact plan locally.' }, expect.any(AbortSignal))
    expect(screen.getAllByText('Review required · not automatically accepted')).toHaveLength(6)
    expect(screen.queryByRole('button', { name: /accept|label|approve/i })).toBeNull()
  })

  it('loads a durable campaign and exposes integrity without conflating receipts with review', async () => {
    const detail = await revalidationView({ terminal: true, submitted: 6 })
    api.loadRevalidationStatus.mockResolvedValue(revalidationStatus(1))
    api.loadRevalidationCampaigns.mockResolvedValue([{ local_campaign_id: detail.campaign_id, producer_campaign_id: detail.producer.producer_campaign_id, event_head: detail.producer.event_head }])
    api.loadRevalidationCampaign.mockResolvedValue(detail)
    render(RevalidationCampaignWorkbench)

    expect(await screen.findByText('6 / 6 terminal')).toBeTruthy()
    expect(screen.getByText('6 / 6', { selector: 'dd' })).toBeTruthy()
    expect(screen.getByText('0 local · acceptance disabled')).toBeTruthy()
    await fireEvent.click(screen.getByRole('button', { name: 'Verify full integrity' }))
    await waitFor(() => expect(screen.getByText(/Integrity valid/)).toBeTruthy())
    await fireEvent.click(screen.getByRole('button', { name: 'Load technical report' }))
    expect(await screen.findByText('Bounded campaign report')).toBeTruthy()
    expect(screen.getByText('unsupported · review required')).toBeTruthy()
  })

  it('continues a snapshot-pinned work projection without replacing prior progress cards', async () => {
    const detail = await revalidationView({ terminal: true, submitted: 6 })
    const first = { ...detail, work: detail.work.slice(0, 2), projection: { ...detail.projection, limit: 2, next_cursor: 'signed-page-cursor' } }
    const next = { ...detail, work: detail.work.slice(2), projection: { ...detail.projection, limit: 2, next_cursor: null } }
    api.loadRevalidationStatus.mockResolvedValue(revalidationStatus(1))
    api.loadRevalidationCampaigns.mockResolvedValue([{ local_campaign_id: detail.campaign_id, producer_campaign_id: detail.producer.producer_campaign_id, event_head: detail.producer.event_head }])
    api.loadRevalidationCampaign.mockResolvedValue(first)
    api.loadRevalidationCampaignPage.mockResolvedValue(next)
    render(RevalidationCampaignWorkbench)

    expect(await screen.findAllByText('Review required · not automatically accepted')).toHaveLength(2)
    await fireEvent.click(screen.getByRole('button', { name: 'Load next 2 work records' }))
    await waitFor(() => expect(screen.getAllByText('Review required · not automatically accepted')).toHaveLength(6))
    expect(api.loadRevalidationCampaignPage).toHaveBeenCalledWith(detail.campaign_id, { limit: 2, cursor: 'signed-page-cursor' }, expect.any(AbortSignal))
  })

  it('has no WCAG 2.2 AA violations with a terminal campaign and its report', async () => {
    const detail = await revalidationView({ terminal: true, submitted: 6 })
    api.loadRevalidationStatus.mockResolvedValue(revalidationStatus(1))
    api.loadRevalidationCampaigns.mockResolvedValue([{ local_campaign_id: detail.campaign_id, producer_campaign_id: detail.producer.producer_campaign_id, event_head: detail.producer.event_head }])
    api.loadRevalidationCampaign.mockResolvedValue(detail)
    render(RevalidationCampaignWorkbench)
    await screen.findByText('6 / 6 terminal')
    await fireEvent.click(screen.getByRole('button', { name: 'Load technical report' }))
    await screen.findByText('Bounded campaign report')
    await expectAccessible()
  })
})
