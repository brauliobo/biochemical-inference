<script setup vapor>
import { computed, ref, watch, watchEffect } from 'vue'
import ClaimStatusBadge from '../../components/kb/ClaimStatusBadge.vue'
import EntityLink from '../../components/kb/EntityLink.vue'
import EntityMiniCard from '../../components/kb/EntityMiniCard.vue'
import SearchBox from '../../components/kb/SearchBox.vue'
import { DIRECTIONS, KIND_CHOICES, SIGN_FILTERS, causalView, readCausal, topics, writeCausal } from '../../kb/atlas-model.js'
import { TIER_LABELS } from '../../kb/causal-view.js'
import { getEntity } from '../../knowledge/index.js'
import { navigate, setPageTitle, useRoute } from '../../router.js'
import DataTable from '../../ui/DataTable.vue'
import Panel from '../../ui/Panel.vue'
import LayeredGraph from '../../viz/LayeredGraph.vue'
import { signGlyph } from '../../viz/shapes.js'
import AtlasNav from './AtlasNav.vue'

// /atlas/causal. The layered causal map: pick a topic (a guided path or a hub such as under-methylation,
// glycine, belching or LPR) or search for any entry and see what leads to it and what it leads to, at most 40 nodes.
// Filters: direction and depth around an entry, hypothesis links on or off, one sign, which kinds to show. Edges are
// signed; hypothesis edges are dashed and say how far the claim behind them is supported. Choosing a node shows a
// compact card with a link to its page; every link of the map is also in the table below the graph.
// All of it lives in the URL query (?topic= ?focus= &depth= &dir= &hyp=0 &sign= &kinds=) so a map can be shared.
const route = useRoute()
const topic = ref('')
const focus = ref('')
const depth = ref(2)
const dir = ref('both')
const hyp = ref(true)
const sign = ref('')
const kinds = ref([])
const selected = ref('')
const notice = ref('')
const showAll = ref(false)
const ROW_LIMIT = 40

function load() {
  const state = readCausal(route.query)
  topic.value = state.topic
  focus.value = state.focus
  depth.value = state.depth
  dir.value = state.dir
  hyp.value = state.hyp
  sign.value = state.sign
  kinds.value = state.kinds
}
watch(() => JSON.stringify(route.query), load, { immediate: true })

const state = computed(() => ({ topic: topic.value, focus: focus.value, depth: Number(depth.value), dir: dir.value, hyp: hyp.value, sign: sign.value, kinds: kinds.value }))
watch(state, () => {
  const query = writeCausal(state.value)
  if (JSON.stringify(query) === JSON.stringify(writeCausal(readCausal(route.query)))) return
  const text = new URLSearchParams(query).toString()
  navigate(text ? `${route.path}?${text}` : route.path, { replace: true })
})

const view = computed(() => causalView(readCausal({ topic: topic.value, focus: focus.value, depth: depth.value, dir: dir.value, hyp: hyp.value ? '' : '0', sign: sign.value, kinds: kinds.value.join(',') })))
const groups = computed(() => ({ path: topics().filter((item) => item.kind === 'path'), hub: topics().filter((item) => item.kind === 'hub') }))
const focusName = computed(() => getEntity(focus.value)?.name ?? '')
const shownRows = computed(() => (showAll.value ? view.value.rows : view.value.rows.slice(0, ROW_LIMIT)))
const chosen = computed(() => (selected.value && getEntity(selected.value) ? selected.value : ''))

function pick(result) {
  if (!['intervention', 'compound', 'enzyme', 'pathway', 'system', 'state', 'disease', 'outcome'].includes(result.type)) {
    notice.value = `${result.name} is ${result.type === 'claim' ? 'a claim' : 'an article'}, which is evidence rather than a cause, so it has no place in the causal map. Open its page instead.`
    return
  }
  notice.value = ''
  focus.value = result.id
  topic.value = ''
  selected.value = ''
}
function clearFocus() {
  focus.value = ''
  topic.value = readCausal({}).topic
  selected.value = ''
}
function toggleKind(id) {
  kinds.value = kinds.value.includes(id) ? kinds.value.filter((item) => item !== id) : [...kinds.value, id]
}
function chooseTopic(event) {
  focus.value = ''
  topic.value = event.target.value
  selected.value = ''
}

watch(() => view.value.title, () => { showAll.value = false })
watchEffect(() => setPageTitle(`Causal map: ${view.value.title}`))
</script>

