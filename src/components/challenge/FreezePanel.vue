<script setup vapor>
import Card from '../../ui/Card.vue'
import Notice from '../../ui/Notice.vue'
import Panel from '../../ui/Panel.vue'
import { endpointName } from './endpoints.js'

// Step 1: commit the model and its predictions, then (separately) disclose the
// held-out observations. Nothing measured is shown before disclosure.
defineProps({
  commitment: { type: Object, default: undefined },
  frozen: { type: Object, default: undefined },
  receipt: { type: Object, default: undefined },
  report: { type: Object, default: undefined },
  state: { type: String, required: true },
  busy: { type: Boolean, required: true }
})
const emit = defineEmits(['freeze', 'disclose'])
</script>

<template lang="pug">
Panel(title="1. Freeze model and predictions" title-id="challenge-freeze-title" eyebrow="Commit before outcome access" :level="3")
  p The server builds and persists the model, equation set, parameter policy, concentration mapping, solver, software, diagnostics, prediction, and public-lineage artifacts before requesting disclosure.
  div
    button.button(type="button" :disabled="busy" data-testid="challenge-freeze" @click="emit('freeze')") {{ commitment ? 'Retry exact commitment' : state === 'freezing' ? 'Freezing…' : 'Freeze challenge commitment' }}

  Notice(v-if="receipt" tone="success" title="Committed before disclosure" data-testid="challenge-commitment")
    p
      code {{ receipt.commitment_digest }}
    p created {{ receipt.created_at }} · committed {{ receipt.committed_at }}
    p prediction artifact #[code {{ commitment?.artifacts.prediction.digest ?? report?.artifact_refs.prediction.digest }}]

  Panel(v-if="frozen" title="Frozen predictions" title-id="challenge-predictions-title" :level="4" data-testid="challenge-predictions")
    p.muted Predicted model outputs. These are not measured observations.
    ul.plain-list.grid
      li(v-for="prediction in frozen.predictions" :key="prediction.endpoint_id")
        Card
          p.eyebrow predicted
          p #[strong {{ endpointName(prediction.endpoint_id) }}]
          p #[strong {{ prediction.predicted_value }} {{ prediction.predicted_unit }}]
          p.muted maximum at {{ prediction.predicted_time_h }} h · {{ prediction.endpoint_id }}

  Notice(v-if="frozen && !report" tone="warning" role="status") Measured outcomes remain undisclosed. No measured value, uncertainty, score, or result is present in this view.
  div(v-if="receipt && !report")
    button.button(type="button" :disabled="busy" data-testid="challenge-disclose" @click="emit('disclose')") {{ state === 'disclosing' ? 'Disclosing and scoring…' : 'Disclose held-out observations and score' }}
</template>
