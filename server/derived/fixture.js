import { Buffer } from 'node:buffer'
import { APAP_RELEASE_DIGEST, APAP_RELEASE_ID } from '../../shared/apap-contracts.js'
import { canonicalDigest, canonicalJson } from '../../shared/canonical-json.js'
import {
  AssertionDetailSchema,
  AssertionEventsSchema,
  AssertionListSchema,
  BundleDetailSchema,
  BundleSubmitResponseSchema,
  DerivedHealthSchema,
  EventAppendResponseSchema,
  ImpactRequestSchema,
  ImpactResponseSchema,
  LayeredQueryResponseSchema,
  LayeredQuerySchema,
  MeasurementComparisonRequestSchema,
  MeasurementComparisonResponseSchema,
  ReviewEventRequestSchema,
  SourceRecordsResponseSchema,
  SourceSelectorSchema
} from '../../shared/derived-contracts.js'
import { createApapFixtureClient } from '../apap/fixture.js'
import { verifyDerivedBundle } from './bundle.js'

const clone = (value) => structuredClone(value)

function initialState() {
  return { review_status: 'pending', reproduction_verified: false, recalculation_requested: false, superseded_by: null, event_count: 0 }
}

function nextState(state, event, assertions) {
  if (state.review_status === 'pending') {
    if (!['accepted', 'rejected'].includes(event.action)) throw new Error(`${event.action} is not allowed from pending`)
    return { ...initialState(), review_status: event.action, event_count: state.event_count + 1 }
  }
  if (state.review_status !== 'accepted') throw new Error(`${event.action} is not allowed from ${state.review_status}`)
  if (!['superseded', 'invalidated', 'reproduction-verified', 'recalculation-requested'].includes(event.action)) throw new Error(`${event.action} is not allowed from accepted`)
  if (event.action === 'reproduction-verified' && state.reproduction_verified) throw new Error('reproduction is already verified')
  if (event.action === 'superseded') {
    const target = assertions.get(event.related_assertion_digest)
    if (!target || target.state.review_status !== 'accepted') throw new Error('superseding assertion must already be accepted')
  }
  return {
    review_status: ['superseded', 'invalidated'].includes(event.action) ? event.action : 'accepted',
    reproduction_verified: state.reproduction_verified || event.action === 'reproduction-verified',
    recalculation_requested: state.recalculation_requested || event.action === 'recalculation-requested',
    superseded_by: event.action === 'superseded' ? event.related_assertion_digest : state.superseded_by,
    event_count: state.event_count + 1
  }
}

