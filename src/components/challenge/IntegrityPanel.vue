<script setup vapor>
import { computed } from 'vue'
import EmptyState from '../../ui/EmptyState.vue'
import Facts from '../../ui/Facts.vue'
import Panel from '../../ui/Panel.vue'

// Local evidence controls: re-hash the immutable closure, replay a report
// offline, and open earlier runs.
const props = defineProps({
  integrity: { type: Object, default: undefined },
  replay: { type: Object, default: undefined },
  runs: { type: Array, required: true },
  report: { type: Object, default: undefined },
  state: { type: String, required: true },
  busy: { type: Boolean, required: true }
})
const emit = defineEmits(['check', 'replay', 'open'])

const integrityFacts = computed(() => [
  { label: 'Integrity', value: props.integrity.status },
  { label: 'Artifacts', value: String(props.integrity.artifacts ?? 'unavailable') },
  { label: 'Disclosure epochs', value: String(props.integrity.disclosureEpochs ?? 0) },
  { label: 'Commitments / reports', value: `${props.integrity.commitments ?? 0} / ${props.integrity.reports ?? 0}` }
])
const replayFacts = computed(() => [
  { label: 'Verification', value: props.replay.verification },
  { label: 'Network access', value: props.replay.network_access ? 'enabled' : 'disabled' }
])
const runTitle = (run) => (run.result_digest ? 'Scored report' : run.disclosure_digest ? 'Disclosed' : 'Committed only')
</script>

<template lang="pug">
Panel(title="Integrity and offline replay" title-id="challenge-local-title" eyebrow="Local evidence controls" :level="3")
  p Integrity rehashes the local immutable closure. Replay recomputes disclosure binding and independent scoring from stored artifacts without network access.
  .cluster
    button.button.button--secondary(type="button" :disabled="busy" data-testid="challenge-integrity" @click="emit('check')") {{ state === 'checking' ? 'Checking…' : 'Verify local integrity' }}
    button.button.button--secondary(type="button" :disabled="busy || !report" data-testid="challenge-replay" @click="emit('replay')") {{ state === 'replaying' ? 'Replaying…' : 'Replay result offline' }}
  Facts(v-if="integrity" rows data-testid="challenge-integrity-result" :items="integrityFacts")
  Facts(v-if="replay" rows data-testid="challenge-replay-result" :items="replayFacts")

  h4 Recent immutable runs
  EmptyState(v-if="runs.length === 0") No local commitments yet.
  ul.plain-list.stack.stack--tight(v-else)
    li.repel(v-for="run in runs" :key="run.commitment_digest")
      .stack.stack--tight
        strong {{ runTitle(run) }}
        code {{ run.commitment_digest }}
      button.button.button--secondary(v-if="run.result_digest" type="button" :disabled="busy" @click="emit('open', run.result_digest)") Open bounded report
</template>
