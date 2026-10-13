<script setup vapor>
import { computed } from 'vue'
import Facts from '../../ui/Facts.vue'
import Notice from '../../ui/Notice.vue'
import Panel from '../../ui/Panel.vue'

// The bounded technical report: what ran, how often, and what it stored.
const props = defineProps({ report: { type: Object, required: true } })

const facts = computed(() => {
  const { technical_execution: run } = props.report
  return [
    { label: 'Selected work', value: run.progress.total },
    { label: 'Direct / transitive', value: `${run.selection.direct} / ${run.selection.transitive}` },
    { label: 'Attempts / retries', value: `${run.recovery.attempts} / ${run.recovery.retries}` },
    { label: 'Exactly once', value: run.accepted_results.exactly_once ? 'verified' : 'not verified' },
    { label: 'CAS objects / bytes', value: `${run.storage.object_count} / ${run.storage.object_bytes}` },
    { label: 'Projection', value: run.projection.snapshot_id, mono: true }
  ]
})
</script>

<template lang="pug">
Panel(title="Bounded campaign report" title-id="revalidation-report-title" eyebrow="Technical execution" :level="3" flat)
  Facts(:items="facts")
  Notice(tone="warning" role="note")
    p.eyebrow Scientific labels
    p
      strong {{ report.scientific_review.support }} · {{ report.scientific_review.review_required ? 'review required' : 'review not yet required' }}
    p No technical completion, retry, receipt, or exactly-once result is scientific support. Automatic acceptance remains disabled.
</template>
