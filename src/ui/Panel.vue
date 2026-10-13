<script setup vapor>
import { computed } from 'vue'
import Badge from './Badge.vue'
import { uniqueId } from './uid.js'

// The one titled container: a card that is a named region (aria-labelledby the
// heading) with an optional eyebrow, state badge, header actions and lede, and
// its content stacked below. Nest panels one heading level deeper (`level`).
// Change `status` to announce progress: the badge is a polite live region, its
// colour comes from the status word unless `tone` is given.
//
//   Panel(title="Experiments" title-id="x-title" eyebrow="Workspace" :status="state")
//     template(#actions)
//       button.button.button--secondary(type="button") Refresh
//     p Content
//
// `flat` is the sunken, shadowless variant for panels inside a panel.
const props = defineProps({
  title: { type: String, required: true },
  titleId: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  lede: { type: String, default: '' },
  level: { type: Number, default: 2 },
  status: { type: String, default: '' },
  tone: { type: String, default: undefined },
  flat: { type: Boolean, default: false }
})

const fallbackId = uniqueId('panel')
const id = computed(() => props.titleId || fallbackId)
</script>

<template lang="pug">
section.card.panel.stack(:class="{ 'card--flat': flat }" :aria-labelledby="id")
  header.stack.stack--tight
    .repel
      .stack.stack--tight
        p.eyebrow(v-if="eyebrow") {{ eyebrow }}
        h2(v-if="level === 2" :id="id") {{ title }}
        h3(v-else-if="level === 3" :id="id") {{ title }}
        h4(v-else :id="id") {{ title }}
      .cluster
        slot(name="actions")
        Badge(v-if="status" :status="status" :tone="tone" aria-live="polite")
    p.lede(v-if="lede") {{ lede }}
  slot
</template>
