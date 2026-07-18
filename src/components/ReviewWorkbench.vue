<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  appendDerivedReviewEvent,
  loadDerivedAssertion,
  loadDerivedAssertions,
  loadDerivedEvents,
  loadDerivedHealth,
  queryDerivedLayers,
  reproduceDerivedAssertion,
  submitApapDerivedBundle
} from '../api.js'

const props = defineProps({ apapRun: { type: Object, default: undefined } })

const health = ref()
const assertions = ref([])
const detail = ref()
const events = ref([])
const layers = ref()
const selectedDigest = ref('')
const state = ref('loading')
const message = ref('')
const reviewerName = ref('Local scientific reviewer')
const reviewerId = ref('local:goal8-reviewer')
const organization = ref('Local review workspace')
const role = ref('scientific-reviewer')
const reason = ref('Reviewed against the visible synthetic scope, lineage, context, uncertainty, and limitations.')
const supersedingDigest = ref('')
let controller
let selectionController
let layersController
let refreshGeneration = 0
let selectionGeneration = 0
let layersGeneration = 0

const reviewer = computed(() => ({ id: reviewerId.value, name: reviewerName.value, organization: organization.value, role: role.value }))
const reviewStatus = computed(() => detail.value?.state.review_status)
const displayedDigest = computed(() => detail.value?.digest ?? '')
const canMutateDisplayed = computed(() => Boolean(displayedDigest.value) && displayedDigest.value === selectedDigest.value && state.value !== 'submitting')
const acceptedTargets = computed(() => assertions.value.filter((item) => item.digest !== displayedDigest.value && item.state.review_status === 'accepted'))

function isAbort(error) {
  return error instanceof DOMException && error.name === 'AbortError'
}

async function fetchLayers(signal) {
  const source = props.apapRun ? {
    family: 'apap',
    release_id: props.apapRun.result.release.id,
    collection: 'protocols',
    record_id: props.apapRun.result.protocol.id
  } : null
  return queryDerivedLayers({
    layers: source ? ['source', 'reviewed-derived'] : ['reviewed-derived'],
    source,
    reviewed_derived: { subject_id: 'OBSERVABLE:APAP-PEAK-INJURED-FRACTION', classification: 'predicted' }
  }, signal)
}

async function fetchSelected(digest, signal) {
  if (!digest) return { selected: undefined, history: [] }
  const [selected, history] = await Promise.all([
    loadDerivedAssertion(digest, signal),
    loadDerivedEvents(digest, signal)
  ])
  return { selected, history: history.items }
}

async function refreshLayers() {
  const generation = ++layersGeneration
  layersController?.abort()
  layersController = new AbortController()
  try {
    const loaded = await fetchLayers(layersController.signal)
    if (generation === layersGeneration) layers.value = loaded
  } catch (error) {
    if (!isAbort(error) && generation === layersGeneration) layers.value = undefined
  }
}

async function refresh(preferredDigest = selectedDigest.value) {
  const generation = ++refreshGeneration
  selectionGeneration += 1
  controller?.abort()
  selectionController?.abort()
  controller = new AbortController()
  state.value = 'loading'
  try {
    const [loadedHealth, queue] = await Promise.all([
      loadDerivedHealth(controller.signal),
      loadDerivedAssertions({}, controller.signal)
    ])
    if (generation !== refreshGeneration) return
    health.value = loadedHealth
    assertions.value = queue.items
    const digest = queue.items.some((item) => item.digest === preferredDigest) ? preferredDigest : queue.items[0]?.digest ?? ''
    selectedDigest.value = digest
    const [selection, loadedLayers] = await Promise.all([fetchSelected(digest, controller.signal), fetchLayers(controller.signal)])
    if (generation !== refreshGeneration || selectedDigest.value !== digest) return
    detail.value = selection.selected
    events.value = selection.history
    layers.value = loadedLayers
    state.value = 'ready'
  } catch (error) {
    if (generation !== refreshGeneration || isAbort(error)) return
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'The reviewed-derived workspace is unavailable.'
  }
}

async function selectAssertion(digest) {
  refreshGeneration += 1
  controller?.abort()
  const generation = ++selectionGeneration
  selectionController?.abort()
  selectionController = new AbortController()
  selectedDigest.value = digest
  detail.value = undefined
  events.value = []
  state.value = 'loading'
  message.value = ''
  try {
    const selection = await fetchSelected(digest, selectionController.signal)
    if (generation !== selectionGeneration || selectedDigest.value !== digest) return
    detail.value = selection.selected
    events.value = selection.history
    state.value = 'ready'
  } catch (error) {
    if (generation !== selectionGeneration || isAbort(error)) return
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'Assertion detail could not be loaded.'
  }
}

