<script setup vapor>
import { computed, ref, watch, watchEffect } from 'vue'
import Breadcrumbs from '../../components/kb/Breadcrumbs.vue'
import EntityNotFound from '../../components/kb/EntityNotFound.vue'
import EntityTable from '../../components/kb/EntityTable.vue'
import { CLAIM_STATUS_KEYS, EVIDENCE_GRADES, EVIDENCE_KEYS, claimStatusInfo } from '../../knowledge/evidence.js'
import { hub } from '../../knowledge/index.js'
import { columnsFor, effectiveDirection, filterRows, firstDirection, readTable, rowsFor, sortRows, writeTable } from '../../kb/listing-table.js'
import { resolveType } from '../../kb/paths.js'
import { navigate, setPageTitle, useRoute } from '../../router.js'

// /kb/:type. One kind of entry as a sortable table with a small visual per row (evidence dots, count bars,
// inline equations, status badges, relation sparklines). Filters and the sort live in the URL query (?q=&grade=&status=&sort=&dir=) so a view
// can be bookmarked or shared.
const route = useRoute()
const type = computed(() => resolveType(route.params.type))
const model = computed(() => (type.value ? hub(type.value) : null))
const columns = computed(() => (type.value ? columnsFor(type.value) : []))
const all = computed(() => (type.value ? rowsFor(type.value) : []))
const isClaim = computed(() => type.value === 'claim')

const q = ref('')
const grade = ref('')
const status = ref('')
const sort = ref('name')
const dir = ref('')

function load() {
  const state = readTable(route.query, columns.value)
  q.value = state.q
  grade.value = state.grade
  status.value = state.status
  sort.value = state.sort
  dir.value = state.dir
}
watch(() => [route.params.type, JSON.stringify(route.query)], load, { immediate: true })

watch([q, grade, status, sort, dir], () => {
  const query = writeTable({ q: q.value, grade: grade.value, status: isClaim.value ? status.value : '', sort: sort.value, dir: dir.value }, columns.value)
  const current = writeTable(readTable(route.query, columns.value), columns.value)
  if (JSON.stringify(query) === JSON.stringify(current)) return
  const text = new URLSearchParams(query).toString()
  navigate(text ? `${route.path}?${text}` : route.path, { replace: true })
})

const visible = computed(() => sortRows(filterRows(all.value, { q: q.value, grade: grade.value, status: isClaim.value ? status.value : '' }), sort.value, effectiveDirection({ sort: sort.value, dir: dir.value }, columns.value)))
const direction = computed(() => effectiveDirection({ sort: sort.value, dir: dir.value }, columns.value))
const gradeCounts = computed(() => Object.fromEntries(EVIDENCE_KEYS.map((key) => [key, all.value.filter((row) => row.evidence === key).length])))
const statusCounts = computed(() => Object.fromEntries(CLAIM_STATUS_KEYS.map((key) => [key, all.value.filter((row) => row.status === key).length])))
const summary = computed(() => `Showing ${visible.value.length} of ${all.value.length} ${model.value?.plural.toLowerCase() ?? ''}`)
const filtered = computed(() => Boolean(q.value || grade.value || status.value))

function onSort(column) {
  if (sort.value === column.id) dir.value = direction.value === 'asc' ? 'desc' : 'asc'
  else {
    sort.value = column.id
    dir.value = firstDirection(column)
  }
}
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
  header.stack.stack--tight
    h1 {{ model.plural }}
    p.lede {{ model.description }}

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

  .repel
    p(role="status") {{ summary }}
    button.button.button--secondary(v-if="filtered" type="button" @click="clear") Clear filters

  EntityTable(v-if="visible.length" :rows="visible" :all-rows="all" :columns="columns" :sort="sort" :dir="direction" :caption="`${model.plural}, sortable table`" @sort="onSort")
  p.notice(v-else-if="!all.length") There are no {{ model.plural.toLowerCase() }} in the knowledge base yet.
  p.notice.notice--warning(v-else) No entries match these filters.
</template>
