<script setup vapor>
import { computed } from 'vue'
import Badge from '../../ui/Badge.vue'
import Card from '../../ui/Card.vue'
import DataTable from '../../ui/DataTable.vue'
import Facts from '../../ui/Facts.vue'
import Panel from '../../ui/Panel.vue'
import { fixed, yesNo } from '../../ui/format.js'

// One terminal study: identity, headline numbers, sensitivity, held-out
// validation, uncertainty categories, robustness matrix and limitations.
const props = defineProps({ result: { type: Object, required: true } })

const interval = (range, digits) => `${fixed(range.lower, digits)}–${fixed(range.upper, digits)}`
const headline = computed(() => {
  const { sensitivity, calibration, identifiability, posterior } = props.result
  const converged = calibration.estimate !== null
  return [
    { label: 'Local sensitivity', value: fixed(sensitivity.local.at(-1).derivative, 4), note: 'Centered finite difference · final point', large: true },
    { label: 'Calibrated k', value: converged ? fixed(calibration.estimate, 8) : 'not converged', note: converged ? 's⁻¹ · calibration IDs only' : `Best-so-far ${fixed(calibration.bestSoFar, 8)} is not a converged estimate`, large: true },
    { label: 'Identifiability', value: identifiability.identifiable ? 'identifiable' : 'underidentified', note: `Fisher rank ${identifiability.rank}/${identifiability.columns} · condition ${identifiability.conditionNumber}`, large: true },
    { label: 'Posterior', value: posterior.converged ? interval(posterior.interval, 5) : 'non-converged', note: `R-hat ${fixed(posterior.rHat, 4)} · acceptance ${posterior.acceptanceRates.map((rate) => fixed(rate, 2)).join(', ')}`, large: true }
  ]
})
</script>

<template lang="pug">
Card(flat aria-labelledby="study-result-title")
  .repel
    div
      h3#study-result-title Canonical terminal study identity
      code.digest {{ result.studyId }}
    Badge(:label="`${result.lifecycle} · ${result.outcome}`" :status="result.outcome")
  Facts(:items="headline")
  .grid
    Panel(title="Sensitivity and screening" title-id="study-sensitivity-title" :level="3" flat)
      DataTable(caption="Seeded Morris elementary effects" :columns="['Parameter', 'μ*', 'σ', 'Trajectories']")
        tr(v-for="item in result.sensitivity.morris" :key="item.parameterId")
          th(scope="row") {{ item.parameterId }}
          td {{ fixed(item.muStar, 5) }}
          td {{ fixed(item.sigma, 5) }}
          td {{ item.trajectories }}
      p.muted {{ result.calibration.iterations }} bounded Nelder-Mead iterations · objective {{ result.calibration.objective.toExponential(3) }}.
    Panel(title="Held-out posterior predictive validation" title-id="study-validation-title" :level="3" flat)
      template(v-if="result.validation.status === 'available'")
        p {{ result.validation.covered }}/{{ result.validation.total }} held-out observations covered ({{ (result.validation.coverageProbability * 100).toFixed(0) }}%).
        DataTable(caption="Validation IDs were not used for calibration or posterior fitting" :columns="['Observation', 'Observed', '95% interval', 'Covered']")
          tr(v-for="prediction in result.validation.predictions" :key="prediction.observationId")
            th(scope="row") {{ prediction.observationId }}
            td {{ fixed(prediction.observed, 4) }}
            td {{ interval(prediction.interval, 4) }}
            td {{ yesNo(prediction.covered) }}
      template(v-else)
        p Posterior predictive validation suppressed. Diagnostic information only; no coverage result was computed.
        ul
          li(v-for="diagnostic in result.validation.diagnostics" :key="diagnostic") {{ diagnostic }}
  section.stack.stack--tight(aria-labelledby="study-uncertainty-title")
    h3#study-uncertainty-title Uncertainty categories
    .grid.grid--compact
      Card(v-for="item in result.uncertainty" :key="item.category" flat)
        p.eyebrow {{ item.label }}
        p
          strong {{ item.category }}
        p.muted {{ item.description }}
  section.stack.stack--tight(aria-labelledby="study-robustness-title")
    h3#study-robustness-title Robustness matrix · {{ result.robustness.status }}
    p.notice {{ result.robustness.conclusion }}
    DataTable(caption="Parameter, solver, timestep, and model-form variation" :columns="['Scenario', 'Start', 'Solver / step', 'Model form', 'Estimate', 'Held-out RMSE', 'Supports']")
      tr(v-for="row in result.robustness.matrix" :key="row.id")
        th(scope="row") {{ row.id }}
        td {{ fixed(row.parameterStart, 3) }}
        td {{ row.solver }} / {{ row.timestep }}
        td {{ row.modelForm }}
        td {{ row.estimate === null ? 'non-converged' : fixed(row.estimate, 6) }}
        td {{ fixed(row.heldOutRmse, 6) }}
        td {{ yesNo(row.supportsConclusion) }}
  section.stack.stack--tight(aria-labelledby="study-limitations-title")
    h3#study-limitations-title Study limitations
    ul
      li(v-for="item in result.limitations" :key="item") {{ item }}
</template>
