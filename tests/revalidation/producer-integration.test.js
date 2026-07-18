import { generateKeyPairSync, sign as signBytes } from 'node:crypto'
import { rm } from 'node:fs/promises'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { canonicalJson } from '../../shared/canonical-json.js'
import {
  createProducerCampaign,
  createProducerOutcome,
  createRevalidationProducerClient,
  RevalidationProducerError,
  verifyProducerEventChain
} from '../../server/revalidation/client.js'
import { loadGoal11RevalidationFixture } from '../../server/revalidation/fixture.js'
import { identityPayload, revalidationIdentity } from '../../server/revalidation/identity.js'
import { createRevalidationIntegrationService } from '../../server/revalidation/integration.js'
import { isolatedTestRoot } from '../fixtures/test-root.js'

const roots = []
const services = []
const author = { id: 'inference:campaign-author', role: 'campaign-author', organization: 'Biochemical Inference' }
const executor = { id: 'inference:executor', role: 'inference-executor', organization: 'Biochemical Inference' }
const administrator = { id: 'producer:key-admin', role: 'key-administrator', organization: 'Biochemical DB' }
const reviewer = { id: 'review:scientist', role: 'scientific-reviewer', organization: 'Independent Review' }
const rolePolicyId = revalidationIdentity({ policy: 'goal15-test-role-policy' })

