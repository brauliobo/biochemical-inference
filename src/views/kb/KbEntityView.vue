<script setup vapor>
import { computed, watchEffect } from 'vue'
import Breadcrumbs from '../../components/kb/Breadcrumbs.vue'
import EntityNotFound from '../../components/kb/EntityNotFound.vue'
import { page } from '../../knowledge/index.js'
import { idFromParams, slugWords } from '../../kb/paths.js'
import { setPageTitle, useRoute } from '../../router.js'
import { lazyComponent } from '../../ui/lazy.js'

// /kb/:type/:slug. A dispatcher: it finds the entity, then draws the visual template of its type.
// Each template is its own lazy chunk (maps, graphs and charts load only for the type that needs them) and
// receives the engine's page model as `model`; it renders everything below the breadcrumbs, one h1 included.
//
//   compound, enzyme, reaction, pathway, intervention  one template each
//   state, disease, outcome, system                    the condition template (causal graph around the entry)
//   claim, article                                     their own templates (the evidence work)
// An unknown type or slug shows a 404 with a search, never a blank page.
const TEMPLATES = {
  compound: lazyComponent(() => import('./templates/CompoundTemplate.vue')),
  enzyme: lazyComponent(() => import('./templates/EnzymeTemplate.vue')),
  reaction: lazyComponent(() => import('./templates/ReactionTemplate.vue')),
  pathway: lazyComponent(() => import('./templates/PathwayTemplate.vue')),
  intervention: lazyComponent(() => import('./templates/InterventionTemplate.vue')),
  claim: lazyComponent(() => import('./templates/ClaimTemplate.vue')),
  article: lazyComponent(() => import('./templates/ArticleTemplate.vue'))
}
const CONDITION = lazyComponent(() => import('./templates/ConditionTemplate.vue'))

const route = useRoute()
const id = computed(() => idFromParams(route.params))
const model = computed(() => (id.value ? page(id.value) : null))
const template = computed(() => (model.value ? TEMPLATES[model.value.type] ?? CONDITION : undefined))

watchEffect(() => setPageTitle(model.value ? model.value.name : 'Page not found'))
</script>

<template lang="pug">
EntityNotFound(v-if="!model" :what="route.params.slug" :query="slugWords(route.params.slug)")
.stack.stack--loose(v-else)
  Breadcrumbs(:crumbs="model.breadcrumbs")
  component(:is="template" :model="model")
</template>
