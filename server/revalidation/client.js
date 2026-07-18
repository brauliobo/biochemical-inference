import { createPublicKey, verify as verifyCrypto } from 'node:crypto'
import { isIP } from 'node:net'
import { canonicalJson } from '../../shared/canonical-json.js'
import {
  ProducerCampaignReceiptSchema,
  ProducerCampaignResponseSchema,
  ProducerCampaignSpecificationSchema,
  ProducerCampaignWriteRequestSchema,
  ProducerEventPageSchema,
  ProducerExecutionOutcomeSchema,
  ProducerOutcomeBatchReceiptSchema,
  ProducerOutcomeBatchWriteRequestSchema,
  ProducerOutcomePageSchema,
  ProducerOutcomeReceiptSchema,
  ProducerOutcomeResponseSchema,
  ProducerOutcomeWriteRequestSchema,
  ProducerPlanManifestSchema,
  ProducerPlanPageSchema,
  ProducerRevalidationActorSchema,
  ProducerRevalidationKeySchema,
  ProducerSignedEventSchema,
  ProducerStateSchema
} from '../../shared/revalidation-contracts.js'
import { identityPayload, immutable, revalidationIdentity } from './identity.js'
import { verifyImpactPlan } from './planning.js'

const MAX_PRODUCER_BYTES = 8 * 1024 * 1024
const MAX_PRODUCER_COLLECTION_ITEMS = 10000
const keyActions = new Set(['key-activated', 'key-rotated', 'key-retired', 'key-revoked'])

export class RevalidationProducerError extends Error {
  constructor(code, message, statusCode = 409) {
    super(message)
    this.name = 'RevalidationProducerError'
    this.code = code
    this.statusCode = statusCode
  }
}

function strictBase64(value, bytes, label) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(value)) throw new RevalidationProducerError('producer-key-invalid', `${label} is not strict standard base64.`)
  const decoded = Buffer.from(value, 'base64')
  if (decoded.length !== bytes || decoded.toString('base64') !== value) throw new RevalidationProducerError('producer-key-invalid', `${label} has an invalid canonical encoding.`)
  return decoded
}

function exactOrigin(value, label) {
  let parsed
  try { parsed = new URL(value) } catch { throw new TypeError(`${label} must be an exact HTTP(S) origin`) }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.origin !== value || parsed.pathname !== '/' || parsed.search || parsed.hash || parsed.username || parsed.password) throw new TypeError(`${label} must be an exact HTTP(S) origin`)
  return value
}

function producerRoot(value) {
  const origin = exactOrigin(value, 'BIOCHEMICAL_REVALIDATION_URL')
  const parsed = new URL(origin)
  const hostname = parsed.hostname.startsWith('[') ? parsed.hostname.slice(1, -1) : parsed.hostname
  if (parsed.protocol !== 'http:' || !['127.0.0.1', '::1'].includes(hostname) || isIP(hostname) === 0) throw new TypeError('BIOCHEMICAL_REVALIDATION_URL must be an exact HTTP loopback origin')
  return origin
}

function parseCanonical(bytes, schema, label) {
  if (!Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > MAX_PRODUCER_BYTES) throw new RevalidationProducerError('producer-wire-invalid', `${label} exceeds its bounded response contract.`)
  let value
  let text
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); value = JSON.parse(text) } catch { throw new RevalidationProducerError('producer-wire-invalid', `${label} is not strict UTF-8 JSON.`) }
  if (canonicalJson(value) !== text) throw new RevalidationProducerError('producer-wire-invalid', `${label} is not RFC 8785 canonical JSON.`)
  const parsed = schema.safeParse(value)
  if (!parsed.success) throw new RevalidationProducerError('producer-contract-invalid', `${label} does not match the strict producer contract: ${parsed.error.issues[0].message}`)
  return parsed.data
}

