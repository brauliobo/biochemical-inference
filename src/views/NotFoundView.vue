<script setup vapor>
import RouterLink from '../ui/RouterLink.vue'
</script>

<template lang="pug">
.stack
  h1 Page not found
  p There is nothing at this address. It may have moved, or the link may be mistyped.
  .cluster
    RouterLink.button(to="/") Go to the home page
    RouterLink.button.button--secondary(to="/kb") Browse the knowledge base
</template>
