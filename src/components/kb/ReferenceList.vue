<script setup vapor>
import { describeFacts } from '../../knowledge/facts.js'
import Badge from './Badge.vue'
import EntityLink from './EntityLink.vue'
import VerifiedBadge from './VerifiedBadge.vue'

// Sources for an entity: article link, whether it supports or contradicts, the
// citation line, and DOI / PMID links. `references` comes from a page model.
defineProps({
  references: { type: Array, required: true },
  showStance: { type: Boolean, default: true }
})

const identifiers = (reference) => describeFacts({
  ...(reference.doi ? { doi: reference.doi } : {}),
  ...(reference.pmid ? { pmid: reference.pmid } : {})
})
</script>

<template lang="pug">
ul.plain-list.stack
  li.stack.stack--tight(v-for="reference in references" :key="reference.id")
    .cluster
      EntityLink(:id="reference.id" :label="reference.name")
      Badge(v-if="showStance" :label="reference.stance === 'supports' ? 'Supports' : 'Contradicts'" :tone="reference.stance === 'supports' ? 'success' : 'danger'")
      VerifiedBadge(:verified="reference.verified")
    p.muted {{ reference.citation }}
    .cluster(v-if="identifiers(reference).length")
      template(v-for="fact in identifiers(reference)" :key="fact.key")
        a(v-if="fact.url" :href="fact.url" rel="noopener noreferrer") {{ fact.label }}: {{ fact.value }}
        span(v-else) {{ fact.label }}: {{ fact.value }}
</template>
