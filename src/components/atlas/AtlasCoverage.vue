<script setup vapor>
import { computed } from 'vue'
import Card from '../../ui/Card.vue'
import EmptyState from '../../ui/EmptyState.vue'
import Panel from '../../ui/Panel.vue'

// How much of each partition the verified release covers, and the explicit gaps.
const props = defineProps({ workspace: { type: Object, required: true } })

const coverage = computed(() => props.workspace.coverage.items)
const total = computed(() => coverage.value.reduce((sum, item) => sum + item.denominator, 0))
const covered = computed(() => coverage.value.reduce((sum, item) => sum + item.numerator, 0))
const gaps = computed(() => coverage.value.filter((item) => item.evidenceClass === 'uncovered' || item.gapIds.length))
</script>

<template lang="pug">
Panel(title="Coverage and measured gaps" title-id="atlas-coverage-title" :level="3" flat)
  p
    strong {{ covered }} / {{ total }} denominator targets covered across {{ coverage.length }} partitions.
  Card(v-for="gap in gaps" :key="gap.id" tone="warning")
    p
      strong Unknown / measured gap · {{ gap.entityType }}
    p {{ gap.numerator }} / {{ gap.denominator }} covered
    p {{ gap.denominatorDefinition }}
    p
      code {{ gap.gapIds.join(', ') }}
  EmptyState(v-if="!gaps.length") No measured gaps are listed for this projection. Unmeasured scope remains unknown.
</template>
