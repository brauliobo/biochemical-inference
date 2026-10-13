<script setup vapor>
import RouterLink from '../ui/RouterLink.vue'
</script>

<template lang="pug">
.stack.stack--loose
  header.stack
    p.eyebrow Educational resource
    h1 Methylation biochemistry, explained and cross-linked
    p.lede.
      Glycine, choline and betaine, under- and over-methylation, the enzymes and
      reactions behind them, the pathways they form, related conditions and the
      literature, each on its own page and linked to the rest.
    .cluster
      RouterLink.button(to="/kb") Browse the knowledge base
      RouterLink.button.button--secondary(to="/workbench") Open a workbench
  .grid
    RouterLink.card.stack.stack--tight(to="/kb")
      h2 Knowledge base
      p.muted Entities and the relationships between them, with sources.
    RouterLink.card.stack.stack--tight(to="/workbench")
      h2 Workbenches
      p.muted Interactive models of one-carbon metabolism. These need the API server.
</template>
