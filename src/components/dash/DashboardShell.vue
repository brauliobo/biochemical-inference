<script setup vapor>
import { computed, useSlots, watch } from 'vue'
import { setPageTitle } from '../../router.js'
import Badge from '../../ui/Badge.vue'
import Disclosure from '../../ui/Disclosure.vue'
import ModelDisclaimer from './ModelDisclaimer.vue'

// The frame every dashboard shares: page title (h1, also the document title), a one-line question, a
// status badge, the standing model disclaimer, then the visuals. `controls` is a column that stays in
// view on wide screens, `notes` a collapsed "Notes & sources" drawer, `related` a row of links.
//
//   DashboardShell(title="Glycine" question="Where does glycine come from and go?" status="model")
//     template(#controls) ...scenario presets and sliders...
//     ...the visuals...
//     template(#notes) ...prose, kept short...
//     template(#related) RouterLink(to="/dash/choline") Choline
const props = defineProps({
  title: { type: String, required: true },
  question: { type: String, default: '' },
  status: { type: String, default: 'model' }
})
const slots = useSlots()

const STATUS = {
  model: { label: 'Simulation model', tone: 'info' },
  hypothesis: { label: 'Hypothesis', tone: 'warning' },
  measured: { label: 'Measured data', tone: 'success' },
  calculator: { label: 'Calculator', tone: 'info' }
}
const badge = computed(() => STATUS[props.status] ?? STATUS.model)

watch(() => props.title, (title) => setPageTitle(title), { immediate: true })
</script>

<template lang="pug">
.dash.stack.stack--loose
  header.dash-head.stack.stack--tight
    .repel
      h1 {{ title }}
      Badge(:label="badge.label" :tone="badge.tone")
    p.dash-question(v-if="question") {{ question }}
    ModelDisclaimer
  .dash-body(:class="{ 'dash-body--side': slots.controls }")
    section.dash-controls(v-if="slots.controls" aria-label="Scenario and controls")
      slot(name="controls")
    .dash-main.stack.stack--loose
      slot
  Disclosure(v-if="slots.notes" summary="Notes & sources" card)
    slot(name="notes")
  nav.dash-related.cluster(v-if="slots.related" aria-label="Related")
    span.muted Related
    slot(name="related")
</template>
