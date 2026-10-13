<script setup vapor>
import { computed } from 'vue'

// One labelled value: a (dt, dd) pair in a div, for use inside <Facts>. The
// value is the `value` prop or the default slot. Under it, `code` adds one or
// more digests or identifiers in monospace (same dd); `mono` prints the value
// itself that way. `large` makes it a headline; `note` adds a second, muted dd.
const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], default: '' },
  code: { type: [String, Array], default: () => [] },
  note: { type: String, default: '' },
  mono: { type: Boolean, default: false },
  large: { type: Boolean, default: false }
})

const codes = computed(() => [props.code].flat())
</script>

<template lang="pug">
div
  dt {{ label }}
  dd(:class="{ fact__value: large, digest: mono }")
    slot
      template(v-if="value !== ''") {{ value }}
      code.digest(v-for="text in codes" :key="text") {{ text }}
  dd(v-if="note || $slots.note")
    slot(name="note") {{ note }}
</template>
