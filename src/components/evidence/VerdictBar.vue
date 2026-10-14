<script setup vapor>
import { computed } from 'vue'
import { signed, verdictBar, verdictBarText } from '../../kb/evidence.js'

// The compact verdict bar of one claim: its length is how much design-weighted evidence there is
// (against `maxTotal`, the largest in the table), its split is evidence for (solid) versus
// evidence against (hatched). The numbers are printed beside it; the full sentence is for screen
// readers. `claim` is an entry of the evidence model.
const props = defineProps({
  claim: { type: Object, required: true },
  maxTotal: { type: Number, required: true },
  large: { type: Boolean, default: false }
})
const bar = computed(() => verdictBar(props.claim, props.maxTotal))
const sentence = computed(() => verdictBarText(props.claim))
const nums = computed(() => `${props.claim.nFor} for, ${props.claim.nAgainst} against`)
const index = computed(() => signed(props.claim.index))
</script>

<template lang="pug">
.ev-vbar(:class="{ 'ev-vbar--large': large }")
  span.visually-hidden {{ sentence }}
  span.ev-vbar__track(aria-hidden="true")
    span.ev-vbar__fill(v-if="bar.length" :style="{ '--length': bar.length }")
      span.ev-vbar__for(v-if="bar.forShare" :style="{ '--for': bar.forShare }")
      span.ev-vbar__against(v-if="bar.againstShare" :style="{ '--against': bar.againstShare }")
    span.ev-vbar__none(v-else) no source
  span.ev-vbar__nums(aria-hidden="true") {{ large ? nums : index }}
</template>
