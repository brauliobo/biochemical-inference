<script setup vapor>
import { computed } from 'vue'
import { STATUS_LOOK, signed } from '../../kb/evidence.js'
import MarkIcon from './MarkIcon.vue'

// The support index of a claim on its -1 to +1 scale: a marker (shaped by the curated status) on a
// diverging strip. The value is printed above it, so the strip is a second channel.
const props = defineProps({
  index: { type: Number, required: true },
  status: { type: String, default: 'partly-supported' },
  noSource: { type: Boolean, default: false }
})
const at = computed(() => (props.index + 1) / 2)
const text = computed(() => signed(props.index))
const label = computed(() => `Support index ${text.value} on a scale from −1, contradicted, to +1, strongly supported${props.noSource ? '. No source is recorded' : ''}`)
</script>

<template lang="pug">
.stack.stack--tight
  p
    strong {{ `Support index ${text}` }}
    span.muted {{ noSource ? ' (no source recorded)' : '' }}
  .ev-gauge(role="img" :aria-label="label")
    span.ev-gauge__track
    MarkIcon.ev-gauge__mark(:look="STATUS_LOOK[status] ?? 0" :hollow="noSource" :style="{ '--at': at }")
  .ev-gauge__ends(aria-hidden="true")
    span −1 contradicted
    span 0
    span +1 supported
</template>
