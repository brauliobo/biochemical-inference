<script setup vapor>
import Card from '../../ui/Card.vue'

// The dataset families by dataflow role, and the rights that apply to the two
// sources. The held-out family shows metadata only.
defineProps({ families: { type: Array, required: true } })

const HELD_OUT = 'external-held-out'
</script>

<template lang="pug">
.stack
  .grid(data-testid="measured-families")
    Card(v-for="family in families" :key="family.id" :flat="family.role !== HELD_OUT" :tone="family.role === HELD_OUT ? 'warning' : ''")
      p.eyebrow {{ family.role }}
      h3 {{ family.title }}
      p
        code {{ family.id }}
      p(v-if="family.role === HELD_OUT") Metadata visible; outcomes, uncertainties, summaries, defaults, and previews absent.
      p.muted(v-else) Values eligible only through their declared {{ family.role }} dataflow.
  .grid
    Card(flat)
      p
        strong CEBS / NTP policy
      p.muted Official federal data under the pinned public-domain-default policy, retaining its third-party copyright caveat and exact attribution.
    Card(flat)
      p
        strong Zenodo record 7648975
      p.muted Authors retain copyright; article and reviewed transcription are carried under CC BY 4.0 with attribution.
</template>
