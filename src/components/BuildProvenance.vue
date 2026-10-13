<script setup vapor>
import { computed } from 'vue'
import Metric from './ui/Metric.vue'
import { badgeClass } from './ui/tone.js'

const props = defineProps({
  provenance: { type: Object, default: undefined },
  status: { type: String, required: true },
  error: { type: String, default: '' }
})

const emit = defineEmits(['retry'])

const label = computed(() => (props.status === 'available' ? 'Available' : props.status === 'unavailable' ? 'Unavailable' : 'Loading'))
const recordTypes = computed(() => [...new Set(props.provenance?.sourceObjects.map((item) => item.recordType) ?? [])].sort())
const sourceNamespaces = computed(() => [...new Set(props.provenance?.sourceObjects.flatMap((item) => item.sourceIds) ?? [])].sort())
const licenseIds = computed(() => [...new Set(props.provenance?.sourceObjects.map((item) => item.licenseId) ?? [])].sort())
</script>

<template lang="pug">
details.stack(:open="status === 'unavailable'")
  summary.repel
    strong Build provenance
    span(:class="badgeClass(status)") {{ label }}
  .stack
    p.muted(v-if="status === 'loading'" role="status") Loading verified build provenance…
    .notice.notice--danger.stack.stack--tight(v-else-if="status === 'unavailable'" role="alert")
      strong Build provenance unavailable
      p {{ error }}
      p Reproducibility is not established from the information currently available.
      button.button.button--secondary(type="button" @click="emit('retry')") Retry provenance request
    template(v-else-if="provenance")
      dl.metrics.metrics--wide
        Metric(label="Recipe")
          | {{ provenance.recipe.path }}
          code.digest {{ provenance.recipe.digest }}
        Metric(label="Source lock")
          | {{ provenance.sourceLock.path }}
          code.digest {{ provenance.sourceLock.digest }}
        Metric(label="Transformer")
          | {{ provenance.transformer.id }} {{ provenance.transformer.version }}
          code.digest {{ provenance.transformer.digest }}
        Metric(label="Validator")
          | {{ provenance.validation.id }} {{ provenance.validation.version }}
          code.digest {{ provenance.validation.digest }}
      dl.metrics
        Metric(label="Record types" :value="recordTypes.join(', ')")
        Metric(label="Source namespaces" :value="sourceNamespaces.join(', ')")
        Metric(label="License IDs" :value="licenseIds.join(', ')")
      section.stack.stack--tight(aria-labelledby="source-objects-title")
        h3#source-objects-title Source objects
        .source-objects.grid
          article.card.card--flat.stack.stack--tight(v-for="sourceObject in provenance.sourceObjects" :key="sourceObject.name")
            .repel
              strong {{ sourceObject.name }}
              span.muted {{ sourceObject.recordType }} · {{ sourceObject.bytes.toLocaleString() }} bytes
            code.digest {{ sourceObject.digest }}
            small.muted {{ sourceObject.sourceIds.join(', ') }} · {{ sourceObject.licenseId }}
</template>
