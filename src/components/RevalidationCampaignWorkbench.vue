<script setup>
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

<template>
  <section class="revalidation-workbench" aria-labelledby="revalidation-title">
    <header class="revalidation-header">
      <div>
        <p class="kicker">15 · Local revalidation campaigns</p>
        <h2 id="revalidation-title">Signed impact execution ledger</h2>
        <p>Run only the work selected by the independently verified Goal 11 impact plan, then bind each technical outcome to the producer audit chain.</p>
      </div>
      <span class="status-chip" :class="stateClass" aria-live="polite">{{ stateLabel }}</span>
    </header>

    <div class="review-boundary" role="note" aria-label="Scientific review boundary">
      <span>Execution lane</span>
      <strong>Terminal software outcomes do not become scientific conclusions.</strong>
      <p>Every result remains review-required. This consumer cannot label, accept, invalidate, or upgrade scientific claims.</p>
    </div>

    <div v-if="message" class="alert error" role="alert">
      <strong>Revalidation operation stopped</strong>
      <p>{{ message }}</p>
      <button class="secondary" type="button" @click="initialize">Retry service verification</button>
    </div>

    <div v-if="status" class="trust-strip">
      <div><span>Producer</span><strong>{{ status.producer_origin }}</strong></div>
      <div><span>Bootstrap trust</span><code>{{ status.bootstrap_key_id }}</code></div>
      <div><span>Automatic review</span><strong>{{ status.review_automatic_acceptance ? 'enabled' : 'disabled' }}</strong></div>
    </div>

    <div class="campaign-console">
      <form class="campaign-form" @submit.prevent="createCampaign">
        <div>
          <p class="kicker">Immutable request</p>
          <h3>Start the pinned plan</h3>
        </div>
        <label for="revalidation-name">Campaign slug</label>
        <input id="revalidation-name" v-model="name" required pattern="[a-z][a-z0-9-]*" maxlength="100" :disabled="busy">
        <label for="revalidation-reason">Execution reason</label>
        <textarea id="revalidation-reason" v-model="reason" required maxlength="4000" rows="3" :disabled="busy"></textarea>
        <button class="run-button" type="submit" :disabled="busy">
          <span>{{ state === 'creating' ? 'Binding campaign…' : 'Create and execute campaign' }}</span><span aria-hidden="true">→</span>
        </button>
      </form>

      <div class="campaign-index">
        <div class="index-heading"><div><p class="kicker">Durable ledger</p><h3>Bound campaigns</h3></div><span>{{ campaigns.length }}</span></div>
        <p v-if="!campaigns.length" class="empty-copy">No producer campaign has been bound to this local store.</p>
        <button v-for="campaign in campaigns" :key="campaign.local_campaign_id" type="button" :class="{ selected: selected?.campaign_id === campaign.local_campaign_id }" @click="selectCampaign(campaign.local_campaign_id)">
          <span>event {{ campaign.event_head.sequence }}</span>
          <code>{{ campaign.local_campaign_id }}</code>
        </button>
      </div>
    </div>

    <template v-if="selected">
      <div class="campaign-identity" data-testid="revalidation-campaign-summary">
        <div><span>Local campaign</span><code>{{ selected.campaign_id }}</code></div>
        <div><span>Producer campaign</span><code>{{ selected.producer.producer_campaign_id }}</code></div>
        <div><span>Signed event head</span><strong>#{{ selected.producer.event_head.sequence }}</strong><code>{{ selected.producer.event_head.digest }}</code></div>
      </div>

      <div class="progress-panel">
        <div class="progress-heading">
          <div><span>Technical completion</span><strong>{{ terminalCount }} / {{ selected.summary.total }} terminal</strong></div>
          <div><span>Signed receipts</span><strong>{{ selected.summary.submitted }} / {{ selected.summary.total }}</strong></div>
          <div><span>Scientific labels</span><strong>{{ selected.review.labeled_outcomes }} local · acceptance disabled</strong></div>
        </div>
        <div class="progress-track" role="progressbar" aria-label="Campaign technical completion" :aria-valuenow="completion" aria-valuemin="0" aria-valuemax="100"><span :style="{ width: `${completion}%` }"></span></div>
        <dl class="outcome-grid">
          <div><dt>Queued</dt><dd>{{ selected.summary.queued }}</dd></div>
          <div><dt>Running</dt><dd>{{ selected.summary.running }}</dd></div>
          <div><dt>Succeeded</dt><dd>{{ selected.summary.succeeded }}</dd></div>
          <div><dt>Failed</dt><dd>{{ selected.summary.failed }}</dd></div>
          <div><dt>Resource exhausted</dt><dd>{{ selected.summary.resource_exhausted }}</dd></div>
          <div><dt>Cancelled</dt><dd>{{ selected.summary.skipped }}</dd></div>
        </dl>
        <div class="campaign-actions">
          <button class="secondary" type="button" :disabled="busy" @click="refreshSelected()">Refresh progress</button>
          <button class="secondary" type="button" :disabled="busy || selected.state !== 'terminal' || selected.summary.submitted === selected.summary.total" @click="reconcile">Reconcile receipts</button>
          <button class="secondary danger-action" type="button" :disabled="busy || selected.state === 'terminal'" @click="cancelCampaign">Cancel unfinished work</button>
          <button class="secondary" type="button" :disabled="busy" @click="checkIntegrity">Verify full integrity</button>
          <button class="secondary" type="button" :disabled="busy" @click="loadAudit">Load signed audit</button>
          <button class="secondary" type="button" :disabled="busy" @click="loadReport">Load technical report</button>
        </div>
        <p v-if="selected.last_error" class="receipt-error" role="status">Receipt reconciliation: {{ selected.last_error }}</p>
        <p v-if="integrity" class="integrity-result" role="status">Integrity {{ integrity.status }} · {{ integrity.campaigns }} campaigns · {{ integrity.accepted_results }} accepted technical artifacts · producer {{ integrity.producer }}</p>
      </div>

      <section v-if="report" class="scale-report" aria-labelledby="revalidation-report-title">
        <div>
          <p class="kicker">Technical execution</p>
          <h3 id="revalidation-report-title">Bounded campaign report</h3>
          <dl>
            <div><dt>Selected work</dt><dd>{{ report.technical_execution.progress.total }}</dd></div>
            <div><dt>Direct / transitive</dt><dd>{{ report.technical_execution.selection.direct }} / {{ report.technical_execution.selection.transitive }}</dd></div>
            <div><dt>Attempts / retries</dt><dd>{{ report.technical_execution.recovery.attempts }} / {{ report.technical_execution.recovery.retries }}</dd></div>
            <div><dt>Exactly once</dt><dd>{{ report.technical_execution.accepted_results.exactly_once ? 'verified' : 'not verified' }}</dd></div>
            <div><dt>CAS objects / bytes</dt><dd>{{ report.technical_execution.storage.object_count }} / {{ report.technical_execution.storage.object_bytes }}</dd></div>
            <div><dt>Projection</dt><dd><code>{{ report.technical_execution.projection.snapshot_id }}</code></dd></div>
          </dl>
        </div>
        <div class="science-report" role="note">
          <p class="kicker">Scientific labels</p>
          <strong>{{ report.scientific_review.support }} · {{ report.scientific_review.review_required ? 'review required' : 'review not yet required' }}</strong>
          <p>No technical completion, retry, receipt, or exactly-once result is scientific support. Automatic acceptance remains disabled.</p>
        </div>
      </section>

      <div class="work-ledger">
        <article v-for="item in selected.work" :key="item.work_id" class="work-card">
          <header>
            <div><span>{{ item.impact.node_kind }} · {{ item.impact.relation }}</span><strong>{{ item.impact.locator }}</strong></div>
            <span class="work-state" :class="item.outcome ?? item.state">{{ item.outcome ?? item.state }}</span>
          </header>
          <code>{{ item.work_id }}</code>
          <div class="impact-classes"><span v-for="value in item.work.impact_classes" :key="value">{{ value }}</span></div>
          <dl>
            <div><dt>Attempts</dt><dd>{{ item.attempt_count }}</dd></div>
            <div><dt>Checkpoints</dt><dd>{{ item.checkpoint_count }}</dd></div>
            <div><dt>Artifact class</dt><dd>{{ item.work.expected_artifact_class }}</dd></div>
            <div><dt>Producer receipt</dt><dd>{{ item.producer_receipt ? `event ${item.producer_receipt.event_sequence}` : 'pending' }}</dd></div>
          </dl>
          <div class="scientific-state"><span>Scientific state</span><strong>{{ item.state === 'terminal' ? 'Review required · not automatically accepted' : 'Technical execution pending · review not yet required' }}</strong></div>
          <p v-if="item.failure" class="failure-copy">{{ item.failure.code }}: {{ item.failure.message }}</p>
        </article>
      </div>
      <button v-if="selected.projection.next_cursor" class="secondary load-work" type="button" :disabled="busy" @click="loadMoreWork">Load next {{ selected.projection.limit }} work records</button>

      <details v-if="events.length" class="event-audit" open>
        <summary>{{ events.length }} locally persisted, signature-verified producer events</summary>
        <ol>
          <li v-for="event in events" :key="event.event_digest"><strong>#{{ event.sequence }} · {{ event.payload.action }}</strong><span>{{ event.actor.role }} · {{ event.occurred_at }}</span><code>{{ event.event_digest }}</code></li>
        </ol>
      </details>
    </template>
    <p class="sr-announcement" aria-live="polite">{{ announcement }}</p>
  </section>
