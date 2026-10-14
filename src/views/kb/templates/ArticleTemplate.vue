<script setup vapor>
import { computed, watchEffect } from 'vue'
import CitationCard from '../../../components/evidence/CitationCard.vue'
import EvidenceNotes from '../../../components/evidence/EvidenceNotes.vue'
import InformsList from '../../../components/evidence/InformsList.vue'
import RelatedStrip from '../../../components/evidence/RelatedStrip.vue'
import { useEvidence } from '../../../components/evidence/useEvidence.js'
import BodyText from '../../../components/kb/BodyText.vue'
import EvidenceBadge from '../../../components/kb/EvidenceBadge.vue'
import TypeBadge from '../../../components/kb/TypeBadge.vue'
import { LITERATURE_PATH, relatedArticles } from '../../../kb/evidence.js'
import { mapPath } from '../../../kb/paths.js'
import { setPageTitle } from '../../../router.js'
import EmptyState from '../../../ui/EmptyState.vue'
import Panel from '../../../ui/Panel.vue'
import RouterLink from '../../../ui/RouterLink.vue'

// The article page as a compact citation card: who, where, when, links to the source, study design,
// evidence grade and population; what the article informs (with stance) and its key points; related
// articles on a timeline. The body text lives in the Notes drawer.
//
// `model` is page(id) from the engine (what the entity dispatcher passes); `id` alone also works.
const props = defineProps({
  model: { type: Object, default: null },
  id: { type: String, default: '' }
})
const KEY_POINTS = 5
const articleId = computed(() => props.model?.id ?? props.id)
const { knowledge, model: evidence } = useEvidence()
const article = computed(() => evidence.value?.articleById.get(articleId.value) ?? null)
const page = computed(() => props.model ?? (knowledge.value ? knowledge.value.page(articleId.value) : null))
const points = computed(() => (article.value ? article.value.takeaways.slice(0, KEY_POINTS) : []))
const related = computed(() => (evidence.value && article.value ? relatedArticles(evidence.value, article.value.id).length : 0))
const visuals = computed(() => ['citation-card', article.value?.nInforms ? 'informs' : '', related.value ? 'timeline' : ''].filter(Boolean).join(','))
const byline = computed(() => (article.value ? `${article.value.byline}, ${article.value.journal} (${article.value.year})` : ''))

watchEffect(() => {
  if (page.value) setPageTitle(page.value.name)
})
</script>

<template lang="pug">
.stack.stack--loose(v-if="article && page" data-testid="entity-visuals" :data-visuals="visuals")
  header.stack
    .cluster
      TypeBadge(type="article")
      EvidenceBadge(:grade="article.grade")
    h1 {{ page.name }}
    p.lede {{ byline }}

  Panel(title="Citation" title-id="ev-citation")
    CitationCard(:article="article")

  Panel(title="What it informs" title-id="ev-informs")
    InformsList(:article="article")

  Panel(v-if="points.length" title="Key points" title-id="ev-points")
    ul.stack.stack--tight
      li(v-for="(point, index) in points" :key="index") {{ point }}

  Panel(title="Related articles" title-id="ev-related-panel")
    RelatedStrip(:model="evidence" :article="article")

  EvidenceNotes(summary="Notes and sources")
    BodyText(v-if="page.body.length" :paragraphs="page.body")
    EmptyState(v-else) No further notes for this article.
    p
      RouterLink(:to="LITERATURE_PATH") Back to the literature
    p
      RouterLink(:to="mapPath(article.id)") Show this article on the map
p.muted(v-else role="status") Loading the article.
</template>
