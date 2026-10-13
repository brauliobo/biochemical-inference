<script setup vapor>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  cancelRevalidationCampaign,
  createRevalidationCampaign,
  loadRevalidationCampaign,
  loadRevalidationCampaignPage,
  loadRevalidationCampaignReport,
  loadRevalidationCampaigns,
  loadRevalidationEvents,
  loadRevalidationStatus,
  reconcileRevalidationCampaign,
  verifyRevalidationIntegrity
} from '../api.js'
import Metric from '../ui/Metric.vue'
import Section from '../ui/Section.vue'
import Toolbar from '../ui/Toolbar.vue'
import { badgeClass, statusTone } from '../ui/tone.js'

const status = ref()
const campaigns = ref([])
const selected = ref()
const integrity = ref()
const report = ref()
const events = ref([])
const state = ref('loading')
const message = ref('')
const announcement = ref('')
const name = ref('goal15-local-revalidation')
const reason = ref('Execute the pinned Goal 11 revalidation impact plan locally.')
let controller
let pollTimer

const busy = computed(() => ['loading', 'creating', 'refreshing', 'reconciling', 'cancelling', 'checking', 'auditing', 'paging', 'reporting'].includes(state.value))
const terminalCount = computed(() => selected.value ? selected.value.summary.succeeded + selected.value.summary.failed + selected.value.summary.resource_exhausted + selected.value.summary.skipped : 0)
const completion = computed(() => selected.value?.summary.total ? Math.round(terminalCount.value / selected.value.summary.total * 100) : 0)
const stateClass = computed(() => message.value ? 'failed' : selected.value?.state === 'terminal' ? 'ready' : selected.value ? 'running' : 'unknown')
const stateLabel = computed(() => message.value ? 'unavailable' : selected.value ? selected.value.state : status.value ? 'ready' : state.value)

function isAbort(error) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function fail(error, fallback) {
  if (isAbort(error)) return
  state.value = 'failed'
  message.value = error instanceof Error ? error.message : fallback
}

function schedulePoll() {
  clearTimeout(pollTimer)
  if (!selected.value || selected.value.state === 'terminal' && selected.value.summary.submitted === selected.value.summary.total) return
  pollTimer = setTimeout(() => refreshSelected(true), 500)
}

async function refreshSelected(background = false) {
  if (!selected.value) return
  if (!background) state.value = 'refreshing'
  try {
    selected.value = await loadRevalidationCampaign(selected.value.campaign_id, controller.signal)
    if (!background) state.value = 'idle'
    schedulePoll()
  } catch (error) {
    fail(error, 'Campaign progress could not be refreshed.')
  }
}

async function selectCampaign(campaignId) {
  clearTimeout(pollTimer)
  state.value = 'refreshing'
  message.value = ''
  try {
    selected.value = await loadRevalidationCampaign(campaignId, controller.signal)
    state.value = 'idle'
    schedulePoll()
  } catch (error) {
    fail(error, 'The selected revalidation campaign could not be loaded.')
  }
}

async function initialize() {
  controller?.abort()
  controller = new AbortController()
  clearTimeout(pollTimer)
  state.value = 'loading'
  message.value = ''
  try {
    const [loadedStatus, loadedCampaigns] = await Promise.all([
      loadRevalidationStatus(controller.signal),
      loadRevalidationCampaigns(controller.signal)
    ])
    status.value = loadedStatus
    campaigns.value = loadedCampaigns
    if (loadedCampaigns.length) selected.value = await loadRevalidationCampaign(loadedCampaigns.at(-1).local_campaign_id, controller.signal)
    state.value = 'idle'
    schedulePoll()
  } catch (error) {
    fail(error, 'The producer-bound revalidation service is unavailable.')
  }
}

