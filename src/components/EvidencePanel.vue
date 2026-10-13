<script setup vapor>
import { computed, onMounted, ref } from 'vue'
import {
  extractEvidenceCandidate,
  loadEvidenceCandidate,
  loadEvidenceCandidates,
  loadEvidenceDocument,
  loadEvidenceHealth,
  searchEvidence
} from '../api.js'
import { errorMessage, useTask } from '../composables/useTask.js'
import Card from '../ui/Card.vue'
import EmptyState from '../ui/EmptyState.vue'
import ErrorNotice from '../ui/ErrorNotice.vue'
import Facts from '../ui/Facts.vue'
import LiveMessage from '../ui/LiveMessage.vue'
import Notice from '../ui/Notice.vue'
import Panel from '../ui/Panel.vue'
import CandidateForm from './evidence/CandidateForm.vue'
import DocumentView from './evidence/DocumentView.vue'
import ResultList from './evidence/ResultList.vue'
import SearchForm from './evidence/SearchForm.vue'

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
// A search owns the document and candidate it leads to: starting one cancels both.
const healthTask = useTask()
const searchTask = useTask()
const documentTask = useTask()
const candidateTask = useTask()

const release = computed(() => health.value?.release)
const canExtract = computed(() => selectedSpanIds.value.length > 0 && instruction.value.trim() !== '' && candidateState.value !== 'extracting' && Boolean(documentResponse.value))
const statusLabel = computed(() => (state.value === 'loading' ? 'Verifying' : state.value === 'ready' ? 'Evidence pinned' : 'Unavailable'))
const pins = computed(() => [
  { label: 'Evidence release', value: health.value.release.id },
  { label: 'Independent SHA-256', value: `sha256:${health.value.release.digest}` },
  { label: 'Strict schema', value: health.value.release.schema_version },
  { label: 'Bounded corpus', value: `${health.value.documents} documents` }
])

function forgetDocument() {
  documentResponse.value = undefined
  selectedCandidate.value = undefined
  selectedSpanIds.value = []
  candidateState.value = 'idle'
  candidateMessage.value = ''
}

function search() {
  if (!release.value || !query.value.trim()) return undefined
  documentTask.cancel()
  candidateTask.cancel()
  results.value = []
  searchResponse.value = undefined
  forgetDocument()
  searchState.value = 'searching'
  documentState.value = 'idle'
  message.value = ''
  documentMessage.value = ''
  return searchTask.run(async ({ signal, fresh }) => fresh(await searchEvidence(release.value, { query: query.value, limit: 10, use_vector: useVector.value }, signal)), {
    done: (response) => {
      searchResponse.value = response
      results.value = response.items
      searchState.value = 'ready'
    },
    fail: (error) => {
      searchState.value = useVector.value ? 'vector-failed' : 'failed'
      message.value = errorMessage(error, 'Evidence search failed.')
    }
  })
}

function openDocument(identifier) {
  if (!release.value) return undefined
  candidateTask.cancel()
  forgetDocument()
  documentState.value = 'loading'
  documentMessage.value = ''
  return documentTask.run(async ({ signal, fresh }) => fresh(await loadEvidenceDocument(release.value, identifier, signal)), {
    done: (response) => {
      documentResponse.value = response
      documentState.value = 'ready'
    },
    fail: (error) => {
      documentState.value = 'failed'
      documentMessage.value = errorMessage(error, 'The evidence document could not be loaded.')
    }
  })
}

function extractCandidate() {
  if (!release.value || !canExtract.value) return undefined
  const documentId = documentResponse.value.document.id
  candidateState.value = 'extracting'
  candidateMessage.value = ''
  selectedCandidate.value = undefined
  return candidateTask.run(async ({ signal, fresh }) => {
    const { candidate } = fresh(await extractEvidenceCandidate(release.value, { document_id: documentId, span_ids: [...selectedSpanIds.value], instruction: instruction.value }, signal))
    return { candidate, queue: fresh(await loadEvidenceCandidates(release.value, signal)).items }
  }, {
    done: ({ candidate, queue }) => {
      selectedCandidate.value = candidate
      candidates.value = queue
      candidateState.value = 'ready'
    },
    fail: (error) => {
      candidateState.value = error && typeof error === 'object' && error.code === 'EVIDENCE_MODEL_UNAVAILABLE' ? 'generation-unavailable' : 'failed'
      candidateMessage.value = errorMessage(error, 'Candidate extraction failed.')
    }
  })
}