function verifyKey(value) {
  const key = ProducerRevalidationKeySchema.parse(value)
  if (key.key_id !== revalidationIdentity(identityPayload(key, 'key_id'))) throw new RevalidationProducerError('producer-key-invalid', 'Producer key identity mismatch.')
  strictBase64(key.public_key, 32, 'Producer public key')
  return key
}

function statusAt(key, sequence) {
  if (key.revokedFrom !== null && sequence >= key.revokedFrom) return 'revoked'
  if (key.retiredFrom !== null && sequence >= key.retiredFrom) return 'retired'
  return sequence >= key.activeFrom ? 'active' : 'pending'
}

function expectedRole(action) {
  if (keyActions.has(action)) return 'key-administrator'
  if (action === 'campaign-created') return 'campaign-author'
  if (action === 'outcome-recorded') return 'inference-executor'
  return 'scientific-reviewer'
}

function verifyCampaignRecord(value) {
  const campaign = ProducerCampaignResponseSchema.parse(value)
  const specification = campaign.specification
  const plan = campaign.plan
  try {
    verifyImpactPlan({
      dependencySnapshot: campaign.dependency_snapshot,
      changeSet: campaign.change_set,
      impactPolicy: campaign.impact_policy,
      impactPlan: plan
    })
  } catch (error) {
    throw new RevalidationProducerError('producer-plan-identity-invalid', `Producer planning closure is invalid: ${error.message}`)
  }
  if (specification.campaign_id !== revalidationIdentity(identityPayload(specification, 'campaign_id'))) throw new RevalidationProducerError('producer-campaign-identity-invalid', 'Producer campaign identity mismatch.')
  const workIds = plan.work_items.map((work) => work.work_id).sort()
  if (specification.plan_id !== plan.plan_id || specification.dependency_snapshot_id !== plan.dependency_snapshot_id || specification.change_set_id !== plan.change_set_id || specification.impact_policy_id !== plan.impact_policy_id || canonicalJson(specification.work_ids) !== canonicalJson(workIds)) throw new RevalidationProducerError('producer-campaign-closure-invalid', 'Producer campaign does not close over its plan.')
  return campaign
}

function cloneKeys(keys) {
  return new Map([...keys].map(([key, value]) => [key, { ...value }]))
}

function verifyEventExtension(eventValue, sequence, previous, keys, rolePolicyId) {
  const event = ProducerSignedEventSchema.parse(eventValue)
  if (event.sequence !== sequence || event.previous_event_digest !== previous) throw new RevalidationProducerError('producer-event-chain-invalid', `Producer event chain breaks at sequence ${event.sequence}.`)
  if (event.role_policy_id !== rolePolicyId) throw new RevalidationProducerError('producer-event-role-policy-invalid', `Producer event ${event.sequence} does not bind the independently pinned role policy.`)
  if (event.actor.role !== expectedRole(event.payload.action)) throw new RevalidationProducerError('producer-event-role-invalid', `Producer event ${event.sequence} has the wrong actor role.`)
  const signing = keys.get(event.signing_key_id)
  if (!signing || statusAt(signing, event.sequence) !== 'active') throw new RevalidationProducerError('producer-event-key-invalid', `Producer event ${event.sequence} was not signed by an active pinned key.`)
  const body = { ...event }
  delete body.event_digest
  delete body.signature
  if (event.event_digest !== revalidationIdentity(body)) throw new RevalidationProducerError('producer-event-identity-invalid', `Producer event ${event.sequence} identity mismatch.`)
  const publicKey = strictBase64(signing.key.public_key, 32, 'Producer event public key')
  const signature = strictBase64(event.signature, 64, 'Producer event signature')
  const spki = Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), publicKey])
  if (!verifyCrypto(null, Buffer.from(canonicalJson(body)), createPublicKey({ key: spki, format: 'der', type: 'spki' }), signature)) throw new RevalidationProducerError('producer-event-signature-invalid', `Producer event ${event.sequence} signature mismatch.`)
  const payload = event.payload
  if (payload.action === 'key-activated' || payload.action === 'key-rotated') {
    if (payload.effective_sequence !== event.sequence + 1) throw new RevalidationProducerError('producer-key-lifecycle-invalid', 'Producer key activation boundary is invalid.')
    const key = verifyKey(payload.key)
    if (keys.has(key.key_id)) throw new RevalidationProducerError('producer-key-lifecycle-invalid', 'Producer key lifecycle repeats a key.')
    keys.set(key.key_id, { key, activeFrom: payload.effective_sequence, retiredFrom: null, revokedFrom: null })
    if (payload.action === 'key-rotated') {
      if (payload.retiring_key_id !== event.signing_key_id) throw new RevalidationProducerError('producer-key-lifecycle-invalid', 'Producer rotation does not retire its signer.')
      signing.retiredFrom = payload.effective_sequence
    }
  } else if (payload.action === 'key-retired' || payload.action === 'key-revoked') {
    if (payload.effective_sequence <= event.sequence) throw new RevalidationProducerError('producer-key-lifecycle-invalid', 'Producer key retirement/revocation boundary is invalid.')
    const target = keys.get(payload.key_id)
    if (!target) throw new RevalidationProducerError('producer-key-lifecycle-invalid', 'Producer key lifecycle references an unknown key.')
    const field = payload.action === 'key-retired' ? 'retiredFrom' : 'revokedFrom'
    if (target[field] !== null) throw new RevalidationProducerError('producer-key-lifecycle-invalid', 'Producer key lifecycle repeats a transition.')
    target[field] = payload.effective_sequence
  }
  return event
}

