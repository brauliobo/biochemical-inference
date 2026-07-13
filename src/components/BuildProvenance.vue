<script setup>
import { computed } from 'vue'

const props = defineProps({
  provenance: { type: Object, default: undefined },
  status: { type: String, required: true },
  error: { type: String, default: '' }
})

defineEmits(['retry'])

const recordTypes = computed(() => [...new Set(props.provenance?.sourceObjects.map((item) => item.recordType) ?? [])].sort())
const sourceNamespaces = computed(() => [...new Set(props.provenance?.sourceObjects.flatMap((item) => item.sourceIds) ?? [])].sort())
const licenseIds = computed(() => [...new Set(props.provenance?.sourceObjects.map((item) => item.licenseId) ?? [])].sort())
</script>

<template lang="pug">
details.build-provenance(:open="status === 'unavailable'")
  summary
    span Build provenance
    span.provenance-status(:class="status") {{ status === 'available' ? 'Available' : status === 'unavailable' ? 'Unavailable' : 'Loading' }}
  .build-provenance-body
    p.loading(v-if="status === 'loading'" aria-live="polite") Loading verified build provenance…
    .alert.error(v-else-if="status === 'unavailable'" role="alert")
      strong Build provenance unavailable
      p {{ error }}
      p Reproducibility is not established from the information currently available.
      button.secondary(type="button" @click="$emit('retry')") Retry provenance request
    template(v-else-if="provenance")
      dl.provenance-digests
        div
          dt Recipe
          dd {{ provenance.recipe.path }}
          code {{ provenance.recipe.digest }}
        div
          dt Source lock
          dd {{ provenance.sourceLock.path }}
          code {{ provenance.sourceLock.digest }}
        div
          dt Transformer
          dd {{ provenance.transformer.id }} {{ provenance.transformer.version }}
          code {{ provenance.transformer.digest }}
        div
          dt Validator
          dd {{ provenance.validation.id }} {{ provenance.validation.version }}
          code {{ provenance.validation.digest }}
      dl.provenance-closure
        div
          dt Record types
          dd {{ recordTypes.join(', ') }}
        div
          dt Source namespaces
          dd {{ sourceNamespaces.join(', ') }}
        div
          dt License IDs
          dd {{ licenseIds.join(', ') }}
      .source-objects
        h3 Source objects
        article(v-for="sourceObject in provenance.sourceObjects" :key="sourceObject.name")
          .source-object-heading
            strong {{ sourceObject.name }}
            span {{ sourceObject.recordType }} · {{ sourceObject.bytes.toLocaleString() }} bytes
          code {{ sourceObject.digest }}
          small {{ sourceObject.sourceIds.join(', ') }} · {{ sourceObject.licenseId }}
</template>
