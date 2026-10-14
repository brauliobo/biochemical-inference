<script setup vapor>
import { computed, ref, watch, watchEffect } from 'vue'
import EntityLink from '../../components/kb/EntityLink.vue'
import GradeDot from '../../components/kb/GradeDot.vue'
import TypeBadge from '../../components/kb/TypeBadge.vue'
import { find, graph } from '../../knowledge/index.js'
import { EVIDENCE_GRADES, EVIDENCE_KEYS } from '../../knowledge/evidence.js'
import { TYPES } from '../../knowledge/types.js'
import { DEFAULT_TYPES } from '../../knowledge/causal.js'
import { atlasPath } from '../../kb/paths.js'
import { navigate, setPageTitle, useRoute } from '../../router.js'
import DataTable from '../../ui/DataTable.vue'
import RouterLink from '../../ui/RouterLink.vue'
import AtlasNav from './AtlasNav.vue'

// /atlas/search. Search the whole knowledge base by name, abbreviation, Portuguese name or topic, narrowed by kind and
// evidence grade, and read the hits as a compact table (kind, evidence, what matched, number of links) instead of
// prose. Each hit with causal links also opens in the causal map. The query is in the URL (?q= &type= &grade=).
const route = useRoute()
const q = ref('')
const type = ref('')
const grade = ref('')

function load() {
  q.value = typeof route.query.q === 'string' ? route.query.q.slice(0, 200) : ''
  type.value = TYPES.some((item) => item.id === route.query.type) ? route.query.type : ''
  grade.value = EVIDENCE_KEYS.includes(route.query.grade) ? route.query.grade : ''
}
watch(() => JSON.stringify(route.query), load, { immediate: true })

watch([q, type, grade], () => {
  const query = new URLSearchParams(Object.entries({ q: q.value, type: type.value, grade: grade.value }).filter(([, value]) => value)).toString()
  const current = new URLSearchParams(Object.entries({ q: route.query.q ?? '', type: route.query.type ?? '', grade: route.query.grade ?? '' }).filter(([, value]) => value)).toString()
  if (query !== current) navigate(query ? `${route.path}?${query}` : route.path, { replace: true })
})

const typed = computed(() => q.value.trim().length > 0)
const results = computed(() => {
  if (!typed.value) return []
  return find(q.value, { limit: 120, ...(type.value ? { types: [type.value] } : {}) })
    .filter((result) => !grade.value || result.evidence === grade.value)
    .map((result) => ({ ...result, links: graph.degree(result.id), causal: DEFAULT_TYPES.includes(result.type) }))
})
const MATCH = { name: 'name', alias: 'other name', id: 'id', summary: 'description' }
const status = computed(() => (!typed.value ? '' : `${results.value.length} ${results.value.length === 1 ? 'result' : 'results'}`))

watchEffect(() => setPageTitle('Atlas search'))
</script>

<template lang="pug">
.stack.stack--loose
  header.stack.stack--tight
    h1 Atlas search
    p.lede Find any entry by name, abbreviation, Portuguese name or topic.
  AtlasNav

  form.grid.atlas-controls(role="search" aria-label="Search the atlas" @submit.prevent)
    .stack.stack--tight
      label(for="atlas-q") Search
      input#atlas-q(type="search" v-model="q" autocomplete="off" placeholder="For example GNMT, glicina or belching")
    .stack.stack--tight
      label(for="atlas-type") Kind
      select#atlas-type(v-model="type")
        option(value="") Any kind
        option(v-for="item in TYPES" :key="item.id" :value="item.id") {{ item.plural }}
    .stack.stack--tight
      label(for="atlas-grade") Evidence grade
      select#atlas-grade(v-model="grade")
        option(value="") Any grade
        option(v-for="key in EVIDENCE_KEYS" :key="key" :value="key") {{ EVIDENCE_GRADES[key].label }}

  p(role="status") {{ status }}
  DataTable(v-if="results.length" caption="Search results" :columns="['Name', 'Kind', 'Evidence', 'Matched', 'Links', 'Map']" data-testid="atlas-results")
    tr(v-for="result in results" :key="result.id")
      th(scope="row")
        EntityLink(:id="result.id" :label="result.name")
      td
        TypeBadge(:type="result.type")
      td
        GradeDot(:grade="result.evidence")
      td
        span.badge {{ MATCH[result.matched] ?? result.matched }}
        span.muted(v-if="result.matched === 'alias'") {{ ` ${result.alias}` }}
      td {{ result.links }}
      td
        RouterLink(v-if="result.causal" :to="atlasPath('causal', { focus: result.id })") {{ `Causal map of ${result.name}` }}
  p.notice.notice--warning(v-else-if="typed") No entries match. Try a shorter word or an abbreviation such as GNMT.
  p.muted(v-else) Type a name to see results here.
</template>
