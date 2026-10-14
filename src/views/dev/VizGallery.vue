<script setup vapor>
import { ref } from 'vue'
import Notice from '../../ui/Notice.vue'
import Panel from '../../ui/Panel.vue'
import LineChartPlus from '../../viz/LineChartPlus.vue'
import ScenarioPicker from '../../viz/ScenarioPicker.vue'
import SliderField from '../../viz/SliderField.vue'
import { timecourseSample } from '../../viz/samples/timecourse.js'

// /dev/viz: every chart primitive in src/viz with illustrative sample data. A
// development gallery, also scanned by the browser accessibility specs.
const time = timecourseSample()
const dose = ref(5)
const scenario = ref('glycine')
const scenarios = [{ value: 'baseline', label: 'Baseline' }, { value: 'glycine', label: 'Glycine 5 g' }, { value: 'choline', label: 'Choline 1 g' }]
</script>

<template lang="pug">
.stack.stack--loose
  header.stack
    h1 Chart components
    p.lede Every chart primitive in the viz library, drawn with made-up sample data. Development gallery; see docs/VIZ_COMPONENTS.md.
    Notice(tone="warning" role="note" title="Illustrative sample data") These numbers are invented to show how the components look. They are not measurements, predictions or advice.
  Panel(title="Line chart with uncertainty" title-id="viz-line")
    LineChartPlus(id="g-line" title="SAM:SAH ratio over 24 h (sample)" :x="time.x" :series="time.series" :events="time.events" :bands="time.bands" :ref-lines="time.refLines" unit="ratio" x-unit="h")
  Panel(title="Controls" title-id="viz-controls")
    .grid
      SliderField(id="g-dose" label="Glycine dose" unit="g" :min="0" :max="10" :step="0.5" v-model="dose" hint="Sample slider")
      ScenarioPicker(label="Scenario" :options="scenarios" v-model="scenario")
</template>
