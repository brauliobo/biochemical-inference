<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import {
  extractEvidenceCandidate,
  loadEvidenceCandidate,
  loadEvidenceCandidates,
  loadEvidenceDocument,
  loadEvidenceHealth,
  searchEvidence
} from '../api.js'

const props = defineProps({ suggestedQuery: { type: String, default: 'MTHFR' } })

const health = ref()
const query = ref('MTHFR')
const useVector = ref(false)
const results = ref([])
const searchResponse = ref()
const documentResponse = ref()
const candidates = ref([])
const selectedCandidate = ref()
const selectedSpanIds = ref([])
const instruction = ref('Extract one biochemical regulation assertion supported by only the selected exact spans.')
const state = ref('loading')
const searchState = ref('idle')
const documentState = ref('idle')
const candidateState = ref('idle')
const message = ref('')
const documentMessage = ref('')
const candidateMessage = ref('')
let controller
let searchController
let documentController
let candidateController
let searchGeneration = 0
let documentGeneration = 0
let candidateGeneration = 0

const release = computed(() => health.value?.release)
const spanById = computed(() => new Map((documentResponse.value?.spans ?? []).map((span) => [span.id, span])))
const sectionById = computed(() => new Map((documentResponse.value?.sections ?? []).map((section) => [section.id, section])))
const annotationById = computed(() => new Map((documentResponse.value?.annotations ?? []).map((annotation) => [annotation.id, annotation])))
const lifecycleWarning = computed(() => documentResponse.value?.document.publication_status !== 'active')
const canExtract = computed(() => selectedSpanIds.value.length > 0 && instruction.value.trim() && candidateState.value !== 'extracting')

function isAbort(error) {
  return error instanceof DOMException && error.name === 'AbortError'
}

function errorMessage(error, fallback) {
  return error instanceof Error ? error.message : fallback
}

function rankingChannels(result) {
  return Object.entries(result.score_components).map(([name, component]) => ({ name, ...component }))
}

function annotationLabel(identifier) {
  const annotation = annotationById.value.get(identifier)
  if (!annotation) return identifier
  const span = spanById.value.get(annotation.span_id)
  return `${span?.text ?? annotation.span_id} (${annotation.normalized_id ?? 'unresolved'})`
}

function useSelection() {
  query.value = props.suggestedQuery || 'MTHFR'
}

async function search() {
  if (!release.value || !query.value.trim()) return
  const generation = ++searchGeneration
  documentGeneration += 1
  candidateGeneration += 1
  searchController?.abort()
  documentController?.abort()
  candidateController?.abort()
  searchController = new AbortController()
  results.value = []
  searchResponse.value = undefined
  documentResponse.value = undefined
  selectedCandidate.value = undefined
  selectedSpanIds.value = []
  searchState.value = 'searching'
  documentState.value = 'idle'
  candidateState.value = 'idle'
  message.value = ''
  documentMessage.value = ''
  candidateMessage.value = ''
  try {
    const response = await searchEvidence(release.value, { query: query.value, limit: 10, use_vector: useVector.value }, searchController.signal)
    if (generation !== searchGeneration) return
    searchResponse.value = response
    results.value = response.items
    searchState.value = 'ready'
  } catch (error) {
    if (generation !== searchGeneration || isAbort(error)) return
    searchState.value = useVector.value ? 'vector-failed' : 'failed'
    message.value = errorMessage(error, 'Evidence search failed.')
  }
}

async function openDocument(identifier) {
  if (!release.value) return
  const generation = ++documentGeneration
  const owner = searchGeneration
  candidateGeneration += 1
  documentController?.abort()
  candidateController?.abort()
  documentController = new AbortController()
  documentResponse.value = undefined
  selectedCandidate.value = undefined
  selectedSpanIds.value = []
  documentState.value = 'loading'
  documentMessage.value = ''
  candidateState.value = 'idle'
  candidateMessage.value = ''
  try {
    const response = await loadEvidenceDocument(release.value, identifier, documentController.signal)
    if (generation !== documentGeneration || owner !== searchGeneration) return
    documentResponse.value = response
    documentState.value = 'ready'
  } catch (error) {
    if (generation !== documentGeneration || owner !== searchGeneration || isAbort(error)) return
    documentState.value = 'failed'
    documentMessage.value = errorMessage(error, 'The evidence document could not be loaded.')
  }
}

