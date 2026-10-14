<script setup vapor>
// How to read a verdict bar. Used under every table that has them.
</script>

<template lang="pug">
.cluster(role="note" aria-label="How to read the verdict bars")
  span.ev-key
    span.ev-key__chip.ev-key__chip--for
    span Evidence for (solid)
  span.ev-key
    span.ev-key__chip.ev-key__chip--against
    span Evidence against (hatched)
  span.muted Bar length is the amount of design-weighted evidence; the number is the support index, from −1 to +1.
</template>