async function submit() {
  if (!props.apapRun) return
  state.value = 'submitting'
  message.value = ''
  try {
    const response = await submitApapDerivedBundle(props.apapRun.runId)
    message.value = response.created ? 'Content-addressed APAP bundle submitted for review.' : 'The identical content-addressed bundle already exists.'
    await refresh(response.assertion_digests[0])
  } catch (error) {
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'The APAP bundle could not be submitted.'
  }
}

async function review(action) {
  const assertionDigest = displayedDigest.value
  if (!assertionDigest || assertionDigest !== selectedDigest.value) return
  state.value = 'submitting'
  message.value = ''
  try {
    await appendDerivedReviewEvent(assertionDigest, {
      action,
      reviewer: reviewer.value,
      reason: reason.value,
      related_assertion_digest: action === 'superseded' ? supersedingDigest.value : null,
      reproduction_artifact_digest: null
    })
    message.value = `Signed ${action} review event appended.`
    await refresh(assertionDigest)
  } catch (error) {
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'The review event was rejected.'
  }
}

async function reproduce() {
  const assertionDigest = displayedDigest.value
  if (!props.apapRun || !assertionDigest || assertionDigest !== selectedDigest.value) return
  state.value = 'submitting'
  message.value = ''
  try {
    await reproduceDerivedAssertion(assertionDigest, { run_id: props.apapRun.runId, reviewer: reviewer.value, reason: reason.value })
    message.value = 'Exact APAP specification reproduced the canonical result; signed verification appended.'
    await refresh(assertionDigest)
  } catch (error) {
    state.value = 'failed'
    message.value = error instanceof Error ? error.message : 'Reproduction did not verify.'
  }
}

watch(() => props.apapRun?.runId, () => {
  message.value = props.apapRun ? 'Completed APAP run is ready for content-addressed submission.' : ''
  refreshLayers()
})
onMounted(refresh)
onBeforeUnmount(() => {
  refreshGeneration += 1
  selectionGeneration += 1
  layersGeneration += 1
  controller?.abort()
  selectionController?.abort()
  layersController?.abort()
})
</script>

