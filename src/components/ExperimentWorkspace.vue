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
  state, message, draft, filters, models, model, targets, isRegistry, experiments, profiles, detail, readOnly, history, modelIds,
  selectedAttempt, events, artifacts, comparison, report, exportHref, exportName, successful,
  chooseModel, selectExperiment, saveRevision, queueRun, cloneExperiment, exportExperiment, importExperiment,
  refreshHistory, inspectAttempt, previousHistoryPage, nextHistoryPage, cancelAttempt, restartAttempt, generateReport, compareLatest
} = useExperimentWorkspace()
</script>

<template lang="pug">
Panel(title="Durable local research runs" title-id="experiment-workspace-title" eyebrow="Controlled experiment workspace" :status="state" :tone="statusTone(state)")
  p.lede Immutable specifications, distinct scientific and attempt identities, bounded child workers, exact specification restarts, content-addressed artifacts, and offline portable bundles.
  ErrorNotice(v-if="state === 'failed'" :message="message")
  LiveMessage(visible :text="state !== 'failed' ? message : ''")

  .grid(v-if="models.length")
    ExperimentForm(:draft="draft" :models="models" :engine="model?.engine.type" :is-registry="isRegistry" :targets="targets" :experiments="experiments" :profiles="profiles" :selected-id="detail?.experiment.experimentId ?? ''" :read-only="readOnly" :saving="state === 'saving'" :revising="Boolean(detail)" @submit="saveRevision" @select="selectExperiment" @model="chooseModel")
    RevisionLedger(:detail="detail" :read-only="readOnly" :export-href="exportHref" :export-name="exportName" @queue="queueRun" @clone="cloneExperiment" @export="exportExperiment" @import="importExperiment")

  AttemptHistory(:history="history" :filters="filters" :model-ids="modelIds" @refresh="refreshHistory" @inspect="inspectAttempt" @previous="previousHistoryPage" @next="nextHistoryPage")
  AttemptInspector(v-if="selectedAttempt" :attempt="selectedAttempt" :events="events" :artifacts="artifacts" :comparison="comparison" :report="report" :can-compare="successful.length >= 2" @cancel="cancelAttempt" @restart="restartAttempt" @report="generateReport" @compare="compareLatest")
</template>
