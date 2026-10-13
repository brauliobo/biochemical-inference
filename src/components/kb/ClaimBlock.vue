<script setup vapor>
import ClaimStatusBadge from './ClaimStatusBadge.vue'

// The statement of a claim, where it came from and what its status means.
// `claim` is the `claim` section of a page model.
defineProps({ claim: { type: Object, required: true } })
</script>

<template lang="pug">
.stack
  blockquote.notice
    p {{ claim.statement }}
  .cluster
    ClaimStatusBadge(:status="claim.status.status")
    span.muted {{ claim.source === 'literature' ? 'Taken from the literature.' : 'Raised in the source conversation.' }}
</template>
