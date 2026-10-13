<script setup vapor>
import { ref } from 'vue'
import APAPBenchmarkWorkbench from '../../components/APAPBenchmarkWorkbench.vue'
import AtlasExplorer from '../../components/AtlasExplorer.vue'
import ChallengeWorkbench from '../../components/ChallengeWorkbench.vue'
import DataPlaneWorkbench from '../../components/DataPlaneWorkbench.vue'
import EvidencePanel from '../../components/EvidencePanel.vue'
import ExperimentWorkspace from '../../components/ExperimentWorkspace.vue'
import MeasuredCommonsWorkbench from '../../components/MeasuredCommonsWorkbench.vue'
import MeasuredSpatialLiverAtlas from '../../components/MeasuredSpatialLiverAtlas.vue'
import ParameterStudyWorkbench from '../../components/ParameterStudyWorkbench.vue'
import PhysiologyPluginWorkbench from '../../components/PhysiologyPluginWorkbench.vue'
import PortfolioWorkbench from '../../components/PortfolioWorkbench.vue'
import ReviewWorkbench from '../../components/ReviewWorkbench.vue'
import RevalidationCampaignWorkbench from '../../components/RevalidationCampaignWorkbench.vue'
import SpatialRegistrationWorkbench from '../../components/SpatialRegistrationWorkbench.vue'
import EntityDetails from '../../components/simulation/EntityDetails.vue'
import ExperimentForm from '../../components/simulation/ExperimentForm.vue'
import KnowledgeProvenance from '../../components/simulation/KnowledgeProvenance.vue'
import SimulationResults from '../../components/simulation/SimulationResults.vue'
import TopologyPanel from '../../components/simulation/TopologyPanel.vue'
import { useSimulation } from '../../composables/useSimulation.js'
import Panel from '../../ui/Panel.vue'

// Every workbench on one page, led by the simulation (sections 01 to 04 and 07).
const {
  taxonId, preset, activity, duration, release, model, network, provenance, provenanceState, provenanceError,
  result, baseline, comparison, selectedId, state, message, resultIsPrevious, errors, locked, evidenceQuery,
  initialize, requestProvenance, run, select, customActivity
} = useSimulation()
const apapRun = ref()
</script>

<template lang="pug">
.stack.stack--loose
  KnowledgeProvenance(:state="state" :message="message" :release="release" :model="model" :network="network" :provenance="provenance" :provenance-state="provenanceState" :provenance-error="provenanceError" @retry="initialize" @retry-provenance="requestProvenance()")

  ChallengeWorkbench
  MeasuredSpatialLiverAtlas
  SpatialRegistrationWorkbench
  RevalidationCampaignWorkbench

  template(v-if="release && model")
    .sidebar
      ExperimentForm(v-model:taxonId="taxonId" v-model:preset="preset" v-model:activity="activity" v-model:duration="duration" :model="model" :locked="locked" :state="state" :errors="errors" @run="run" @custom-activity="customActivity")
      TopologyPanel(:model="model" :network="network" :result="result" :selected-id="selectedId" @select="select")
    EntityDetails(v-if="network" :model="model" :network="network" :result="result" :selected-id="selectedId")
    AtlasExplorer(:taxon-id="taxonId")
    EvidencePanel(:suggested-query="evidenceQuery")
    PortfolioWorkbench
    ExperimentWorkspace
    ParameterStudyWorkbench
    APAPBenchmarkWorkbench(@completed="apapRun = $event")
    ReviewWorkbench(:apap-run="apapRun")
    PhysiologyPluginWorkbench
    DataPlaneWorkbench
    MeasuredCommonsWorkbench
    SimulationResults(:model="model" :result="result" :baseline="baseline" :comparison="comparison" :state="state" :message="message" :is-previous="resultIsPrevious" :selected-id="selectedId" @select="select")
    Panel(v-if="network" title="Assumptions and limitations" title-id="limitations-title" eyebrow="Scientific boundary")
      ul
        li(v-for="limitation in model.limitations" :key="limitation") {{ limitation }}
        li(v-for="limitation in network.limitations" :key="limitation.id") {{ limitation.statement }}

  p.muted(v-if="provenanceState === 'available'") Verified release metadata and build provenance are shown above. No output is medical advice.
  p.muted(v-else) Build provenance is unavailable; reproducibility is not established. No output is medical advice.
</template>
