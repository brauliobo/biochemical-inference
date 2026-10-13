<script setup vapor>
import { computed, onMounted, ref } from 'vue'
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
import { usePolling } from '../composables/usePolling.js'
import { useWorkflow } from '../composables/useWorkflow.js'
import Disclosure from '../ui/Disclosure.vue'
import ErrorNotice from '../ui/ErrorNotice.vue'
import Facts from '../ui/Facts.vue'
import LiveMessage from '../ui/LiveMessage.vue'
import Notice from '../ui/Notice.vue'
import Panel from '../ui/Panel.vue'
import { statusTone } from '../ui/tone.js'
import CampaignProgress from './revalidation/CampaignProgress.vue'
import CampaignReport from './revalidation/CampaignReport.vue'
import CampaignSidebar from './revalidation/CampaignSidebar.vue'
import WorkRecords from './revalidation/WorkRecords.vue'

const status = ref()
const campaigns = ref([])
const selected = ref()
const integrity = ref()
const report = ref()
const events = ref([])
const name = ref('goal15-local-revalidation')
const reason = ref('Execute the pinned Goal 11 revalidation impact plan locally.')
const { state, message, announcement, busy, step, fail } = useWorkflow()

const finished = (campaign) => campaign.state === 'terminal' && campaign.summary.submitted === campaign.summary.total
// Campaigns that are still running or awaiting receipts are re-read until they finish.
const poll = usePolling(async ({ signal, fresh }) => {
  selected.value = fresh(await loadRevalidationCampaign(selected.value.campaign_id, signal))
  return !finished(selected.value)
}, {
  interval: 500,
  onError: (error) => {
    fail(error, 'Campaign progress could not be refreshed.')
    return false
  }
})
function watchSelected() {
  if (selected.value && !finished(selected.value)) poll.start()
  else poll.stop()
}

const statusWord = computed(() => (message.value ? 'unavailable' : selected.value ? selected.value.state : status.value ? 'ready' : state.value))
const statusKind = computed(() => (message.value ? 'failed' : selected.value?.state === 'terminal' ? 'ready' : selected.value ? 'running' : 'unknown'))
const pins = computed(() => [
  { label: 'Producer', value: status.value.producer_origin },
  { label: 'Bootstrap trust', value: status.value.bootstrap_key_id, mono: true },
  { label: 'Automatic review', value: status.value.review_automatic_acceptance ? 'enabled' : 'disabled' }
])

const refreshLists = async ({ signal, fresh }) => {
  const [loadedStatus, loadedCampaigns] = fresh(await Promise.all([loadRevalidationStatus(signal), loadRevalidationCampaigns(signal)]))
  status.value = loadedStatus
  campaigns.value = loadedCampaigns
}

// Each operation replaces `selected` with the campaign as the producer now reports it.
const adopt = (campaign) => {
  selected.value = campaign
  watchSelected()
  return 'idle'
}

const initialize = () => {
  poll.stop()
  return step('loading', async (task) => {
    await refreshLists(task)
    if (campaigns.value.length) return task.fresh(await loadRevalidationCampaign(campaigns.value.at(-1).local_campaign_id, task.signal))
    return undefined
  }, {
    done: (campaign) => {
      if (campaign) selected.value = campaign
      watchSelected()
      return 'idle'
    },
    failure: 'The producer-bound revalidation service is unavailable.'
  })
}

const selectCampaign = (campaignId) => {
  poll.stop()
  return step('refreshing', async ({ signal, fresh }) => fresh(await loadRevalidationCampaign(campaignId, signal)), { done: adopt, failure: 'The selected revalidation campaign could not be loaded.' })
}

const refreshSelected = () => step('refreshing', async ({ signal, fresh }) => fresh(await loadRevalidationCampaign(selected.value.campaign_id, signal)), { done: adopt, failure: 'Campaign progress could not be refreshed.' })

function createCampaign() {
  integrity.value = undefined
  report.value = undefined
  events.value = []
  return step('creating', async (task) => {
    const created = task.fresh(await createRevalidationCampaign({ name: name.value, reason: reason.value }, task.signal))
    await refreshLists(task)
    return created
  }, { done: adopt, announce: 'The immutable producer campaign was verified, bound locally, and queued for bounded execution.', failure: 'The revalidation campaign could not be created.' })
}