</template>

<style scoped>
.revalidation-workbench { margin-top: -1px; padding: clamp(1.25rem, 3vw, 2.5rem); overflow: hidden; }
.revalidation-header { display: flex; justify-content: space-between; gap: 2rem; }
.revalidation-header p:last-child { max-width: 760px; margin: .8rem 0 0; color: var(--muted); line-height: 1.6; }
.review-boundary { display: grid; grid-template-columns: 9rem minmax(260px, .8fr) minmax(300px, 1.2fr); gap: 1rem; align-items: center; margin: 1.5rem 0; padding: 1rem; border: 1px solid var(--amber); background: linear-gradient(90deg, rgba(240, 166, 90, .1), transparent); }
.review-boundary span, .trust-strip span, .campaign-identity span, .progress-heading span, .work-card header span, .scientific-state span { color: var(--muted); font: .66rem/1.4 ui-monospace, monospace; letter-spacing: .08em; text-transform: uppercase; }
.review-boundary p { margin: 0; color: #d3b897; font-size: .84rem; line-height: 1.5; }
.trust-strip, .campaign-identity { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; background: var(--line); }
.trust-strip > div, .campaign-identity > div { min-width: 0; padding: .9rem 1rem; background: #0e1917; }
.trust-strip span, .trust-strip strong, .trust-strip code, .campaign-identity span, .campaign-identity strong, .campaign-identity code { display: block; }
.trust-strip strong, .trust-strip code, .campaign-identity strong, .campaign-identity code { margin-top: .35rem; }
.campaign-console { display: grid; grid-template-columns: minmax(320px, .9fr) minmax(360px, 1.1fr); gap: 1px; margin-top: 1px; background: var(--line); }
.campaign-form, .campaign-index { min-width: 0; padding: 1.2rem; background: var(--panel-bright); }
.campaign-form { display: grid; }
.campaign-form h3, .campaign-index h3 { margin: 0; font-size: 1.15rem; }
.index-heading { display: flex; justify-content: space-between; align-items: start; }
.index-heading > span { min-width: 2rem; padding: .3rem; border: 1px solid var(--mint); border-radius: 50%; color: var(--mint); text-align: center; }
.campaign-index button { width: 100%; display: grid; gap: .3rem; margin-top: .6rem; padding: .8rem; border: 1px solid var(--line); background: #0d1816; color: var(--ink); text-align: left; }
.campaign-index button.selected { border-color: var(--lime); box-shadow: inset 3px 0 var(--lime); }
.campaign-index button span { color: var(--muted); font-size: .7rem; text-transform: uppercase; }
.empty-copy { color: var(--muted); }
.campaign-identity { margin-top: 1px; }
.progress-panel { margin-top: 1px; padding: 1.2rem; border: 1px solid var(--line); background: #0e1917; }
.progress-heading { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
.progress-heading span, .progress-heading strong { display: block; }
.progress-heading strong { margin-top: .3rem; }
.progress-track { height: .55rem; margin: 1rem 0; overflow: hidden; background: #243835; }
.progress-track span { display: block; height: 100%; background: linear-gradient(90deg, var(--mint), var(--lime)); transition: width .25s ease; }
.outcome-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 1px; margin: 0; background: var(--line); }
.outcome-grid > div { padding: .75rem; background: var(--panel); }
.outcome-grid dd { font-size: 1.35rem; }
.campaign-actions { display: flex; flex-wrap: wrap; gap: .55rem; margin-top: 1rem; }
.campaign-actions button:disabled { cursor: not-allowed; opacity: .45; }
.danger-action { border-color: var(--danger); color: var(--danger); }
.receipt-error { color: var(--danger); }
.integrity-result { padding: .75rem; border-left: 3px solid var(--mint); background: rgba(115, 213, 190, .08); }
.work-ledger { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1px; margin-top: 1px; background: var(--line); }
.scale-report { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(260px, .65fr); gap: 1px; margin-top: 1px; background: var(--line); }
.scale-report > div { min-width: 0; padding: 1rem; background: #0e1917; }
.scale-report h3 { margin: .2rem 0 1rem; }
.scale-report dl { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1px; margin: 0; background: var(--line); }
.scale-report dl > div { min-width: 0; padding: .75rem; background: var(--panel); }
.scale-report dd { overflow-wrap: anywhere; }
.science-report { border-left: 3px solid var(--amber); }
.science-report strong { color: #e6c49e; text-transform: uppercase; }
.science-report p:last-child { color: var(--muted); line-height: 1.55; }
.load-work { width: 100%; margin-top: 1px; }
.work-card { min-width: 0; padding: 1rem; background: var(--panel); }
.work-card header { display: flex; justify-content: space-between; gap: 1rem; }
.work-card header strong, .work-card header span { display: block; }
.work-card header strong { margin-top: .25rem; }
.work-card > code { display: block; margin-top: .7rem; color: var(--muted); }
.work-state { align-self: start; padding: .3rem .5rem; border: 1px solid var(--line); }
.work-state.succeeded { border-color: var(--mint); color: var(--mint); }
.work-state.failed, .work-state.resource-exhausted { border-color: var(--danger); color: var(--danger); }
.impact-classes { display: flex; flex-wrap: wrap; gap: .35rem; margin: .8rem 0; }
.impact-classes span { padding: .25rem .45rem; background: #263d38; color: var(--lime); font-size: .68rem; }
.work-card dl { display: grid; grid-template-columns: repeat(2, 1fr); gap: .65rem; margin: 0; }
.scientific-state { margin-top: .9rem; padding: .75rem; border-left: 3px solid var(--amber); background: rgba(240, 166, 90, .08); }
.scientific-state span, .scientific-state strong { display: block; }
.scientific-state strong { margin-top: .25rem; color: #e6c49e; font-size: .82rem; }
.failure-copy { color: var(--danger); font-size: .8rem; }
.event-audit { margin-top: 1px; padding: 1rem; border: 1px solid var(--line); background: #0e1917; }
.event-audit summary { cursor: pointer; font-weight: 700; }
.event-audit ol { margin: 1rem 0 0; padding-left: 2rem; }
.event-audit li { padding: .65rem 0; border-top: 1px solid var(--line); }
.event-audit li strong, .event-audit li span, .event-audit li code { display: block; }
.event-audit li span { margin: .25rem 0; color: var(--muted); font-size: .75rem; }
.sr-announcement { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
@media (max-width: 820px) {
  .revalidation-header { display: grid; }
  .review-boundary, .campaign-console { grid-template-columns: 1fr; }
  .trust-strip, .campaign-identity, .progress-heading { grid-template-columns: 1fr; }
  .outcome-grid { grid-template-columns: repeat(3, 1fr); }
  .work-ledger { grid-template-columns: 1fr; }
  .scale-report, .scale-report dl { grid-template-columns: 1fr; }
}
@media (max-width: 480px) {
  .outcome-grid, .work-card dl { grid-template-columns: repeat(2, 1fr); }
  .campaign-actions { display: grid; }
}
</style>