export function createDerivedFixtureClient() {
  const bundles = new Map()
  const assertions = new Map()
  const apap = createApapFixtureClient()
  const keyId = canonicalDigest('biochemical-inference-derived-fixture-key')

  async function sourceRecords(input) {
    const selector = SourceSelectorSchema.parse(input)
    if (selector.family !== 'apap' || selector.release_id !== APAP_RELEASE_ID) throw new Error(`Unknown fixture source release: ${selector.family}/${selector.release_id}`)
    let items
    if (['contexts', 'parameters', 'protocols', 'observations', 'assumptions', 'limitations'].includes(selector.collection)) {
      items = (await apap[selector.collection]()).items
    } else if (selector.collection === 'validation_matrix') {
      items = (await apap.validationMatrix()).items
    } else if (['compounds', 'proteins'].includes(selector.collection)) {
      items = (await apap.detail()).benchmark[selector.collection]
    } else {
      throw new Error(`Unknown fixture APAP collection: ${selector.collection}`)
    }
    const selected = items.filter((item) => selector.record_id === null || item.id === selector.record_id)
    if (selector.record_id !== null && selected.length === 0) throw new Error(`Unknown fixture APAP record: ${selector.record_id}`)
    return SourceRecordsResponseSchema.parse({
      layer: 'source',
      items: selected.map((record) => ({ family: 'apap', release_id: APAP_RELEASE_ID, release_digest: `sha256:${APAP_RELEASE_DIGEST}`, collection: selector.collection, record_digest: canonicalDigest(record), record: clone(record) }))
    })
  }

  function list(filters = {}, reviewed = false) {
    const items = [...assertions.values()]
      .filter((item) => !filters.subject_id || item.assertion.subject_id === filters.subject_id)
      .filter((item) => !filters.classification || item.assertion.classification === filters.classification)
      .filter((item) => !filters.review_status || item.state.review_status === filters.review_status)
      .filter((item) => !reviewed || item.state.review_status === 'accepted')
      .sort((left, right) => left.digest.localeCompare(right.digest))
      .map(({ digest, assertion, state }) => clone({ digest, assertion, state }))
    return AssertionListSchema.parse({ layer: reviewed ? 'reviewed-derived' : 'derived-review-workspace', items })
  }

  return {
    async health() {
      return DerivedHealthSchema.parse({ status: 'ok', journal_mode: 'wal', bundles: bundles.size, assertions: assertions.size, content_objects: [...bundles.values()].reduce((total, item) => total + item.bundle.objects.length, 0), events: [...assertions.values()].reduce((total, item) => total + item.events.length, 0) })
    },
    async submitBundle(input) {
      const submission = verifyDerivedBundle(input)
      if (bundles.has(submission.digest)) return BundleSubmitResponseSchema.parse({ created: false, bundle_digest: submission.digest, assertion_digests: submission.bundle.assertions.map((item) => item.digest) })
      bundles.set(submission.digest, { digest: submission.digest, submitted_at: '2026-07-13T00:00:00.000Z', bundle: clone(submission.bundle) })
      for (const wrapped of submission.bundle.assertions) assertions.set(wrapped.digest, { digest: wrapped.digest, assertion: clone(wrapped.assertion), state: initialState(), events: [] })
      return BundleSubmitResponseSchema.parse({ created: true, bundle_digest: submission.digest, assertion_digests: submission.bundle.assertions.map((item) => item.digest) })
    },
    async bundle(digest) {
      const item = bundles.get(digest)
      if (!item) throw new Error(`Unknown fixture derived bundle: ${digest}`)
      return BundleDetailSchema.parse(clone(item))
    },
    async assertions(filters = {}) { return list(filters, false) },
    async reviewedAssertions(filters = {}) { return list(filters, true) },
    async assertion(digest) {
      const item = assertions.get(digest)
      if (!item) throw new Error(`Unknown fixture derived assertion: ${digest}`)
      return AssertionDetailSchema.parse(clone({ digest, assertion: item.assertion, state: item.state }))
    },
    async events(digest) {
      const item = assertions.get(digest)
      if (!item) throw new Error(`Unknown fixture derived assertion: ${digest}`)
      return AssertionEventsSchema.parse(clone({ assertion_digest: digest, items: item.events }))
    },
    async appendEvent(digest, input) {
      const request = ReviewEventRequestSchema.parse(input)
      const item = assertions.get(digest)
      if (!item) throw new Error(`Unknown fixture derived assertion: ${digest}`)
      if (request.action === 'reproduction-verified' && request.reproduction_artifact_digest !== item.assertion.reproduction.result_artifact_digest) throw new Error('reproduction event must pin the declared result artifact')
      const sequence = item.events.length + 1
      const unsigned = {
        contract_version: '1.0.0', assertion_digest: digest, sequence, action: request.action, reviewer: request.reviewer,
        occurred_at: `2026-07-13T00:00:${String(sequence).padStart(2, '0')}.000Z`, reason: request.reason,
        related_assertion_digest: request.related_assertion_digest, reproduction_artifact_digest: request.reproduction_artifact_digest,
        previous_event_digest: item.events.at(-1)?.event_digest ?? null
      }
      item.state = nextState(item.state, request, assertions)
      const event = { ...unsigned, event_digest: canonicalDigest(unsigned), key_id: keyId, signature: Buffer.alloc(64, sequence).toString('base64') }
      item.events.push(event)
      return EventAppendResponseSchema.parse(clone({ event, state: item.state }))
    },
    sourceRecords,
    async query(input) {
      const request = LayeredQuerySchema.parse(input)
      const response = { layers: request.layers }
      if (request.source) response.source = (await sourceRecords(request.source)).items
      if (request.layers.includes('reviewed-derived')) response['reviewed-derived'] = list(request.reviewed_derived ?? {}, true).items
      return LayeredQueryResponseSchema.parse(response)
    },
    async impact(input) {
      const request = ImpactRequestSchema.parse(input)
      const changes = new Map(request.changes.map((item) => [canonicalJson(item.previous), item.current_digest]))
      const items = list().items.flatMap((item) => {
        const reasons = item.assertion.dependencies.flatMap((dependency) => {
          const current = changes.get(canonicalJson(dependency))
          return current && current !== dependency.digest ? [{ dependency, pinned_digest: dependency.digest, current_digest: current }] : []
        })
        return reasons.length ? [{ assertion_digest: item.digest, state: item.state, reasons, automatically_invalidated: false }] : []
      })
      return ImpactResponseSchema.parse({ items, automatic_invalidation: false })
    },
    async compare(input) {
      const request = MeasurementComparisonRequestSchema.parse(input)
      const item = assertions.get(request.assertion_digest)
      if (!item || item.state.review_status !== 'accepted') throw new Error('measurement comparison requires an accepted assertion')
      const unitCompatible = canonicalJson(item.assertion.unit.dimension) === canonicalJson(request.measurement.unit.dimension)
      const contextCompatible = canonicalJson(item.assertion.context) === canonicalJson(request.measurement.context)
      const derived = item.assertion.value.kind === 'scalar' ? item.assertion.value.value * item.assertion.unit.scale_to_si : null
      const measured = request.measurement.value * request.measurement.unit.scale_to_si
      return MeasurementComparisonResponseSchema.parse({
        assertion_digest: request.assertion_digest,
        measurement_record: request.measurement.record,
        unit_compatible: unitCompatible,
        context_compatible: contextCompatible,
        comparable: unitCompatible && contextCompatible,
        comparison: unitCompatible && contextCompatible && derived !== null ? { derived_si: derived, measurement_si: measured, absolute_difference_si: measured - derived, relative_difference: derived === 0 ? null : (measured - derived) / Math.abs(derived) } : null,
        automatically_invalidated: false
      })
    }
  }
}
