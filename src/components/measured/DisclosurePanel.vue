<script setup vapor>
import { computed } from 'vue'
import Facts from '../../ui/Facts.vue'
import Notice from '../../ui/Notice.vue'
import Panel from '../../ui/Panel.vue'
import Toolbar from '../../ui/Toolbar.vue'

// Freeze the consumer commitment first, then disclose the held-out values as a
// separate, explicit act. This is dataflow isolation, not secrecy.
const props = defineProps({
  calibration: { type: Object, default: undefined },
  commitment: { type: Object, default: undefined },
  disclosure: { type: Object, default: undefined },
  cacheControl: { type: String, default: '' },
  canFreeze: { type: Boolean, required: true },
  busy: { type: Boolean, required: true }
})
const emit = defineEmits(['freeze', 'disclose'])

const artifacts = computed(() => {
  const { model, parameterPolicy, endpointMapping, metricThresholdPolicy, prediction } = props.commitment.artifacts
  return [
    { label: 'Model / calibration', value: model.digest, mono: true },
    { label: 'Parameter policy', value: parameterPolicy.digest, mono: true },
    { label: 'Endpoint mapping', value: endpointMapping.digest, mono: true },
    { label: 'No-score policy', value: metricThresholdPolicy.digest, mono: true },
    { label: 'Not-evaluable prediction', value: prediction.digest, mono: true }
  ]
})
</script>

<template lang="pug">
Panel(title="Freeze first, disclose separately" title-id="disclosure-title" eyebrow="Explicit heldout boundary" :level="3" flat)
  p This is dataflow isolation, not secrecy, DRM, or authentication. Protected responses are #[code private, no-store]; a local repository holder can inspect licensed source material.
  p(v-if="!calibration")
    strong Run and persist the calibration analysis before freezing.
  Toolbar(label="Heldout commitment and disclosure")
    button.button(type="button" :disabled="busy || !canFreeze" data-testid="freeze-measured" @click="emit('freeze')") {{ commitment ? 'Retry exact commitment' : 'Freeze from calibration artifact' }}
    button.button.button--secondary(v-if="commitment" type="button" :disabled="busy" data-testid="disclose-measured" @click="emit('disclose')") Explicitly disclose heldout outcomes
  Notice(v-if="commitment" tone="success" data-testid="commitment-receipt")
    p
      strong Frozen before disclosure
    code.digest {{ commitment.receipt.commitment_digest }}
    p nonce {{ commitment.frozenRequest.nonce }} · {{ cacheControl }}
    Facts(data-testid="frozen-artifact-digests" :items="artifacts")
  Notice(v-if="disclosure" tone="warning" data-testid="disclosure-values")
    p
      strong {{ disclosure.items.length }} heldout renal GSH group values disclosed
    p Immutable disclosure receipt {{ disclosure.disclosed_at }}.
    ul
      li(v-for="item in disclosure.items" :key="item.measurement_id")
        code {{ item.group_id }}
        | {{ ` ${item.reported_value}` }} {{ item.reported_unit }} · SEM {{ item.uncertainty.value }} · n={{ item.uncertainty.n }}
    p Labels remain external-held-out; disclosure does not produce a validation conclusion.
</template>
