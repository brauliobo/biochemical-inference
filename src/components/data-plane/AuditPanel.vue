<script setup vapor>
import { computed } from 'vue'
import Facts from '../../ui/Facts.vue'
import Panel from '../../ui/Panel.vue'
import { plural } from '../../ui/format.js'

// The persisted deterministic audit of the verified local closure. Running it is
// idempotent and reads only records that are already verified.
const props = defineProps({
  report: { type: Object, default: undefined },
  audits: { type: Array, required: true },
  busy: { type: Boolean, required: true },
  disabled: { type: Boolean, required: true }
})
const emit = defineEmits(['run'])

const facts = computed(() => {
  const { algorithmVersion, baseline, release, results, scientificValidation } = props.report
  return [
    { label: 'Algorithm / reports', value: algorithmVersion, note: `${plural(props.audits.length, 'immutable report')}` },
    { label: 'Release pair', value: baseline.id, note: release.id },
    { label: 'Closure result', value: `${results.totalRecords} records · ${results.partitionCount} partitions`, note: `${results.sourceObjectCount} source objects · all checks passed` },
    { label: 'Scientific validation', value: scientificValidation, note: 'Distribution and authority closure only' }
  ]
})
</script>

<template lang="pug">
Panel(title="Authority closure audit" title-id="data-plane-audit-title" eyebrow="Persisted deterministic audit" :level="3")
  template(#actions)
    button.button.button--secondary(type="button" :disabled="busy || disabled" @click="emit('run')") {{ busy ? 'Auditing…' : report ? 'Re-run idempotent audit' : 'Run offline audit' }}
  p Audit reads only already verified local records. It checks record counts, reaction balance, taxon/catalysis closure, and references; scientific validation remains unsupported.
  template(v-if="report")
    p
      code {{ report.reportDigest }}
    Facts(:items="facts")
</template>
