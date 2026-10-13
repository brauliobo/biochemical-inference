<script setup vapor>
import { computed } from 'vue'

// A box for one record inside a panel: an <article> that stacks its content.
// `flat` is the sunken variant; `tone` ('success' | 'warning' | 'danger')
// turns it into the matching notice box instead (a record that needs attention).
//
//   Card(flat)
//     p.eyebrow measured
//     p #[strong {{ item.name }}]
const props = defineProps({
  flat: { type: Boolean, default: false },
  tone: { type: String, default: '' }
})

const classes = computed(() => (props.tone ? ['notice', `notice--${props.tone}`] : ['card', props.flat ? 'card--flat' : '']))
</script>

<template lang="pug">
article.stack.stack--tight(:class="classes")
  slot
</template>
