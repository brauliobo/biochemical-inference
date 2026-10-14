<script setup vapor>
import { computed, ref, watch } from 'vue'
import { curvePoints, saturation } from '../../kb/params.js'
import { formatNumber } from '../../viz/scale.js'
import LineChartPlus from '../../viz/LineChartPlus.vue'
import SliderField from '../../viz/SliderField.vue'
import Disclosure from '../../ui/Disclosure.vue'
import Notice from '../../ui/Notice.vue'
import Panel from '../../ui/Panel.vue'
import SelectField from '../../ui/SelectField.vue'
import QuantChips from './QuantChips.vue'

// A Michaelis-Menten curve for one substrate of an enzyme: percent of Vmax against the substrate concentration,
// with the literature range of Km as a ribbon, the cited Km as a dashed line, and two sliders (Km and substrate
// concentration). Every constant opens to its provenance. The other substrates are held non-limiting, which is
// what a single Km means. Educational and illustrative; the curves are reconstructed from published constants.
//
//   MichaelisMentenExplorer(:curves="curves" title="GNMT")
const props = defineProps({
  curves: { type: Array, required: true },
  name: { type: String, default: 'this enzyme' }
})

const key = ref(props.curves[0]?.key ?? '')
const curve = computed(() => props.curves.find((item) => item.key === key.value) ?? props.curves[0])
const kmPos = ref(50)
const km = computed(() => (kmPos.value === posFromKm(curve.value.km) ? curve.value.km : kmFromPos(kmPos.value)))
const substrate = ref(curve.value?.km ?? 1)
const kmText = (pos) => formatNumber(kmFromPos(pos))

const round = (value) => Number(Number(value).toPrecision(3))
const kmMin = computed(() => round(Math.min(curve.value.kmLow, curve.value.km) / (curve.value.kmLow === curve.value.km ? 4 : 2)))
const kmMax = computed(() => round(Math.max(curve.value.kmHigh, curve.value.km) * (curve.value.kmHigh === curve.value.km ? 4 : 2)))
const xMax = computed(() => round(curve.value.km * 6))
const kmFromPos = (pos) => round(Math.exp(Math.log(kmMin.value) + ((Math.log(kmMax.value) - Math.log(kmMin.value)) * pos) / 100))
const posFromKm = (value) => Math.round((100 * (Math.log(value) - Math.log(kmMin.value))) / (Math.log(kmMax.value) - Math.log(kmMin.value)))
const hasRange = computed(() => curve.value.kmHigh > curve.value.kmLow)

watch(() => props.curves, () => { key.value = props.curves[0]?.key ?? '' })
function reset() {
  kmPos.value = posFromKm(curve.value.km)
  substrate.value = round(curve.value.km)
}
watch(() => curve.value?.key, reset)
reset()

const x = computed(() => curvePoints(km.value, xMax.value).x)
const series = computed(() => {
  const mine = curvePoints(km.value, xMax.value).y
  const entry = { id: 'rate', label: `Km ${formatNumber(km.value)} µM`, values: mine, look: 0 }
  if (hasRange.value) {
    entry.lower = curvePoints(curve.value.kmHigh, xMax.value).y
    entry.upper = curvePoints(curve.value.kmLow, xMax.value).y
    entry.lowerLabel = `Km ${formatNumber(curve.value.kmHigh)} µM`
    entry.upperLabel = `Km ${formatNumber(curve.value.kmLow)} µM`
  }
  const list = [entry]
  if (Math.abs(km.value - curve.value.km) > 1e-9) list.push({ id: 'cited', label: `Cited Km ${formatNumber(curve.value.km)} µM`, values: curvePoints(curve.value.km, xMax.value).y, baseline: true })
  return list
})
const events = computed(() => [{ x: Math.min(substrate.value, xMax.value), label: 'Substrate' }])
const fraction = computed(() => saturation(substrate.value, km.value))
const sentence = computed(() => {
  const percent = formatNumber(fraction.value * 100, 3)
  const absolute = curve.value.vmax ? ` With the cited Vmax of ${formatNumber(curve.value.vmax)} µM/h that is about ${formatNumber(curve.value.vmax * fraction.value, 3)} µM/h.` : ''
  return `At ${formatNumber(substrate.value)} µM ${curve.value.substrate} the enzyme runs at ${percent} % of Vmax.${absolute}`
})
const options = computed(() => props.curves.map((item) => ({ value: item.key, label: `${item.substrate} (Km ${formatNumber(item.km)} µM, ${item.dataset === 'b1' ? 'methionine and folate set' : 'choline, glycine and gastric set'})` })))

function paramChip(param, label) {
  const range = param.low !== param.high ? `${formatNumber(param.low)} to ${formatNumber(param.high)} ${param.unit}` : 'a single value'
  return {
    id: `${param.id}`,
    label,
    text: `${formatNumber(param.value)} ${param.unit}`,
    rows: [
      { term: 'Range in the literature', value: range },
      ...(param.tissue ? [{ term: 'Tissue', value: param.tissue }] : []),
      ...(param.species ? [{ term: 'Species', value: param.species }] : []),
      ...(param.confidence ? [{ term: 'Confidence', value: param.confidence }] : []),
      ...(param.locator ? [{ term: 'Where in the source', value: param.locator }] : [])
    ],
    note: param.note,
    refs: [param.source, ...param.extraSources].filter((ref) => ref && ref.startsWith('article:'))
  }
}
const chips = computed(() => [paramChip(curve.value.kmParam, `Km (${curve.value.substrate})`), ...(curve.value.vmaxParam ? [paramChip(curve.value.vmaxParam, 'Vmax')] : [])])
</script>

<template lang="pug">
Panel.mm-explorer(v-if="curve" title="Rate against substrate" :lede="`How fast ${name} runs as its substrate rises, from published Km values. Move the sliders to see the saturation curve change.`" data-visual="mm-curve" data-testid="mm-explorer")
  Notice(role="note" title="Illustrative model")
    p A saturation curve drawn from literature constants, with every other substrate held non-limiting. It shows the shape of the kinetics, not a measurement of anyone's physiology, and it is not medical advice.
  SelectField(v-if="curves.length > 1" id="mm-curve" label="Substrate and parameter set" :options="options" v-model="key")
  .grid
    SliderField(id="mm-substrate" :label="`Substrate (${curve.substrate})`" unit="µM" :min="0" :max="xMax" :step="round(xMax / 100)" v-model="substrate")
    SliderField(id="mm-km" label="Km (log scale)" unit="µM" :min="0" :max="100" :step="1" v-model="kmPos" :format="kmText" :hint="hasRange ? `Literature range ${formatNumber(curve.kmLow)} to ${formatNumber(curve.kmHigh)} µM` : 'A single reported value'")
  p(role="status" aria-live="polite") {{ sentence }}
  LineChartPlus(:title="`${name}: ${curve.substrate}, percent of Vmax`" :x="x" :series="series" :events="events" :ref-lines="[{ value: 50, label: 'Half of Vmax' }]" unit="% of Vmax" x-unit="µM" x-label="Substrate concentration" y-label="Percent of Vmax" :y-min="0" :y-max="100" :height="260" :allow-log="false")
  QuantChips(:chips="chips" label="Constants behind the curve")
  Disclosure(summary="Rate law and caveats" v-if="curve.rateExpression || curve.caveats.length")
    .stack.stack--tight
      p(v-if="curve.rateExpression") #[code {{ curve.rateExpression }}]
      p.muted(v-if="curve.law") {{ curve.law }}
      ul(v-if="curve.caveats.length")
        li(v-for="caveat in curve.caveats" :key="caveat") {{ caveat }}
</template>
