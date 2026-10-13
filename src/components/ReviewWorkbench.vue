<script setup vapor>
import { computed, onMounted, reactive, ref, watch } from 'vue'
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
import { errorMessage, useTask } from '../composables/useTask.js'
import Card from '../ui/Card.vue'
import EmptyState from '../ui/EmptyState.vue'
import ErrorNotice from '../ui/ErrorNotice.vue'
import LiveMessage from '../ui/LiveMessage.vue'
import Panel from '../ui/Panel.vue'
import { statusTone } from '../ui/tone.js'
import AssertionDetail from './review/AssertionDetail.vue'
import ReviewForm from './review/ReviewForm.vue'

const props = defineProps({ apapRun: { type: Object, default: undefined } })

const health = ref()
const assertions = ref([])
const detail = ref()
const events = ref([])
const layers = ref()
const selectedDigest = ref('')
const state = ref('loading')
const message = ref('')
const reviewer = reactive({ id: 'local:goal8-reviewer', name: 'Local scientific reviewer', organization: 'Local review workspace', role: 'scientific-reviewer' })
const reason = ref('Reviewed against the visible synthetic scope, lineage, context, uncertainty, and limitations.')
const superseding = ref('')
// The queue, one selected assertion and the layer query are independent requests.
const refreshTask = useTask()
const selectionTask = useTask()
const layersTask = useTask()

const reviewStatus = computed(() => detail.value?.state.review_status)
const canAct = computed(() => Boolean(detail.value) && detail.value.digest === selectedDigest.value && state.value !== 'submitting')
const accepted = computed(() => assertions.value.filter((item) => item.digest !== detail.value?.digest && item.state.review_status === 'accepted'))
const statusWord = computed(() => (health.value ? `${health.value.assertions} assertions · ${health.value.events} events` : state.value))

function fetchLayers(signal) {
  const source = props.apapRun
    ? { family: 'apap', release_id: props.apapRun.result.release.id, collection: 'protocols', record_id: props.apapRun.result.protocol.id }
    : null
  return queryDerivedLayers({
    layers: source ? ['source', 'reviewed-derived'] : ['reviewed-derived'],
    source,
    reviewed_derived: { subject_id: 'OBSERVABLE:APAP-PEAK-INJURED-FRACTION', classification: 'predicted' }
  }, signal)
}

async function fetchSelected(digest, { signal, fresh }) {
  if (!digest) return { selected: undefined, history: [] }
  const [selected, history] = fresh(await Promise.all([loadDerivedAssertion(digest, signal), loadDerivedEvents(digest, signal)]))
  return { selected, history: history.items }
}

const refreshLayers = () => layersTask.run(async ({ signal, fresh }) => fresh(await fetchLayers(signal)), {
  done: (loaded) => { layers.value = loaded },
  fail: () => { layers.value = undefined }
})

function refresh(preferred = selectedDigest.value) {
  selectionTask.cancel()
  state.value = 'loading'
  return refreshTask.run(async (task) => {
    const [loadedHealth, queue] = task.fresh(await Promise.all([loadDerivedHealth(task.signal), loadDerivedAssertions({}, task.signal)]))
    const digest = queue.items.some((item) => item.digest === preferred) ? preferred : queue.items[0]?.digest ?? ''
    const [selection, loadedLayers] = task.fresh(await Promise.all([fetchSelected(digest, task), fetchLayers(task.signal)]))
    return { loadedHealth, queue, digest, selection, loadedLayers }
  }, {
    done: ({ loadedHealth, queue, digest, selection, loadedLayers }) => {
      health.value = loadedHealth
      assertions.value = queue.items
      selectedDigest.value = digest
      detail.value = selection.selected
      events.value = selection.history
      layers.value = loadedLayers
      state.value = 'ready'
    },
    fail: (error) => {
      state.value = 'failed'
      message.value = errorMessage(error, 'The reviewed-derived workspace is unavailable.')
    }
  })
}

function selectAssertion(digest) {
  refreshTask.cancel()
  selectedDigest.value = digest
  detail.value = undefined
  events.value = []
  state.value = 'loading'
  message.value = ''
  return selectionTask.run((task) => fetchSelected(digest, task), {
    done: (selection) => {
      detail.value = selection.selected
      events.value = selection.history
      state.value = 'ready'
    },
    fail: (error) => {
      state.value = 'failed'
      message.value = errorMessage(error, 'Assertion detail could not be loaded.')
    }
  })
}

