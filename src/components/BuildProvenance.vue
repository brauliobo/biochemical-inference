<script setup vapor>
import { computed } from 'vue'
import Badge from '../ui/Badge.vue'
import Card from '../ui/Card.vue'
import Disclosure from '../ui/Disclosure.vue'
import ErrorNotice from '../ui/ErrorNotice.vue'
import Facts from '../ui/Facts.vue'
import LiveMessage from '../ui/LiveMessage.vue'
import { statusTone } from '../ui/tone.js'

// How a release was built (recipe, source lock, transformer, validator) and
// the source objects it contains. Open by default when it is unavailable.
const props = defineProps({
  provenance: { type: Object, default: undefined },
  status: { type: String, required: true },
  error: { type: String, default: '' }
})
const emit = defineEmits(['retry'])

const LABELS = { available: 'Available', unavailable: 'Unavailable' }
const unique = (values) => [...new Set(values)].sort().join(', ')
const pins = computed(() => {
  const { recipe, sourceLock, transformer, validation } = props.provenance
  const digest = (text) => ({ text, mono: true })
  return [
    { label: 'Recipe', value: [recipe.path, digest(recipe.digest)] },
    { label: 'Source lock', value: [sourceLock.path, digest(sourceLock.digest)] },
    { label: 'Transformer', value: [`${transformer.id} ${transformer.version}`, digest(transformer.digest)] },
    { label: 'Validator', value: [`${validation.id} ${validation.version}`, digest(validation.digest)] }
  ]
})
const inventory = computed(() => {
  const objects = props.provenance.sourceObjects
  return [
    { label: 'Record types', value: unique(objects.map((item) => item.recordType)) },
    { label: 'Source namespaces', value: unique(objects.flatMap((item) => item.sourceIds)) },
    { label: 'License IDs', value: unique(objects.map((item) => item.licenseId)) }
  ]
})
</script>

<template lang="pug">
Disclosure(:open="status === 'unavailable'")
  template(#summary)
    span.cluster
      strong Build provenance
      Badge(:label="LABELS[status] ?? 'Loading'" :tone="statusTone(status)")
  LiveMessage(v-if="status === 'loading'" visible text="Loading verified build provenance…")
  ErrorNotice(v-else-if="status === 'unavailable'" title="Build provenance unavailable" :message="error" retry-label="Retry provenance request" @retry="emit('retry')")
    p Reproducibility is not established from the information currently available.
  template(v-else-if="provenance")
    Facts(size="wide" :items="pins")
    Facts(:items="inventory")
    section.stack.stack--tight(aria-labelledby="source-objects-title")
      h3#source-objects-title Source objects
      .source-objects.grid
        Card(v-for="sourceObject in provenance.sourceObjects" :key="sourceObject.name" flat)
          .repel
            strong {{ sourceObject.name }}
            span.muted {{ sourceObject.recordType }} · {{ sourceObject.bytes.toLocaleString() }} bytes
          code.digest {{ sourceObject.digest }}
          small.muted {{ sourceObject.sourceIds.join(', ') }} · {{ sourceObject.licenseId }}
</template>
