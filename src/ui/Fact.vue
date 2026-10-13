<script setup vapor>
import { computed } from 'vue'

// One labelled value: a (dt, dd) pair in a div, for use inside <Facts>. The
// value is the `value` prop, a list of values (one dd each, the later ones
// muted), or the default slot. `mono` prints values as digests/identifiers;
// `large` makes the first value a headline; `note` adds a muted last line.
// A value can also be { text, mono } to mix plain and monospace lines.
const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number, Array], default: '' },
  note: { type: String, default: '' },
  mono: { type: Boolean, default: false },
  large: { type: Boolean, default: false }
})

const values = computed(() => (Array.isArray(props.value) ? props.value : [props.value])
  .map((item) => (item !== null && typeof item === 'object' ? { text: item.text, mono: item.mono ?? props.mono } : { text: item, mono: props.mono })))
</script>

<template lang="pug">
div
  dt {{ label }}
  dd(v-if="$slots.default" :class="{ fact__value: large }")
    slot
  template(v-else)
    dd(v-for="(item, index) in values" :key="index" :class="{ fact__value: large && index === 0, digest: item.mono }") {{ item.text }}
  dd(v-if="note || $slots.note")
    slot(name="note") {{ note }}
</template>
