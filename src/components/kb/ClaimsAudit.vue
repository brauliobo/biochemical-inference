<script setup vapor>
import { CLAIM_STATUS_KEYS, claimStatusInfo } from '../../knowledge/evidence.js'
import { getEntity, graph } from '../../knowledge/index.js'
import { CLAIMS_AUDIT_PATH } from '../../kb/paths.js'
import RouterLink from '../../ui/RouterLink.vue'

// Shortcut to the claims audit: how many claims there are in each status, each
// count a link to the claim list filtered to that status.
const claims = graph.byType.get('claim') ?? []
const counts = CLAIM_STATUS_KEYS.map((status) => ({
  status,
  to: `${CLAIMS_AUDIT_PATH}?status=${status}`,
  label: claimStatusInfo(status).label.toLowerCase(),
  count: claims.filter((claim) => getEntity(claim.id).status === status).length
}))
</script>

<template lang="pug">
section.card.stack(aria-labelledby="audit-heading")
  h2#audit-heading Claims audit
  p The knowledge base records {{ claims.length }} claims. Each one is graded, with the evidence for and against it.
  ul.cluster.plain-list
    li(v-for="entry in counts" :key="entry.status")
      RouterLink(:to="entry.to") {{ entry.count }} {{ entry.label }}
  p
    RouterLink.button(:to="CLAIMS_AUDIT_PATH") Open the claims audit
</template>