async function refreshCandidates(signal = controller?.signal, current = () => true) {
  if (!release.value) return
  const response = await loadEvidenceCandidates(release.value, signal)
  if (current()) candidates.value = response.items
}

async function extractCandidate() {
  if (!release.value || !documentResponse.value || !canExtract.value) return
  const generation = ++candidateGeneration
  const owner = searchGeneration
  const documentId = documentResponse.value.document.id
  candidateController?.abort()
  candidateController = new AbortController()
  candidateState.value = 'extracting'
  candidateMessage.value = ''
  selectedCandidate.value = undefined
  try {
    const response = await extractEvidenceCandidate(release.value, {
      document_id: documentId,
      span_ids: [...selectedSpanIds.value],
      instruction: instruction.value
    }, candidateController.signal)
    if (generation !== candidateGeneration || owner !== searchGeneration || documentId !== documentResponse.value?.document.id) return
    selectedCandidate.value = response.candidate
    candidateState.value = 'ready'
    await refreshCandidates(candidateController.signal, () => generation === candidateGeneration && owner === searchGeneration)
  } catch (error) {
    if (generation !== candidateGeneration || owner !== searchGeneration || isAbort(error)) return
    candidateState.value = error && typeof error === 'object' && error.code === 'EVIDENCE_MODEL_UNAVAILABLE' ? 'generation-unavailable' : 'failed'
    candidateMessage.value = errorMessage(error, 'Candidate extraction failed.')
  }
}

async function openCandidate(identifier) {
  if (!release.value) return
  const generation = ++candidateGeneration
  const owner = searchGeneration
  candidateController?.abort()
  candidateController = new AbortController()
  candidateState.value = 'loading'
  candidateMessage.value = ''
  try {
    const response = await loadEvidenceCandidate(release.value, identifier, candidateController.signal)
    if (generation !== candidateGeneration || owner !== searchGeneration) return
    selectedCandidate.value = response.candidate
    candidateState.value = 'ready'
  } catch (error) {
    if (generation !== candidateGeneration || owner !== searchGeneration || isAbort(error)) return
    candidateState.value = 'failed'
    candidateMessage.value = errorMessage(error, 'The unreviewed candidate could not be loaded.')
  }
}

async function initialize() {
  controller?.abort()
  controller = new AbortController()
  state.value = 'loading'
  message.value = ''
  try {
    health.value = await loadEvidenceHealth(controller.signal)
    state.value = 'ready'
    await Promise.all([search(), refreshCandidates()])
  } catch (error) {
    if (isAbort(error)) return
    health.value = undefined
    state.value = 'failed'
    message.value = errorMessage(error, 'The pinned evidence release is unavailable.')
  }
}

initialize()
onBeforeUnmount(() => {
  controller?.abort()
  searchController?.abort()
  documentController?.abort()
  candidateController?.abort()
})
</script>

