<script setup vapor>
import { computed } from 'vue'
import { relatedArticles, timelineGroups } from '../../kb/evidence.js'
import { entityPath } from '../../kb/paths.js'
import { href } from '../../router.js'
import EmptyState from '../../ui/EmptyState.vue'
import Timeline from '../../viz/Timeline.vue'

// Articles that inform the same entries as this one, on a timeline by year and design (this article is
// included, so it can be placed among them). `model` is the evidence model, `article` one of its entries.
const props = defineProps({
  model: { type: Object, required: true },
  article: { type: Object, required: true },
  id: { type: String, default: 'ev-related' }
})

const related = computed(() => relatedArticles(props.model, props.article.id))
const items = computed(() => [
  { id: props.article.id, title: props.article.name, year: props.article.year, group: props.article.design, detail: 'This article', href: href(entityPath(props.article.id)) },
  ...related.value.map(({ article, shared }) => ({ id: article.id, title: article.name, year: article.year, group: article.design, detail: `${article.byline}; ${shared} shared ${shared === 1 ? 'entry' : 'entries'}`, href: href(entityPath(article.id)) }))
])
const groups = computed(() => timelineGroups(items.value))
</script>

<template lang="pug">
EmptyState(v-if="!related.length") No other article informs the same entries.
Timeline(v-else :id="id" title="Related articles by year and design" :items="items" :groups="groups")
</template>
