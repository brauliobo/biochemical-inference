import {
  REVALIDATION_CSRF_HEADER,
  REVALIDATION_CSRF_VALUE,
  ProducerEventPageSchema,
  RevalidationCampaignDetailSchema,
  RevalidationCampaignListSchema,
  RevalidationCampaignReportSchema,
  RevalidationDigestSchema,
  RevalidationIntegrationStatusSchema,
  RevalidationIntegritySchema,
  RevalidationSyncRequestSchema
} from '../../shared/revalidation-contracts.js'
import { ApiError, collectCursorPages, createStrictClient, csrfHeaders, identityMismatch, policyError, violatesNoStore, withQuery, withSignal } from './core.js'

const BASE = '/api/v13/revalidation'
const mutationHeaders = csrfHeaders(REVALIDATION_CSRF_HEADER, REVALIDATION_CSRF_VALUE)

const revalidationRequest = createStrictClient({
  verifyFirst: true,
  verify(response) {
    if (violatesNoStore(response, 'no-store')) {
      throw policyError(response, 'Goal 15 response did not preserve the required no-store policy.', 'REVALIDATION_CACHE_POLICY_INVALID')
    }
  }
})

const get = (path, schema, signal) => revalidationRequest(path, { init: withSignal(signal), schema })
const post = (path, body, schema, signal) => revalidationRequest(path, {
  init: { method: 'POST', headers: mutationHeaders, body: JSON.stringify(body), ...withSignal(signal) },
  schema
})
const bindCampaign = (payload, id, message) => identityMismatch(payload.campaign_id === id, message, 'REVALIDATION_IDENTITY_MISMATCH', payload)

export async function loadRevalidationStatus(signal) {
  return get(`${BASE}/status`, RevalidationIntegrationStatusSchema, signal)
}

export async function loadRevalidationCampaigns(signal) {
  return get(`${BASE}/campaigns`, RevalidationCampaignListSchema, signal)
}

export async function createRevalidationCampaign(input = {}, signal) {
  return post(`${BASE}/campaigns`, RevalidationSyncRequestSchema.parse(input), RevalidationCampaignDetailSchema, signal)
}

export async function loadRevalidationCampaign(campaignId, signal) {
  return loadRevalidationCampaignPage(campaignId, {}, signal)
}

export async function loadRevalidationCampaignPage(campaignId, page = {}, signal) {
  const id = RevalidationDigestSchema.parse(campaignId)
  const campaign = await get(withQuery(`${BASE}/campaigns/${encodeURIComponent(id)}`, { limit: page.limit, cursor: page.cursor }), RevalidationCampaignDetailSchema, signal)
  bindCampaign(campaign, id, 'Goal 15 campaign response does not bind the requested identity.')
  return campaign
}

export async function loadRevalidationCampaignReport(campaignId, signal) {
  const id = RevalidationDigestSchema.parse(campaignId)
  const report = await get(`${BASE}/campaigns/${encodeURIComponent(id)}/report`, RevalidationCampaignReportSchema, signal)
  bindCampaign(report, id, 'Goal 15 campaign report does not bind the requested identity.')
  return report
}

async function mutateCampaign(campaignId, action, signal) {
  const id = RevalidationDigestSchema.parse(campaignId)
  const campaign = await post(`${BASE}/campaigns/${encodeURIComponent(id)}/${action}`, {}, RevalidationCampaignDetailSchema, signal)
  bindCampaign(campaign, id, 'Goal 15 campaign mutation does not bind the requested identity.')
  return campaign
}

export async function reconcileRevalidationCampaign(campaignId, signal) {
  return mutateCampaign(campaignId, 'reconcile', signal)
}

export async function cancelRevalidationCampaign(campaignId, signal) {
  return mutateCampaign(campaignId, 'cancel', signal)
}

export async function verifyRevalidationIntegrity(signal) {
  return get(`${BASE}/integrity`, RevalidationIntegritySchema, signal)
}

export async function loadRevalidationEvents(signal) {
  let expectedHead = null
  return collectCursorPages(
    (cursor) => get(withQuery(`${BASE}/events`, { limit: 100, cursor }), ProducerEventPageSchema, signal),
    (page) => {
      const head = `${page.head_sequence}\0${page.head_digest}`
      if (expectedHead !== null && head !== expectedHead) throw new ApiError('Goal 15 event pagination changed signed heads.', { status: 200, code: 'REVALIDATION_EVENT_HEAD_DRIFT', payload: page })
      expectedHead = head
    }
  )
}
