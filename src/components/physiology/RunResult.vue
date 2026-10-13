<script setup vapor>
import { computed } from 'vue'
import Badge from '../../ui/Badge.vue'
import Card from '../../ui/Card.vue'
import DataTable from '../../ui/DataTable.vue'
import Disclosure from '../../ui/Disclosure.vue'
import Facts from '../../ui/Facts.vue'

// The exact result of one coupled fixture run: mass balance, per-minute
// compartment masses, timestep refinement and the integrated exchanges.
const props = defineProps({ run: { type: Object, required: true } })

const facts = computed(() => {
  const { diagnostics } = props.run
  return [
    { label: 'Total mass', value: `${diagnostics.initialMassMg} → ${diagnostics.finalMassMg} mg` },
    { label: 'Maximum residual', value: `${diagnostics.maximumAbsoluteResidualMg} mg` },
    { label: 'Timestep convergence', value: diagnostics.converged ? 'passed' : 'failed' },
    { label: 'Max refinement difference', value: `${diagnostics.convergenceMaximumDifferenceMg} mg` }
  ]
})
const total = (masses) => Object.values(masses).reduce((sum, value) => sum + value, 0)
</script>

<template lang="pug">
Card(flat aria-labelledby="physiology-run-title")
  .repel
    div
      h3#physiology-run-title Exact run digest
      code.digest {{ run.runDigest }}
    Badge(tone="warning" label="Scientific validation unsupported")
  Facts(:items="facts")
  .grid
    DataTable(caption="Compartment mass schedule" :columns="['Minute', 'Circulation', 'Liver', 'Kidney', 'Residual']")
      tr(v-for="snapshot in run.states" :key="snapshot.timeMinutes")
        th(scope="row") {{ snapshot.timeMinutes }}
        td {{ snapshot.massesMg['PLUGIN:CIRCULATION-REFERENCE'] }} mg
        td {{ snapshot.massesMg['PLUGIN:LIVER-REFERENCE'] }} mg
        td {{ snapshot.massesMg['PLUGIN:KIDNEY-REFERENCE'] }} mg
        td {{ snapshot.massConservationResidualMg }} mg
    DataTable(caption="Timestep refinement" :columns="['Factor', 'Step', 'Residual', 'Final total']")
      tr(v-for="item in run.diagnostics.refinement" :key="item.factor")
        th(scope="row") {{ item.factor }}×
        td {{ item.stepMinutes }} min
        td {{ item.maximumAbsoluteResidualMg }} mg
        td {{ total(item.finalMassesMg) }} mg
  Disclosure(summary="Integrated exchange amounts and protocol schedule")
    DataTable(caption="Integrated exchange amounts" :columns="['Interval', 'Quantity', 'Rate', 'Integrated amount', 'Residual']")
      tr(v-for="(exchange, index) in run.exchanges" :key="`${exchange.quantityId}-${index}`")
        td {{ exchange.intervalStartMinutes }}–{{ exchange.intervalEndMinutes }} min
        td {{ exchange.quantityId }}
        td {{ exchange.rateMgPerMinute }} mg/min
        td {{ exchange.integratedAmountMg }} mg
        td {{ exchange.residualMg }} mg
</template>
