<script setup vapor>
import { computed } from 'vue'
import { encodeArtifactPath, encodeReportPath } from './paths.js'
import Facts from '../../ui/Facts.vue'
import Notice from '../../ui/Notice.vue'
import Panel from '../../ui/Panel.vue'
import { plural } from '../../ui/format.js'

// One attempt: its two identities, events, artifacts, and the actions that fit
// its state. A restart reruns the exact specification; it never continues state.
const props = defineProps({
  attempt: { type: Object, required: true },
  events: { type: Array, required: true },
  artifacts: { type: Array, required: true },
  comparison: { type: Object, default: undefined },
  report: { type: Object, default: undefined },
  canCompare: { type: Boolean, required: true }
})
const emit = defineEmits(['cancel', 'restart', 'report', 'compare'])

const REPORT_FORMATS = ['html', 'json', 'csv', 'svg']
const word = computed(() => props.attempt.attempt.outcome ?? props.attempt.attempt.state)
const identities = computed(() => [
  { label: 'Attempt identity', code: props.attempt.attempt.attemptId },
  { label: 'Scientific identity', code: props.attempt.attempt.runId }
])
</script>

<template lang="pug">
Panel(title="Attempt inspector" title-id="attempt-title" :level="3" :status="word")
  Facts(:items="identities")
  Notice(v-if="attempt.attempt.kind === 'restart'" tone="warning" role="note") Restarted from the exact specification. This is not stateful continuation.
  .cluster
    button.button.button--secondary(v-if="attempt.attempt.state !== 'terminal'" type="button" @click="emit('cancel')") Cancel attempt
    button.button.button--secondary(v-else type="button" @click="emit('restart')") Restart from specification
    button.button.button--secondary(v-if="attempt.attempt.resultArtifactId" type="button" @click="emit('report')") Generate offline report
    button.button.button--secondary(v-if="canCompare" type="button" @click="emit('compare')") Compare latest successful attempts
  .grid
    .stack.stack--tight
      h4 Events
      ol.plain-list.stack.stack--tight
        li(v-for="event in events" :key="event.eventId")
          strong {{ event.sequence }} · {{ event.type }}
          |
          time(:datetime="event.at") {{ event.at }}
    .stack.stack--tight
      h4 Artifacts
      ul.plain-list.stack.stack--tight
        li(v-for="artifact in artifacts" :key="artifact.artifactId")
          a(:href="encodeArtifactPath(artifact.artifactId)") {{ artifact.name }}
          |
          span {{ artifact.bytes }} bytes · {{ artifact.digest }}
      p(v-if="artifacts.length === 0") No artifact has been atomically published.
  Notice(v-if="comparison" role="status" :title="`Comparison ${comparison.status}`")
    p {{ comparison.specificationChanged ? 'Specifications changed.' : 'Specifications are identical.' }} {{ plural(comparison.differences.length, 'numeric difference') }} recorded.
  .cluster(v-if="report")
    strong Static offline report
    a(v-for="format in REPORT_FORMATS" :key="format" :href="encodeReportPath(report.reportId, format)" target="_blank" rel="noreferrer") {{ format.toUpperCase() }}
</template>