export function verifyProducerEventChain(eventsValue, bootstrapKeyValue, rolePolicyId) {
  const bootstrap = verifyKey(bootstrapKeyValue)
  if (!/^sha256:[a-f0-9]{64}$/.test(rolePolicyId ?? '')) throw new RevalidationProducerError('producer-event-role-policy-invalid', 'Producer role policy requires an independent SHA-256 identity pin.')
  const keys = new Map([[bootstrap.key_id, { key: bootstrap, activeFrom: 1, retiredFrom: null, revokedFrom: null }]])
  const events = []
  let previous = null
  for (const value of eventsValue) {
    const event = verifyEventExtension(value, events.length + 1, previous, keys, rolePolicyId)
    events.push(event)
    previous = event.event_digest
  }
  return immutable({ events, keys, rolePolicyId, head: { sequence: events.length, digest: previous } })
}

export function verifyProducerEventExtensions(chain, eventsValue) {
  const keys = cloneKeys(chain.keys)
  const events = [...chain.events]
  let previous = chain.head.digest
  for (const value of eventsValue) {
    const event = verifyEventExtension(value, events.length + 1, previous, keys, chain.rolePolicyId)
    events.push(event)
    previous = event.event_digest
  }
  return immutable({ events, keys, rolePolicyId: chain.rolePolicyId, head: { sequence: events.length, digest: previous } })
}

export function createProducerCampaign({ name, reason, planning, actor }) {
  const requestedBy = ProducerRevalidationActorSchema.parse(actor)
  if (requestedBy.role !== 'campaign-author') throw new TypeError('Producer campaign actor must be a campaign-author')
  const plan = verifyImpactPlan({
    dependencySnapshot: planning.dependencySnapshot,
    changeSet: planning.changeSet,
    impactPolicy: planning.impactPolicy,
    impactPlan: planning.impactPlan
  })
  const payload = {
    campaign_spec_schema_version: '1.0.0',
    name,
    plan_id: plan.plan_id,
    dependency_snapshot_id: plan.dependency_snapshot_id,
    change_set_id: plan.change_set_id,
    impact_policy_id: plan.impact_policy_id,
    work_ids: plan.work_items.map((work) => work.work_id).sort(),
    requested_by: requestedBy,
    reason
  }
  const specification = ProducerCampaignSpecificationSchema.parse({ ...payload, campaign_id: revalidationIdentity(payload) })
  return immutable({
    specification,
    dependency_snapshot: planning.dependencySnapshot,
    change_set: planning.changeSet,
    impact_policy: planning.impactPolicy,
    plan
  })
}

