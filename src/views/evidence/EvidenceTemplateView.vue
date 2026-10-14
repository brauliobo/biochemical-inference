<script setup vapor>
import { computed } from 'vue'
import { useRoute } from '../../router.js'
import RouterLink from '../../ui/RouterLink.vue'
import ArticleTemplate from '../kb/templates/ArticleTemplate.vue'
import ClaimTemplate from '../kb/templates/ClaimTemplate.vue'

// /evidence/claim/:slug and /evidence/article/:slug: the claim and article templates on their own, with
// a way back to the dashboards. The knowledge-base pages (/kb/claim/..., /kb/article/...) render the
// same templates through the entity view.
const route = useRoute()
const isArticle = computed(() => route.route.name === 'evidence-article')
const id = computed(() => `${isArticle.value ? 'article' : 'claim'}:${route.params.slug}`)
</script>

<template lang="pug">
.stack.stack--loose
  nav(aria-label="Breadcrumb")
    RouterLink(to="/evidence") Evidence
  ArticleTemplate(v-if="isArticle" :id="id")
  ClaimTemplate(v-else :id="id")
</template>
