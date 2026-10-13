<script setup vapor>
import ClaimsAudit from '../../components/kb/ClaimsAudit.vue'
import SearchBox from '../../components/kb/SearchBox.vue'
import TypeCards from '../../components/kb/TypeCards.vue'
import { home } from '../../knowledge/index.js'
import { MAP_PATH } from '../../kb/paths.js'
import RouterLink from '../../ui/RouterLink.vue'

// /kb: every entity type with its count, global search and the claims audit.
const overview = home()
</script>

<template lang="pug">
.stack.stack--loose
  header.stack
    h1 Knowledge base
    p.lede {{ overview.totals.entities }} entries in {{ overview.types.length }} kinds, joined by {{ overview.totals.edges }} labelled relationships. Search, or browse by kind.
  SearchBox
  section.stack(aria-labelledby="types-heading")
    h2#types-heading Browse by kind
    TypeCards(:types="overview.types")
  ClaimsAudit
  p
    RouterLink(:to="MAP_PATH") Explore the connections around any entry on the map
</template>
