<script setup vapor>
import Notice from '../../ui/Notice.vue'
import Panel from '../../ui/Panel.vue'

// Calibration-only analysis of the immutable calibration partition. No held-out
// value is read, and the result is never a validation conclusion.
defineProps({
  calibration: { type: Object, default: undefined },
  busy: { type: Boolean, required: true }
})
const emit = defineEmits(['run'])
</script>

<template lang="pug">
Panel(title="C55801C · ALT · 24 h · five dose groups" title-id="calibration-title" eyebrow="Calibration-only analysis" :level="3" flat)
  p The immutable calibration partition is selected within one study, observable, time, assay ID, protocol, unit, and declared group set. A fit is emitted only if scientific context is complete and identical.
  div
    button.button(type="button" :disabled="busy" data-testid="run-measured-calibration" @click="emit('run')") Run deterministic calibration analysis
  Notice(v-if="calibration" tone="warning" data-testid="calibration-artifact")
    p
      strong {{ calibration.status }}
    code.digest {{ calibration.artifactDigest }}
    p {{ calibration.measurements.length }} pinned measurement values and lineage digests · {{ calibration.missingness.length }} selected missingness records.
    ul
      li(v-for="reason in calibration.reasons" :key="reason") {{ reason }}
    p Access proof: development {{ calibration.accessProof.developmentMeasurementsRead }}, validation {{ calibration.accessProof.validationMeasurementsRead }}, external-heldout {{ calibration.accessProof.externalHeldoutMeasurementsRead }}. Evaluation client available: {{ calibration.accessProof.evaluationClientAvailable ? 'yes' : 'no' }}.
    p
      strong No validation conclusion.
</template>