const loadMoreWork = () => selected.value.projection.next_cursor && step('paging', async ({ signal, fresh }) => fresh(await loadRevalidationCampaignPage(selected.value.campaign_id, {
  limit: selected.value.projection.limit,
  cursor: selected.value.projection.next_cursor
}, signal)), {
  done: (page) => {
    selected.value = { ...page, work: [...selected.value.work, ...page.work] }
    return 'idle'
  },
  announce: () => `Loaded ${selected.value.work.length} of ${selected.value.projection.total} snapshot-pinned work records.`,
  failure: 'The campaign work projection could not be continued.'
})

const loadReport = () => step('reporting', async ({ signal, fresh }) => fresh(await loadRevalidationCampaignReport(selected.value.campaign_id, signal)), {
  done: (loaded) => {
    report.value = loaded
    return 'idle'
  },
  announce: (loaded) => (loaded.scientific_review.review_required
    ? 'Loaded the terminal technical scale report; scientific support remains explicitly unsupported and review-required.'
    : 'Loaded the active technical scale report; scientific review is not required before terminal execution.'),
  failure: 'The campaign technical report could not be loaded.'
})

const reconcile = () => step('reconciling', async ({ signal, fresh }) => fresh(await reconcileRevalidationCampaign(selected.value.campaign_id, signal)), {
  done: adopt,
  announce: (campaign) => `Signed producer receipts now cover ${campaign.summary.submitted} of ${campaign.summary.total} work outcomes.`,
  failure: 'Producer outcome reconciliation failed.'
})

const cancelCampaign = () => step('cancelling', async ({ signal, fresh }) => fresh(await cancelRevalidationCampaign(selected.value.campaign_id, signal)), {
  done: adopt,
  announce: 'Cancellation was durably requested; accepted terminal results remain immutable.',
  failure: 'Campaign cancellation failed.'
})

const checkIntegrity = () => step('checking', async ({ signal, fresh }) => fresh(await verifyRevalidationIntegrity(signal)), {
  done: (checked) => {
    integrity.value = checked
    return 'idle'
  },
  announce: 'Local artifacts, durable state, signed events, and pinned producer heads passed integrity verification.',
  failure: 'Revalidation integrity verification failed.'
})

const loadAudit = () => step('auditing', async ({ signal, fresh }) => fresh(await loadRevalidationEvents(signal)), {
  done: (loaded) => {
    events.value = loaded
    return 'idle'
  },
  announce: (loaded) => `Loaded ${loaded.length} locally persisted signed producer events.`,
  failure: 'The signed producer event audit could not be loaded.'
})

onMounted(initialize)
</script>

<template lang="pug">
Panel.revalidation-workbench(title="Signed impact execution ledger" title-id="revalidation-title" eyebrow="15 · Local revalidation campaigns" lede="Run only the work selected by the independently verified Goal 11 impact plan, then bind each technical outcome to the producer audit chain." :status="statusWord" :tone="statusTone(statusKind)")
  Notice(tone="warning" role="note" aria-label="Scientific review boundary")
    p.eyebrow Execution lane
    p
      strong Terminal software outcomes do not become scientific conclusions.
    p Every result remains review-required. This consumer cannot label, accept, invalidate, or upgrade scientific claims.

  ErrorNotice(v-if="message" title="Revalidation operation stopped" :message="message" retry-label="Retry service verification" @retry="initialize")

  Facts(v-if="status" :items="pins")

  CampaignSidebar(v-model:name="name" v-model:reason="reason" :campaigns="campaigns" :selected-id="selected?.campaign_id" :creating="state === 'creating'" :busy="busy" @create="createCampaign" @select="selectCampaign")

  template(v-if="selected")
    CampaignProgress(:campaign="selected" :integrity="integrity" :busy="busy" @refresh="refreshSelected" @reconcile="reconcile" @cancel="cancelCampaign" @check="checkIntegrity" @audit="loadAudit" @report="loadReport")
    CampaignReport(v-if="report" :report="report")
    WorkRecords(:campaign="selected" :busy="busy" @more="loadMoreWork")
    Disclosure(v-if="events.length" open card flat :summary="`${events.length} locally persisted, signature-verified producer events`")
      ol.plain-list.stack.stack--tight
        li.stack.stack--tight(v-for="event in events" :key="event.event_digest")
          strong {{ `#${event.sequence} · ${event.payload.action}` }}
          span.muted {{ event.actor.role }} · {{ event.occurred_at }}
          code.digest {{ event.event_digest }}
  LiveMessage(:text="announcement")
</template>
