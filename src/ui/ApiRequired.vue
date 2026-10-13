<script setup vapor>
import Notice from './Notice.vue'

// Shown instead of a workbench that needs the Fastify API when the app is
// built in static mode (GitHub Pages). The only place that explains this.
defineProps({ title: { type: String, default: 'This workbench' } })
</script>

<template lang="pug">
Notice(tone="warning" role="status")
  p
    strong {{ title }} requires the API server.
  p.
    This is the static, read-only edition of the site, which has no back end.
    The workbenches run simulations and read verified releases through the API,
    so they work only when you run the project yourself:
    #[code npm ci] then #[code npm run dev], and open the address it prints.
  p
    a(href="#/kb") Browse the knowledge base instead
</template>
