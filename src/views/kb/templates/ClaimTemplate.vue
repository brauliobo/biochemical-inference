<script setup vapor>
import { computed, watchEffect } from 'vue'
import ClaimArticles from '../../../components/evidence/ClaimArticles.vue'
import ClaimEdges from '../../../components/evidence/ClaimEdges.vue'
import EvidenceNotes from '../../../components/evidence/EvidenceNotes.vue'
import IndexGauge from '../../../components/evidence/IndexGauge.vue'
import QuantChips from '../../../components/evidence/QuantChips.vue'
import ScoringHelp from '../../../components/evidence/ScoringHelp.vue'
import VerdictBar from '../../../components/evidence/VerdictBar.vue'
import VerdictKey from '../../../components/evidence/VerdictKey.vue'
import WhyChips from '../../../components/evidence/WhyChips.vue'
import { useEvidence } from '../../../components/evidence/useEvidence.js'
import BodyText from '../../../components/kb/BodyText.vue'
import ClaimStatusBadge from '../../../components/kb/ClaimStatusBadge.vue'
import EntityLink from '../../../components/kb/EntityLink.vue'
import EvidenceBadge from '../../../components/kb/EvidenceBadge.vue'
import TypeBadge from '../../../components/kb/TypeBadge.vue'
import { CLAIMS_PATH, topicInfo } from '../../../kb/evidence.js'
import { claimGraph, claimQuantities } from '../../../kb/evidence-graph.js'
import { mapPath } from '../../../kb/paths.js'
import { setPageTitle } from '../../../router.js'
import Badge from '../../../ui/Badge.vue'
import EmptyState from '../../../ui/EmptyState.vue'
import Panel from '../../../ui/Panel.vue'
import RouterLink from '../../../ui/RouterLink.vue'

// The claim page as a verdict dashboard: status and statement, the support index, an evidence balance bar,
// generated "why this verdict" chips, the articles for and against on a timeline, the causal edges the
// claim underpins and the quantities of the entries it is about. Text lives in the Notes drawer.
//
// `model` is page(id) from the engine (what the entity dispatcher passes); `id` alone also works.
const props = defineProps({
  model: { type: Object, default: null },
  id: { type: String, default: '' }
})
const claimId = computed(() => props.model?.id ?? props.id)
const { knowledge, model: evidence } = useEvidence()
const claim = computed(() => evidence.value?.claimById.get(claimId.value) ?? null)
const page = computed(() => props.model ?? (knowledge.value ? knowledge.value.page(claimId.value) : null))
const graphData = computed(() => (knowledge.value && claim.value ? claimGraph(knowledge.value.graph, claim.value.id) : null))
const quantities = computed(() => (knowledge.value && claim.value ? claimQuantities(knowledge.value, { ...claim.value, graphIds: graphData.value.nodes.map((node) => node.id) }) : []))
const topic = computed(() => (claim.value ? topicInfo(claim.value.topic) : null))
const noSource = computed(() => (claim.value ? claim.value.nFor + claim.value.nAgainst === 0 : true))
const visuals = computed(() => ['verdict', 'evidence-balance', 'why-chips', noSource.value ? '' : 'timeline', graphData.value?.edges.length ? 'causal-graph' : '', quantities.value.length ? 'quantities' : ''].filter(Boolean).join(','))
const total = computed(() => (claim.value ? claim.value.evidenceFor + claim.value.evidenceAgainst : 0))

watchEffect(() => {
  if (page.value) setPageTitle(page.value.name)
})
</script>

<template lang="pug">
.stack.stack--loose(v-if="claim && page" data-testid="entity-visuals" :data-visuals="visuals")
  header.stack
    .cluster
      TypeBadge(type="claim")
      EvidenceBadge(:grade="claim.grade")
    h1 {{ page.name }}
    p.lede {{ page.summary }}

  Panel.ev-verdict(title="Verdict" title-id="ev-verdict" :class="`ev-verdict--${claim.status}`")
    .cluster
      ClaimStatusBadge(:status="claim.status")
      Badge(:label="claim.source === 'conversation' ? 'Raised in the conversation' : 'Taken from the literature'")
      RouterLink(:to="`${CLAIMS_PATH}?topic=${claim.topic}`") {{ topic.label }}
    blockquote.ev-verdict__statement {{ claim.statement }}
    IndexGauge(:index="claim.index" :status="claim.status" :no-source="noSource")

  Panel(title="Evidence balance" title-id="ev-balance")
    VerdictBar(:claim="claim" :max-total="total || 1" large)
    VerdictKey
    ScoringHelp(:articles="evidence.articles")

  Panel(title="Why this verdict" title-id="ev-why")
    WhyChips(:claim="claim")

  Panel(title="Articles for and against" title-id="ev-articles")
    ClaimArticles(:claim="claim")

  Panel(title="Causal edges this claim underpins" title-id="ev-edges")
    ClaimEdges(:graph="graphData")

  Panel(v-if="quantities.length" title="Quantities involved" title-id="ev-quant")
    QuantChips(:chips="quantities")

  Panel(v-if="claim.associated.length" title="What it is about" title-id="ev-about")
    ul.ev-chips
      li(v-for="entity in claim.associated" :key="entity")
        EntityLink(:id="entity")

  EvidenceNotes(summary="Notes and sources")
    BodyText(v-if="page.body.length" :paragraphs="page.body")
    EmptyState(v-else) No further notes for this claim.
    p
      RouterLink(:to="CLAIMS_PATH") Back to the claims audit
    p
      RouterLink(:to="mapPath(claim.id)") Show this claim on the map
p.muted(v-else role="status") Loading the claim.
</template>
