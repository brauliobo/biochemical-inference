<script setup vapor>
import { computed, reactive, ref, watch } from 'vue'
import CausalMap from '../../components/dash-gut/CausalMap.vue'
import DashRelated from '../../components/dash-gut/DashRelated.vue'
import EvidenceChips from '../../components/dash-gut/EvidenceChips.vue'
import RunStatus from '../../components/dash-gut/RunStatus.vue'
import { HISTAMINE_DEFAULTS, HISTAMINE_PRESETS, METHYLATION_LINKS, SAH_LIMITS, SAM_LIMITS } from '../../components/dash-gut/histamine-presets.js'
import { dayEvents, daySeries, histamineTiles, shareBars, sweepView } from '../../components/dash-gut/histamine-view.js'
import { STATUS_WORD } from '../../components/dash-gut/gut-presets.js'
import { HISTAMINE_MAP } from '../../components/dash-gut/map-sets.js'
import DashboardShell from '../../components/dash/DashboardShell.vue'
import ProvenancePanel from '../../components/dash/ProvenancePanel.vue'
import ResultTiles from '../../components/dash/ResultTiles.vue'
import ScenarioPresets from '../../components/dash/ScenarioPresets.vue'
import { useModelRun } from '../../composables/useModelRun.js'
import { setPageTitle } from '../../router.js'
import Badge from '../../ui/Badge.vue'
import InputField from '../../ui/InputField.vue'
import Notice from '../../ui/Notice.vue'
import Panel from '../../ui/Panel.vue'
import LineChartPlus from '../../viz/LineChartPlus.vue'
import SliderField from '../../viz/SliderField.vue'
import StackedBar from '../../viz/StackedBar.vue'

// /dash/histamine-night: "Why 2-3 am waking? What does the SAM-dependent histamine route do?" The histamine turnover model
// (HNMT needs SAM, DAO does not), SAM and SAH from presets or from the methylation model, an optional weak diurnal rhythm,
// and the causal map to night waking, tachycardia and flushing with choline, betaine and P5P as levers.
setPageTitle('Histamine and night waking')
const controls = reactive({ ...HISTAMINE_DEFAULTS })
const snapshot = computed(() => ({ ...controls }))
const presets = [...HISTAMINE_PRESETS, ...METHYLATION_LINKS.map((link) => ({ id: link.id, label: link.label, evidence: link.evidence }))]
const preset = ref('reference')
const link = ref(null) // the methylation-model values behind a "Methylation model: ..." preset
const linking = ref(false)
const linkProblem = ref('')

const sameAs = (item) => Object.keys(HISTAMINE_DEFAULTS).every((key) => item.controls[key] === controls[key])
const linkHolds = computed(() => link.value && Math.abs(controls.samUM - link.value.samUM) < 0.5 && Math.abs(controls.sahUM - link.value.sahUM) < 0.5)
watch(snapshot, () => {
  const direct = HISTAMINE_PRESETS.find(sameAs)
  preset.value = direct ? direct.id : linkHolds.value ? link.value.id : ''
})
watch(preset, async (id) => {
  const direct = HISTAMINE_PRESETS.find((item) => item.id === id)
  if (direct) {
    if (!sameAs(direct)) Object.assign(controls, direct.controls)
    link.value = null
    return
  }
  const wanted = METHYLATION_LINKS.find((item) => item.id === id)
  if (!wanted || link.value?.id === id) return
  linking.value = true
  linkProblem.value = ''
  try {
    const { methylationSamSah } = await import('../../components/dash-gut/methylation-link.js')
    const found = methylationSamSah(wanted.scenario)
    Object.assign(controls, HISTAMINE_DEFAULTS, { samUM: Math.round(found.sam * 10) / 10, sahUM: Math.round(found.sah * 10) / 10, diurnal: controls.diurnal })
    link.value = { ...found, id, samUM: controls.samUM, sahUM: controls.sahUM }
  } catch (problem) {
    linkProblem.value = `The methylation model could not be read: ${problem.message}`
  } finally {
    linking.value = false
  }
})
const linkStatus = computed(() => (link.value ? STATUS_WORD[{ supported: 'measured-anchor', partly: 'model-prediction', hypothesis: 'hypothesis' }[link.value.status] ?? 'hypothesis'] : null))

const { result, running, error, warnings } = useModelRun(() => import('../../components/dash-gut/histamine-run.js').then((module) => module.createHistamineRunner()), snapshot, { debounceMs: 80 })
const tiles = computed(() => (result.value ? histamineTiles(result.value, controls) : []))
const day = computed(() => (result.value ? daySeries(result.value) : []))
const events = computed(() => dayEvents(controls))
const sweep = computed(() => (result.value ? sweepView(result.value, controls) : null))
const bars = computed(() => (result.value ? shareBars(result.value) : []))
const EVIDENCE = [
  { id: 'claim:hnmt-needs-sam' },
  { id: 'claim:histamine-peaks-2-4am' },
  { id: 'claim:histamine-h1-h2-tachycardia-flushing' },
  { id: 'claim:choline-fixed-night-waking-via-bhmt-hnmt' },
  { id: 'article:szefler-1991-nocturnal-histamine', label: 'Szefler 1991: plasma about 2x at 04:00 vs 16:00', note: 'weak', tone: 'warning' },
  { id: 'article:rehn-1987-histamine-circadian', label: 'Rehn 1987: 5 am peak, two daytime maxima', note: 'weak', tone: 'warning' },
  { id: 'article:schulze-1992-urinary-histamine-no-rhythm', label: 'Schulze 1992: urinary histamine shows no rhythm', note: 'against', tone: 'danger' }
]
const PARAMS = ['km_sam', 'ki_sah', 'km_his', 'vmax_hnmt_s', 'km_dao', 'vmax_dao', 'k_abs_g', 'k_other', 'rel_p_flat']
</script>