async function createCampaign() {
  state.value = 'creating'
  message.value = ''
  integrity.value = undefined
  report.value = undefined
  events.value = []
  try {
    selected.value = await createRevalidationCampaign({ name: name.value, reason: reason.value }, controller.signal)
    const [loadedStatus, loadedCampaigns] = await Promise.all([loadRevalidationStatus(controller.signal), loadRevalidationCampaigns(controller.signal)])
    status.value = loadedStatus
    campaigns.value = loadedCampaigns
    state.value = 'idle'
    announcement.value = 'The immutable producer campaign was verified, bound locally, and queued for bounded execution.'
    schedulePoll()
  } catch (error) {
    fail(error, 'The revalidation campaign could not be created.')
  }
}

async function loadMoreWork() {
  if (!selected.value?.projection.next_cursor) return
  state.value = 'paging'
  message.value = ''
  try {
    const page = await loadRevalidationCampaignPage(selected.value.campaign_id, {
      limit: selected.value.projection.limit,
      cursor: selected.value.projection.next_cursor
    }, controller.signal)
    selected.value = { ...page, work: [...selected.value.work, ...page.work] }
    state.value = 'idle'
    announcement.value = `Loaded ${selected.value.work.length} of ${selected.value.projection.total} snapshot-pinned work records.`
  } catch (error) {
    fail(error, 'The campaign work projection could not be continued.')
  }
}

async function loadReport() {
  state.value = 'reporting'
  message.value = ''
  try {
    report.value = await loadRevalidationCampaignReport(selected.value.campaign_id, controller.signal)
    state.value = 'idle'
    announcement.value = report.value.scientific_review.review_required
      ? 'Loaded the terminal technical scale report; scientific support remains explicitly unsupported and review-required.'
      : 'Loaded the active technical scale report; scientific review is not required before terminal execution.'
  } catch (error) {
    fail(error, 'The campaign technical report could not be loaded.')
  }
}

async function reconcile() {
  state.value = 'reconciling'
  message.value = ''
  try {
    selected.value = await reconcileRevalidationCampaign(selected.value.campaign_id, controller.signal)
    state.value = 'idle'
    announcement.value = `Signed producer receipts now cover ${selected.value.summary.submitted} of ${selected.value.summary.total} work outcomes.`
    schedulePoll()
  } catch (error) {
    fail(error, 'Producer outcome reconciliation failed.')
  }
}

async function cancelCampaign() {
  state.value = 'cancelling'
  message.value = ''
  try {
    selected.value = await cancelRevalidationCampaign(selected.value.campaign_id, controller.signal)
    state.value = 'idle'
    announcement.value = 'Cancellation was durably requested; accepted terminal results remain immutable.'
    schedulePoll()
  } catch (error) {
    fail(error, 'Campaign cancellation failed.')
  }
}

async function checkIntegrity() {
  state.value = 'checking'
  message.value = ''
  try {
    integrity.value = await verifyRevalidationIntegrity(controller.signal)
    state.value = 'idle'
    announcement.value = 'Local artifacts, durable state, signed events, and pinned producer heads passed integrity verification.'
  } catch (error) {
    fail(error, 'Revalidation integrity verification failed.')
  }
}

async function loadAudit() {
  state.value = 'auditing'
  message.value = ''
  try {
    events.value = await loadRevalidationEvents(controller.signal)
    state.value = 'idle'
    announcement.value = `Loaded ${events.value.length} locally persisted signed producer events.`
  } catch (error) {
    fail(error, 'The signed producer event audit could not be loaded.')
  }
}

