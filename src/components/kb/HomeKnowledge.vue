<script setup vapor>
import { home } from '../../knowledge/index.js'
import ClaimsAudit from './ClaimsAudit.vue'
import TypeCards from './TypeCards.vue'

// The part of the home page that needs the knowledge data (counts per kind and the
// claims audit). The home page loads it lazily, after first paint; see kb/knowledge-lazy.js.
const overview = home()
</script>

<template lang="pug">
.stack.stack--loose
  section.stack(aria-labelledby="types-heading")
    h2#types-heading Browse by kind
    p.muted {{ overview.totals.entities }} entries joined by {{ overview.totals.edges }} labelled relationships.
    TypeCards(:types="overview.types")
  ClaimsAudit
</template>
