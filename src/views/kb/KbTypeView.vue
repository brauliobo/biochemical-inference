<script setup vapor>
// PLACEHOLDER: replaced by the knowledge-base views phase.
import { useRoute } from '../../router.js'
import RouterLink from '../../ui/RouterLink.vue'

const route = useRoute()
</script>

<template lang="pug">
.stack
  h1 {{ route.params.type }}
  p.notice(role="note") No entities of this type are published yet.
  RouterLink(to="/kb") Back to the knowledge base
</template>
