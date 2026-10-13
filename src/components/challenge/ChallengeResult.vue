<script setup vapor>
import { nextTick, onMounted, ref, watch } from 'vue'
import { CHALLENGE_CONCLUSION_BOUNDARY } from '../../../shared/challenge-contracts.js'
import Badge from '../../ui/Badge.vue'
import Card from '../../ui/Card.vue'
import Facts from '../../ui/Facts.vue'
import Panel from '../../ui/Panel.vue'
import { endpointName, locatorText } from './endpoints.js'

// The disclosed result: the overall conclusion, the measured observations (kept
// apart from the predictions), the endpoint scores and everything that is
// explicitly not evaluable. It takes focus when a report appears.
const props = defineProps({ report: { type: Object, required: true } })

const CONCLUSION_TONE = { failed: 'danger', 'not-evaluable': 'warning', 'supported-within-boundary': 'success' }
const SUPPORT_TONE = { unsupported: 'danger', 'not-evaluable': 'warning', 'supported-within-boundary': 'success' }
const panel = ref()

const focusPanel = async () => {
  await nextTick()
  panel.value?.focus()
}
onMounted(focusPanel)
watch(() => props.report, focusPanel)

const observationFacts = (observation) => [
  { label: 'Uncertainty', value: observation.uncertainty_reported ? 'Reported by source' : 'Absent: not reported in source' },
  { label: 'Value locator', value: locatorText(observation.locator) },
  { label: 'Sample-size locator', value: locatorText(observation.n_locator) },
  { label: 'Source object', value: observation.locator.source_object_id, mono: true }
]
const scoreFacts = (endpoint) => [
  { label: 'Absolute relative error', value: endpoint.absolute_relative_error ?? 'Not evaluable' },
  { label: 'Endpoint threshold', value: `<= ${endpoint.threshold}` },
  { label: 'Diagnostic status', value: endpoint.diagnostic_status }
]
</script>

<template lang="pug">
.stack
  section.notice.stack.stack--tight(ref="panel" :class="`notice--${CONCLUSION_TONE[report.producer_result.conclusion]}`" aria-labelledby="challenge-result-title" data-testid="challenge-result" tabindex="-1")
    p.eyebrow Bounded overall result
    .repel
      h3#challenge-result-title {{ report.producer_result.conclusion }}
      span exactly two declared endpoints
    p {{ report.producer_result.bounded_conclusion }}
    p #[strong Interpretation boundary:] {{ report.scientific_boundary }}.
    p {{ CHALLENGE_CONCLUSION_BOUNDARY }}

  Panel(title="Measured observations" title-id="challenge-measured-title" eyebrow="Disclosed measured evidence" :level="3" data-testid="challenge-measured")
    p.muted Measured values remain distinct from predictions. The source reported no endpoint uncertainty, so none is inferred or displayed.
    ul.plain-list.grid
      li(v-for="observation in report.disclosure.observations" :key="observation.endpoint_id")
        Card
          p.eyebrow measured · {{ observation.validation_state }}
          p #[strong {{ endpointName(observation.endpoint_id) }}]
          p #[strong {{ observation.normalized_value }} {{ observation.normalized_unit }}]
          p.muted reported {{ observation.reported_value }} {{ observation.reported_unit }} · {{ observation.transformation }} · n={{ observation.n }}
          Facts(rows :items="observationFacts(observation)")

  Panel(title="Errors against the frozen threshold" title-id="challenge-scoring-title" eyebrow="Independent endpoint scoring" :level="3")
    p Metric #[code {{ report.independent_scoring.metric }}]; threshold #[strong {{ report.independent_scoring.threshold }}]; {{ report.independent_scoring.rounding }}.
    ul.plain-list.grid
      li(v-for="endpoint in report.independent_scoring.endpoint_results" :key="endpoint.endpoint_id")
        Card
          p #[strong {{ endpointName(endpoint.endpoint_id) }}]
          Facts(rows :items="scoreFacts(endpoint)")
            div
              dt Endpoint result
              dd
                Badge(:label="endpoint.support_label" :tone="SUPPORT_TONE[endpoint.support_label]")

  Panel(title="All not-evaluable endpoints" title-id="challenge-not-evaluable-title" eyebrow="Explicitly outside this result" :level="3" data-testid="challenge-not-evaluable")
    p.muted These outcomes are not silently omitted and cannot inherit support from the two Cmax scores.
    ol.plain-list.grid
      li(v-for="item in report.not_evaluable" :key="item.id")
        Card
          strong {{ item.endpoint }}
          p {{ item.reason }}
          code {{ item.id }}
</template>
