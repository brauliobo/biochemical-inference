<script setup vapor>
import { computed } from 'vue'
import { whyChips } from '../../kb/evidence.js'
import Badge from '../../ui/Badge.vue'

// "Why this verdict": three to five short facts generated from the recorded sources (design mix, human
// versus animal, contradictions, recency). Not authored text. `claim` is an entry of the evidence model.
const props = defineProps({ claim: { type: Object, required: true } })
const chips = computed(() => whyChips(props.claim))
</script>

<template lang="pug">
ul.ev-chips
  li(v-for="chip in chips" :key="chip.id")
    Badge(:label="chip.label" :tone="chip.tone")
</template>
