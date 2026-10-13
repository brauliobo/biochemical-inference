<script setup vapor>
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
import Section from '../ui/Section.vue'
import Toolbar from '../ui/Toolbar.vue'
import { statusTone } from '../ui/tone.js'

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
Section.review-panel(title="Review workbench" title-id="review-title" eyebrow="Goal 8 · reviewed derived knowledge" lede="Simulation output remains a separate derived-review workspace. Only accepted assertions appear in the reviewed-derived layer; source APAP records are immutable and never overwritten." :status="health ? `${health.assertions} assertions · ${health.events} events` : state" :tone="statusTone(state)")
  p.muted No eligible verified parameter measurement is available in the current synthetic parameter release. APAP protocol records are lineage inputs, not measurement-comparison inputs.
  .notice.notice--danger.stack.stack--tight(v-if="state === 'failed'" role="alert")
    p {{ message }}
    button.button.button--secondary(type="button" @click="refresh()") Retry derived workspace
  .notice(v-else-if="message" role="status") {{ message }}

  .grid
    article.card.card--flat.stack.stack--tight
      p.eyebrow Completed APAP linkage
      template(v-if="apapRun")
        p
          strong {{ apapRun.result.context.taxon_label }} · {{ apapRun.result.protocol.name }}
        code.digest {{ apapRun.runId }}
        button.button(type="button" :disabled="state === 'submitting'" @click="submit") Submit immutable bundle
      p(v-else) Run a successful APAP benchmark above before submitting a derived prediction.
    article.card.card--flat.stack.stack--tight
      p.eyebrow Explicit layers
      p
        strong Source vs reviewed-derived
      p.muted {{ layers?.source?.length ?? 0 }} exact source protocol record · {{ layers?.['reviewed-derived']?.length ?? 0 }} currently accepted prediction
      code.digest(v-if="layers?.source?.[0]") {{ layers.source[0].record_digest }}

  .sidebar
    section.stack.stack--tight(aria-labelledby="review-queue-title")
      h3#review-queue-title Review queue
      p(v-if="!assertions.length") No derived assertions have been submitted.
      ul.plain-list.stack.stack--tight
        li(v-for="item in assertions" :key="item.digest")
          button.tile(type="button" :aria-pressed="item.digest === selectedDigest" :disabled="state === 'submitting'" @click="selectAssertion(item.digest)")
            strong {{ item.state.review_status }} · {{ item.assertion.classification }}
            span {{ item.assertion.property }}
            code.digest {{ item.digest }}

    article.stack(v-if="detail")
      section.notice.notice--warning.stack.stack--tight(aria-labelledby="review-claim-title")
        span.badge.badge--warning Synthetic prediction
        h3#review-claim-title Claim
        p {{ detail.assertion.statement }}
        code.digest {{ detail.digest }}
        dl.facts
          div
            dt State
            dd {{ detail.state.review_status }}
          div
            dt Value
            dd {{ detail.assertion.value.value }} {{ detail.assertion.unit.symbol }}
          div
            dt Reproduction
            dd {{ detail.state.reproduction_verified ? 'reviewer verified' : detail.assertion.reproduction.status }}

      .grid
        Section(title="Lineage" title-id="review-lineage-title" :level="3" flat)
          ul.plain-list.stack.stack--tight
            li.stack.stack--tight(v-for="dependency in detail.assertion.dependencies" :key="`${dependency.type}-${dependency.digest}`")
              strong {{ dependency.type }} · {{ dependency.family ?? dependency.model_id ?? dependency.artifact_id }}
              code.digest {{ dependency.digest }}
        Section(title="Full scientific context" title-id="review-context-title" :level="3" flat)
          dl.facts
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

      .grid
        Section(title="Bounded applicability" title-id="review-applicability-title" :level="3" flat)
          p {{ detail.assertion.applicability.rationale }}
          ul
            li(v-for="boundary in detail.assertion.applicability.boundaries" :key="boundary.variable") {{ boundary.variable }}: {{ boundary.lower ?? 'open' }}–{{ boundary.upper ?? 'open' }} {{ boundary.unit?.symbol ?? '' }}
        Section(title="Qualitative uncertainty" title-id="review-uncertainty-title" :level="3" flat)
          ul.stack.stack--tight
            li(v-for="component in detail.assertion.uncertainty.components" :key="component.category")
              strong {{ component.category }}
              p {{ component.description }}

      section.stack.stack--tight(aria-labelledby="review-limitations-title")
        h3#review-limitations-title Unsupported limitations
        ul
          li(v-for="limitation in detail.assertion.limitations" :key="limitation") {{ limitation }}

      form.form.card.card--flat(aria-labelledby="review-form-title" @submit.prevent)
        h3#review-form-title Append-only scientific review
        .grid
          .form
            label(for="review-reviewer-id") Reviewer ID
            input#review-reviewer-id(v-model="reviewerId" required autocomplete="off")
          .form
            label(for="review-reviewer-name") Reviewer name
            input#review-reviewer-name(v-model="reviewerName" required autocomplete="name")
          .form
            label(for="review-organization") Organization
            input#review-organization(v-model="organization" required autocomplete="organization")
          .form
            label(for="review-role") Role
            input#review-role(v-model="role" required autocomplete="organization-title")
        label(for="review-reason") Review reason
        textarea#review-reason(v-model="reason" rows="3" required)
        Toolbar(v-if="reviewStatus === 'pending'" label="Review decision")
          button.button(type="button" :disabled="!canMutateDisplayed" @click="review('accepted')") Accept
          button.button.button--secondary(type="button" :disabled="!canMutateDisplayed" @click="review('rejected')") Reject
        Toolbar(v-else-if="reviewStatus === 'accepted'" label="Review actions on an accepted assertion")
          button.button(v-if="!detail.state.reproduction_verified" type="button" :disabled="!apapRun || !canMutateDisplayed" @click="reproduce") Reproduce exact APAP run
          button.button.button--secondary(type="button" :disabled="!canMutateDisplayed" @click="review('recalculation-requested')") Request recalculation
          button.button.button--secondary(type="button" :disabled="!canMutateDisplayed" @click="review('invalidated')") Invalidate
          select(v-model="supersedingDigest" aria-label="Accepted superseding assertion")
            option(value="") Select accepted replacement
            option(v-for="target in acceptedTargets" :key="target.digest" :value="target.digest") {{ target.digest }}
          button.button.button--secondary(type="button" :disabled="!supersedingDigest || !canMutateDisplayed" @click="review('superseded')") Supersede
        p(v-else) This terminal review state remains auditable and allows no further events.

      section.stack.stack--tight(aria-labelledby="review-events-title")
        h3#review-events-title Signed event history
        p(v-if="!events.length") No review events have been appended.
        ol.plain-list.stack.stack--tight
          li.card.card--flat.stack.stack--tight(v-for="event in events" :key="event.event_digest")
            strong Event {{ event.sequence }} · {{ event.action }} · {{ event.reviewer.name }}
            span.muted {{ event.occurred_at }} · {{ event.reason }}
            details.stack.stack--tight
              summary Signature and event chain
              code.digest event {{ event.event_digest }}
              code.digest key {{ event.key_id }}
              code.digest previous {{ event.previous_event_digest ?? 'genesis' }}
              code.digest signature {{ event.signature }}
</template>
