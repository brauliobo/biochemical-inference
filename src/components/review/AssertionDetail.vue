<script setup vapor>
import { computed } from 'vue'
import Badge from '../../ui/Badge.vue'
import Facts from '../../ui/Facts.vue'
import Notice from '../../ui/Notice.vue'
import Panel from '../../ui/Panel.vue'

// One derived assertion as submitted: the claim, its lineage, the full
// scientific context, bounded applicability, uncertainty and limitations.
const props = defineProps({ detail: { type: Object, required: true } })

const assertion = computed(() => props.detail.assertion)
const claim = computed(() => {
  const { state } = props.detail
  return [
    { label: 'State', value: state.review_status },
    { label: 'Value', value: `${assertion.value.value.value} ${assertion.value.unit.symbol}` },
    { label: 'Reproduction', value: state.reproduction_verified ? 'reviewer verified' : assertion.value.reproduction.status }
  ]
})
const context = computed(() => {
  const { context: scope } = assertion.value
  return [
    { label: 'Taxon', value: scope.taxon_id },
    { label: 'Tissue / cell', value: `${scope.tissue_id} / ${scope.cell_type_id}` },
    { label: 'Sex / strain', value: `${scope.biological_sex} / ${scope.strain ?? 'not specified'}` },
    { label: 'Route / dose', value: `${scope.route} / ${scope.dose?.value} ${scope.dose?.unit.symbol}` },
    { label: 'Scope', value: scope.model_scope }
  ]
})
</script>

<template lang="pug">
article.stack
  Notice(tone="warning" aria-labelledby="review-claim-title")
    Badge(tone="warning" label="Synthetic prediction")
    h3#review-claim-title Claim
    p {{ assertion.statement }}
    code.digest {{ detail.digest }}
    Facts(:items="claim")

  .grid
    Panel(title="Lineage" title-id="review-lineage-title" :level="3" flat)
      ul.plain-list.stack.stack--tight
        li.stack.stack--tight(v-for="dependency in assertion.dependencies" :key="`${dependency.type}-${dependency.digest}`")
          strong {{ dependency.type }} · {{ dependency.family ?? dependency.model_id ?? dependency.artifact_id }}
          code.digest {{ dependency.digest }}
    Panel(title="Full scientific context" title-id="review-context-title" :level="3" flat)
      Facts(:items="context")

  .grid
    Panel(title="Bounded applicability" title-id="review-applicability-title" :level="3" flat)
      p {{ assertion.applicability.rationale }}
      ul
        li(v-for="boundary in assertion.applicability.boundaries" :key="boundary.variable") {{ boundary.variable }}: {{ boundary.lower ?? 'open' }}–{{ boundary.upper ?? 'open' }} {{ boundary.unit?.symbol ?? '' }}
    Panel(title="Qualitative uncertainty" title-id="review-uncertainty-title" :level="3" flat)
      ul.stack.stack--tight
        li(v-for="component in assertion.uncertainty.components" :key="component.category")
          strong {{ component.category }}
          p {{ component.description }}

  section.stack.stack--tight(aria-labelledby="review-limitations-title")
    h3#review-limitations-title Unsupported limitations
    ul
      li(v-for="limitation in assertion.limitations" :key="limitation") {{ limitation }}
</template>
