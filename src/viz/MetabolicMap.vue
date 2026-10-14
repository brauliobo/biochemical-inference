<script setup vapor>
import { computed, ref } from 'vue'
import ChartFrame from '../ui/ChartFrame.vue'
import { uniqueId } from '../ui/uid.js'
import { buildMap, connectedTo, describeMap, reactionEquations } from './metabolic-model.js'
import { nearestInDirection } from './nav.js'
import { clamp, formatNumber } from './scale.js'
import { useChartWidth } from './useChartWidth.js'

// A renderer for hand-laid metabolic networks (the layout is data: x, y per node).
// Compounds are rounded boxes, reactions small squares with arrowheads on the
// product side (both sides when reversible; the flow reverses with negative flux),
// enzymes labels tethered to their reaction by a dotted line, pools dashed boxes.
// Currency molecules (ATP, water, NADPH, ...) are hidden until the toggle is on.
// Values: `flux` ({ reactionId: n }) sets edge width and colour, `concentration`
// ({ compoundId: n }) sets node fill and a little size; a key explains both.
//
//   MetabolicMap(title="Methionine and folate cycles" :map="layout" :flux="{ 'r-mat': 6.2 }" :concentration="{ met: 30 }"
//     conc-unit="uM" flux-unit="umol/h" v-model:selected="chosen" @select="open")
//
// Pointer: click a node to select it (connected reactions stay bright, the rest dim),
// drag to pan, buttons or Ctrl/Meta+wheel zoom (plain wheel zooms once the map has focus).
// Keyboard (one tab stop): arrow keys move between nodes by position, Shift+arrows pan,
// + and - zoom, 0 resets, Enter selects, Escape clears. The text alternative lists every
// reaction as an equation. The optional flow animation is off under reduced motion.
const selected = defineModel('selected', { type: String, default: '' })
const props = defineProps({
  id: { type: String, default: () => uniqueId('map') },
  title: { type: String, required: true },
  map: { type: Object, required: true },
  flux: { type: Object, default: () => ({}) },
  concentration: { type: Object, default: () => ({}) },
  concUnit: { type: String, default: '' },
  fluxUnit: { type: String, default: '' },
  showValues: { type: Boolean, default: false },
  animate: { type: Boolean, default: false },
  summary: { type: String, default: '' },
  tableLabel: { type: String, default: 'Show reactions as equations' }
})
const emit = defineEmits(['select'])

const reduced = typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
const { el, width } = useChartWidth(900)
const currency = ref(false)
const values = ref(props.showValues)
const flow = ref(props.animate && !reduced)
const view = ref({ k: 1, tx: 0, ty: 0 })
const active = ref('')
const hovered = ref('')
const focused = ref(false)
const surface = ref()
let drag = null
let dragged = false