<template lang="pug">
section.review-panel(aria-labelledby="review-title")
  .section-heading
    div
      p.kicker Goal 8 · reviewed derived knowledge
      h2#review-title Review workbench
    span.status-chip(:class="state" aria-live="polite") {{ health ? `${health.assertions} assertions · ${health.events} events` : state }}
  p.review-intro Simulation output remains a separate derived-review workspace. Only accepted assertions appear in the reviewed-derived layer; source APAP records are immutable and never overwritten.
  p.measurement-note No eligible verified parameter measurement is available in the current synthetic parameter release. APAP protocol records are lineage inputs, not measurement-comparison inputs.
  .alert.error(v-if="state === 'failed'" role="alert")
    p {{ message }}
    button.secondary(type="button" @click="refresh()") Retry derived workspace
  .previous-note(v-else-if="message" role="status") {{ message }}

  .review-linkage
    article
      span.assumption-label Completed APAP linkage
      template(v-if="apapRun")
        strong {{ apapRun.result.context.taxon_label }} · {{ apapRun.result.protocol.name }}
        code {{ apapRun.runId }}
        button.run-button(type="button" :disabled="state === 'submitting'" @click="submit") Submit immutable bundle
      p(v-else) Run a successful APAP benchmark above before submitting a derived prediction.
    article
      span.assumption-label Explicit layers
      strong Source vs reviewed-derived
      p {{ layers?.source?.length ?? 0 }} exact source protocol record · {{ layers?.['reviewed-derived']?.length ?? 0 }} currently accepted prediction
      code(v-if="layers?.source?.[0]") {{ layers.source[0].record_digest }}

  .review-layout
    aside.review-queue(aria-label="Derived review queue")
      h3 Review queue
      p(v-if="!assertions.length") No derived assertions have been submitted.
      button.candidate-row(v-for="item in assertions" :key="item.digest" type="button" :class="{ selected: item.digest === selectedDigest }" :aria-pressed="item.digest === selectedDigest" :disabled="state === 'submitting'" @click="selectAssertion(item.digest)")
        strong {{ item.state.review_status }} · {{ item.assertion.classification }}
        span {{ item.assertion.property }}
        code {{ item.digest }}

    article.review-detail(v-if="detail")
      .review-claim
        span.unsupported-badge Synthetic prediction
        h3 Claim
        p {{ detail.assertion.statement }}
        code {{ detail.digest }}
        dl.compact-list
          div
            dt State
            dd {{ detail.state.review_status }}
          div
            dt Value
            dd {{ detail.assertion.value.value }} {{ detail.assertion.unit.symbol }}
          div
            dt Reproduction
            dd {{ detail.state.reproduction_verified ? 'reviewer verified' : detail.assertion.reproduction.status }}

      .review-columns
        section
          h3 Lineage
          ul.lineage-list
            li(v-for="dependency in detail.assertion.dependencies" :key="`${dependency.type}-${dependency.digest}`")
              strong {{ dependency.type }} · {{ dependency.family ?? dependency.model_id ?? dependency.artifact_id }}
              code {{ dependency.digest }}
        section
          h3 Full scientific context
          dl.compact-list
            div
              dt Taxon
              dd {{ detail.assertion.context.taxon_id }}
            div
              dt Tissue / cell
              dd {{ detail.assertion.context.tissue_id }} / {{ detail.assertion.context.cell_type_id }}
            div
              dt Sex / strain
              dd {{ detail.assertion.context.biological_sex }} / {{ detail.assertion.context.strain ?? 'not specified' }}
            div
              dt Route / dose
              dd {{ detail.assertion.context.route }} / {{ detail.assertion.context.dose?.value }} {{ detail.assertion.context.dose?.unit.symbol }}
            div
              dt Scope
              dd {{ detail.assertion.context.model_scope }}

      .review-columns
        section
          h3 Bounded applicability
          p {{ detail.assertion.applicability.rationale }}
          ul
            li(v-for="boundary in detail.assertion.applicability.boundaries" :key="boundary.variable") {{ boundary.variable }}: {{ boundary.lower ?? 'open' }}–{{ boundary.upper ?? 'open' }} {{ boundary.unit?.symbol ?? '' }}
        section
          h3 Qualitative uncertainty
          ul
            li(v-for="component in detail.assertion.uncertainty.components" :key="component.category")
              strong {{ component.category }}
              span {{ component.description }}

      h3 Unsupported limitations
      ul.study-limitations
        li(v-for="limitation in detail.assertion.limitations" :key="limitation") {{ limitation }}

      form.review-form(@submit.prevent)
        h3 Append-only scientific review
        .reviewer-grid
          label Reviewer ID
            input(v-model="reviewerId" required)
          label Reviewer name
            input(v-model="reviewerName" required)
          label Organization
            input(v-model="organization" required)
          label Role
            input(v-model="role" required)
        label(for="review-reason") Review reason
        textarea#review-reason(v-model="reason" rows="3" required)
        .review-actions(v-if="reviewStatus === 'pending'")
          button.run-button(type="button" :disabled="!canMutateDisplayed" @click="review('accepted')") Accept
          button.secondary(type="button" :disabled="!canMutateDisplayed" @click="review('rejected')") Reject
        .review-actions(v-else-if="reviewStatus === 'accepted'")
          button.run-button(v-if="!detail.state.reproduction_verified" type="button" :disabled="!apapRun || !canMutateDisplayed" @click="reproduce") Reproduce exact APAP run
          button.secondary(type="button" :disabled="!canMutateDisplayed" @click="review('recalculation-requested')") Request recalculation
          button.secondary(type="button" :disabled="!canMutateDisplayed" @click="review('invalidated')") Invalidate
          select(v-model="supersedingDigest" aria-label="Accepted superseding assertion")
            option(value="") Select accepted replacement
            option(v-for="target in acceptedTargets" :key="target.digest" :value="target.digest") {{ target.digest }}
          button.secondary(type="button" :disabled="!supersedingDigest || !canMutateDisplayed" @click="review('superseded')") Supersede
        p(v-else) This terminal review state remains auditable and allows no further events.

      h3 Signed event history
      p(v-if="!events.length") No review events have been appended.
      ol.event-history
        li(v-for="event in events" :key="event.event_digest")
          strong Event {{ event.sequence }} · {{ event.action }} · {{ event.reviewer.name }}
          span {{ event.occurred_at }} · {{ event.reason }}
          details
            summary Signature and event chain
            code event {{ event.event_digest }}
            code key {{ event.key_id }}
            code previous {{ event.previous_event_digest ?? 'genesis' }}
            code signature {{ event.signature }}
</template>