// Mutations: send, then reload the queue around the same assertion.
async function mutate(send, done, failure, digest = selectedDigest.value) {
  state.value = 'submitting'
  message.value = ''
  try {
    const outcome = await send()
    message.value = done(outcome)
    await refresh(outcome?.assertion_digests?.[0] ?? digest)
  } catch (error) {
    state.value = 'failed'
    message.value = errorMessage(error, failure)
  }
}

const submit = () => props.apapRun && mutate(
  () => submitApapDerivedBundle(props.apapRun.runId),
  (response) => (response.created ? 'Content-addressed APAP bundle submitted for review.' : 'The identical content-addressed bundle already exists.'),
  'The APAP bundle could not be submitted.'
)

function review(action) {
  const digest = detail.value?.digest
  if (!digest || digest !== selectedDigest.value) return undefined
  return mutate(
    () => appendDerivedReviewEvent(digest, { action, reviewer: { ...reviewer }, reason: reason.value, related_assertion_digest: action === 'superseded' ? superseding.value : null, reproduction_artifact_digest: null }),
    () => `Signed ${action} review event appended.`,
    'The review event was rejected.'
  )
}

function reproduce() {
  const digest = detail.value?.digest
  if (!props.apapRun || !digest || digest !== selectedDigest.value) return undefined
  return mutate(
    () => reproduceDerivedAssertion(digest, { run_id: props.apapRun.runId, reviewer: { ...reviewer }, reason: reason.value }),
    () => 'Exact APAP specification reproduced the canonical result; signed verification appended.',
    'Reproduction did not verify.'
  )
}

watch(() => props.apapRun?.runId, () => {
  message.value = props.apapRun ? 'Completed APAP run is ready for content-addressed submission.' : ''
  refreshLayers()
})
onMounted(() => refresh())
</script>

<template lang="pug">
Panel.review-panel(title="Review workbench" title-id="review-title" eyebrow="Goal 8 · reviewed derived knowledge" lede="Simulation output remains a separate derived-review workspace. Only accepted assertions appear in the reviewed-derived layer; source APAP records are immutable and never overwritten." :status="statusWord" :tone="statusTone(state)")
  p.muted No eligible verified parameter measurement is available in the current synthetic parameter release. APAP protocol records are lineage inputs, not measurement-comparison inputs.
  ErrorNotice(v-if="state === 'failed'" :message="message" retry-label="Retry derived workspace" @retry="refresh()")
  LiveMessage(v-else visible :text="message")

  .grid
    Card(flat)
      p.eyebrow Completed APAP linkage
      template(v-if="apapRun")
        p
          strong {{ apapRun.result.context.taxon_label }} · {{ apapRun.result.protocol.name }}
        code.digest {{ apapRun.runId }}
        button.button(type="button" :disabled="state === 'submitting'" @click="submit") Submit immutable bundle
      p(v-else) Run a successful APAP benchmark above before submitting a derived prediction.
    Card(flat)
      p.eyebrow Explicit layers
      p
        strong Source vs reviewed-derived
      p.muted {{ layers?.source?.length ?? 0 }} exact source protocol record · {{ layers?.['reviewed-derived']?.length ?? 0 }} currently accepted prediction
      code.digest(v-if="layers?.source?.[0]") {{ layers.source[0].record_digest }}

  .sidebar
    section.stack.stack--tight(aria-labelledby="review-queue-title")
      h3#review-queue-title Review queue
      EmptyState(v-if="!assertions.length") No derived assertions have been submitted.
      ul.plain-list.stack.stack--tight
        li(v-for="item in assertions" :key="item.digest")
          button.tile(type="button" :aria-pressed="item.digest === selectedDigest" :disabled="state === 'submitting'" @click="selectAssertion(item.digest)")
            strong {{ item.state.review_status }} · {{ item.assertion.classification }}
            span {{ item.assertion.property }}
            code.digest {{ item.digest }}
    .stack(v-if="detail")
      AssertionDetail(:detail="detail")
      ReviewForm(v-model:reviewer="reviewer" v-model:reason="reason" v-model:superseding="superseding" :status="reviewStatus" :reproduced="detail.state.reproduction_verified" :can-act="canAct" :can-reproduce="Boolean(apapRun)" :replacements="accepted" :events="events" @review="review" @reproduce="reproduce")
</template>
