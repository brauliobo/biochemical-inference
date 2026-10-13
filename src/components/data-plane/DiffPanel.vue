<script setup vapor>
import { computed } from 'vue'
import Facts from '../../ui/Facts.vue'
import Panel from '../../ui/Panel.vue'

// The pinned semantic difference between the two releases, by change class.
const props = defineProps({ difference: { type: Object, required: true } })

const classes = computed(() => {
  const { record_changes: records, scientific_metadata_changes: metadata, provenance_changes: provenance, rights_changes: rights, packaging_changes: packaging } = props.difference
  return [
    { label: 'Scientific', value: `${records.length + metadata.length} changes`, note: 'Normalized records or scientific scope' },
    { label: 'Provenance', value: `${provenance.length} changes`, note: 'Source objects, adapters, or transformations' },
    { label: 'Rights', value: `${rights.length} changes`, note: 'Licenses, attribution, or redistribution' },
    { label: 'Packaging', value: `${packaging.length} changes`, note: 'Partitions and signature envelopes only' }
  ]
})
</script>

<template lang="pug">
Panel(:title="`${difference.baseline.id} → ${difference.candidate.id}`" title-id="data-plane-diff-title" eyebrow="Baseline → candidate semantic proof" :level="3")
  template(#actions)
    code {{ difference.diff_digest }}
  Facts(:items="classes")
  p {{ difference.counts.unchanged }} records are unchanged; additions {{ difference.counts.added }}, removals {{ difference.counts.removed }}, changed {{ difference.counts.changed }}.
  ul.plain-list.stack.stack--tight
    li.cluster(v-for="change in difference.record_changes" :key="`${change.record_type}:${change.id}`")
      strong {{ change.record_type }}/{{ change.id }}
      span {{ change.status }} · {{ change.classification }} · {{ change.attribution.join(', ') }}
</template>
