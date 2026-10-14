<script setup vapor>
import ClaimsExplorer from '../../components/evidence/ClaimsExplorer.vue'
import { useEvidence } from '../../components/evidence/useEvidence.js'
import { setPageTitle } from '../../router.js'
import RouterLink from '../../ui/RouterLink.vue'

// /evidence/claims. The claims audit on its own: headline counters, filters in the URL, the matrix.
setPageTitle('Claims audit')
const { model } = useEvidence()
</script>

<template lang="pug">
.stack.stack--loose
  header.stack
    nav(aria-label="Breadcrumb")
      RouterLink(to="/evidence") Evidence
    h1 Claims audit
    p.lede Every claim with its status, evidence grade, supporting and contradicting articles, and a verdict bar.
  p.muted(v-if="!model" role="status") Loading the evidence data.
  ClaimsExplorer(v-else :claims="model.claims" :articles="model.articles" url-sync id-prefix="cl")
</template>