function openCandidate(identifier) {
  if (!release.value) return undefined
  candidateState.value = 'loading'
  candidateMessage.value = ''
  return candidateTask.run(async ({ signal, fresh }) => fresh(await loadEvidenceCandidate(release.value, identifier, signal)).candidate, {
    done: (candidate) => {
      selectedCandidate.value = candidate
      candidateState.value = 'ready'
    },
    fail: (error) => {
      candidateState.value = 'failed'
      candidateMessage.value = errorMessage(error, 'The unreviewed candidate could not be loaded.')
    }
  })
}

function initialize() {
  state.value = 'loading'
  message.value = ''
  return healthTask.run(async (task) => {
    health.value = task.fresh(await loadEvidenceHealth(task.signal))
    state.value = 'ready'
    await Promise.all([search(), loadQueue(task)])
  }, {
    fail: (error) => {
      health.value = undefined
      state.value = 'failed'
      message.value = errorMessage(error, 'The pinned evidence release is unavailable.')
    }
  })
}

async function loadQueue({ signal, fresh }) {
  if (release.value) candidates.value = fresh(await loadEvidenceCandidates(release.value, signal)).items
}

onMounted(initialize)
</script>

<template lang="pug">
Panel(title="Search exact evidence" title-id="literature-title" eyebrow="06 · Literature intelligence" :status="statusLabel" :tone="state === 'ready' ? 'success' : state === 'loading' ? '' : 'danger'")
  LiveMessage(visible :text="state === 'loading' ? 'Verifying the independent evidence release and digest…' : ''")
  ErrorNotice(v-if="state === 'failed'" title="Evidence intelligence unavailable" :message="message" retry-label="Retry evidence verification" @retry="initialize")
    p Atlas and simulation state do not establish literature compatibility.

  template(v-if="state === 'ready' && health")
    Facts(:items="pins")
    SearchForm(v-model:query="query" v-model:useVector="useVector" :searching="searchState === 'searching'" @search="search" @selection="query = props.suggestedQuery || 'MTHFR'")

    LiveMessage(visible :text="searchState === 'searching' ? `Ranking exact identifiers, annotations, and full text${useVector ? ' with the requested vector channel' : ''}…` : ''")
    ErrorNotice(v-if="searchState === 'vector-failed'" title="Vector search failed; no lexical fallback was substituted" :message="message" retry-label="Retry vector search" @retry="search")
      p Turn vectors off for an explicit exact/BM25 search, or retry the requested vector search.
    ErrorNotice(v-if="searchState === 'failed'" title="Evidence search failed" :message="message" retry-label="Retry search" @retry="search")
    ResultList(v-if="searchState === 'ready'" :response="searchResponse" :results="results" @open="openDocument")

    LiveMessage(visible :text="documentState === 'loading' ? 'Loading license-filtered document evidence…' : ''")
    ErrorNotice(v-if="documentState === 'failed'" title="Evidence document failed" :message="documentMessage")
    DocumentView(v-if="documentResponse" v-model:selectedSpanIds="selectedSpanIds" :document="documentResponse")
      CandidateForm(v-model:instruction="instruction" :selected-count="selectedSpanIds.length" :state="candidateState" :message="candidateMessage" :candidate="selectedCandidate" :can-extract="Boolean(canExtract)" @extract="extractCandidate")

    Panel(title="Unreviewed candidate workspace" title-id="candidate-queue-title" :level="3")
      Notice(tone="warning") Every record below is unreviewed, not trusted knowledge, and stored outside immutable evidence releases.
      EmptyState(v-if="!candidates.length") No unreviewed candidates have been persisted in this workspace.
      ul.plain-list.stack.stack--tight(v-else)
        li(v-for="candidate in candidates" :key="candidate.id")
          button.card(type="button" @click="openCandidate(candidate.id)")
            strong Unreviewed, not trusted knowledge
            span {{ candidate.subject }} · {{ candidate.relation }} · {{ candidate.object }}
            small {{ candidate.release_id }} · sha256:{{ candidate.release_digest }}
            code {{ candidate.id }}
</template>
