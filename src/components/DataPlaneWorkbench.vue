<script setup vapor>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
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
import DataTable from './ui/DataTable.vue'
import Field from './ui/Field.vue'
import Panel from './ui/Panel.vue'

const TONES = { ready: 'success', valid: 'success', failed: 'danger' }
const statusTone = (value) => TONES[value] ?? ''

const RECORD_TYPES = ['taxa', 'compounds', 'reactions', 'proteins', 'references', 'catalysis', 'limitations']
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
let mainGeneration = 0
let pageGeneration = 0
let auditGeneration = 0
let mainController
let pageController
let auditController

const releaseId = computed(() => status.value?.release?.id)
const pageNumber = computed(() => cursorStack.value.length)
const sourceInputs = computed(() => detail.value?.manifest.inputs ?? [])
const partitions = computed(() => detail.value?.manifest.partitions ?? [])
const controlsBusy = computed(() => status.value?.state === 'syncing' || pageBusy.value)
const links = computed(() => linked.value.catalysis.map((assertion) => ({
  assertion,
  taxon: linked.value.taxa.find((item) => item.id === assertion.taxon_id),
  reaction: linked.value.reactions.find((item) => item.id === assertion.reaction_id),
  protein: linked.value.proteins.find((item) => item.id === assertion.protein_id)
})))
const diffClasses = computed(() => difference.value ? [
  { name: 'Scientific', count: difference.value.record_changes.length + difference.value.scientific_metadata_changes.length, description: 'Normalized records or scientific scope' },
  { name: 'Provenance', count: difference.value.provenance_changes.length, description: 'Source objects, adapters, or transformations' },
  { name: 'Rights', count: difference.value.rights_changes.length, description: 'Licenses, attribution, or redistribution' },
  { name: 'Packaging', count: difference.value.packaging_changes.length, description: 'Partitions and signature envelopes only' }
] : [])

function isAbort(value) {
  return value instanceof DOMException && value.name === 'AbortError'
}

function sourceOrigin(input) {
  return input.source === 'REPOSITORY' ? 'Repository curation' : 'Authority response'
}

async function fetchPublished(activeReleaseId, selectedType, signal) {
  const baselineId = discovery.value.pins.baseline.releaseId
  const candidateId = discovery.value.pins.candidate.releaseId
  const [loadedReleases, loadedDetail, loadedPage, taxa, reactions, proteins, catalysis, loadedDifference, loadedIntegrity, loadedAudits] = await Promise.all([
    loadDataPlaneReleases(signal),
    loadDataPlaneRelease(activeReleaseId, signal),
    loadDataPlanePage(activeReleaseId, selectedType, { limit: 2 }, signal),
    loadDataPlanePage(activeReleaseId, 'taxa', { limit: 2 }, signal),
    loadDataPlanePage(activeReleaseId, 'reactions', { limit: 2 }, signal),
    loadDataPlanePage(activeReleaseId, 'proteins', { limit: 2 }, signal),
    loadDataPlanePage(activeReleaseId, 'catalysis', { limit: 2 }, signal),
    loadDataPlaneDiff(baselineId, candidateId, signal),
    loadDataPlaneIntegrity(signal),
    loadAuthorityClosureAudits(signal)
  ])
  const loadedAudit = loadedAudits.length ? await loadAuthorityClosureAudit(loadedAudits.at(-1).reportDigest, signal) : undefined
  return { loadedReleases, loadedDetail, loadedPage, taxa, reactions, proteins, catalysis, loadedDifference, loadedIntegrity, loadedAudits, loadedAudit }
}