export function verifyProducerCampaign(value, expected) {
  const campaign = verifyCampaignRecord(value)
  if (canonicalJson(campaign) !== canonicalJson({ ...expected, event_sequence: campaign.event_sequence })) throw new RevalidationProducerError('producer-campaign-drift', 'Producer campaign or planning closure differs from the independent inference pin.')
  return immutable(campaign)
}

export function createProducerOutcome(value) {
  const payload = { outcome_schema_version: '1.0.0', ...value }
  return ProducerExecutionOutcomeSchema.parse({ ...payload, outcome_id: revalidationIdentity(payload) })
}

export function verifyProducerOutcome(value) {
  const outcome = ProducerExecutionOutcomeSchema.parse(value)
  if (outcome.outcome_id !== revalidationIdentity(identityPayload(outcome, 'outcome_id'))) throw new RevalidationProducerError('producer-outcome-identity-invalid', 'Producer outcome identity mismatch.')
  return immutable(outcome)
}

export function createRevalidationProducerClient(env = process.env, options = {}) {
  const root = producerRoot(env.BIOCHEMICAL_REVALIDATION_URL)
  const origin = exactOrigin(env.BIOCHEMICAL_REVALIDATION_ALLOWED_ORIGIN, 'BIOCHEMICAL_REVALIDATION_ALLOWED_ORIGIN')
  const bearerTokens = Object.freeze({
    'campaign-author': env.BIOCHEMICAL_REVALIDATION_AUTHOR_BEARER_TOKEN,
    'inference-executor': env.BIOCHEMICAL_REVALIDATION_EXECUTOR_BEARER_TOKEN
  })
  for (const [role, token] of Object.entries(bearerTokens)) {
    if (typeof token !== 'string' || token.length < 16 || token.length > 4096) throw new TypeError(`BIOCHEMICAL_REVALIDATION_${role === 'campaign-author' ? 'AUTHOR' : 'EXECUTOR'}_BEARER_TOKEN must contain 16 to 4096 characters`)
  }
  if (bearerTokens['campaign-author'] === bearerTokens['inference-executor']) throw new TypeError('Revalidation role-specific bearer tokens must be distinct')
  const bootstrapKey = verifyKey({
    key_schema_version: '1.0.0',
    key_id: env.BIOCHEMICAL_REVALIDATION_BOOTSTRAP_KEY_ID,
    algorithm: 'Ed25519',
    public_key: env.BIOCHEMICAL_REVALIDATION_BOOTSTRAP_PUBLIC_KEY
  })
  const rolePolicyId = env.BIOCHEMICAL_REVALIDATION_ROLE_POLICY_ID
  if (!/^sha256:[a-f0-9]{64}$/.test(rolePolicyId ?? '')) throw new TypeError('BIOCHEMICAL_REVALIDATION_ROLE_POLICY_ID must be a SHA-256 identity')
  const fetchImpl = options.fetchImpl ?? fetch

  async function request(path, { method = 'GET', body = null, schema, label, actorRole = 'campaign-author', signal }) {
    const url = new URL(path, root)
    if (url.origin !== root || !url.pathname.startsWith('/api/revalidation/v1/')) throw new RevalidationProducerError('producer-path-invalid', 'Producer request escaped the pinned revalidation root.')
    let response
    try {
      response = await fetchImpl(url, {
        method,
        redirect: 'error',
        headers: { origin, authorization: `Bearer ${bearerTokens[actorRole]}`, ...(body === null ? {} : { 'content-type': 'application/json' }) },
        body: body === null ? undefined : canonicalJson(body),
        signal
      })
    } catch (error) {
      if (signal?.aborted) throw signal.reason
      throw new RevalidationProducerError('producer-unavailable', error instanceof Error ? error.message : 'Producer request failed.', 503)
    }
    if (!response.headers.get('cache-control')?.split(',').map((item) => item.trim()).includes('no-store') || response.headers.get('pragma') !== 'no-cache' || response.headers.has('etag')) throw new RevalidationProducerError('producer-cache-boundary-invalid', 'Producer response does not enforce the no-store boundary.')
    const bytes = Buffer.from(await response.arrayBuffer())
    if (!response.ok) {
      let detail = `Producer returned ${response.status}.`
      try { detail = String(JSON.parse(bytes.toString('utf8')).detail ?? detail) } catch {}
      throw new RevalidationProducerError(response.status === 409 ? 'producer-conflict' : 'producer-status', detail, response.status)
    }
    return parseCanonical(bytes, schema, label)
  }

  async function events(signal) {
    const items = []
    const paths = new Set()
    let path = '/api/revalidation/v1/events?limit=100'
    let expectedHead = null
    while (path) {
      signal?.throwIfAborted()
      if (paths.has(path)) throw new RevalidationProducerError('producer-pagination-invalid', 'Producer event pagination repeated a cursor.')
      paths.add(path)
      const page = await request(path, { schema: ProducerEventPageSchema, label: 'Producer event page', signal })
      const head = `${page.head_sequence}\0${page.head_digest}`
      if (expectedHead !== null && head !== expectedHead) throw new RevalidationProducerError('producer-event-head-drift', 'Producer event pagination changed heads.')
      expectedHead = head
      items.push(...page.items)
      if (items.length > MAX_PRODUCER_COLLECTION_ITEMS + 100) throw new RevalidationProducerError('producer-pagination-invalid', 'Producer event pagination exceeds its bounded collection contract.')
      if (page.next_cursor !== null && page.items.length === 0) throw new RevalidationProducerError('producer-pagination-invalid', 'Producer event pagination did not advance.')
      path = page.next_cursor === null ? null : `/api/revalidation/v1/events?limit=100&cursor=${encodeURIComponent(page.next_cursor)}`
    }
    const verified = verifyProducerEventChain(items, bootstrapKey, rolePolicyId)
    const [sequenceText, digest] = expectedHead?.split('\0') ?? ['0', 'null']
    if (verified.head.sequence !== Number(sequenceText) || String(verified.head.digest) !== digest) throw new RevalidationProducerError('producer-event-head-drift', 'Producer event page head does not match its signed chain.')
    return verified
  }

  async function state(headSequence = null, signal) {
    const path = `/api/revalidation/v1/state${headSequence === null ? '' : `?head_sequence=${headSequence}`}`
    return request(path, { schema: ProducerStateSchema, label: 'Producer revalidation state', signal })
  }

  async function activePlan() {
    const manifest = await request('/api/revalidation/v1/plans/active', { schema: ProducerPlanManifestSchema, label: 'Producer plan manifest' })
    const collections = {}
    for (const collection of ['impacts', 'work-items']) {
      const items = []
      const paths = new Set()
      let path = `/api/revalidation/v1/plans/active/${collection}?limit=100`
      while (path) {
        if (paths.has(path)) throw new RevalidationProducerError('producer-pagination-invalid', 'Producer plan pagination repeated a cursor.')
        paths.add(path)
        const page = await request(path, { schema: ProducerPlanPageSchema, label: 'Producer plan page' })
        if (page.collection !== collection || page.plan_id !== manifest.plan.plan_id || page.total !== (collection === 'impacts' ? manifest.plan.impact_count : manifest.plan.work_item_count)) throw new RevalidationProducerError('producer-plan-page-invalid', 'Producer plan page differs from its manifest.')
        items.push(...page.items)
        if (items.length > MAX_PRODUCER_COLLECTION_ITEMS || items.length > page.total) throw new RevalidationProducerError('producer-pagination-invalid', 'Producer plan pagination exceeds its declared bounded collection.')
        if (page.next_cursor !== null && page.items.length === 0) throw new RevalidationProducerError('producer-pagination-invalid', 'Producer plan pagination did not advance.')
        path = page.next_cursor === null ? null : `/api/revalidation/v1/plans/active/${collection}?limit=100&cursor=${encodeURIComponent(page.next_cursor)}`
      }
      if (items.length !== (collection === 'impacts' ? manifest.plan.impact_count : manifest.plan.work_item_count)) throw new RevalidationProducerError('producer-pagination-invalid', 'Producer plan pagination did not close over its declared collection.')
      collections[collection] = items
    }
    const { impact_count: _impactCount, work_item_count: _workItemCount, ...header } = manifest.plan
    const planning = {
      dependencySnapshot: manifest.dependency_snapshot,
      changeSet: manifest.change_set,
      impactPolicy: manifest.impact_policy,
      impactPlan: { ...header, impacts: collections.impacts, work_items: collections['work-items'] }
    }
    verifyImpactPlan(planning)
    return immutable(planning)
  }

  async function materializedState(chain, sequence, signal) {
    const selectedChain = verifyProducerEventChain(chain.events.slice(0, sequence), bootstrapKey, rolePolicyId)
    const selectedEvents = selectedChain.events
    const campaigns = new Map()
    const outcomes = new Map()
    const outcomeEvents = new Map()
    for (const event of selectedEvents.filter((candidate) => candidate.payload.action === 'outcome-recorded')) {
      const key = `${event.payload.campaign_id}\0${event.payload.work_id}`
      if (outcomeEvents.has(key)) throw new RevalidationProducerError('producer-state-closure-invalid', `Producer campaign/work outcome transition is repeated at event ${event.sequence}.`)
      outcomeEvents.set(key, event)
    }
    const labelEvents = new Map()
    for (const event of selectedEvents.filter((candidate) => candidate.payload.action === 'outcome-labeled')) {
      if (labelEvents.has(event.payload.outcome_id)) throw new RevalidationProducerError('producer-state-closure-invalid', `Producer outcome ${event.payload.outcome_id} has repeated labels.`)
      labelEvents.set(event.payload.outcome_id, event)
    }
    for (const event of selectedEvents) {
      signal?.throwIfAborted()
      if (event.payload.action !== 'campaign-created') continue
      const campaign = verifyCampaignRecord(await request(`/api/revalidation/v1/campaigns/${encodeURIComponent(event.payload.campaign_id)}`, { schema: ProducerCampaignResponseSchema, label: 'Producer campaign', signal }))
      if (campaign.event_sequence !== event.sequence || campaign.specification.campaign_id !== event.payload.campaign_id || campaign.plan.plan_id !== event.payload.plan_id || campaigns.has(event.payload.campaign_id)) throw new RevalidationProducerError('producer-state-closure-invalid', `Producer campaign state differs at event ${event.sequence}.`)
      campaigns.set(event.payload.campaign_id, {
        campaign,
        workById: new Map(campaign.plan.work_items.map((item) => [item.work_id, item])),
        projected: { campaign_id: campaign.specification.campaign_id, plan_id: campaign.plan.plan_id, work_ids: campaign.specification.work_ids, outcomes: [] }
      })
    }
    for (const selectedCampaign of campaigns.values()) {
      let path = `/api/revalidation/v1/campaigns/${encodeURIComponent(selectedCampaign.campaign.specification.campaign_id)}/outcomes?limit=100&head_sequence=${sequence}`
      const paths = new Set()
      while (path) {
        signal?.throwIfAborted()
        if (paths.has(path)) throw new RevalidationProducerError('producer-pagination-invalid', 'Producer outcome pagination repeated a cursor.')
        paths.add(path)
        const page = await request(path, { schema: ProducerOutcomePageSchema, label: 'Producer outcome page', signal })
        if (page.campaign_id !== selectedCampaign.campaign.specification.campaign_id || page.head_sequence !== sequence || page.head_digest !== selectedChain.head.digest) throw new RevalidationProducerError('producer-state-closure-invalid', 'Producer outcome page differs from its historical head.')
        for (const response of page.items) {
          const outcome = verifyProducerOutcome(response.outcome)
          const event = outcomeEvents.get(`${outcome.campaign_id}\0${outcome.work_id}`)
          if (!event || response.event_sequence !== event.sequence || outcome.outcome_id !== event.payload.outcome_id || outcomes.has(outcome.outcome_id)) throw new RevalidationProducerError('producer-state-closure-invalid', `Producer outcome state differs for ${outcome.work_id}.`)
          const work = selectedCampaign.workById.get(outcome.work_id)
          if (!work || (outcome.artifact !== null && outcome.artifact.artifact_class !== work.expected_artifact_class)) throw new RevalidationProducerError('producer-state-closure-invalid', `Producer outcome artifact differs at event ${event.sequence}.`)
          const labelEvent = labelEvents.get(outcome.outcome_id) ?? null
          if ((response.label_sequence === null) !== (response.scientific_label === null) || (labelEvent === null) !== (response.label_sequence === null)) throw new RevalidationProducerError('producer-state-closure-invalid', `Producer outcome label state differs for ${outcome.outcome_id}.`)
          if (labelEvent && (response.label_sequence !== labelEvent.sequence || response.scientific_label !== labelEvent.payload.scientific_label || labelEvent.payload.campaign_id !== outcome.campaign_id || labelEvent.payload.work_id !== outcome.work_id)) throw new RevalidationProducerError('producer-state-closure-invalid', `Producer outcome label binding differs for ${outcome.outcome_id}.`)
          const projected = { work_id: outcome.work_id, outcome_id: outcome.outcome_id, execution_status: outcome.execution_status, scientific_label: response.scientific_label }
          selectedCampaign.projected.outcomes.push(projected)
          outcomes.set(outcome.outcome_id, projected)
          if (selectedCampaign.projected.outcomes.length > MAX_PRODUCER_COLLECTION_ITEMS || selectedCampaign.projected.outcomes.length > page.total) throw new RevalidationProducerError('producer-pagination-invalid', 'Producer outcome pagination exceeds its declared bounded collection.')
        }
        if (page.next_cursor !== null && page.items.length === 0) throw new RevalidationProducerError('producer-pagination-invalid', 'Producer outcome pagination did not advance.')
        path = page.next_cursor === null ? null : `/api/revalidation/v1/campaigns/${encodeURIComponent(page.campaign_id)}/outcomes?limit=100&cursor=${encodeURIComponent(page.next_cursor)}`
      }
      if (selectedCampaign.projected.outcomes.length > selectedCampaign.campaign.specification.work_ids.length) throw new RevalidationProducerError('producer-pagination-invalid', 'Producer outcome pagination exceeds the campaign work closure.')
    }
    if (outcomes.size !== outcomeEvents.size) throw new RevalidationProducerError('producer-state-closure-invalid', 'Producer outcome pages do not close over every signed outcome event.')
    for (const event of selectedEvents) {
      if (event.payload.action === 'outcome-labeled' && (!outcomes.has(event.payload.outcome_id) || outcomes.get(event.payload.outcome_id).scientific_label !== event.payload.scientific_label)) throw new RevalidationProducerError('producer-state-closure-invalid', `Producer label state differs at event ${event.sequence}.`)
    }
    const keys = [...selectedChain.keys.values()].map((value) => ({
      key_id: value.key.key_id,
      algorithm: value.key.algorithm,
      active_from: value.activeFrom,
      retired_from: value.retiredFrom,
      revoked_from: value.revokedFrom,
      status: statusAt(value, sequence || 1)
    })).sort((left, right) => left.key_id.localeCompare(right.key_id))
    const projectedCampaigns = [...campaigns.values()].map((value) => {
      value.projected.outcomes.sort((left, right) => left.work_id.localeCompare(right.work_id))
      return value.projected
    }).sort((left, right) => left.campaign_id.localeCompare(right.campaign_id))
    return ProducerStateSchema.parse({ state_schema_version: '1.0.0', head_sequence: sequence, head_digest: selectedChain.head.digest, keys, campaigns: projectedCampaigns })
  }

  async function verifyHead(sequence, digest, signal) {
    const chain = await events(signal)
    if (sequence > chain.head.sequence) throw new RevalidationProducerError('producer-event-head-drift', 'Pinned producer event head is unavailable.')
    const selectedDigest = sequence === 0 ? null : chain.events[sequence - 1]?.event_digest
    if (selectedDigest !== digest) throw new RevalidationProducerError('producer-event-head-drift', 'Pinned producer event digest changed.')
    const selected = await state(sequence, signal)
    if (selected.head_sequence !== sequence || selected.head_digest !== digest) throw new RevalidationProducerError('producer-event-head-drift', 'Producer historical replay differs from the pinned event head.')
    const projected = await materializedState(chain, sequence, signal)
    if (canonicalJson(selected) !== canonicalJson(projected)) throw new RevalidationProducerError('producer-state-closure-invalid', 'Producer historical materialized state differs from its signed event closure.')
    return immutable({ chain, state: selected, event: sequence === 0 ? null : chain.events[sequence - 1] })
  }

  return Object.freeze({
    root,
    bootstrapKey,
    rolePolicyId,
    activePlan,
    state,
    events,
    verifyHead,
    async submitCampaign(campaign, event) {
      const body = ProducerCampaignWriteRequestSchema.parse({ campaign, event })
      return request('/api/revalidation/v1/campaigns', { method: 'POST', body, schema: ProducerCampaignReceiptSchema, label: 'Producer campaign receipt', actorRole: 'campaign-author' })
    },
    async campaign(campaignId, signal) {
      return verifyCampaignRecord(await request(`/api/revalidation/v1/campaigns/${encodeURIComponent(campaignId)}`, { schema: ProducerCampaignResponseSchema, label: 'Producer campaign', signal }))
    },
    async submitOutcome(outcome, event) {
      const verified = verifyProducerOutcome(outcome)
      const raw = identityPayload(verified, 'outcome_id')
      delete raw.outcome_schema_version
      const body = ProducerOutcomeWriteRequestSchema.parse({ outcome: raw, event })
      const receipt = await request('/api/revalidation/v1/outcomes', { method: 'POST', body, schema: ProducerOutcomeReceiptSchema, label: 'Producer outcome receipt', actorRole: 'inference-executor' })
      verifyProducerOutcome(receipt.outcome)
      return receipt
    },
    async submitOutcomes(outcomes, event) {
      const verified = outcomes.map((outcome) => verifyProducerOutcome(outcome))
      const raw = verified.map((outcome) => {
        const value = identityPayload(outcome, 'outcome_id')
        delete value.outcome_schema_version
        return value
      })
      const body = ProducerOutcomeBatchWriteRequestSchema.parse({ outcomes: raw, event })
      const receipts = await request('/api/revalidation/v1/outcomes/batch', { method: 'POST', body, schema: ProducerOutcomeBatchReceiptSchema, label: 'Producer outcome batch receipt', actorRole: 'inference-executor' })
      receipts.forEach((receipt) => verifyProducerOutcome(receipt.outcome))
      return receipts
    },
    async outcome(campaignId, workId) {
      return request(`/api/revalidation/v1/campaigns/${encodeURIComponent(campaignId)}/outcomes/${encodeURIComponent(workId)}`, { schema: ProducerOutcomeResponseSchema, label: 'Producer outcome' })
    }
  })
}
