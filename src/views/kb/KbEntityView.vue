<script setup vapor>
// PLACEHOLDER: replaced by the knowledge-base views phase.
import { useRoute } from '../../router.js'
import RouterLink from '../../ui/RouterLink.vue'

const route = useRoute()
</script>

<template lang="pug">
.stack
  p.eyebrow {{ route.params.type }}
  h1 {{ route.params.slug }}
  p.notice(role="note") This entity page is not published yet.
  RouterLink(:to="'/kb/' + route.params.type") Back to {{ route.params.type }}
</template>
