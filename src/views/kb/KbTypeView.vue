<script setup vapor>
import { computed, ref, watch, watchEffect } from 'vue'
import Breadcrumbs from '../../components/kb/Breadcrumbs.vue'
import EntityNotFound from '../../components/kb/EntityNotFound.vue'
import GroupedList from '../../components/kb/GroupedList.vue'
import { EVIDENCE_GRADES, EVIDENCE_KEYS, CLAIM_STATUS_KEYS, claimStatusInfo } from '../../knowledge/evidence.js'
import { graph, hub } from '../../knowledge/index.js'
import { DEFAULT_SORT, SORTS, countBy, enrichItems, filterItems, groupItems, readFilters, writeFilters } from '../../kb/listing.js'
import { resolveType } from '../../kb/paths.js'
import { navigate, setPageTitle, useRoute } from '../../router.js'

// /kb/:type. Filter, sort and group one type's entries. The controls live in the
// URL query (?q=&grade=&status=&sort=) so a filtered list can be bookmarked or shared.
const route = useRoute()
const type = computed(() => resolveType(route.params.type))
const model = computed(() => (type.value ? hub(type.value) : null))
const all = computed(() => (model.value ? enrichItems(graph, model.value) : []))
const isClaim = computed(() => type.value === 'claim')

const q = ref('')
const grade = ref('')
const status = ref('')
const sort = ref(DEFAULT_SORT)

function load() {
  const filters = readFilters(route.query)
  q.value = filters.q
  grade.value = filters.grade
  status.value = filters.status
  sort.value = filters.sort
}
watch(() => [route.params.type, JSON.stringify(route.query)], load, { immediate: true })

watch([q, grade, status, sort], () => {
  const query = writeFilters({ q: q.value, grade: grade.value, status: status.value, sort: sort.value })
  if (JSON.stringify(query) === JSON.stringify(writeFilters(readFilters(route.query)))) return
  const text = new URLSearchParams(query).toString()
  navigate(text ? `${route.path}?${text}` : route.path, { replace: true })
})

const visible = computed(() => filterItems(all.value, { q: q.value, grade: grade.value, status: isClaim.value ? status.value : '' }))
const groups = computed(() => groupItems(visible.value, { type: type.value, sort: sort.value }))
const gradeCounts = computed(() => countBy(all.value, 'evidence'))
const statusCounts = computed(() => countBy(all.value, 'status'))
const summary = computed(() => `Showing ${visible.value.length} of ${all.value.length} ${model.value?.plural.toLowerCase() ?? ''}`)
const filtered = computed(() => Boolean(q.value || grade.value || status.value))

function clear() {
  q.value = ''
  grade.value = ''
  status.value = ''
}

watchEffect(() => setPageTitle(model.value ? model.value.plural : 'Page not found'))
</script>

<template lang="pug">
EntityNotFound(v-if="!model" title="We have no entries of that kind" :what="route.params.type")
.stack.stack--loose(v-else)
  Breadcrumbs(:crumbs="model.breadcrumbs")
  header.stack
    h1 {{ model.plural }}
    p.lede {{ model.description }}
    p.muted(v-if="isClaim") This is the claims audit. Each claim carries a status and links to the evidence for and against it. A claim with no recorded source says so on its page.

  form.grid(role="search" :aria-label="'Filter ' + model.plural.toLowerCase()" @submit.prevent)
    .stack.stack--tight
      label(for="filter-text") Filter by name or text
      input#filter-text(type="search" v-model="q" autocomplete="off")
    .stack.stack--tight
      label(for="filter-grade") Evidence grade
      select#filter-grade(v-model="grade")
        option(value="") Any grade
        option(v-for="key in EVIDENCE_KEYS" :key="key" :value="key") {{ EVIDENCE_GRADES[key].label }} ({{ gradeCounts[key] ?? 0 }})
    .stack.stack--tight(v-if="isClaim")
      label(for="filter-status") Claim status
      select#filter-status(v-model="status")
        option(value="") Any status
        option(v-for="key in CLAIM_STATUS_KEYS" :key="key" :value="key") {{ claimStatusInfo(key).label }} ({{ statusCounts[key] ?? 0 }})
    .stack.stack--tight
      label(for="filter-sort") Sort and group by
      select#filter-sort(v-model="sort")
        option(v-for="option in SORTS" :key="option.id" :value="option.id") {{ option.label }}

  .repel
    p(role="status") {{ summary }}
    button.button.button--secondary(v-if="filtered" type="button" @click="clear") Clear filters

  GroupedList(v-if="groups.length" :groups="groups" :show-type="false")
  p.notice(v-else-if="!all.length") There are no {{ model.plural.toLowerCase() }} in the knowledge base yet.
  p.notice.notice--warning(v-else) No entries match these filters.
</template>
