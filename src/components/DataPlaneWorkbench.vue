<script setup vapor>
import { computed, onMounted, ref, watch } from 'vue'
import {
  loadAuthorityClosureAudit,
  loadAuthorityClosureAudits,
  loadDataPlaneDiff,
  loadDataPlaneDiscovery,
  loadDataPlaneIntegrity,
  loadDataPlanePage,
  loadDataPlaneRelease,
  loadDataPlaneReleases,
  runAuthorityClosureAudit,
  syncDataPlane
} from '../api.js'
import { errorMessage, useTask } from '../composables/useTask.js'
import Badge from '../ui/Badge.vue'
import ErrorNotice from '../ui/ErrorNotice.vue'
import LiveMessage from '../ui/LiveMessage.vue'
import Notice from '../ui/Notice.vue'
import Panel from '../ui/Panel.vue'
import { statusTone } from '../ui/tone.js'
import AuditPanel from './data-plane/AuditPanel.vue'
import DiffPanel from './data-plane/DiffPanel.vue'
import RecordBrowser from './data-plane/RecordBrowser.vue'
import ReleasePanels from './data-plane/ReleasePanels.vue'

const PAGE_SIZE = 2
const EMPTY_STATUS = { contractVersion: '1.0.0', localOnly: true, release: null, signerKeyId: null, lastSyncAt: null, lastError: null, integrity: 'empty' }

const discovery = ref()
const status = ref()
const releases = ref([])
const detail = ref()
const page = ref()
const linked = ref({ taxa: [], reactions: [], proteins: [], catalysis: [] })
const difference = ref()
const integrity = ref()
const audits = ref([])
const auditReport = ref()
const recordType = ref('compounds')
const cursorStack = ref([null])
const pageBusy = ref(false)
const auditBusy = ref(false)
const liveMessage = ref('')
const error = ref('')
// Three independent requests: the release pair, one page of records, the audit.
const mainTask = useTask()
const pageTask = useTask()
const auditTask = useTask()

const releaseId = computed(() => status.value?.release?.id)
const pageNumber = computed(() => cursorStack.value.length)
const syncing = computed(() => status.value?.state === 'syncing')
const controlsLocked = computed(() => syncing.value || pageBusy.value)

async function fetchPublished(activeReleaseId, selectedType, { signal, fresh }) {
  const { baseline, candidate } = discovery.value.pins
  const records = (type) => loadDataPlanePage(activeReleaseId, type, { limit: PAGE_SIZE }, signal)
  const [loadedReleases, loadedDetail, loadedPage, taxa, reactions, proteins, catalysis, loadedDifference, loadedIntegrity, loadedAudits] = fresh(await Promise.all([
    loadDataPlaneReleases(signal),
    loadDataPlaneRelease(activeReleaseId, signal),
    records(selectedType),
    records('taxa'),
    records('reactions'),
    records('proteins'),
    records('catalysis'),
    loadDataPlaneDiff(baseline.releaseId, candidate.releaseId, signal),
    loadDataPlaneIntegrity(signal),
    loadAuthorityClosureAudits(signal)
  ]))
  const loadedAudit = loadedAudits.length ? fresh(await loadAuthorityClosureAudit(loadedAudits.at(-1).reportDigest, signal)) : undefined
  return { loadedReleases, loadedDetail, loadedPage, taxa, reactions, proteins, catalysis, loadedDifference, loadedIntegrity, loadedAudits, loadedAudit }
}

// The whole published generation replaces the visible one in a single step.
function commitPublished(loaded) {
  pageTask.cancel()
  pageBusy.value = false
  releases.value = loaded.loadedReleases
  detail.value = loaded.loadedDetail
  page.value = loaded.loadedPage
  linked.value = { taxa: loaded.taxa.items, reactions: loaded.reactions.items, proteins: loaded.proteins.items, catalysis: loaded.catalysis.items }
  difference.value = loaded.loadedDifference
  integrity.value = loaded.loadedIntegrity
  audits.value = loaded.loadedAudits
  auditReport.value = loaded.loadedAudit
  cursorStack.value = [null]
  liveMessage.value = `Loaded page 1 of ${loaded.loadedPage.recordType}.`
}

const initialize = () => {
  error.value = ''
  return mainTask.run(async (task) => {
    const loadedDiscovery = task.fresh(await loadDataPlaneDiscovery(task.signal))
    discovery.value = loadedDiscovery
    status.value = loadedDiscovery.status
    if (loadedDiscovery.status.release) commitPublished(await fetchPublished(loadedDiscovery.status.release.id, recordType.value, task))
  }, { fail: (value) => { error.value = errorMessage(value, 'The local data plane could not be inspected.') } })
}

// After a failed sync the mirror's own status says what is (still) published.
const recoverStatus = () => mainTask.run(async ({ signal, fresh }) => {
  const loaded = fresh(await loadDataPlaneDiscovery(signal))
  discovery.value = loaded
  status.value = loaded.status
}, { fail: () => { status.value = { ...status.value, state: 'failed', lastError: error.value } } })

