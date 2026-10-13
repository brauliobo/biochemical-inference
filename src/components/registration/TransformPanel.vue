<script setup vapor>
import { computed } from 'vue'
import Facts from '../../ui/Facts.vue'
import InputField from '../../ui/InputField.vue'
import Panel from '../../ui/Panel.vue'

// Transform one grid coordinate between the two prealigned spaces. Evaluation
// ROI membership is reported separately and never decides validity.
const props = defineProps({
  source: { type: String, required: true },
  target: { type: String, required: true },
  transformed: { type: Object, default: undefined },
  checking: { type: Boolean, required: true },
  busy: { type: Boolean, required: true }
})
const point = defineModel('point', { type: Array, required: true })
const emit = defineEmits(['transform', 'reverse'])

const shortSpace = (value) => (value?.includes('-CT-') ? 'CT prealigned' : value?.includes('-MR-') ? 'MR prealigned' : value)
const result = computed(() => [
  { label: 'Direction', value: props.transformed.direction },
  { label: 'Input XYZ mm', value: props.transformed.inputPointXyzMm.join(', ') },
  { label: 'Output XYZ mm', value: props.transformed.outputPointXyzMm.join(', ') },
  { label: 'Evaluation ROI', value: `${props.transformed.evaluationRoiMembership} (metric scope only)` }
])
</script>

<template lang="pug">
Panel(title="Verify one grid coordinate" title-id="transform-title" eyebrow="Bounded transform intent" :level="3")
  template(#actions)
    button.button.button--secondary(type="button" :disabled="busy" data-testid="spatial-registration-reverse" @click="emit('reverse')") Reverse
  p Any coordinate inside the selected source-space extent can be transformed. Evaluation-ROI membership is reported separately and never determines transform validity. The inverse is exact because the materialized affine is identity.
  form.stack(@submit.prevent="emit('transform')")
    .grid
      InputField(id="registration-source" label="Source" :model-value="shortSpace(source)" readonly)
      InputField(id="registration-target" label="Target" :model-value="shortSpace(target)" readonly)
    .grid
      InputField(id="registration-x" label="X mm" type="number" v-model="point[0]" min="0" max="382" step="any")
      InputField(id="registration-y" label="Y mm" type="number" v-model="point[1]" min="0" max="318" step="any")
      InputField(id="registration-z" label="Z mm" type="number" v-model="point[2]" min="0" max="382" step="any")
    div
      button.button(type="submit" :disabled="busy" data-testid="spatial-registration-transform") {{ checking ? 'Applying affine…' : 'Apply bounded transform' }}
  Facts(v-if="transformed" rows data-testid="spatial-registration-transform-result" :items="result")
</template>
