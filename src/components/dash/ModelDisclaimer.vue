<script setup vapor>
import { ref } from 'vue'

// The standing label of every simulator dashboard: one visible line, and a disclosure with the
// validation status. The counts come from the precomputed validation summary (a small lazy chunk).
const counts = ref(null)
import('../../sim/data/validation-summary.json').then((module) => { counts.value = module.default }, () => {})
</script>

<template lang="pug">
.dash-disclaimer(role="note" aria-label="Model limits")
  p
    strong Illustrative educational model
    |  — not measured physiology or medical advice.
  details
    summary Validation status
    ul.plain-list.stack.stack--tight
      li Parameters come from published papers (value, range, source). The model is calibrated to published steady states, not to any person.
      li(v-if="counts") {{ counts.pass }} of {{ counts.total }} validation checks pass; {{ counts.mismatch }} are documented disagreements with the literature (the amber dots on the methylation page).
      li(v-else) The validation summary is loading.
      li Where no human data exist (for example glycine and SAM) the result is marked as a hypothesis.
      li No personalised dosing output is given or implied.
</template>
