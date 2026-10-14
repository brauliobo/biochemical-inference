<script setup vapor>
import { computed, watchEffect } from 'vue'
import EntityLink from '../../components/kb/EntityLink.vue'
import TypeBadge from '../../components/kb/TypeBadge.vue'
import { matrixModel, relationsBetween, topics } from '../../kb/atlas-model.js'
import { atlasPath } from '../../kb/paths.js'
import { typeMeta } from '../../knowledge/types.js'
import { navigate, setPageTitle, useRoute } from '../../router.js'
import DataTable from '../../ui/DataTable.vue'
import Panel from '../../ui/Panel.vue'
import RouterLink from '../../ui/RouterLink.vue'
import Matrix from '../../viz/Matrix.vue'
import AtlasNav from './AtlasNav.vue'

// /atlas. The overview: how many relations the knowledge base holds between each pair of kinds (click or press
// Enter on a cell to list them), and a few topics to start the causal map from. The causal map, the metabolic
// network and the search are the other three views (AtlasNav).
const route = useRoute()
const evidence = computed(() => route.query.evidence === '1')
const model = computed(() => matrixModel({ includeEvidence: evidence.value }))
const from = computed(() => (model.value.types.some((type) => type.id === route.query.from) ? route.query.from : ''))
const to = computed(() => (model.value.types.some((type) => type.id === route.query.to) ? route.query.to : ''))
const chosen = computed(() => (from.value && to.value ? relationsBetween(from.value, to.value, { includeEvidence: evidence.value }) : null))
const relationItems = computed(() => Object.entries(chosen.value?.byRelation ?? {}).map(([label, n]) => ({ label, n })))
const starts = computed(() => topics().filter((topic) => topic.kind === 'path').slice(0, 9))

const labelOf = (id) => typeMeta(id)?.plural ?? id
function pick(cell) {
  const query = new URLSearchParams({ from: cell.from, to: cell.to, ...(evidence.value ? { evidence: '1' } : {}) })
  navigate(`/atlas?${query}`, { replace: true })
}
function toggleEvidence() {
  navigate(evidence.value ? '/atlas' : '/atlas?evidence=1', { replace: true })
}

watchEffect(() => setPageTitle('Atlas'))
</script>

<template lang="pug">
.stack.stack--loose
  header.stack.stack--tight
    h1 Atlas
    p.lede Maps of the ontology: how the kinds of entry relate, what causes what, and the metabolic network.
  AtlasNav

  Panel(title="Relations between kinds" :lede="`${model.total} relations, counted from the kind of the first entry (rows) to the kind of the second (columns). Open a cell to list them.`" data-visual="matrix" data-testid="atlas-matrix")
    .cluster
      button.button.button--secondary(type="button" :aria-pressed="evidence" @click="toggleEvidence") Include articles and evidence links
    Matrix(id="atlas-matrix" title="Relations between kinds of entry" :types="model.types" :counts="model.counts" @select="pick")

  Panel(v-if="chosen" :title="`${labelOf(from)} to ${labelOf(to)}`" :lede="`${chosen.total} relations${chosen.total > chosen.rows.length ? `, the first ${chosen.rows.length} shown` : ''}.`" data-testid="atlas-relations")
    .cluster
      span.muted By relation
      ul.chip-list(aria-label="Relations by kind")
        li(v-for="item in relationItems" :key="item.label")
          span.badge {{ `${item.label}: ${item.n}` }}
    DataTable(:caption="`${labelOf(from)} to ${labelOf(to)}: relations`" :columns="['From', 'Relation', 'To']")
      tr(v-for="row in chosen.rows" :key="`${row.from}-${row.rel}-${row.to}`")
        td
          EntityLink(:id="row.from" :label="row.fromName")
        th(scope="row")
          | {{ row.label }}
          span.badge(v-if="row.hypothesis") {{ ' hypothesis' }}
        td
          EntityLink(:id="row.to" :label="row.toName")

  Panel(title="Start the causal map from a question")
    ul.chip-list(aria-label="Topics")
      li(v-for="topic in starts" :key="topic.id")
        RouterLink.chip(:to="atlasPath('causal', { topic: topic.id })") {{ topic.title }}
</template>
