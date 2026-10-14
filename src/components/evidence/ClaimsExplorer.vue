<script setup vapor>
import { computed, ref, watch } from 'vue'
import { EVIDENCE_GRADES, EVIDENCE_KEYS } from '../../knowledge/evidence.js'
import { CLAIM_SORTS, TOPICS, filterClaims, readClaimFilters, sortClaims, statusCounts, topicInfo, writeClaimFilters } from '../../kb/evidence.js'
import { navigate, useRoute } from '../../router.js'
import InputField from '../../ui/InputField.vue'
import SelectField from '../../ui/SelectField.vue'
import ClaimsMatrix from './ClaimsMatrix.vue'
import ScoringHelp from './ScoringHelp.vue'
import StatusTiles from './StatusTiles.vue'
import VerdictKey from './VerdictKey.vue'

// The claims audit: status tiles (the headline counters, also filters), a filter bar and the matrix.
// With `urlSync` the filters live in the URL query (?q=&status=&topic=&source=&grade=&sort=) so a
// filtered audit can be shared; without it they are local to the page. `articles` feeds the
// scoring help.
const props = defineProps({
  claims: { type: Array, required: true },
  articles: { type: Array, default: () => [] },
  urlSync: { type: Boolean, default: false },
  idPrefix: { type: String, default: 'claims' }
})

const route = useRoute()
const q = ref('')
const status = ref('')
const topic = ref('')
const source = ref('')
const grade = ref('')
const sort = ref('topic')
const grouped = ref(true)

function load() {
  if (!props.urlSync) return
  const filters = readClaimFilters(route.query)
  q.value = filters.q
  status.value = filters.status
  topic.value = filters.topic
  source.value = filters.source
  grade.value = filters.grade
  sort.value = filters.sort
}
watch(() => [route.path, JSON.stringify(route.query)], load, { immediate: true })

watch([q, status, topic, source, grade, sort], () => {
  if (!props.urlSync) return
  const query = writeClaimFilters({ q: q.value, status: status.value, topic: topic.value, source: source.value, grade: grade.value, sort: sort.value })
  if (JSON.stringify(query) === JSON.stringify(writeClaimFilters(readClaimFilters(route.query)))) return
  const text = new URLSearchParams(query).toString()
  navigate(text ? `${route.path}?${text}` : route.path, { replace: true })
})

const counts = computed(() => statusCounts(props.claims))
const maxTotal = computed(() => Math.max(0, ...props.claims.map((claim) => claim.evidenceFor + claim.evidenceAgainst)))
const visible = computed(() => filterClaims(props.claims, { q: q.value, status: status.value, topic: topic.value, source: source.value, grade: grade.value }))
const groups = computed(() => {
  if (!visible.value.length) return []
  if (!grouped.value) return [{ key: 'all', label: null, items: sortClaims(visible.value, sort.value) }]
  const sorted = sortClaims(visible.value, sort.value === 'topic' ? 'name' : sort.value)
  return TOPICS.map((entry) => ({ key: entry.id, label: topicInfo(entry.id).label, items: sorted.filter((claim) => claim.topic === entry.id) })).filter((group) => group.items.length)
})
const summary = computed(() => `Showing ${visible.value.length} of ${props.claims.length} claims`)
const filtered = computed(() => Boolean(q.value || status.value || topic.value || source.value || grade.value))
const topicOptions = computed(() => [{ value: '', label: 'Any topic' }, ...TOPICS.map((entry) => ({ value: entry.id, label: entry.label }))])
const sourceOptions = [{ value: '', label: 'Any source' }, { value: 'conversation', label: 'Raised in the conversation' }, { value: 'literature', label: 'Taken from the literature' }]
const gradeOptions = [{ value: '', label: 'Any grade' }, ...EVIDENCE_KEYS.map((key) => ({ value: key, label: EVIDENCE_GRADES[key].label }))]
const sortOptions = CLAIM_SORTS.map((entry) => ({ value: entry.id, label: entry.label }))

function clear() {
  q.value = ''
  status.value = ''
  topic.value = ''
  source.value = ''
  grade.value = ''
}
function setSort(id) {
  sort.value = id
}
</script>

<template lang="pug">
.stack
  StatusTiles(v-model="status" :counts="counts" :total="claims.length")
  form.grid.grid--compact.grid--end(role="search" aria-label="Filter the claims" @submit.prevent)
    InputField(:id="`${idPrefix}-q`" label="Find a claim" type="search" v-model="q" autocomplete="off")
    SelectField(:id="`${idPrefix}-topic`" label="Topic" v-model="topic" :options="topicOptions")
    SelectField(:id="`${idPrefix}-source`" label="Where it came from" v-model="source" :options="sourceOptions")
    SelectField(:id="`${idPrefix}-grade`" label="Evidence grade" v-model="grade" :options="gradeOptions")
    SelectField(:id="`${idPrefix}-sort`" label="Sort by" v-model="sort" :options="sortOptions")
    InputField(:id="`${idPrefix}-group`" label="Group by topic" type="checkbox" v-model="grouped")
  .repel
    p(role="status") {{ summary }}
    button.button.button--secondary(v-if="filtered" type="button" @click="clear") Clear filters
  ClaimsMatrix(v-if="groups.length" :groups="groups" :max-total="maxTotal" :sort="sort" @sort="setSort")
  p.notice.notice--warning(v-else) No claim matches these filters.
  VerdictKey
  ScoringHelp(:articles="articles")
</template>