afterEach(async () => {
  await Promise.allSettled(services.splice(0).map((service) => service.close()))
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function testRoot(name) {
  const root = await isolatedTestRoot(name)
  roots.push(root)
  return root
}

function producerEnvironment(producer) {
  return {
    NODE_ENV: 'test',
    BIOCHEMICAL_REVALIDATION_URL: producer.root,
    BIOCHEMICAL_REVALIDATION_ALLOWED_ORIGIN: 'http://127.0.0.1:5173',
    BIOCHEMICAL_REVALIDATION_AUTHOR_BEARER_TOKEN: 'test-producer-author-token-0001',
    BIOCHEMICAL_REVALIDATION_EXECUTOR_BEARER_TOKEN: 'test-producer-executor-token-0001',
    BIOCHEMICAL_REVALIDATION_BOOTSTRAP_KEY_ID: producer.bootstrapKey.key_id,
    BIOCHEMICAL_REVALIDATION_BOOTSTRAP_PUBLIC_KEY: producer.bootstrapKey.public_key,
    BIOCHEMICAL_REVALIDATION_ROLE_POLICY_ID: rolePolicyId
  }
}

class TestProducer {
  constructor() {
    const pair = generateKeyPairSync('ed25519')
    const publicKey = pair.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64')
    const payload = { key_schema_version: '1.0.0', algorithm: 'Ed25519', public_key: publicKey }
    this.bootstrapKey = { ...payload, key_id: revalidationIdentity(payload) }
    this.rolePolicyId = rolePolicyId
    this.privateKey = pair.privateKey
    this.privateKeys = new Map([[this.bootstrapKey.key_id, pair.privateKey]])
    this.root = 'http://127.0.0.1:47831'
    this.eventValues = []
    this.campaignValues = new Map()
    this.outcomeValues = new Map()
    this.stateDrift = false
    this.lastRequest = null
    this.rotateOnNextCampaign = false
    this.stalledEventPagination = false
    this.fetch = this.fetch.bind(this)
  }

  append(payload, metadata) {
    const body = {
      event_schema_version: '1.0.0',
      sequence: this.eventValues.length + 1,
      previous_event_digest: this.eventValues.at(-1)?.event_digest ?? null,
      occurred_at: `2026-07-17T12:00:${String(this.eventValues.length + 1).padStart(2, '0')}Z`,
      actor: metadata.actor,
      reason: metadata.reason,
      role_policy_id: rolePolicyId,
      signing_key_id: metadata.signing_key_id,
      algorithm: 'Ed25519',
      payload
    }
    const event = {
      ...body,
      event_digest: revalidationIdentity(body),
      signature: signBytes(null, Buffer.from(canonicalJson(body)), this.privateKeys.get(metadata.signing_key_id)).toString('base64')
    }
    this.eventValues.push(event)
    return event
  }

  async submitCampaign(campaign, metadata) {
    if (this.rotateOnNextCampaign) {
      this.rotateOnNextCampaign = false
      this.rotate()
      throw new RevalidationProducerError('producer-conflict', 'requested signing key is not active at the next event sequence', 409)
    }
    const campaignId = campaign.specification.campaign_id
    const existing = this.campaignValues.get(campaignId)
    if (existing) return { created: false, campaign_id: campaignId, event_sequence: existing.event_sequence, event: this.eventValues[existing.event_sequence - 1] }
    const event = this.append({ action: 'campaign-created', campaign_id: campaignId, plan_id: campaign.plan.plan_id }, metadata)
    this.campaignValues.set(campaignId, { ...campaign, event_sequence: event.sequence })
    return { created: true, campaign_id: campaignId, event_sequence: event.sequence, event }
  }

  async campaign(campaignId) {
    return structuredClone(this.campaignValues.get(campaignId))
  }

  async submitOutcome(outcome, metadata) {
    const key = `${outcome.campaign_id}\0${outcome.work_id}`
    const existing = this.outcomeValues.get(key)
    if (existing) return { created: false, outcome: existing.outcome, event_sequence: existing.event_sequence, event: this.eventValues[existing.event_sequence - 1] }
    const event = this.append({ action: 'outcome-recorded', campaign_id: outcome.campaign_id, work_id: outcome.work_id, outcome_id: outcome.outcome_id }, metadata)
    this.outcomeValues.set(key, { outcome, event_sequence: event.sequence, scientific_label: null, label_sequence: null })
    return { created: true, outcome, event_sequence: event.sequence, event }
  }

  async submitOutcomes(outcomes, metadata) {
    const receipts = []
    for (const outcome of outcomes) receipts.push(await this.submitOutcome(outcome, metadata))
    return receipts
  }

  async outcome(campaignId, workId) {
    return structuredClone(this.outcomeValues.get(`${campaignId}\0${workId}`))
  }

  rotate() {
    const pair = generateKeyPairSync('ed25519')
    const publicKey = pair.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64')
    const payload = { key_schema_version: '1.0.0', algorithm: 'Ed25519', public_key: publicKey }
    const key = { ...payload, key_id: revalidationIdentity(payload) }
    this.privateKeys.set(key.key_id, pair.privateKey)
    this.append({ action: 'key-rotated', key, retiring_key_id: this.bootstrapKey.key_id, effective_sequence: this.eventValues.length + 2 }, { actor: administrator, reason: 'Rotate during an in-flight producer write.', signing_key_id: this.bootstrapKey.key_id })
    return key
  }

  labelOutcome(campaignId, workId, scientificLabel) {
    const selected = this.outcomeValues.get(`${campaignId}\0${workId}`)
    const chain = verifyProducerEventChain(this.eventValues, this.bootstrapKey, rolePolicyId)
    const signing = [...chain.keys.values()].find((value) => value.activeFrom <= chain.head.sequence + 1 && (value.retiredFrom === null || value.retiredFrom > chain.head.sequence + 1))
    const event = this.append({ action: 'outcome-labeled', campaign_id: campaignId, work_id: workId, outcome_id: selected.outcome.outcome_id, scientific_label: scientificLabel }, { actor: reviewer, reason: 'Record independent scientific review.', signing_key_id: signing.key.key_id })
    selected.scientific_label = scientificLabel
    selected.label_sequence = event.sequence
    return event
  }

  async events() {
    return verifyProducerEventChain(this.eventValues, this.bootstrapKey, rolePolicyId)
  }

  async verifyHead(sequence, digest) {
    const chain = await this.events()
    if ((sequence === 0 ? null : chain.events[sequence - 1]?.event_digest) !== digest) throw new Error('producer head mismatch')
    return { chain, state: this.stateAt(sequence), event: sequence === 0 ? null : chain.events[sequence - 1] }
  }

  stateAt(sequence) {
    const chain = verifyProducerEventChain(this.eventValues.slice(0, sequence), this.bootstrapKey, rolePolicyId)
    const campaigns = [...this.campaignValues.values()].filter((campaign) => campaign.event_sequence <= sequence).map((campaign) => ({
      campaign_id: campaign.specification.campaign_id,
      plan_id: campaign.plan.plan_id,
      work_ids: campaign.specification.work_ids,
      outcomes: [...this.outcomeValues.values()].filter((value) => value.event_sequence <= sequence && value.outcome.campaign_id === campaign.specification.campaign_id).map((value) => ({
        work_id: value.outcome.work_id,
        outcome_id: value.outcome.outcome_id,
        execution_status: this.stateDrift ? 'failed' : value.outcome.execution_status,
        scientific_label: value.label_sequence !== null && value.label_sequence <= sequence ? value.scientific_label : null
      })).sort((left, right) => left.work_id.localeCompare(right.work_id))
    })).sort((left, right) => left.campaign_id.localeCompare(right.campaign_id))
    return {
      state_schema_version: '1.0.0',
      head_sequence: sequence,
      head_digest: sequence === 0 ? null : this.eventValues[sequence - 1].event_digest,
      keys: [...chain.keys.values()].map((value) => ({
        key_id: value.key.key_id,
        algorithm: value.key.algorithm,
        active_from: value.activeFrom,
        retired_from: value.retiredFrom,
        revoked_from: value.revokedFrom,
        status: value.revokedFrom !== null && sequence >= value.revokedFrom ? 'revoked' : value.retiredFrom !== null && sequence >= value.retiredFrom ? 'retired' : sequence >= value.activeFrom ? 'active' : 'pending'
      })).sort((left, right) => left.key_id.localeCompare(right.key_id)),
      campaigns
    }
  }

  response(value, status = 200) {
    return new Response(canonicalJson(value), { status, headers: { 'cache-control': 'no-store', 'content-type': 'application/json', pragma: 'no-cache' } })
  }

  async fetch(urlValue, options = {}) {
    const url = new URL(urlValue)
    this.lastRequest = { url, options }
    if (options.method === 'POST' && url.pathname.endsWith('/campaigns')) {
      const body = JSON.parse(options.body)
      return this.response(await this.submitCampaign(body.campaign, body.event), 201)
    }
    if (options.method === 'POST' && url.pathname.endsWith('/outcomes')) {
      const body = JSON.parse(options.body)
      return this.response(await this.submitOutcome(createProducerOutcome(body.outcome), body.event), 201)
    }
    if (url.pathname.endsWith('/events')) {
      return this.response({ page_schema_version: '1.0.0', head_sequence: this.eventValues.length, head_digest: this.eventValues.at(-1)?.event_digest ?? null, limit: 100, items: this.stalledEventPagination ? [] : this.eventValues, next_cursor: this.stalledEventPagination ? 'stalled' : null })
    }
    if (url.pathname.endsWith('/state')) return this.response(this.stateAt(url.searchParams.has('head_sequence') ? Number(url.searchParams.get('head_sequence')) : this.eventValues.length))
    if (/\/campaigns\/[^/]+\/outcomes$/.test(url.pathname)) {
      const campaignId = decodeURIComponent(url.pathname.split('/').at(-2))
      const head = Number(url.searchParams.get('head_sequence') ?? this.eventValues.length)
      const items = [...this.outcomeValues.values()].filter((value) => value.outcome.campaign_id === campaignId && value.event_sequence <= head).sort((left, right) => left.outcome.work_id.localeCompare(right.outcome.work_id))
      return this.response({ page_schema_version: '1.0.0', campaign_id: campaignId, head_sequence: head, head_digest: head === 0 ? null : this.eventValues[head - 1].event_digest, total: items.length, limit: 100, items, next_cursor: null })
    }
    if (/\/campaigns\/[^/]+\/outcomes\/[^/]+$/.test(url.pathname)) {
      const parts = url.pathname.split('/')
      return this.response(await this.outcome(decodeURIComponent(parts.at(-3)), decodeURIComponent(parts.at(-1))))
    }
    if (url.pathname.includes('/campaigns/')) return this.response(await this.campaign(decodeURIComponent(url.pathname.split('/').at(-1))))
    return this.response({ detail: 'Not Found' }, 404)
  }
}

async function waitFor(read, predicate, label) {
  for (let index = 0; index < 1000; index += 1) {
    const value = await read()
    if (predicate(value)) return value
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw new Error(`${label} did not reach its expected state`)
}

describe('Goal 15 producer client', () => {
  it('sends exact producer wire requests and verifies the full signed historical state closure', async () => {
    const producer = new TestProducer()
    const env = producerEnvironment(producer)
    const client = createRevalidationProducerClient(env, { fetchImpl: producer.fetch })
    const planning = await loadGoal11RevalidationFixture()
    const campaign = createProducerCampaign({ name: 'goal15-client-test', reason: 'Verify the signed producer state closure.', planning, actor: author })
    const metadata = { actor: author, reason: 'Create a test campaign.', signing_key_id: producer.bootstrapKey.key_id }
    const campaignReceipt = await client.submitCampaign(campaign, metadata)
    const work = planning.impactPlan.work_items[0]
    const outcome = createProducerOutcome({
      campaign_id: campaignReceipt.campaign_id,
      work_id: work.work_id,
      execution_status: 'succeeded',
      artifact: { artifact_class: work.expected_artifact_class, digest: revalidationIdentity({ artifact: 'test' }) },
      diagnostics: { review_required: true, automatically_accepted: false },
      executor
    })
    await client.submitOutcome(outcome, { actor: executor, reason: 'Record a test outcome.', signing_key_id: producer.bootstrapKey.key_id })
    expect(JSON.parse(producer.lastRequest.options.body).outcome).not.toHaveProperty('outcome_id')
    expect(JSON.parse(producer.lastRequest.options.body).outcome).not.toHaveProperty('outcome_schema_version')
    const head = producer.eventValues.at(-1)
    await expect(client.verifyHead(head.sequence, head.event_digest)).resolves.toMatchObject({ state: { head_sequence: 2 } })
    producer.stateDrift = true
    await expect(client.verifyHead(head.sequence, head.event_digest)).rejects.toMatchObject({ code: 'producer-state-closure-invalid' })
    expect(() => createRevalidationProducerClient({ ...env, BIOCHEMICAL_REVALIDATION_URL: 'http://[::1]:47831' }, { fetchImpl: producer.fetch })).not.toThrow()
  })

  it('retains historical verification across rotation and rejects unknown or revoked signers', () => {
    const bootstrap = new TestProducer()
    const rotatedPair = generateKeyPairSync('ed25519')
    const rotatedPublic = rotatedPair.publicKey.export({ format: 'der', type: 'spki' }).subarray(-32).toString('base64')
    const rotatedPayload = { key_schema_version: '1.0.0', algorithm: 'Ed25519', public_key: rotatedPublic }
    const rotatedKey = { ...rotatedPayload, key_id: revalidationIdentity(rotatedPayload) }
    const values = []
    const append = (payload, selectedActor, key, privateKey) => {
      const body = {
        event_schema_version: '1.0.0',
        sequence: values.length + 1,
        previous_event_digest: values.at(-1)?.event_digest ?? null,
        occurred_at: `2026-07-17T13:00:0${values.length + 1}Z`,
        actor: selectedActor,
        reason: 'Exercise the exact key lifecycle boundary.',
        role_policy_id: rolePolicyId,
        signing_key_id: key.key_id,
        algorithm: 'Ed25519',
        payload
      }
      const event = { ...body, event_digest: revalidationIdentity(body), signature: signBytes(null, Buffer.from(canonicalJson(body)), privateKey).toString('base64') }
      values.push(event)
      return event
    }
    append({ action: 'key-activated', key: rotatedKey, effective_sequence: 2 }, administrator, bootstrap.bootstrapKey, bootstrap.privateKey)
    append({ action: 'key-revoked', key_id: bootstrap.bootstrapKey.key_id, effective_sequence: 3 }, administrator, rotatedKey, rotatedPair.privateKey)
    expect(() => verifyProducerEventChain(values, bootstrap.bootstrapKey, rolePolicyId)).not.toThrow()

    const campaignPayload = { action: 'campaign-created', campaign_id: revalidationIdentity({ campaign: 'rotated' }), plan_id: revalidationIdentity({ plan: 'rotated' }) }
    append(campaignPayload, author, rotatedKey, rotatedPair.privateKey)
    expect(() => verifyProducerEventChain(values, bootstrap.bootstrapKey, rolePolicyId)).not.toThrow()
    values.pop()
    append(campaignPayload, author, bootstrap.bootstrapKey, bootstrap.privateKey)
    expect(() => verifyProducerEventChain(values, bootstrap.bootstrapKey, rolePolicyId)).toThrow(/not signed by an active pinned key/)

    const unknown = structuredClone(values.at(-1))
    unknown.signing_key_id = revalidationIdentity({ key: 'unknown' })
    expect(() => verifyProducerEventChain([...values.slice(0, -1), unknown], bootstrap.bootstrapKey, rolePolicyId)).toThrow(/not signed by an active pinned key/)
  })

  it('fails closed when bounded producer pagination does not advance', async () => {
    const producer = new TestProducer()
    producer.stalledEventPagination = true
    const client = createRevalidationProducerClient(producerEnvironment(producer), { fetchImpl: producer.fetch })
    await expect(client.events()).rejects.toMatchObject({ code: 'producer-pagination-invalid' })
  })

  it('rejects repeated signed campaign/work outcome transitions before materialization', async () => {
    const producer = new TestProducer()
    const client = createRevalidationProducerClient(producerEnvironment(producer), { fetchImpl: producer.fetch })
    const planning = await loadGoal11RevalidationFixture()
    const campaign = createProducerCampaign({ name: 'goal15-duplicate-outcome', reason: 'Reject duplicate signed outcome transitions.', planning, actor: author })
    const metadata = { actor: author, reason: 'Create the duplicate-outcome campaign.', signing_key_id: producer.bootstrapKey.key_id }
    const campaignReceipt = await client.submitCampaign(campaign, metadata)
    const work = planning.impactPlan.work_items[0]
    const outcome = createProducerOutcome({
      campaign_id: campaignReceipt.campaign_id,
      work_id: work.work_id,
      execution_status: 'succeeded',
      artifact: { artifact_class: work.expected_artifact_class, digest: revalidationIdentity({ artifact: 'duplicate-transition' }) },
      diagnostics: { review_required: true, automatically_accepted: false },
      executor
    })
    await client.submitOutcome(outcome, { actor: executor, reason: 'Record the first outcome.', signing_key_id: producer.bootstrapKey.key_id })
    producer.append({ action: 'outcome-recorded', campaign_id: outcome.campaign_id, work_id: outcome.work_id, outcome_id: outcome.outcome_id }, { actor: executor, reason: 'Duplicate the signed transition.', signing_key_id: producer.bootstrapKey.key_id })
    const head = producer.eventValues.at(-1)
    await expect(client.verifyHead(head.sequence, head.event_digest)).rejects.toMatchObject({ code: 'producer-state-closure-invalid' })
  })
})

describe('Goal 15 producer-bound integration', () => {
  it('closes an injected engine when producer client construction fails', async () => {
    const close = vi.fn(async () => undefined)
    await expect(createRevalidationIntegrationService({ env: {}, engine: { close } })).rejects.toThrow(/BIOCHEMICAL_REVALIDATION_URL/)
    expect(close).toHaveBeenCalledOnce()
  })

  it('closes an injected engine when initialization fails before resume', async () => {
    const close = vi.fn(async () => undefined)
    const failure = new Error('active plan failed')
    await expect(createRevalidationIntegrationService({
      env: {},
      engine: { close },
      producerClient: { activePlan: vi.fn(async () => { throw failure }) }
    })).rejects.toBe(failure)
    expect(close).toHaveBeenCalledOnce()
  })

  it('executes, records exactly one outcome per work, and resumes verified receipts after restart', async () => {
    const producer = new TestProducer()
    const root = await testRoot('revalidation-producer-integration')
    const planning = await loadGoal11RevalidationFixture()
    const options = { root, env: producerEnvironment(producer), producerClient: producer, planning, reconcileIntervalMs: 10, exposeTesting: true }
    let service = await createRevalidationIntegrationService(options)
    services.push(service)
    const created = await service.sync({ name: 'goal15-integration-test', reason: 'Execute the producer-bound integration test.' })
    const terminal = await waitFor(() => service.detail(created.campaign_id), (value) => value.state === 'terminal' && value.summary.submitted === value.summary.total, 'producer campaign')
    expect(terminal.summary).toMatchObject({ total: 6, succeeded: 6, submitted: 6 })
    expect(terminal.review).toEqual({ required: true, automatically_accepted: false, labeled_outcomes: 0 })
    expect(producer.outcomeValues.size).toBe(6)
    const firstWork = terminal.work[0]
    producer.labelOutcome(producer.campaignValues.keys().next().value, firstWork.work_id, 'inconclusive')
    await expect(service.report(created.campaign_id)).resolves.toMatchObject({ scientific_review: { producer_labeled_outcomes: 1 } })
    for (const work of terminal.work) {
      expect(work.producer_receipt.request.outcome).not.toHaveProperty('outcome_id')
      expect(work.producer_receipt.request.outcome).not.toHaveProperty('outcome_schema_version')
      expect(work.producer_receipt.receipt.outcome.executor).toEqual(executor)
    }
    await expect(service.integrity()).resolves.toMatchObject({ status: 'valid', producer: 'valid', accepted_results: 6 })
    const persistedEvents = service.testing.engine.producerEvents()
    expect(() => service.testing.engine.recordProducerChain(created.campaign_id, [{ ...persistedEvents[0], event_digest: `sha256:${'0'.repeat(64)}` }], terminal.producer.event_head)).toThrow(/sequence 1 conflicts/)
    await service.close()
    services.splice(services.indexOf(service), 1)

    service = await createRevalidationIntegrationService(options)
    services.push(service)
    await expect(service.detail(created.campaign_id)).resolves.toMatchObject({ state: 'terminal', summary: { total: 6, submitted: 6 }, review: { labeled_outcomes: 1 } })
    expect(producer.outcomeValues.size).toBe(6)
  })

  it('refreshes the active signing key and retries safely when rotation wins the write race', async () => {
    const producer = new TestProducer()
    producer.rotateOnNextCampaign = true
    const root = await testRoot('revalidation-producer-rotation-race')
    const planning = await loadGoal11RevalidationFixture()
    const service = await createRevalidationIntegrationService({ root, env: producerEnvironment(producer), producerClient: producer, planning, reconcileIntervalMs: 10 })
    services.push(service)
    const created = await service.sync({ name: 'goal15-rotation-race', reason: 'Verify rotation-safe producer retries.' })
    const terminal = await waitFor(() => service.detail(created.campaign_id), (value) => value.state === 'terminal' && value.summary.submitted === value.summary.total, 'rotation-safe campaign')
    expect(terminal.summary.submitted).toBe(6)
    expect(producer.eventValues[1].signing_key_id).toBe(producer.eventValues[0].payload.key.key_id)
  })
})