<template lang="pug">
DashboardShell(title="Histamine and night waking" question="Does low SAM slow histamine clearance enough to matter at 2-3 am? What would choline, betaine or B6 change?" status="model")
  template(#controls)
    ScenarioPresets(label="Start from a situation" :scenarios="presets" v-model="preset")
    .stack.stack--tight(v-if="link")
      p.cluster
        Badge(:label="linkStatus.word" :tone="linkStatus.tone")
        span {{ `${link.label}: SAM:SAH ${link.ratio0.toFixed(1)} to ${link.ratio.toFixed(1)}, so SAM ${(link.relSam * 100).toFixed(0)}% and SAH ${(link.relSah * 100).toFixed(0)}% of baseline.` }}
      p.muted {{ link.summary }}
    p.muted(v-if="linking" role="status") Reading SAM and SAH from the methylation model.
    p.muted(v-if="linkProblem" role="alert") {{ linkProblem }}
    .dg-controls
      SliderField(id="his-sam" label="SAM available to HNMT" unit="uM" :min="SAM_LIMITS.min" :max="SAM_LIMITS.max" :step="1" v-model="controls.samUM" hint="Reference 60 uM (rat-liver scale; human tissue not measured).")
      SliderField(id="his-sah" label="SAH (HNMT is inhibited by it)" unit="uM" :min="SAH_LIMITS.min" :max="SAH_LIMITS.max" :step="1" v-model="controls.sahUM" hint="Reference 12 uM.")
      SliderField(id="his-hnmt" label="HNMT enzyme activity" unit="x" :min="0" :max="2" :step="0.1" v-model="controls.hnmtX" hint="0.5 imitates a lower-activity variant.")
      SliderField(id="his-dao" label="Gut DAO activity" unit="x" :min="0" :max="2" :step="0.1" v-model="controls.daoX" hint="0 is a full block.")
      SliderField(id="his-release" label="Mast-cell histamine release" unit="x" :min="0.5" :max="5" :step="0.5" v-model="controls.releaseX" hint="1 is normal.")
      .stack.stack--tight
        InputField(id="his-diurnal" type="checkbox" label="Add the weak day-night rhythm" v-model="controls.diurnal")
        Badge(label="Weak evidence: one study" tone="warning")
  RunStatus(:running="running" :error="error" :warnings="warnings" what="the histamine model")
  p.muted(v-if="!result && !error" role="status") Running the histamine model for the first time.
  template(v-if="result")
    Panel(title="What the model says" title-id="his-tiles")
      ResultTiles(:tiles="tiles")
    Panel(title="Histamine over a day" title-id="his-day" lede="Relative to the reference state. The day-night rhythm is optional because the evidence for it is weak: one study found plasma about 2x higher at 04:00, another found no rhythm in urine.")
      LineChartPlus(v-if="controls.diurnal" id="his-day-chart" title="Histamine by clock hour, relative to the reference" :x="result.day.x" :series="day" :events="events" :ref-lines="[{ value: 1, label: 'Reference' }]" unit="x reference" x-unit="h" x-label="Clock hour" :y-min="0" :height="280")
      .stack.stack--tight(v-else)
        p.muted Without the rhythm the model has no time of day: every line is flat at the steady state shown in the tiles above.
        div
          button.button.button--secondary(type="button" @click="controls.diurnal = true") Show the weak day-night rhythm
    Panel(title="How SAM and the clearance routes matter" title-id="his-routes")
      .dg-pair
        LineChartPlus(id="his-sweep-chart" title="Steady-state histamine against SAM" :x="sweep.x" :series="sweep.series" :events="sweep.events" :ref-lines="[{ value: 1, label: 'Reference' }]" unit="x reference" x-unit="uM" x-label="SAM available to HNMT" :y-min="0" :height="280")
        StackedBar(id="his-share-chart" title="Who clears histamine" :bars="bars" unit="uM/h")
      EvidenceChips(label="Assumptions behind the split" :items="[{ id: 'compound:histamine', label: 'HNMT share of clearance: assumed 60% (brain 80%)', note: 'assumed', tone: 'warning', plain: true }, { id: 'enzyme:dao', label: 'DAO capacity and gut absorption: assumed', note: 'assumed', tone: 'warning', plain: true }]")
    Panel(title="What the evidence says" title-id="his-evidence" lede="Verdicts and grades from the knowledge base. The day-night rhythm is the weakest link.")
      EvidenceChips(label="Evidence on histamine and night waking" :items="EVIDENCE")
    Panel(title="From histamine to waking, racing heart and flushing" title-id="his-causal" lede="Dashed links are hypotheses. Choline, betaine, P5P, niacin and glycine are shown as signed levers.")
      CausalMap(id="his-causal-map" title="Causal map: methyl donors, SAM, HNMT and histamine to night waking" :include="HISTAMINE_MAP.include" :labels="HISTAMINE_MAP.labels")
    ProvenancePanel(model="histamine" :ids="PARAMS")
  template(#related)
    DashRelated(current="histamine-night")
  template(#notes)
    p In this model HNMT methylates histamine inside cells using SAM; DAO works outside cells without SAM. Lowering SAM or raising SAH therefore slows the HNMT route, and the brain, which has no usable DAO, is affected more than the blood.
    p The link from glycine or niacin to SAM to histamine has no human data. The presets taken from the methylation model use its steady states for chronic doses and scale SAM and SAH to the histamine model by ratio.
    p Plasma DAO activity is below detection in healthy people; the split between HNMT and other routes is an assumption. Pools are lumped concentration-equivalents with an assumed 20:1 volume ratio.
    p This is educational material, not medical advice.
</template>
