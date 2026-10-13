<script setup vapor>
import Badge from '../../ui/Badge.vue'
import Card from '../../ui/Card.vue'
import Facts from '../../ui/Facts.vue'
import Notice from '../../ui/Notice.vue'

// The snapshot-pinned work records of a campaign. A terminal software outcome
// is always labelled "review required": it is never a scientific conclusion.
const props = defineProps({
  campaign: { type: Object, required: true },
  busy: { type: Boolean, required: true }
})
const emit = defineEmits(['more'])

const facts = (item) => [
  { label: 'Attempts', value: item.attempt_count },
  { label: 'Checkpoints', value: item.checkpoint_count },
  { label: 'Artifact class', value: item.work.expected_artifact_class },
  { label: 'Producer receipt', value: item.producer_receipt ? `event ${item.producer_receipt.event_sequence}` : 'pending' }
]
</script>

<template lang="pug">
section.stack.stack--tight(aria-labelledby="revalidation-work-title")
  h3#revalidation-work-title Work records
  .grid
    Card(v-for="item in campaign.work" :key="item.work_id" flat)
      .repel
        div
          p.eyebrow {{ item.impact.node_kind }} · {{ item.impact.relation }}
          p
            strong {{ item.impact.locator }}
        Badge(:status="item.outcome ?? item.state")
      p
        code {{ item.work_id }}
      .cluster
        Badge(v-for="value in item.work.impact_classes" :key="value" :label="value")
      Facts(size="compact" :items="facts(item)")
      Notice(tone="warning" title="Scientific state")
        p
          strong {{ item.state === 'terminal' ? 'Review required · not automatically accepted' : 'Technical execution pending · review not yet required' }}
      Notice(v-if="item.failure" tone="danger" role="status") {{ item.failure.code }}: {{ item.failure.message }}
  button.button.button--secondary(v-if="campaign.projection.next_cursor" type="button" :disabled="busy" @click="emit('more')") Load next {{ campaign.projection.limit }} work records
</template>