function synchronize() {
  error.value = ''
  pageTask.cancel()
  status.value = { ...(status.value ?? EMPTY_STATUS), state: 'syncing' }
  return mainTask.run(async (task) => {
    const synced = task.fresh(await syncDataPlane(task.signal))
    discovery.value = task.fresh(await loadDataPlaneDiscovery(task.signal))
    status.value = synced
    commitPublished(await fetchPublished(synced.release.id, recordType.value, task))
  }, {
    fail: (value) => {
      error.value = errorMessage(value, 'The verified sync failed before publication.')
      recoverStatus()
    }
  })
}

function requestPage(type, cursor, nextStack) {
  if (!releaseId.value) return undefined
  pageBusy.value = true
  error.value = ''
  return pageTask.run(async ({ signal, fresh }) => fresh(await loadDataPlanePage(releaseId.value, type, { limit: PAGE_SIZE, ...(cursor ? { cursor } : {}) }, signal)), {
    // The page, its cursor stack and the end of "busy" appear together.
    done: (loaded) => {
      pageBusy.value = false
      if (loaded.recordType !== type) return
      page.value = loaded
      cursorStack.value = nextStack
      liveMessage.value = `Loaded page ${nextStack.length} of ${type}.`
    },
    fail: (value) => {
      pageBusy.value = false
      error.value = errorMessage(value, 'The local page could not be loaded.')
      liveMessage.value = `Could not load ${type}.`
    }
  })
}

function nextPage() {
  const cursor = page.value?.nextCursor
  if (pageBusy.value || !cursor) return
  requestPage(recordType.value, cursor, [...cursorStack.value, cursor])
}

function previousPage() {
  if (pageBusy.value || cursorStack.value.length === 1) return
  const stack = cursorStack.value.slice(0, -1)
  requestPage(recordType.value, stack.at(-1), stack)
}

function runAudit() {
  if (!discovery.value || auditBusy.value) return undefined
  auditBusy.value = true
  error.value = ''
  const { baseline, candidate } = discovery.value.pins
  return auditTask.run(async ({ signal, fresh }) => {
    const created = fresh(await runAuthorityClosureAudit({ baselineReleaseId: baseline.releaseId, candidateReleaseId: candidate.releaseId }, signal))
    return { created, all: fresh(await loadAuthorityClosureAudits(signal)) }
  }, {
    done: ({ created, all }) => {
      auditBusy.value = false
      audits.value = all
      auditReport.value = created
      liveMessage.value = `Authority closure audit ${created.reportDigest} is available.`
    },
    fail: (value) => {
      auditBusy.value = false
      error.value = errorMessage(value, 'The authority closure audit failed.')
    }
  })
}

watch(recordType, (type) => {
  if (releaseId.value) requestPage(type, null, [null])
})
onMounted(initialize)
</script>

<template lang="pug">
Panel(title="Data plane workbench" title-id="data-plane-title" eyebrow="11 · Authoritative local data" :status="status?.state ?? 'empty'" :tone="statusTone(status?.state)")
  template(#actions)
    Badge(label="Local / offline reads")
  p.lede Explicit sync is the only upstream operation. Publication atomically binds both signed releases and their pinned cross-release difference; all subsequent records and audits are read from the verified local closure.
  LiveMessage(:text="liveMessage")

  .cluster
    button.button(type="button" :disabled="syncing || pageBusy || auditBusy" @click="synchronize") {{ syncing ? 'Verifying release pair…' : status?.release ? 'Re-verify release pair' : 'Sync release pair' }}
    span.muted(v-if="status?.lastSyncAt") Last verified {{ status.lastSyncAt }}

  div(role="status")
    Notice(v-if="status?.state === 'empty' && !status.release" title="Empty local mirror")
      p No release is readable yet. Sync explicitly to stage and verify both signed snapshots, every partition and cursor page, and their semantic difference before publication.
    p.notice(v-if="syncing") Staging trust, signed metadata, exact partitions, producer pages, and cross-release difference. No partial generation is visible.
  ErrorNotice(v-if="error || status?.state === 'failed'" title="Sync, audit, or integrity verification failed" :message="error || status?.lastError")
    p(v-if="status?.release") The previously published immutable release pair remains identified below; no unverified replacement was published.

  template(v-if="discovery")
    ReleasePanels(:discovery="discovery" :releases="releases" :detail="detail" :integrity="integrity" :status="status")
    template(v-if="detail")
      RecordBrowser(v-model:recordType="recordType" :detail="detail" :page="page" :page-number="pageNumber" :linked="linked" :loading="pageBusy" :locked="controlsLocked" @previous="previousPage" @next="nextPage")
      DiffPanel(v-if="difference" :difference="difference")
      AuditPanel(:report="auditReport" :audits="audits" :busy="auditBusy" :disabled="status?.state !== 'ready' || pageBusy" @run="runAudit")
</template>
