<script setup vapor>
import { computed } from 'vue'
import Card from '../../ui/Card.vue'
import Facts from '../../ui/Facts.vue'
import Notice from '../../ui/Notice.vue'
import Toolbar from '../../ui/Toolbar.vue'

// Identity, technical completion and the actions of the selected campaign.
const props = defineProps({
  campaign: { type: Object, required: true },
  integrity: { type: Object, default: undefined },
  busy: { type: Boolean, required: true }
})
const emit = defineEmits(['refresh', 'reconcile', 'cancel', 'check', 'audit', 'report'])

const summary = computed(() => props.campaign.summary)
const terminal = computed(() => summary.value.succeeded + summary.value.failed + summary.value.resource_exhausted + summary.value.skipped)
const completion = computed(() => (summary.value.total ? Math.round(terminal.value / summary.value.total * 100) : 0))
const identity = computed(() => [
  { label: 'Local campaign', value: props.campaign.campaign_id, mono: true },
  { label: 'Producer campaign', value: props.campaign.producer.producer_campaign_id, mono: true },
  { label: 'Signed event head', value: `#${props.campaign.producer.event_head.sequence}`, code: props.campaign.producer.event_head.digest }
])
const headline = computed(() => [
  { label: 'Technical completion', value: `${terminal.value} / ${summary.value.total} terminal`, large: true },
  { label: 'Signed receipts', value: `${summary.value.submitted} / ${summary.value.total}`, large: true },
  { label: 'Scientific labels', value: `${props.campaign.review.labeled_outcomes} local · acceptance disabled`, large: true }
])
const counts = computed(() => [
  ['Queued', 'queued'], ['Running', 'running'], ['Succeeded', 'succeeded'], ['Failed', 'failed'], ['Resource exhausted', 'resource_exhausted'], ['Cancelled', 'skipped']
].map(([label, key]) => ({ label, value: summary.value[key], large: true })))
</script>

<template lang="pug">
.stack
  Facts(size="wide" data-testid="revalidation-campaign-summary" :items="identity")
  Card(flat aria-labelledby="revalidation-progress-title")
    h3#revalidation-progress-title Campaign progress
    Facts(size="wide" :items="headline")
    progress.progress(:value="completion" max="100" aria-label="Campaign technical completion") {{ completion }}%
    Facts(size="compact" :items="counts")
    Toolbar(label="Campaign actions")
      button.button.button--secondary(type="button" :disabled="busy" @click="emit('refresh')") Refresh progress
      button.button.button--secondary(type="button" :disabled="busy || campaign.state !== 'terminal' || summary.submitted === summary.total" @click="emit('reconcile')") Reconcile receipts
      button.button.button--danger(type="button" :disabled="busy || campaign.state === 'terminal'" @click="emit('cancel')") Cancel unfinished work
      button.button.button--secondary(type="button" :disabled="busy" @click="emit('check')") Verify full integrity
      button.button.button--secondary(type="button" :disabled="busy" @click="emit('audit')") Load signed audit
      button.button.button--secondary(type="button" :disabled="busy" @click="emit('report')") Load technical report
    Notice(v-if="campaign.last_error" tone="danger" role="status") Receipt reconciliation: {{ campaign.last_error }}
    Notice(v-if="integrity" tone="success" role="status") Integrity {{ integrity.status }} · {{ integrity.campaigns }} campaigns · {{ integrity.accepted_results }} accepted technical artifacts · producer {{ integrity.producer }}
</template>
