<script setup vapor>
// One labelled value: a (dt, dd) pair wrapped in a div, for use inside
// <dl class="metrics"> or <dl class="facts">. The value is the `value` prop or
// the default slot; `note` (or the note slot) is a second, muted line.
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: '' },
  note: { type: String, default: '' },
  mono: { type: Boolean, default: false },
  large: { type: Boolean, default: false }
})
</script>

<template lang="pug">
div
  dt {{ label }}
  dd(:class="{ metric__value: large }")
    slot
      code.digest(v-if="mono") {{ value }}
      template(v-else) {{ value }}
  dd(v-if="note || $slots.note")
    slot(name="note") {{ note }}
</template>
