<script setup vapor>
import { computed, ref, watch } from 'vue'
import { EVIDENCE_GRADES, EVIDENCE_KEYS } from '../../knowledge/evidence.js'
import { ARTICLE_SORTS, DESIGN_CLASSES, TOPICS, filterArticles, readArticleFilters, sortArticles, writeArticleFilters, yearExtent } from '../../kb/evidence.js'
import { navigate, useRoute } from '../../router.js'
import InputField from '../../ui/InputField.vue'
import Pagination from '../../ui/Pagination.vue'
import SelectField from '../../ui/SelectField.vue'
import ArticleTable from './ArticleTable.vue'
import DesignIcon from './DesignIcon.vue'
import ScoringHelp from './ScoringHelp.vue'

// The literature explorer: filter the articles by words, the entries they inform, topic, design, grade
// and year range, sort them, and page through the dot plot table. Filters live in the URL query
// (?q=&entity=&topic=&design=&grade=&from=&to=&sort=&page=) so a view can be shared.
const props = defineProps({ articles: { type: Array, required: true } })

const PAGE_SIZE = 60
const route = useRoute()
const extent = computed(() => yearExtent(props.articles))
const q = ref('')
const entity = ref('')
const topic = ref('')
const design = ref('')
const grade = ref('')
const yearFrom = ref(extent.value[0])
const yearTo = ref(extent.value[1])
const sort = ref('newest')
const page = ref(1)

function load() {
  const filters = readArticleFilters(route.query, extent.value)
  q.value = filters.q
  entity.value = filters.entity
  topic.value = filters.topic
  design.value = filters.design
  grade.value = filters.grade
  yearFrom.value = filters.yearFrom
  yearTo.value = filters.yearTo
  sort.value = filters.sort
  const wanted = Number.parseInt(route.query.page, 10)
  page.value = Number.isFinite(wanted) && wanted > 0 ? wanted : 1
}
watch(() => [route.path, JSON.stringify(route.query)], load, { immediate: true })

const current = () => writeArticleFilters({ q: q.value, topic: topic.value, design: design.value, grade: grade.value, entity: entity.value, yearFrom: yearFrom.value, yearTo: yearTo.value, sort: sort.value }, extent.value)
watch([q, entity, topic, design, grade, yearFrom, yearTo, sort], () => {
  page.value = 1
  push()
})
watch(page, () => push())
function push() {
  const query = { ...current(), ...(page.value > 1 ? { page: String(page.value) } : {}) }
  const existing = { ...writeArticleFilters(readArticleFilters(route.query, extent.value), extent.value), ...(route.query.page && Number(route.query.page) > 1 ? { page: String(Number(route.query.page)) } : {}) }
  if (JSON.stringify(query) === JSON.stringify(existing)) return
  const text = new URLSearchParams(query).toString()
  navigate(text ? `${route.path}?${text}` : route.path, { replace: true })
}

const low = computed(() => Math.min(yearFrom.value, yearTo.value))
const high = computed(() => Math.max(yearFrom.value, yearTo.value))
const visible = computed(() => sortArticles(filterArticles(props.articles, { q: q.value, entity: entity.value, topic: topic.value, design: design.value, grade: grade.value, yearFrom: low.value, yearTo: high.value }), sort.value))
const pages = computed(() => Math.max(1, Math.ceil(visible.value.length / PAGE_SIZE)))
const at = computed(() => Math.min(page.value, pages.value))
const rows = computed(() => visible.value.slice((at.value - 1) * PAGE_SIZE, at.value * PAGE_SIZE))
const summary = computed(() => `Showing ${visible.value.length} of ${props.articles.length} articles`)
const range = computed(() => (visible.value.length ? `${(at.value - 1) * PAGE_SIZE + 1} to ${Math.min(at.value * PAGE_SIZE, visible.value.length)} of ${visible.value.length}` : 'none'))
const filtered = computed(() => Boolean(q.value || entity.value || topic.value || design.value || grade.value || low.value > extent.value[0] || high.value < extent.value[1]))

// The entries that the most articles inform, offered as suggestions for the entity filter.
const suggestions = computed(() => {
  const counts = new Map()
  for (const article of props.articles) for (const item of article.informs) if (item.type !== 'claim') counts.set(item.name, (counts.get(item.name) ?? 0) + 1)
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 80).map(([name]) => name)
})
const designCounts = computed(() => DESIGN_CLASSES.map((entry) => ({ ...entry, count: filterArticles(props.articles, { q: q.value, entity: entity.value, topic: topic.value, grade: grade.value, yearFrom: low.value, yearTo: high.value, design: entry.id }).length })))
const topicOptions = computed(() => [{ value: '', label: 'Any topic' }, ...TOPICS.map((entry) => ({ value: entry.id, label: entry.label }))])
const designOptions = computed(() => [{ value: '', label: 'Any design' }, ...designCounts.value.map((entry) => ({ value: entry.id, label: `${entry.label} (${entry.count})` }))])
const gradeOptions = [{ value: '', label: 'Any grade' }, ...EVIDENCE_KEYS.map((key) => ({ value: key, label: EVIDENCE_GRADES[key].label }))]
const sortOptions = ARTICLE_SORTS.map((entry) => ({ value: entry.id, label: entry.label }))

function clear() {
  q.value = ''
  entity.value = ''
  topic.value = ''
  design.value = ''
  grade.value = ''
  yearFrom.value = extent.value[0]
  yearTo.value = extent.value[1]
}
const setSort = (id) => {
  sort.value = id
}
const toggleDesign = (id) => {
  design.value = design.value === id ? '' : id
}
</script>

<template lang="pug">
.stack
  form.grid.grid--compact.grid--end(role="search" aria-label="Filter the literature" @submit.prevent)
    InputField(id="lit-q" label="Title, author or journal" type="search" v-model="q" autocomplete="off")
    InputField(id="lit-entity" label="Informs (entry name)" type="search" v-model="entity" autocomplete="off" list="lit-entities")
    SelectField(id="lit-topic" label="Topic" v-model="topic" :options="topicOptions")
    SelectField(id="lit-design" label="Study design" v-model="design" :options="designOptions")
    SelectField(id="lit-grade" label="Evidence grade" v-model="grade" :options="gradeOptions")
    InputField(id="lit-from" label="From year" type="number" v-model="yearFrom" :min="extent[0]" :max="extent[1]")
    InputField(id="lit-to" label="To year" type="number" v-model="yearTo" :min="extent[0]" :max="extent[1]")
    SelectField(id="lit-sort" label="Sort by" v-model="sort" :options="sortOptions")
  datalist#lit-entities
    option(v-for="name in suggestions" :key="name" :value="name")
  div(role="group" aria-label="Study designs, choose one to filter")
    .cluster.cluster--tight
      button.viz-toggle(v-for="entry in designCounts" :key="entry.id" type="button" :aria-pressed="design === entry.id" @click="toggleDesign(entry.id)")
        DesignIcon(:design="entry.id" short)
        span.muted {{ entry.count }}
  .repel
    p(role="status") {{ summary }}
    button.button.button--secondary(v-if="filtered" type="button" @click="clear") Clear filters
  ArticleTable(v-if="rows.length" :rows="rows" :years="extent" :sort="sort" @sort="setSort")
  p.notice.notice--warning(v-else) No article matches these filters.
  Pagination(v-if="pages > 1" label="Literature pages" :summary="`Showing ${range}`" :can-previous="at > 1" :can-next="at < pages" @previous="page = at - 1" @next="page = at + 1")
  ScoringHelp(:articles="articles")
</template>
