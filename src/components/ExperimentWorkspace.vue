<script setup vapor>
import { useExperimentWorkspace } from '../composables/useExperimentWorkspace.js'
import ErrorNotice from '../ui/ErrorNotice.vue'
import LiveMessage from '../ui/LiveMessage.vue'
import Panel from '../ui/Panel.vue'
import { statusTone } from '../ui/tone.js'
import AttemptHistory from './experiments/AttemptHistory.vue'
import AttemptInspector from './experiments/AttemptInspector.vue'
import ExperimentForm from './experiments/ExperimentForm.vue'
import RevisionLedger from './experiments/RevisionLedger.vue'

const {
  state, message, draft, models, model, targets, isRegistry, experiments, profiles, detail, readOnly, modelIds,
  exportHref, exportName, chooseModel, selectExperiment, saveRevision, cloneExperiment, exportExperiment, importExperiment,
  attempts
} = useExperimentWorkspace()
const { history, filters, selected, events, artifacts, comparison, report, successful } = attempts
</script>

<template lang="pug">
Panel(title="Durable local research runs" title-id="experiment-workspace-title" eyebrow="Controlled experiment workspace" :status="state" :tone="statusTone(state)")
  p.lede Immutable specifications, distinct scientific and attempt identities, bounded child workers, exact specification restarts, content-addressed artifacts, and offline portable bundles.
  ErrorNotice(v-if="state === 'failed'" :message="message")
  LiveMessage(visible :text="state !== 'failed' ? message : ''")

  .grid(v-if="models.length")
    ExperimentForm(:draft="draft" :models="models" :engine="model?.engine.type" :is-registry="isRegistry" :targets="targets" :experiments="experiments" :profiles="profiles" :selected-id="detail?.experiment.experimentId ?? ''" :read-only="readOnly" :saving="state === 'saving'" :revising="Boolean(detail)" @submit="saveRevision" @select="selectExperiment" @model="chooseModel")
    RevisionLedger(:detail="detail" :read-only="readOnly" :export-href="exportHref" :export-name="exportName" @queue="attempts.queue" @clone="cloneExperiment" @export="exportExperiment" @import="importExperiment")

  AttemptHistory(:history="history" :filters="filters" :model-ids="modelIds" @refresh="attempts.refresh" @inspect="attempts.inspect" @previous="attempts.previousPage" @next="attempts.nextPage")
  AttemptInspector(v-if="selected" :attempt="selected" :events="events" :artifacts="artifacts" :comparison="comparison" :report="report" :can-compare="successful.length >= 2" @cancel="attempts.cancel" @restart="attempts.restart" @report="attempts.generateReport" @compare="attempts.compareLatest")
</template>