const built = computed(() => buildMap({ map: props.map, showCurrency: currency.value, flux: props.flux, concentration: props.concentration, showValues: values.value, concUnit: props.concUnit, fluxUnit: props.fluxUnit }))
const vb = computed(() => built.value.viewBox)
const equations = computed(() => reactionEquations({ map: props.map, flux: props.flux, fluxUnit: props.fluxUnit }))
const hasEncodings = computed(() => Boolean(built.value.concentration || built.value.fluxLegend))
const highlight = computed(() => hovered.value || selected.value)
const connected = computed(() => (highlight.value ? connectedTo(props.map, highlight.value) : null))
const ids = computed(() => new Map(built.value.nodes.map((node, index) => [node.id, `${props.id}-n-${index}`])))
const hasEnzyme = computed(() => new Set(built.value.edges.filter((edge) => edge.kind === 'catalysis').flatMap((edge) => [edge.from, edge.to])))
const world = computed(() => `translate(${view.value.tx} ${view.value.ty}) scale(${view.value.k})`)
const zoomText = computed(() => `${Math.round(view.value.k * 100)}%`)
const summaryText = computed(() => props.summary || describeMap({ map: props.map, equations: equations.value, built: built.value, selected: props.map.nodes.find((node) => node.id === selected.value)?.label }))
const drawNodes = computed(() => built.value.nodes.map((node) => {
  const lit = !connected.value || connected.value.nodes.has(node.id)
  const kindLabel = { compound: 'compound', enzyme: 'enzyme', reaction: 'reaction', pool: 'pool' }[node.kind]
  return {
    ...node,
    domId: ids.value.get(node.id),
    dim: !lit,
    labelText: node.kind === 'reaction' ? (hasEnzyme.value.has(node.id) ? '' : node.label) : node.label,
    aria: `${node.label}, ${kindLabel}${node.valueText ? `, ${node.valueText}` : ''}${node.kind === 'reaction' && built.value.reactionValues.get(node.id) ? `, rate ${built.value.reactionValues.get(node.id)}` : ''}`
  }
}))
const drawEdges = computed(() => built.value.edges.map((edge) => ({ ...edge, dim: connected.value ? !connected.value.edges.has(edge.index) : false })))
const info = computed(() => {
  const id = highlight.value
  const node = built.value.nodes.find((entry) => entry.id === id)
  if (!node) return null
  const around = connectedTo(props.map, id)
  const rows = equations.value.filter((row) => around.nodes.has(row.id) && (node.kind === 'reaction' ? row.id === id : true))
  return { node, rows, text: `${node.label} (${node.kind}${node.valueText ? `, ${node.valueText}` : ''})` }
})

function box() {
  const rect = surface.value?.getBoundingClientRect?.()
  return rect && rect.width ? rect : null
}
function toWorld(clientX, clientY) {
  const rect = box()
  const [x, y, w, h] = vb.value
  if (!rect) return { x: x + w / 2, y: y + h / 2 }
  const px = x + ((clientX - rect.left) / rect.width) * w
  const py = y + ((clientY - rect.top) / rect.height) * h
  return { x: px, y: py }
}
function zoomAt(factor, point) {
  const { k, tx, ty } = view.value
  const next = clamp(k * factor, 0.5, 8)
  const [x, y, w, h] = vb.value
  const at = point ?? { x: x + w / 2, y: y + h / 2 }
  view.value = { k: next, tx: at.x - (at.x - tx) * (next / k), ty: at.y - (at.y - ty) * (next / k) }
}
const resetView = () => { view.value = { k: 1, tx: 0, ty: 0 } }
function pan(dx, dy) {
  view.value = { ...view.value, tx: view.value.tx + dx, ty: view.value.ty + dy }
}

function choose(id) {
  const node = props.map.nodes.find((entry) => entry.id === id)
  if (!node) return
  active.value = id
  selected.value = id
  emit('select', { id: node.id, kind: node.kind, label: node.label })
}
function onNodeClick(id) {
  if (dragged) return
  choose(id)
}
function onPointerDown(event) {
  if (event.button !== 0) return
  dragged = false
  drag = { x: event.clientX, y: event.clientY, tx: view.value.tx, ty: view.value.ty, id: event.pointerId }
}
function onPointerMove(event) {
  if (!drag) return
  const rect = box()
  if (!rect) return
  const dx = event.clientX - drag.x
  const dy = event.clientY - drag.y
  if (!dragged && Math.hypot(dx, dy) < 4) return
  if (!dragged) event.currentTarget.setPointerCapture?.(drag.id)
  dragged = true
  const [, , w, h] = vb.value
  view.value = { ...view.value, tx: drag.tx + (dx / rect.width) * w, ty: drag.ty + (dy / rect.height) * h }
}
function onPointerUp() {
  drag = null
}
function onWheel(event) {
  if (!focused.value && !event.ctrlKey && !event.metaKey) return
  event.preventDefault()
  zoomAt(event.deltaY < 0 ? 1.15 : 1 / 1.15, toWorld(event.clientX, event.clientY))
}
function onFocus() {
  focused.value = true
  if (!ids.value.has(active.value)) active.value = ids.value.has(selected.value) ? selected.value : (built.value.nodes[0]?.id ?? '')
}
function onBlur() {
  focused.value = false
}
function onKey(event) {
  const key = event.key
  if (key === '+' || key === '=') { event.preventDefault(); zoomAt(1.25); return }
  if (key === '-' || key === '_') { event.preventDefault(); zoomAt(0.8); return }
  if (key === '0') { event.preventDefault(); resetView(); return }
  if (key === 'Enter' || key === ' ') {
    if (ids.value.has(active.value)) { event.preventDefault(); choose(active.value) }
    return
  }
  if (key === 'Escape') { selected.value = ''; return }
  if (event.shiftKey && key.startsWith('Arrow')) {
    event.preventDefault()
    const step = 40
    pan(key === 'ArrowLeft' ? step : key === 'ArrowRight' ? -step : 0, key === 'ArrowUp' ? step : key === 'ArrowDown' ? -step : 0)
    return
  }
  const next = nearestInDirection(built.value.nodes, ids.value.has(active.value) ? active.value : built.value.nodes[0]?.id, key)
  if (next === null) return
  event.preventDefault()
  active.value = next
}
</script>