<template lang="pug">
.stack.stack--loose
  header.stack.stack--tight
    h1 Causal map
    p.lede What leads to what, with the sign of each link and how well supported it is.
  AtlasNav

  form.stack(role="search" aria-label="Causal map controls" @submit.prevent)
    .grid.atlas-controls
      .stack.stack--tight
        label(for="causal-topic") Topic
        select#causal-topic(:value="topic" @change="chooseTopic")
          option(v-if="focus" value="") Entry chosen below
          optgroup(label="Guided paths")
            option(v-for="item in groups.path" :key="item.id" :value="item.id") {{ item.title }}
          optgroup(label="Hub topics")
            option(v-for="item in groups.hub" :key="item.id" :value="item.id") {{ item.title }}
      SearchBox(mode="pick" label="Or focus on an entry" placeholder="For example belching" :limit="6" @select="pick")
    p.notice.notice--warning(v-if="notice" role="status") {{ notice }}
    p.cluster(v-if="focus")
      span {{ `Focused on ${focusName}.` }}
      button.button.button--secondary(type="button" @click="clearFocus") Back to topics
    .grid.atlas-controls
      .stack.stack--tight(v-if="focus")
        label(for="causal-dir") Direction
        select#causal-dir(v-model="dir")
          option(v-for="item in DIRECTIONS" :key="item.value" :value="item.value") {{ item.label }}
      .stack.stack--tight(v-if="focus")
        label(for="causal-depth") Steps away
        select#causal-depth(v-model.number="depth")
          option(:value="1") 1 step
          option(:value="2") 2 steps
          option(:value="3") 3 steps
      .stack.stack--tight
        label(for="causal-sign") Sign
        select#causal-sign(v-model="sign")
          option(v-for="item in SIGN_FILTERS" :key="item.value" :value="item.value") {{ item.label }}
      .stack.stack--tight
        label.choice
          input(type="checkbox" v-model="hyp")
          span Include hypothesis links
    fieldset.stack.stack--tight
      legend Kinds to show (none ticked shows all)
      .cluster
        label.choice(v-for="item in KIND_CHOICES" :key="item.id")
          input(type="checkbox" :checked="kinds.includes(item.id)" @change="toggleKind(item.id)")
          span {{ item.label }}

  Panel(:title="view.title" :lede="view.summary" data-visual="causal-graph" data-testid="atlas-causal")
    p.notice.notice--warning(v-if="view.empty" role="status") No links match these filters. Widen the sign or kinds, or include hypothesis links.
    .sidebar.sidebar--end(v-else)
      .stack.atlas-side.atlas-graph
        LayeredGraph(id="atlas-graph" :title="`${view.title}: causal map`" :nodes="view.nodes" :edges="view.edges" :tier-names="TIER_LABELS" direction="LR" v-model:selected="selected")
      aside.stack.stack--tight.atlas-side(aria-label="Selected entry" aria-live="polite")
        EntityMiniCard(v-if="chosen" :id="chosen")
        p.muted(v-else) Choose a node to see its type, evidence, summary and top quantities here, with a link to its page.
    p.muted(role="status") {{ `${view.counts.nodes} entries, ${view.counts.edges} links, ${view.counts.hypotheses} of them hypotheses.` }}

  Panel(v-if="!view.empty" title="Links in this map" lede="The same links as a table, for reading and for keyboard use." data-visual="effect-table" data-testid="atlas-links")
    DataTable(caption="Links in the causal map" :columns="['From', 'Effect', 'To', 'Status']")
      tr(v-for="row in shownRows" :key="`${row.from}-${row.rel}-${row.to}`")
        td
          EntityLink(:id="row.from" :label="row.fromName")
        th(scope="row")
          span.sign(:class="`sign--${row.sign}`")
            span.sign__glyph(aria-hidden="true") {{ signGlyph({ sign: row.sign, hypothesis: row.hypothesis }) || '·' }}
            span {{ row.phrase }}
        td
          EntityLink(:id="row.to" :label="row.toName")
        td
          .cluster.cluster--tight(v-if="row.hypothesis || row.claimStatus")
            span.badge(v-if="row.hypothesis") Hypothesis
            ClaimStatusBadge(v-if="row.claimStatus" :status="row.claimStatus")
          span.muted(v-else) established link
    p(v-if="view.rows.length > ROW_LIMIT")
      button.button.button--secondary(type="button" :aria-expanded="showAll" @click="showAll = !showAll") {{ showAll ? `Show the first ${ROW_LIMIT} links` : `Show all ${view.rows.length} links` }}
</template>
