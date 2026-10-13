<script setup vapor>
import FactsTable from './FactsTable.vue'
import VerifiedBadge from './VerifiedBadge.vue'

// Citation block for an article page. `article` is the `article` section of a page model.
defineProps({ article: { type: Object, required: true } })
</script>

<template lang="pug">
.stack
  p {{ article.citation }}
  .cluster
    VerifiedBadge(:verified="article.verified")
  p.muted(v-if="article.verified") The citation details have been checked.
  p.notice.notice--warning(v-else role="note") This citation has not been checked yet. Treat it as a pointer to look up, not as a confirmed source.
  FactsTable(:facts="article.identifiers" caption="Article identifiers")
  p(v-if="article.url")
    a(:href="article.url" rel="noopener noreferrer") Open the article
    span.visually-hidden  (external site)
  div(v-if="article.takeaways.length")
    h3 Key takeaways
    ul
      li(v-for="(item, index) in article.takeaways" :key="index") {{ item }}
</template>