<template lang="pug">
ChartFrame(:id="id" :title="title" :summary="summaryText" :table-label="tableLabel")
  .viz-box(ref="el")
    .cluster.cluster--tight
      button.button.button--secondary(type="button" @click="zoomAt(1.25)") Zoom in
      button.button.button--secondary(type="button" @click="zoomAt(0.8)") Zoom out
      button.button.button--secondary(type="button" @click="resetView") {{ `Reset view (${zoomText})` }}
      button.button.button--secondary(type="button" :aria-pressed="currency" @click="currency = !currency") Currency molecules
      button.button.button--secondary(v-if="hasEncodings" type="button" :aria-pressed="values" @click="values = !values") Show values
      button.button.button--secondary(v-if="!reduced && Object.keys(flux).length" type="button" :aria-pressed="flow" @click="flow = !flow") Animate flow
    .viz-map(role="group" tabindex="0" :aria-label="`${title}: metabolic map with ${drawNodes.length} nodes. Arrow keys move between nodes, Shift with arrows pans, plus and minus zoom, zero resets, Enter selects.`" :aria-activedescendant="focused && ids.has(active) ? ids.get(active) : undefined" @focus="onFocus" @blur="onBlur" @keydown="onKey" @wheel="onWheel")
      svg.viz-msvg(ref="surface" :class="{ 'viz-map--flow': flow }" :viewBox="vb.join(' ')" @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp")
        g(:transform="world")
          g(v-for="group in built.groups" :key="group.id")
            rect.viz-mgroup(:x="group.x" :y="group.y" :width="group.w" :height="group.h" rx="10")
            text.viz-label(:x="group.x + 10" :y="group.y + 15") {{ group.id }}
          g(v-for="edge in drawEdges" :key="edge.index" :class="[edge.fluxClass, { 'is-dim': edge.dim }]")
            path.viz-medge(:class="[`viz-medge--${edge.kind}`, { 'viz-medge--moving': edge.moving }]" :d="edge.d" :stroke-width="edge.width")
            path.viz-mhead(v-if="edge.head" :d="edge.head")
            path.viz-mhead(v-if="edge.tail" :d="edge.tail")
            text.viz-label.viz-stoich(v-if="edge.stoich" :x="edge.stoich.x" :y="edge.stoich.y + 4" text-anchor="middle") {{ edge.stoich.text }}
          g.viz-mnode(v-for="node in drawNodes" :key="node.id" :id="node.domId" role="button" :aria-label="node.aria" :aria-pressed="selected === node.id" :class="[`viz-mnode--${node.kind}`, node.bin ? `viz-bin-${node.bin}` : '', { 'is-dim': node.dim, 'is-selected': selected === node.id, 'is-active': focused && active === node.id }]" :transform="`translate(${node.x} ${node.y})`" @pointerenter="hovered = node.id" @pointerleave="hovered = ''" @click="onNodeClick(node.id)")
            title {{ node.aria }}
            rect.viz-mnode__ring(v-if="focused && active === node.id" :x="-node.w / 2 - 5" :y="-node.h / 2 - 5" :width="node.w + 10" :height="node.h + 10" rx="8")
            rect.viz-mnode__shape(v-if="node.kind !== 'enzyme'" :x="-node.w / 2" :y="-node.h / 2" :width="node.w" :height="node.h" :rx="node.kind === 'compound' ? 9 : node.kind === 'pool' ? 16 : 1")
            text.viz-mnode__text(v-if="node.kind === 'compound' || node.kind === 'pool'" y="4" text-anchor="middle") {{ node.label }}
            text.viz-mnode__enzyme(v-if="node.kind === 'enzyme'" y="4" text-anchor="middle") {{ node.label }}
            text.viz-label(v-if="node.kind === 'reaction' && node.labelText" x="10" y="-6") {{ node.labelText }}
            text.viz-label.viz-value(v-if="node.showValue" :y="node.h / 2 + 12" text-anchor="middle") {{ node.valueText }}
            text.viz-label.viz-value(v-if="node.kind === 'reaction' && built.reactionValues.get(node.id)" x="10" y="14") {{ built.reactionValues.get(node.id) }}
    .viz-readout(aria-live="polite" aria-atomic="true")
      template(v-if="info")
        strong {{ info.node.label }}
        span {{ ` (${info.node.kind}${info.node.valueText ? `, ${info.node.valueText}` : ''})` }}
        ul.viz-readout__list(v-if="info.rows.length")
          li(v-for="row in info.rows" :key="row.id") {{ `${row.equation}${row.enzymes.length ? ` (${row.enzymes.join(', ')})` : ''}` }}
      span.muted(v-else) {{ width < 520 ? 'The labels are small on a narrow screen: use Zoom in, then drag the map to pan. Tap a node to light up its reactions.' : 'Click or focus a node to light up its reactions. Drag to pan; zoom with the buttons.' }}
  template(#legend)
    span.viz-key
      svg.viz-swatch(viewBox="0 0 28 14" aria-hidden="true" focusable="false")
        rect.viz-mnode__shape.viz-mkey(x="3" y="2" width="22" height="10" rx="5")
      | Compound
    span.viz-key
      svg.viz-swatch(viewBox="0 0 28 14" aria-hidden="true" focusable="false")
        rect.viz-mnode__shape.viz-mkey(x="9" y="2" width="10" height="10" rx="1")
      | Reaction
    span.viz-key
      svg.viz-swatch(viewBox="0 0 28 14" aria-hidden="true" focusable="false")
        path.viz-medge.viz-medge--catalysis(d="M1 7H27")
      | Enzyme tether
    template(v-if="built.concentration")
      span.viz-key(v-for="bin in built.concentration.legend" :key="bin.bin")
        span.viz-key__chip(:class="`viz-bin-${bin.bin}`")
        span {{ `${formatNumber(bin.from)} to ${formatNumber(bin.to)}${concUnit ? ` ${concUnit}` : ''}` }}
    template(v-if="built.fluxLegend")
      span.viz-key(v-for="step in built.fluxLegend" :key="step.cls")
        svg.viz-swatch(viewBox="0 0 28 14" aria-hidden="true" focusable="false" :class="step.cls")
          path.viz-medge(d="M1 7H27" :stroke-width="step.width")
        span {{ `${step.text}${fluxUnit ? ` ${fluxUnit}` : ''}` }}
  template(#table)
    table
      caption {{ title }}: reactions
      thead
        tr
          th(scope="col") Reaction
          th(scope="col") Enzyme
          th(scope="col") Equation
          th(v-if="Object.keys(flux).length" scope="col") Rate
      tbody
        tr(v-for="row in equations" :key="row.id")
          th(scope="row") {{ row.label }}
          td {{ row.enzymes.join(', ') || 'not named' }}
          td {{ row.equation }}
          td(v-if="Object.keys(flux).length") {{ row.flux || 'no value' }}
</template>