function commitPublished(loaded) {
  pageGeneration += 1
  pageController?.abort()
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

async function initialize() {
  const selectedGeneration = ++mainGeneration
  mainController?.abort()
  mainController = new AbortController()
  error.value = ''
  try {
    const loadedDiscovery = await loadDataPlaneDiscovery(mainController.signal)
    if (selectedGeneration !== mainGeneration) return
    discovery.value = loadedDiscovery
    status.value = loadedDiscovery.status
    if (!loadedDiscovery.status.release) return
    const loaded = await fetchPublished(loadedDiscovery.status.release.id, recordType.value, mainController.signal)
    if (selectedGeneration !== mainGeneration) return
    commitPublished(loaded)
  } catch (value) {
    if (selectedGeneration !== mainGeneration || isAbort(value)) return
    error.value = value instanceof Error ? value.message : 'The local data plane could not be inspected.'
  }
}

async function synchronize() {
  const selectedGeneration = ++mainGeneration
  mainController?.abort()
  pageGeneration += 1
  pageController?.abort()
  mainController = new AbortController()
  error.value = ''
  status.value = { ...(status.value ?? { contractVersion: '1.0.0', localOnly: true, release: null, signerKeyId: null, lastSyncAt: null, lastError: null, integrity: 'empty' }), state: 'syncing' }
  try {
    const synced = await syncDataPlane(mainController.signal)
    if (selectedGeneration !== mainGeneration) return
    const loadedDiscovery = await loadDataPlaneDiscovery(mainController.signal)
    if (selectedGeneration !== mainGeneration) return
    discovery.value = loadedDiscovery
    status.value = synced
    const loaded = await fetchPublished(synced.release.id, recordType.value, mainController.signal)
    if (selectedGeneration !== mainGeneration) return
    commitPublished(loaded)
  } catch (value) {
    if (selectedGeneration !== mainGeneration || isAbort(value)) return
    error.value = value instanceof Error ? value.message : 'The verified sync failed before publication.'
    try {
      const loaded = await loadDataPlaneDiscovery(mainController.signal)
      if (selectedGeneration !== mainGeneration) return
      discovery.value = loaded
      status.value = loaded.status
    } catch (reloadError) {
      if (selectedGeneration !== mainGeneration || isAbort(reloadError)) return
      status.value = { ...status.value, state: 'failed', lastError: error.value }
    }
  }
}

async function requestPage(requestedType, cursor, nextStack) {
  if (!releaseId.value) return
  const selectedGeneration = ++pageGeneration
  pageController?.abort()
  pageController = new AbortController()
  pageBusy.value = true
  error.value = ''
  try {
    const loaded = await loadDataPlanePage(releaseId.value, requestedType, { limit: 2, ...(cursor ? { cursor } : {}) }, pageController.signal)
    if (selectedGeneration !== pageGeneration || loaded.recordType !== requestedType) return
    page.value = loaded
    cursorStack.value = nextStack
    liveMessage.value = `Loaded page ${nextStack.length} of ${requestedType}.`
  } catch (value) {
    if (selectedGeneration !== pageGeneration || isAbort(value)) return
    error.value = value instanceof Error ? value.message : 'The local page could not be loaded.'
    liveMessage.value = `Could not load ${requestedType}.`
  } finally {
    if (selectedGeneration === pageGeneration) pageBusy.value = false
  }
}

function nextPage() {
  if (pageBusy.value || !page.value?.nextCursor) return
  const cursor = page.value.nextCursor
  requestPage(recordType.value, cursor, [...cursorStack.value, cursor])
}

function previousPage() {
  if (pageBusy.value || cursorStack.value.length === 1) return
  const nextStack = cursorStack.value.slice(0, -1)
  requestPage(recordType.value, nextStack.at(-1), nextStack)
}

async function runAudit() {
  if (!discovery.value || auditBusy.value) return
  const selectedGeneration = ++auditGeneration
  auditController?.abort()
  auditController = new AbortController()
  auditBusy.value = true
  error.value = ''
  try {
    const report = await runAuthorityClosureAudit({
      baselineReleaseId: discovery.value.pins.baseline.releaseId,
      candidateReleaseId: discovery.value.pins.candidate.releaseId
    }, auditController.signal)
    if (selectedGeneration !== auditGeneration) return
    const loadedAudits = await loadAuthorityClosureAudits(auditController.signal)
    if (selectedGeneration !== auditGeneration) return
    auditReport.value = report
    audits.value = loadedAudits
    liveMessage.value = `Authority closure audit ${report.reportDigest} is available.`
  } catch (value) {
    if (selectedGeneration !== auditGeneration || isAbort(value)) return
    error.value = value instanceof Error ? value.message : 'The authority closure audit failed.'
  } finally {
    if (selectedGeneration === auditGeneration) auditBusy.value = false
  }
}

watch(recordType, (type) => {
  if (releaseId.value) requestPage(type, null, [null])
})

onMounted(initialize)
onBeforeUnmount(() => {
  mainGeneration += 1
  pageGeneration += 1
  auditGeneration += 1
  mainController?.abort()
  pageController?.abort()
  auditController?.abort()
})
</script>

<template lang="pug">
Panel(title-id="data-plane-title" title="Data plane workbench" eyebrow="11 · Authoritative local data" :status="status?.state ?? 'empty'" :tone="statusTone(status?.state)")
  template(v-slot:actions)
    span.badge Local / offline reads
  p.lede Explicit sync is the only upstream operation. Publication atomically binds both signed releases and their pinned cross-release difference; all subsequent records and audits are read from the verified local closure.
  p.visually-hidden(role="status" aria-atomic="true") {{ liveMessage }}

  .cluster
    button.button(type="button" :disabled="status?.state === 'syncing' || pageBusy || auditBusy" @click="synchronize") {{ status?.state === 'syncing' ? 'Verifying release pair…' : status?.release ? 'Re-verify release pair' : 'Sync release pair' }}
    span.muted(v-if="status?.lastSyncAt") Last verified {{ status.lastSyncAt }}

  div(role="status")
    .notice.stack.stack--tight(v-if="status?.state === 'empty' && !status.release")
      strong Empty local mirror
      p No release is readable yet. Sync explicitly to stage and verify both signed snapshots, every partition and cursor page, and their semantic difference before publication.
    p.notice(v-if="status?.state === 'syncing'") Staging trust, signed metadata, exact partitions, producer pages, and cross-release difference. No partial generation is visible.
  .notice.notice--danger.stack.stack--tight(v-if="error || status?.state === 'failed'" role="alert")
    strong Sync, audit, or integrity verification failed
    p {{ error || status?.lastError }}
    p(v-if="status?.release") The previously published immutable release pair remains identified below; no unverified replacement was published.

  template(v-if="discovery")
    Panel(title-id="data-plane-pins-title" title="Independent data-plane pins" :level="3")
      dl.facts
        div
          dt Baseline release
          dd
            strong {{ discovery.pins.baseline.releaseId }}
            code {{ discovery.pins.baseline.releaseDigest }}
            small.muted {{ discovery.pins.baseline.signerKeyId }}
        div
          dt Candidate / active release
          dd
            strong {{ discovery.pins.candidate.releaseId }}
            code {{ discovery.pins.candidate.releaseDigest }}
            small.muted {{ discovery.pins.candidate.signerKeyId }}
        div
          dt Signed catalog / trust
          dd
            code {{ discovery.pins.catalogDigest }}
            code {{ discovery.pins.trustDigest }}
        div
          dt Rotated Ed25519 keys
          dd
            strong {{ discovery.pins.historicalKey.keyId }} · {{ discovery.pins.historicalKey.status }}
            code {{ discovery.pins.historicalKey.publicKey }}
            strong {{ discovery.pins.activeKey.keyId }} · {{ discovery.pins.activeKey.status }}
            code {{ discovery.pins.activeKey.publicKey }}

  template(v-if="detail")
    Panel(title-id="data-plane-releases-title" title="Locally published releases" :level="3")
      dl.facts
        div(v-for="item in releases" :key="item.release.id")
          dt {{ item.active ? 'Active candidate' : 'Readable baseline' }}
          dd
            strong {{ item.release.id }}
            code {{ item.release.digest }}
            small.muted {{ item.signerKeyId }} · signed {{ item.signedAt }}

    Panel(title-id="data-plane-generation-title" :title="detail.release.id" eyebrow="Active immutable generation" :level="3" :status="`Integrity ${integrity?.status ?? status?.integrity ?? 'unchecked'}`" :tone="statusTone(integrity?.status ?? status?.integrity)")
      dl.facts
        div
          dt Release / schema
          dd {{ detail.release.digest }}
          dd {{ detail.manifest.manifest_schema_version }} manifest · {{ detail.envelope.envelope_schema_version }} envelope
        div
          dt Verified signer / time
          dd {{ detail.signer.keyId }} · {{ detail.signer.status }}
          dd {{ detail.signer.algorithm }} · {{ detail.signer.signedAt }}
        div
          dt Manifest / envelope bytes
          dd {{ detail.manifestDigest }}
          dd {{ detail.envelopeDigest }}
        div
          dt Recipe / source lock
          dd {{ detail.envelope.payload.recipe_path }}
          dd {{ detail.envelope.payload.recipe_sha256 }}
          dd {{ detail.envelope.payload.source_lock_path }}
          dd {{ detail.envelope.payload.source_lock_sha256 }}

    Panel(title-id="data-plane-partitions-title" title="Digest, count, bytes, and ID bounds" eyebrow="Exact partition closure" :level="3")
      template(v-slot:actions)
        span.muted {{ partitions.length }} immutable partitions
      dl.facts
        div(v-for="partition in partitions" :key="partition.path")
          dt {{ partition.path }}
          dd
            code {{ partition.sha256 }}
          dd {{ partition.record_count }} records · {{ partition.bytes }} bytes · {{ partition.first_id }} → {{ partition.last_id }}

    Panel(title-id="data-plane-sources-title" title="Authority and curation remain distinct" eyebrow="Source / adapter / rights closure" :level="3")
      template(v-slot:actions)
        span.muted {{ sourceInputs.length }} pinned source objects
      dl.facts
        div(v-for="input in sourceInputs" :key="input.name")
          dt {{ input.name }}
          dd.stack.stack--tight
            p
              span.badge(:class="input.source === 'REPOSITORY' ? 'badge--warning' : ''") {{ sourceOrigin(input) }}
            p {{ input.source }} → {{ input.record_type }} · {{ input.source_object_bytes }} bytes
            code source {{ input.source_object_sha256 }}
            code adapter {{ input.adapter.id }}@{{ input.adapter.version }}
            code implementation {{ input.adapter.implementation_sha256 }}
            code package {{ input.adapter.package_sha256 }}
            p.muted {{ input.license.id }} · {{ input.license.name }} · {{ input.license.redistribution }}
            p.muted {{ input.license.url }} · {{ input.license.attribution }}
      p.muted Courtesy of the U.S. National Library of Medicine.

    Panel(title-id="data-plane-records-title" title="Local records" :level="3")
      .repel
        Field(id="data-plane-record-type" label="Local record collection")
          select#data-plane-record-type(v-model="recordType" :disabled="controlsBusy")
            option(v-for="type in RECORD_TYPES" :key="type" :value="type") {{ type }} · {{ detail.manifest.record_counts[type] }}
        nav.cluster(aria-label="Record pagination")
          button.button.button--secondary(type="button" :disabled="controlsBusy || pageNumber === 1" @click="previousPage") Previous
          span {{ pageBusy ? 'Loading…' : `Page ${pageNumber}` }}
          button.button.button--secondary(type="button" :disabled="controlsBusy || !page?.nextCursor" @click="nextPage") Next
      DataTable(v-if="page" :caption="`${page.recordType} from the local verified mirror, sorted by ID`" :columns="['Identifier', 'Local record']" :busy="pageBusy")
        tr(v-for="item in page.items" :key="item.id")
          th(scope="row")
            code {{ item.id }}
          td
            .cluster
              strong {{ item.name ?? item.scientific_name ?? item.recommended_name ?? item.statement ?? item.citation ?? item.gene_symbol ?? item.evidence_class }}
              span(v-if="item.formula") {{ item.formula }} · charge {{ item.charge }}
              span(v-if="item.taxon_id") taxon {{ item.taxon_id }}
              span(v-if="item.reaction_id") reaction {{ item.reaction_id }}
              span(v-if="item.protein_id") protein {{ item.protein_id }}

    Panel(title-id="data-plane-links-title" title="Linked catalysis assertions" eyebrow="Taxon / reaction / protein closure" :level="3")
      ul.plain-list.grid
        li.card.stack.stack--tight(v-for="link in links" :key="link.assertion.id")
          div
            span.badge {{ link.assertion.evidence_class }} curation
          p
            strong {{ link.protein?.gene_symbol }} · {{ link.protein?.recommended_name }}
          p
            code {{ link.protein?.id }}
          p {{ link.taxon?.scientific_name }} → {{ link.reaction?.id }}
          p.muted {{ link.assertion.evidence_code }} · {{ link.assertion.reference_ids.join(', ') }}

    Panel(v-if="difference" title-id="data-plane-diff-title" :title="`${difference.baseline.id} → ${difference.candidate.id}`" eyebrow="Baseline → candidate semantic proof" :level="3")
      template(v-slot:actions)
        code {{ difference.diff_digest }}
      dl.facts
        div(v-for="item in diffClasses" :key="item.name")
          dt {{ item.name }}
          dd
            strong {{ item.count }} changes
          dd {{ item.description }}
      p {{ difference.counts.unchanged }} records are unchanged; additions {{ difference.counts.added }}, removals {{ difference.counts.removed }}, changed {{ difference.counts.changed }}.
      ul.plain-list.stack.stack--tight
        li.cluster(v-for="change in difference.record_changes" :key="`${change.record_type}:${change.id}`")
          strong {{ change.record_type }}/{{ change.id }}
          span {{ change.status }} · {{ change.classification }} · {{ change.attribution.join(', ') }}

    Panel(title-id="data-plane-audit-title" title="Authority closure audit" eyebrow="Persisted deterministic audit" :level="3")
      template(v-slot:actions)
        button.button.button--secondary(type="button" :disabled="auditBusy || status?.state !== 'ready' || pageBusy" @click="runAudit") {{ auditBusy ? 'Auditing…' : auditReport ? 'Re-run idempotent audit' : 'Run offline audit' }}
      p Audit reads only already verified local records. It checks record counts, reaction balance, taxon/catalysis closure, and references; scientific validation remains unsupported.
      template(v-if="auditReport")
        p
          code {{ auditReport.reportDigest }}
        dl.facts
          div
            dt Algorithm / reports
            dd {{ auditReport.algorithmVersion }}
            dd {{ audits.length }} immutable report{{ audits.length === 1 ? '' : 's' }}
          div
            dt Release pair
            dd {{ auditReport.baseline.id }}
            dd {{ auditReport.release.id }}
          div
            dt Closure result
            dd {{ auditReport.results.totalRecords }} records · {{ auditReport.results.partitionCount }} partitions
            dd {{ auditReport.results.sourceObjectCount }} source objects · all checks passed
          div
            dt Scientific validation
            dd {{ auditReport.scientificValidation }}
            dd Distribution and authority closure only
</template>