<template lang="pug">
section.evidence-panel(aria-labelledby="literature-title")
  .section-heading
    div
      p.kicker 06 · Literature intelligence
      h2#literature-title Search exact evidence
    span.status-chip(:class="state === 'ready' ? 'ready' : 'failed'") {{ state === 'loading' ? 'Verifying' : state === 'ready' ? 'Evidence pinned' : 'Unavailable' }}

  .evidence-loading(v-if="state === 'loading'" aria-live="polite") Verifying the independent evidence release and digest…
  .alert.error(v-else-if="state === 'failed'" role="alert")
    strong Evidence intelligence unavailable
    p {{ message }}
    p Atlas and simulation state do not establish literature compatibility.
    button.secondary(type="button" @click="initialize") Retry evidence verification

  template(v-else-if="health")
    dl.provenance-grid.evidence-provenance
      div
        dt Evidence release
        dd {{ health.release.id }}
      div
        dt Independent SHA-256
        dd.digest sha256:{{ health.release.digest }}
      div
        dt Strict schema
        dd {{ health.release.schema_version }}
      div
        dt Bounded corpus
        dd {{ health.documents }} documents

    form.evidence-search(@submit.prevent="search")
      .evidence-query
        label(for="evidence-query") PMID, PMCID, DOI, ontology ID, or text
        input#evidence-query(v-model="query" type="search" maxlength="500" autocomplete="off" aria-describedby="evidence-query-help")
        small#evidence-query-help Search works with exact and BM25 ranking when vectors are off.
      label.vector-control(for="evidence-vector")
        input#evidence-vector(v-model="useVector" type="checkbox")
        span Add local Ollama vector rank
      button.secondary(type="button" @click="useSelection") Use workbench selection
      button.run-button(type="submit" :disabled="searchState === 'searching'") {{ searchState === 'searching' ? 'Searching…' : 'Search evidence' }}

    .evidence-loading(v-if="searchState === 'searching'" aria-live="polite") Ranking exact identifiers, annotations, and full text{{ useVector ? ' with the requested vector channel' : '' }}…
    .alert.error(v-else-if="searchState === 'vector-failed'" role="alert")
      strong Vector search failed; no lexical fallback was substituted
      p {{ message }}
      p Turn vectors off for an explicit exact/BM25 search, or retry the requested vector search.
      button.secondary(type="button" @click="search") Retry vector search
    .alert.error(v-else-if="searchState === 'failed'" role="alert")
      strong Evidence search failed
      p {{ message }}
      button.secondary(type="button" @click="search") Retry search

    template(v-else-if="searchState === 'ready'")
      .ranking-explanation
        strong Transparent ranking · reciprocal-rank-fusion-v1
        details
          summary Explain exact, annotation, BM25, vector, and RRF channels
          dl.compact-list
            div(v-for="(explanation, channel) in searchResponse.explanations" :key="channel")
              dt {{ channel }}
              dd {{ explanation }}
      p.atlas-empty(v-if="!results.length" role="status") No evidence matched this bounded release. This does not establish absence from the literature.
      .evidence-results(v-else role="list" aria-label="Ranked evidence results")
        article.evidence-result(v-for="(result, index) in results" :key="result.document.id" role="listitem")
          .evidence-result-heading
            span.result-rank
              | Rank {{ index + 1 }} · RRF {{ result.score.toFixed(6) }}
            span(:class="`lifecycle-${result.document.publication_status}`") {{ result.document.publication_status }}
          h3
            button.evidence-title(type="button" @click="openDocument(result.document.id)") {{ result.document.title }}
          p {{ result.document.canonical_id }} · {{ result.document.journal }} · {{ result.document.publication_date }}
          ul.ranking-channels(aria-label="Ranking channels and scores")
            li(v-for="channel in rankingChannels(result)" :key="channel.name")
              strong {{ channel.name }} rank {{ channel.rank }}
              span(v-if="channel.raw !== undefined") BM25 raw {{ channel.raw.toFixed(6) }}
              span(v-if="channel.cosine !== undefined") cosine {{ channel.cosine.toFixed(6) }}
              span RRF +{{ channel.rrf.toFixed(6) }}

    .evidence-loading(v-if="documentState === 'loading'" aria-live="polite") Loading license-filtered document evidence…
    .alert.error(v-else-if="documentState === 'failed'" role="alert")
      strong Evidence document failed
      p {{ documentMessage }}
    article.evidence-document(v-else-if="documentResponse" aria-labelledby="evidence-document-title")
      .document-heading
        div
          p.kicker Selected document
          h3#evidence-document-title {{ documentResponse.document.title }}
        span(:class="`lifecycle-${documentResponse.document.publication_status}`") {{ documentResponse.document.publication_status }}
      .lifecycle-warning(v-if="lifecycleWarning" role="alert")
        strong Publication lifecycle warning
        p This record is {{ documentResponse.document.publication_status }}. Inspect its lifecycle before using any span.
      dl.detail-grid
        div
          dt Content policy
          dd {{ documentResponse.document.content_scope }}
        div
          dt Authors
          dd {{ documentResponse.document.authors.join(', ') }}
      section.license-card(aria-labelledby="license-title")
        h4#license-title License and redistribution policy
        article(v-for="license in documentResponse.licenses" :key="license.id")
          strong {{ license.name }} · {{ license.redistribution }}
          p {{ license.attribution }}
          a(:href="license.url" target="_blank" rel="noreferrer") Read license terms
      details.lifecycle-details
        summary Publication lifecycle ({{ documentResponse.lifecycle.length }})
        ol
          li(v-for="event in documentResponse.lifecycle" :key="event.id") {{ event.occurred_at }} · {{ event.event_type }} · {{ event.note }}
      .document-sections
        section.evidence-section(v-for="section in documentResponse.sections" :key="section.id")
          h4 {{ section.section_type }}
          p.location {{ section.source_locator }} · source [{{ section.source_offset }}, {{ section.source_end }})
          p(v-if="section.text") {{ section.text }}
          p.withheld(v-else role="note") Text withheld by the metadata-only content policy.
          fieldset.span-list(v-if="documentResponse.spans.some(span => span.section_id === section.id)")
            legend Select exact supporting spans for review-only extraction
            label(v-for="span in documentResponse.spans.filter(item => item.section_id === section.id)" :key="span.id" :for="span.id")
              input(:id="span.id" v-model="selectedSpanIds" type="checkbox" :value="span.id")
              span
                strong “{{ span.text }}”
                small {{ span.id }} · local [{{ span.start }}, {{ span.end }}) · source [{{ span.source_offset }}, {{ span.source_end }})
      .annotation-grid
        section
          h4 PubTator annotations
          p.atlas-empty(v-if="!documentResponse.annotations.length") No annotations in this document response.
          ul
            li(v-for="annotation in documentResponse.annotations" :key="annotation.id") {{ annotation.annotation_type }} · {{ spanById.get(annotation.span_id)?.text }} · {{ annotation.normalized_id ?? 'unresolved' }}
        section
          h4 PubTator relations
          p.atlas-empty(v-if="!documentResponse.relations.length") No machine relation in this document response.
          ul
            li(v-for="relation in documentResponse.relations" :key="relation.id") {{ annotationLabel(relation.subject_annotation_id) }} {{ relation.relation_type.replaceAll('_', ' ') }} {{ annotationLabel(relation.object_annotation_id) }} · confidence {{ relation.confidence }}

      form.candidate-form(@submit.prevent="extractCandidate")
        .trust-boundary(role="note")
          strong Unreviewed, not trusted knowledge
          p Ollama output is a review-only candidate. It cannot enter the atlas or trusted release through this workbench.
        label(for="candidate-instruction") Extraction instruction
        textarea#candidate-instruction(v-model="instruction" maxlength="2000" rows="3")
        p {{ selectedSpanIds.length }} exact span{{ selectedSpanIds.length === 1 ? '' : 's' }} selected.
        button.run-button(type="submit" :disabled="!canExtract") {{ candidateState === 'extracting' ? 'Generating candidate…' : 'Extract unreviewed candidate' }}
      .alert.error(v-if="candidateState === 'generation-unavailable'" role="alert")
        strong Ollama generation unavailable; no candidate was created
        p {{ candidateMessage }}
        button.secondary(type="button" @click="extractCandidate") Retry candidate generation
      .alert.error(v-else-if="candidateState === 'failed'" role="alert") {{ candidateMessage }}
      article.candidate-detail(v-else-if="selectedCandidate")
        strong.trust-label Unreviewed, not trusted knowledge
        h4 {{ selectedCandidate.subject }} · {{ selectedCandidate.relation }} · {{ selectedCandidate.object }}
        p Model {{ selectedCandidate.model }} · {{ selectedCandidate.id }}
        p Supporting spans: {{ selectedCandidate.span_ids.join(', ') }}
        p Unresolved: {{ selectedCandidate.unresolved_entities.join(', ') || 'none declared' }}
        p Missing context: {{ selectedCandidate.missing_context.join(', ') || 'none declared' }}

    section.candidate-queue(aria-labelledby="candidate-queue-title")
      h3#candidate-queue-title Unreviewed candidate workspace
      p.trust-boundary Every record below is unreviewed, not trusted knowledge, and stored outside immutable evidence releases.
      p.atlas-empty(v-if="!candidates.length") No unreviewed candidates have been persisted in this workspace.
      button.candidate-row(v-for="candidate in candidates" :key="candidate.id" type="button" @click="openCandidate(candidate.id)")
        strong Unreviewed, not trusted knowledge
        span {{ candidate.subject }} · {{ candidate.relation }} · {{ candidate.object }}
        code {{ candidate.id }}
</template>
