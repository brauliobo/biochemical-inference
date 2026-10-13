<script setup vapor>
import { computed, watchEffect } from 'vue'
import ArticleBlock from '../../components/kb/ArticleBlock.vue'
import BodyText from '../../components/kb/BodyText.vue'
import Breadcrumbs from '../../components/kb/Breadcrumbs.vue'
import ClaimBlock from '../../components/kb/ClaimBlock.vue'
import EntityNotFound from '../../components/kb/EntityNotFound.vue'
import EvidenceBadge from '../../components/kb/EvidenceBadge.vue'
import FactsTable from '../../components/kb/FactsTable.vue'
import ItemList from '../../components/kb/ItemList.vue'
import PathFinder from '../../components/kb/PathFinder.vue'
import ReactionEquation from '../../components/kb/ReactionEquation.vue'
import ReferenceList from '../../components/kb/ReferenceList.vue'
import RelationGroups from '../../components/kb/RelationGroups.vue'
import TypeBadge from '../../components/kb/TypeBadge.vue'
import { page } from '../../knowledge/index.js'
import { idFromParams, mapPath, slugWords } from '../../kb/paths.js'
import { setPageTitle, useRoute } from '../../router.js'
import RouterLink from '../../ui/RouterLink.vue'

// /kb/:type/:slug. Everything comes from the engine's page model; this view only
// lays it out. An unknown type or slug shows a 404 with a search, never a blank page.
const route = useRoute()
const id = computed(() => idFromParams(route.params))
const model = computed(() => (id.value ? page(id.value) : null))
const isClaim = computed(() => model.value?.type === 'claim')
const supporting = computed(() => (model.value?.references ?? []).filter((reference) => reference.stance === 'supports'))
const contradicting = computed(() => (model.value?.references ?? []).filter((reference) => reference.stance === 'contradicts'))
const seeAlso = computed(() => (model.value?.seeAlso ?? []).map((item) => ({
  ...item,
  note: `Shares links with ${item.via.map((via) => via.name).join(', ')}`
})))

// Reaction identifiers (EC, Rhea, ...) are shown with the equation, so not twice.
const facts = computed(() => {
  const shown = new Set((model.value?.reaction?.identifiers ?? []).map((fact) => fact.key))
  return (model.value?.facts ?? []).filter((fact) => !shown.has(fact.key))
})

watchEffect(() => setPageTitle(model.value ? model.value.name : 'Page not found'))
</script>

<template lang="pug">
EntityNotFound(v-if="!model" :what="route.params.slug" :query="slugWords(route.params.slug)")
.stack.stack--loose(v-else)
  Breadcrumbs(:crumbs="model.breadcrumbs")

  header.stack
    .cluster
      TypeBadge(:type="model.type")
    h1 {{ model.name }}
    p.lede {{ model.summary }}
    p.muted(v-if="model.aliases.length")
      strong Also known as:
      |  {{ model.aliases.join(', ') }}
    EvidenceBadge(:grade="model.evidence.grade" explain)

  PathFinder(:from="model.id")

  section.stack(v-if="model.claim" aria-labelledby="claim-heading")
    h2#claim-heading The claim
    ClaimBlock(:claim="model.claim")

  template(v-if="isClaim")
    section.stack(aria-labelledby="for-heading")
      h2#for-heading Evidence for this claim
      ReferenceList(v-if="supporting.length" :references="supporting" :show-stance="false")
      p.notice.notice--warning(v-else) No supporting source is recorded yet. Treat this claim as unchecked.
    section.stack(aria-labelledby="against-heading")
      h2#against-heading Evidence against this claim
      ReferenceList(v-if="contradicting.length" :references="contradicting" :show-stance="false")
      p.muted(v-else) No contradicting source is recorded.

  section.stack(v-if="model.reaction" aria-labelledby="reaction-heading")
    h2#reaction-heading Reaction
    ReactionEquation(:reaction="model.reaction")

  section.stack(v-if="model.article" aria-labelledby="article-heading")
    h2#article-heading Citation
    ArticleBlock(:article="model.article")

  section.stack(v-if="model.body.length" aria-labelledby="about-heading")
    h2#about-heading Details
    BodyText(:paragraphs="model.body")

  section.stack(v-if="facts.length" aria-labelledby="facts-heading")
    h2#facts-heading Facts and identifiers
    FactsTable(:facts="facts")

  section.stack(v-if="model.relationGroups.length" aria-labelledby="connections-heading")
    h2#connections-heading Connections
    RelationGroups(:groups="model.relationGroups")

  section.stack(v-if="!isClaim && model.references.length" aria-labelledby="sources-heading")
    h2#sources-heading Sources
    ReferenceList(:references="model.references")

  section.stack(v-if="model.mentionedBy.length" aria-labelledby="mentioned-heading")
    h2#mentioned-heading Mentioned in
    ItemList(:items="model.mentionedBy")

  section.stack(v-if="seeAlso.length" aria-labelledby="see-also-heading")
    h2#see-also-heading See also
    ItemList(:items="seeAlso")

  p
    RouterLink(:to="mapPath(model.id)") Show {{ model.name }} on the map
</template>
