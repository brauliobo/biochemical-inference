import { z } from 'zod'
import {
  REVALIDATION_CSRF_HEADER,
  REVALIDATION_CSRF_VALUE,
  RevalidationCampaignParamSchema,
  RevalidationProjectionQuerySchema,
  RevalidationSyncRequestSchema
} from '../../shared/revalidation-contracts.js'
import { createCsrfGuard } from '../http/guards.js'
import { problemReply } from '../http/replies.js'
import { createRouter } from '../http/routes.js'
import { RevalidationIntegrationError } from '../revalidation/integration.js'

const Empty = z.object({}).strict()
const invalidRevalidation = problemReply(422, 'INVALID_REVALIDATION_REQUEST', 'Goal 15 request does not match the strict bounded revalidation contract.', { noStore: true })

export function registerRevalidationRoutes(app, { revalidation, allowedOrigins }) {
  const { get, post } = createRouter(app, invalidRevalidation)
  const requireRevalidation = () => {
    if (!revalidation) throw new RevalidationIntegrationError('revalidation-not-configured', 'Goal 15 producer integration is not configured.', 503)
    return revalidation
  }
  const mutation = {
    preHandler: createCsrfGuard(allowedOrigins, REVALIDATION_CSRF_HEADER, REVALIDATION_CSRF_VALUE,
      () => new RevalidationIntegrationError('revalidation-csrf-rejected', 'Goal 15 campaign mutation requires a startup-allowlisted browser origin and CSRF header.', 403))
  }

  get('/api/v13/revalidation/status', { query: Empty }, () => requireRevalidation().status())
  get('/api/v13/revalidation/campaigns', { query: Empty }, () => requireRevalidation().campaigns())
  post('/api/v13/revalidation/campaigns', { query: Empty, bodyOrEmpty: RevalidationSyncRequestSchema, options: mutation, status: 201 }, ({ body }) => requireRevalidation().sync(body))
  get('/api/v13/revalidation/campaigns/:campaignId', { query: RevalidationProjectionQuerySchema, params: RevalidationCampaignParamSchema },
    ({ query, params }) => requireRevalidation().detail(params.campaignId, { limit: query.limit, cursor: query.cursor ?? null }))
  get('/api/v13/revalidation/campaigns/:campaignId/report', { query: Empty, params: RevalidationCampaignParamSchema }, ({ params }) => requireRevalidation().report(params.campaignId))
  post('/api/v13/revalidation/campaigns/:campaignId/reconcile', { query: Empty, bodyOrEmpty: Empty, params: RevalidationCampaignParamSchema, options: mutation }, ({ params }) => requireRevalidation().reconcile(params.campaignId))
  post('/api/v13/revalidation/campaigns/:campaignId/cancel', { query: Empty, bodyOrEmpty: Empty, params: RevalidationCampaignParamSchema, options: mutation }, ({ params }) => requireRevalidation().cancel(params.campaignId))
  get('/api/v13/revalidation/integrity', { query: Empty }, () => requireRevalidation().integrity())
  get('/api/v13/revalidation/events', { query: RevalidationProjectionQuerySchema }, ({ query }) => requireRevalidation().events(query))
}
