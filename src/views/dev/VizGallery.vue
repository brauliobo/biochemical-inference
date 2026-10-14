<script setup vapor>
import { ref } from 'vue'
import Notice from '../../ui/Notice.vue'
import Panel from '../../ui/Panel.vue'
import Heatmap from '../../viz/Heatmap.vue'
import LayeredGraph from '../../viz/LayeredGraph.vue'
import LineChartPlus from '../../viz/LineChartPlus.vue'
import Matrix from '../../viz/Matrix.vue'
import RangeBar from '../../viz/RangeBar.vue'
import ScenarioPicker from '../../viz/ScenarioPicker.vue'
import SliderField from '../../viz/SliderField.vue'
import Sparkline from '../../viz/Sparkline.vue'
import StackedBar from '../../viz/StackedBar.vue'
import Timeline from '../../viz/Timeline.vue'
import { changeHeatSample, gradeHeatSample, matrixSample, rangeSample, sharesSample, sparkSample, timelineSample } from '../../viz/samples/charts.js'
import { causalSample } from '../../viz/samples/causal.js'
import { timecourseSample } from '../../viz/samples/timecourse.js'

// /dev/viz: every chart primitive in src/viz with illustrative sample data. A
// development gallery, also scanned by the browser accessibility specs.
const time = timecourseSample()
const range = rangeSample()
const shares = sharesSample()
const matrix = matrixSample()
const grades = gradeHeatSample()
const change = changeHeatSample()
const timeline = timelineSample()
const spark = sparkSample()
const causal = causalSample()
const chosen = ref('')

const intake = ref(1200)
const dose = ref(5)
const scenario = ref('glycine')
const scenarios = [{ value: 'baseline', label: 'Baseline' }, { value: 'glycine', label: 'Glycine 5 g' }, { value: 'choline', label: 'Choline 1 g' }]
const picked = ref('Nothing selected yet.')
const note = (text) => { picked.value = text }
</script>

<template lang="pug">
.stack.stack--loose
  header.stack
    h1 Chart components
    p.lede Every chart primitive in the viz library, drawn with made-up sample data. Development gallery; see docs/VIZ_COMPONENTS.md.
    Notice(tone="warning" role="note" title="Illustrative sample data")
      p These numbers are invented to show how the components look. They are not measurements, predictions or advice.
  Panel(title="Line chart with uncertainty" title-id="viz-line")
    LineChartPlus(id="g-line" title="SAM:SAH ratio over 24 h (sample)" :x="time.x" :series="time.series" :events="time.events" :bands="time.bands" :ref-lines="time.refLines" unit="ratio" x-unit="h")
  Panel(title="Dose against limits" title-id="viz-range")
    RangeBar(id="g-range" title="Choline-like intake against two authorities (sample)" :rows="range.rows" :unit="range.unit" :min="range.min" :max="range.max" :step="50" v-model="intake")
  Panel(title="Stacked shares" title-id="viz-stack")
    StackedBar(id="g-stack" title="Where the methyl groups go (sample)" :bars="shares.bars" @select="note")
    StackedBar(id="g-stack-one" title="One scenario, with ranges (sample)" :bars="shares.bars.slice(0, 1)")
  Panel(title="Sparklines" title-id="viz-spark")
    ul.plain-list.stack.stack--tight
      li.cluster
        | SAM (sample)
        Sparkline(label="SAM (sample)" :values="spark.values" unit="uM" show-value)
      li.cluster
        | With a band (sample)
        Sparkline(label="With band (sample)" :values="spark.values" :lower="spark.lower" :upper="spark.upper" :look="2" show-value)
  Panel(title="Heatmaps" title-id="viz-heat")
    Heatmap(id="g-heat" title="Entries by kind and evidence grade (sample)" :rows="grades.rows" :cols="grades.cols" :values="grades.values" totals row-title="Kind" col-title="Grade" unit="entries" @select="(cell) => note(`${cell.row} / ${cell.col}: ${cell.value}`)")
    Heatmap(id="g-heat-div" title="Change under each scenario, percent (sample)" :rows="change.rows" :cols="change.cols" :values="change.values" mode="diverging" unit="%" row-title="Metabolite" col-title="Scenario")
  Panel(title="Relation matrix" title-id="viz-matrix")
    Matrix(id="g-matrix" title="Relations between kinds (sample)" :types="matrix.types" :counts="matrix.counts" @select="(cell) => note(`${cell.from} to ${cell.to}: ${cell.count}`)")
    p.muted(role="status") {{ picked }}
  Panel(title="Timeline" title-id="viz-timeline")
    Timeline(id="g-timeline" title="Articles by year and design (sample)" :items="timeline.items" :groups="timeline.groups")
  Panel(title="Layered causal graph" title-id="viz-graph")
    LayeredGraph(id="g-graph" title="From an intervention to an outcome (sample)" :nodes="causal.nodes" :edges="causal.edges" :tier-names="causal.tierNames" v-model:selected="chosen")
  Panel(title="Controls" title-id="viz-controls")
    .grid
      SliderField(id="g-dose" label="Glycine dose" unit="g" :min="0" :max="10" :step="0.5" v-model="dose" hint="Sample slider")
      ScenarioPicker(label="Scenario" :options="scenarios" v-model="scenario")
</template>