onMounted(initialize)
onBeforeUnmount(() => {
  clearTimeout(pollTimer)
  controller?.abort()
})
</script>
<template lang="pug">
Section.revalidation-workbench(title="Signed impact execution ledger" title-id="revalidation-title" eyebrow="15 · Local revalidation campaigns" lede="Run only the work selected by the independently verified Goal 11 impact plan, then bind each technical outcome to the producer audit chain." :status="stateLabel" :tone="statusTone(stateClass)")
  .notice.notice--warning.stack.stack--tight(role="note" aria-label="Scientific review boundary")
    p.eyebrow Execution lane
    p
      strong Terminal software outcomes do not become scientific conclusions.
    p Every result remains review-required. This consumer cannot label, accept, invalidate, or upgrade scientific claims.

  .notice.notice--danger.stack.stack--tight(v-if="message" role="alert")
    strong Revalidation operation stopped
    p {{ message }}
    button.button.button--secondary(type="button" @click="initialize") Retry service verification

  dl.metrics(v-if="status")
    Metric(label="Producer" :value="status.producer_origin")
    Metric(label="Bootstrap trust" :value="status.bootstrap_key_id" mono)
    Metric(label="Automatic review" :value="status.review_automatic_acceptance ? 'enabled' : 'disabled'")

  .sidebar
    form.form(@submit.prevent="createCampaign")
      p.eyebrow Immutable request
      h3 Start the pinned plan
      label(for="revalidation-name") Campaign slug
      input#revalidation-name(v-model="name" required pattern="[a-z][a-z0-9-]*" maxlength="100" autocomplete="off" aria-describedby="revalidation-name-help" :disabled="busy")
      small#revalidation-name-help Lowercase letters, digits and hyphens, starting with a letter.
      label(for="revalidation-reason") Execution reason
      textarea#revalidation-reason(v-model="reason" required maxlength="4000" rows="3" :disabled="busy")
      button.button(type="submit" :disabled="busy") {{ state === 'creating' ? 'Binding campaign…' : 'Create and execute campaign' }}

    section.stack.stack--tight(aria-labelledby="revalidation-index-title")
      .repel
        div
          p.eyebrow Durable ledger
          h3#revalidation-index-title Bound campaigns
        span.badge(:aria-label="`${campaigns.length} bound campaigns`") {{ campaigns.length }}
      p.muted(v-if="!campaigns.length") No producer campaign has been bound to this local store.
      ul.plain-list.stack.stack--tight
        li(v-for="campaign in campaigns" :key="campaign.local_campaign_id")
          button.tile(type="button" :aria-pressed="selected?.campaign_id === campaign.local_campaign_id" @click="selectCampaign(campaign.local_campaign_id)")
            span.muted event {{ campaign.event_head.sequence }}
            code {{ campaign.local_campaign_id }}

  template(v-if="selected")
    dl.metrics.metrics--wide(data-testid="revalidation-campaign-summary")
      Metric(label="Local campaign" :value="selected.campaign_id" mono)
      Metric(label="Producer campaign" :value="selected.producer.producer_campaign_id" mono)
      Metric(label="Signed event head")
        strong {{ '#' + selected.producer.event_head.sequence }}
        code.digest {{ selected.producer.event_head.digest }}

    section.card.card--flat.stack(aria-labelledby="revalidation-progress-title")
      h3#revalidation-progress-title Campaign progress
      dl.metrics.metrics--wide
        Metric(label="Technical completion" :value="`${terminalCount} / ${selected.summary.total} terminal`" large)
        Metric(label="Signed receipts" :value="`${selected.summary.submitted} / ${selected.summary.total}`" large)
        Metric(label="Scientific labels" :value="`${selected.review.labeled_outcomes} local · acceptance disabled`" large)
      progress.progress(:value="completion" max="100" aria-label="Campaign technical completion") {{ completion }}%
      dl.metrics.metrics--compact
        Metric(label="Queued" :value="selected.summary.queued" large)
        Metric(label="Running" :value="selected.summary.running" large)
        Metric(label="Succeeded" :value="selected.summary.succeeded" large)
        Metric(label="Failed" :value="selected.summary.failed" large)
        Metric(label="Resource exhausted" :value="selected.summary.resource_exhausted" large)
        Metric(label="Cancelled" :value="selected.summary.skipped" large)
      Toolbar(label="Campaign actions")
        button.button.button--secondary(type="button" :disabled="busy" @click="refreshSelected()") Refresh progress
        button.button.button--secondary(type="button" :disabled="busy || selected.state !== 'terminal' || selected.summary.submitted === selected.summary.total" @click="reconcile") Reconcile receipts
        button.button.button--danger(type="button" :disabled="busy || selected.state === 'terminal'" @click="cancelCampaign") Cancel unfinished work
        button.button.button--secondary(type="button" :disabled="busy" @click="checkIntegrity") Verify full integrity
        button.button.button--secondary(type="button" :disabled="busy" @click="loadAudit") Load signed audit
        button.button.button--secondary(type="button" :disabled="busy" @click="loadReport") Load technical report
      p.notice.notice--danger(v-if="selected.last_error" role="status") Receipt reconciliation: {{ selected.last_error }}
      p.notice.notice--success(v-if="integrity" role="status") Integrity {{ integrity.status }} · {{ integrity.campaigns }} campaigns · {{ integrity.accepted_results }} accepted technical artifacts · producer {{ integrity.producer }}

    Section(v-if="report" title="Bounded campaign report" title-id="revalidation-report-title" eyebrow="Technical execution" :level="3" flat)
      dl.metrics
        Metric(label="Selected work" :value="report.technical_execution.progress.total")
        Metric(label="Direct / transitive" :value="`${report.technical_execution.selection.direct} / ${report.technical_execution.selection.transitive}`")
        Metric(label="Attempts / retries" :value="`${report.technical_execution.recovery.attempts} / ${report.technical_execution.recovery.retries}`")
        Metric(label="Exactly once" :value="report.technical_execution.accepted_results.exactly_once ? 'verified' : 'not verified'")
        Metric(label="CAS objects / bytes" :value="`${report.technical_execution.storage.object_count} / ${report.technical_execution.storage.object_bytes}`")
        Metric(label="Projection" :value="report.technical_execution.projection.snapshot_id" mono)
      .notice.notice--warning.stack.stack--tight(role="note")
        p.eyebrow Scientific labels
        p
          strong {{ report.scientific_review.support }} · {{ report.scientific_review.review_required ? 'review required' : 'review not yet required' }}
        p No technical completion, retry, receipt, or exactly-once result is scientific support. Automatic acceptance remains disabled.

    section.stack.stack--tight(aria-labelledby="revalidation-work-title")
      h3#revalidation-work-title Work records
      .grid
        article.card.card--flat.stack.stack--tight(v-for="item in selected.work" :key="item.work_id")
          .repel
            div
              p.eyebrow {{ item.impact.node_kind }} · {{ item.impact.relation }}
              p
                strong {{ item.impact.locator }}
            span(:class="badgeClass(item.outcome ?? item.state)") {{ item.outcome ?? item.state }}
          p
            code {{ item.work_id }}
          .cluster
            span.badge(v-for="value in item.work.impact_classes" :key="value") {{ value }}
          dl.metrics.metrics--compact
            Metric(label="Attempts" :value="item.attempt_count")
            Metric(label="Checkpoints" :value="item.checkpoint_count")
            Metric(label="Artifact class" :value="item.work.expected_artifact_class")
            Metric(label="Producer receipt" :value="item.producer_receipt ? `event ${item.producer_receipt.event_sequence}` : 'pending'")
          .notice.notice--warning.stack.stack--tight
            p.eyebrow Scientific state
            p
              strong {{ item.state === 'terminal' ? 'Review required · not automatically accepted' : 'Technical execution pending · review not yet required' }}
          p.notice.notice--danger(v-if="item.failure") {{ item.failure.code }}: {{ item.failure.message }}
      button.button.button--secondary(v-if="selected.projection.next_cursor" type="button" :disabled="busy" @click="loadMoreWork") Load next {{ selected.projection.limit }} work records

    details.card.card--flat.stack.stack--tight(v-if="events.length" open)
      summary {{ events.length }} locally persisted, signature-verified producer events
      ol.plain-list.stack.stack--tight
        li.stack.stack--tight(v-for="event in events" :key="event.event_digest")
          strong {{ '#' + event.sequence }} · {{ event.payload.action }}
          span.muted {{ event.actor.role }} · {{ event.occurred_at }}
          code.digest {{ event.event_digest }}
  p.visually-hidden(role="status") {{ announcement }}
</template>
