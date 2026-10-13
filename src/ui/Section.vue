<script setup vapor>
import { computed } from 'vue'

// A labelled workbench section: a card with an eyebrow, a heading at the given
// level, an optional state badge (announced politely) and a lede. Its content
// is the default slot, stacked.
const props = defineProps({
  title: { type: String, required: true },
  titleId: { type: String, required: true },
  eyebrow: { type: String, default: '' },
  lede: { type: String, default: '' },
  level: { type: Number, default: 2 },
  status: { type: String, default: '' },
  tone: { type: String, default: '' },
  flat: { type: Boolean, default: false }
})

const badge = computed(() => (props.tone ? `badge badge--${props.tone}` : 'badge'))
</script>

<template lang="pug">
section.card.card--section.stack(:class="{ 'card--flat': flat }" :aria-labelledby="titleId")
  header.stack.stack--tight
    .repel
      div
        p.eyebrow(v-if="eyebrow") {{ eyebrow }}
        h2(v-if="level === 2" :id="titleId") {{ title }}
        h3(v-else-if="level === 3" :id="titleId") {{ title }}
        h4(v-else :id="titleId") {{ title }}
      span(v-if="status" :class="badge" role="status") {{ status }}
    p.lede(v-if="lede") {{ lede }}
  slot
</template>
