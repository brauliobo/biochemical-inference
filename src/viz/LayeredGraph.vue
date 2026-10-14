<script setup vapor>
import { computed, nextTick, ref } from 'vue'
import ChartFrame from '../ui/ChartFrame.vue'
import { uniqueId } from '../ui/uid.js'
import { adjacency, adjacencyRows, describeGraph, filterGraph, measureNode, reach, stepAlong } from './graph-model.js'
import LegendToggle from './LegendToggle.vue'
import { layoutLayered } from './layout/layered.js'
import { textWidth } from './scale.js'
import { edgeSign, endMarker, gradeStyle, GRADE_STYLES, shapePath, SIGN_IDS, SIGNS, signGlyph, signWords, typeLook } from './shapes.js'

// A layered causal graph: nodes in tiers (or by longest path), signed edges, own
// layout (src/viz/layout/layered.js). Edges encode their sign four ways: colour,
// end marker (arrow, bar, open arrow, diamond, dot), a short label and, for a
// hypothesis, a dashed line. Nodes have a shape per type and a badge with the
// evidence grade (a letter, so not colour alone).
//
//   LayeredGraph(title="From glycine to belching" :nodes="[{ id, label, type, tier, grade }]"
//     :edges="[{ from, to, sign: 'decrease', hypothesis: true, label?: '...' }]"
//     :tier-names="['Intervention', 'Molecule', ...]" v-model:selected="chosen" @select="open")
//
// Hover or focus a node to highlight everything upstream and downstream of it.
// The graph is one tab stop. Keyboard: with the layout top-to-bottom, Down/Up follow
// an edge forward/backward and Left/Right move to the neighbour in the same tier
// (left-to-right swaps these); Home/End jump to the first/last node; Enter or
// Space selects; Escape clears. The panel under the graph lists the node's
// neighbours as buttons. Type, sign and hypothesis toggles filter the graph, and
// the text alternative is an adjacency list.
//
// Events: `select` (node object, on click or Enter) and `focus-node` (on keyboard move).
const selected = defineModel('selected', { type: String, default: '' })
const props = defineProps({
  id: { type: String, default: () => uniqueId('graph') },
  title: { type: String, required: true },
  nodes: { type: Array, required: true },
  edges: { type: Array, required: true },
  tierNames: { type: Array, default: () => [] },
  direction: { type: String, default: 'LR' },
  routing: { type: String, default: 'curve' },
  typeStyles: { type: Object, default: () => ({}) },
  showEdgeLabels: { type: Boolean, default: true },
  summary: { type: String, default: '' },
  tableLabel: { type: String, default: 'Show adjacency list' }
})
const emit = defineEmits(['select', 'focus-node'])

const hiddenTypes = ref([])
const hiddenSigns = ref([])
const hideHypothesis = ref(false)
const fit = ref(false)
const active = ref('')
const hovered = ref('')
const focused = ref(false)
const box = ref()

const filtered = computed(() => filterGraph({ nodes: props.nodes, edges: props.edges }, { hiddenTypes: hiddenTypes.value, hiddenSigns: hiddenSigns.value, hypothesis: hideHypothesis.value ? 'hide' : 'show' }))
const measured = computed(() => new Map(filtered.value.nodes.map((node) => [node.id, measureNode(node.label)])))
const layout = computed(() => layoutLayered(
  {
    nodes: filtered.value.nodes.map((node) => ({ id: node.id, tier: node.tier, width: measured.value.get(node.id).width, height: measured.value.get(node.id).height })),
    edges: filtered.value.edges.map((edge) => ({ from: edge.from, to: edge.to }))
  },
  { direction: props.direction, routing: props.routing, tiers: props.tierNames, nodeGap: props.direction === 'LR' ? 22 : 30, layerGap: props.direction === 'LR' ? 104 : 84 }
))
const adj = computed(() => adjacency(filtered.value.nodes, filtered.value.edges))
const dataById = computed(() => new Map(filtered.value.nodes.map((node) => [node.id, node])))
const layoutById = computed(() => new Map(layout.value.nodes.map((node) => [node.id, node])))
const domId = (id) => `${props.id}-n-${filtered.value.nodes.findIndex((node) => node.id === id)}`

const focusId = computed(() => (hovered.value && dataById.value.has(hovered.value) ? hovered.value : dataById.value.has(active.value) ? active.value : ''))
const trail = computed(() => (focusId.value ? { up: reach(adj.value, focusId.value, 'up'), down: reach(adj.value, focusId.value, 'down') } : null))

const drawNodes = computed(() => layout.value.nodes.map((placed) => {
  const data = dataById.value.get(placed.id)
  const look = typeLook(data.type, props.typeStyles)
  const grade = data.grade ? gradeStyle(data.grade) : null
  const out = adj.value.out.get(placed.id).length
  const incoming = adj.value.in.get(placed.id).length
  let state = ''
  if (trail.value) {
    if (placed.id === focusId.value) state = 'focus'
    else if (trail.value.down.nodes.has(placed.id)) state = 'down'
    else if (trail.value.up.nodes.has(placed.id)) state = 'up'
    else state = 'dim'
  }
  return {
    id: placed.id,
    domId: domId(placed.id),
    data,
    placed,
    lines: measured.value.get(placed.id).lines,
    d: shapePath(look.shape, placed.width, placed.height),
    ringD: shapePath(look.shape, placed.width + 12, placed.height + 12),
    colorClass: `viz-s${look.series % 8}`,
    grade,
    state,
    label: `${data.label}, ${data.type}${grade ? `, evidence ${grade.label}` : ''}, ${out} outgoing and ${incoming} incoming links`
  }
}))

const drawEdges = computed(() => layout.value.edges.map((route) => {
  const edge = filtered.value.edges[route.index]
  const { sign, hypothesis } = edgeSign(edge)
  const head = endMarker(SIGNS[sign].marker, route.end.x, route.end.y, route.endAngle, 9)
  const text = edge.label ?? signGlyph(edge)
  let state = ''
  if (trail.value) {
    if (trail.value.down.edges.has(route.index)) state = 'down'
    else if (trail.value.up.edges.has(route.index)) state = 'up'
    else state = 'dim'
  }
  const chipWidth = textWidth(text, 11) + 12
  return {
    key: route.index,
    d: route.d,
    head,
    sign,
    hypothesis,
    state,
    text,
    chip: text && props.showEdgeLabels ? { x: route.labelAt.x - chipWidth / 2, y: route.labelAt.y - 9, w: chipWidth, tx: route.labelAt.x, ty: route.labelAt.y + 4 } : null,
    title: `${dataById.value.get(edge.from).label} ${signWords(edge).toLowerCase()} ${dataById.value.get(edge.to).label}`
  }
}))

const tierLabels = computed(() => layout.value.layers.map((band) => {
  const tier = dataById.value.get(band.nodeIds[0])?.tier
  const name = typeof tier === 'number' ? props.tierNames[tier] : tier
  return { index: band.index, name: name ?? '', from: band.from, to: band.to, center: band.center }
}))

const typesPresent = computed(() => [...new Set(props.nodes.map((node) => node.type))])
const typeItems = computed(() => typesPresent.value.map((type) => {
  const look = typeLook(type, props.typeStyles)
  return { id: type, label: type, kind: 'node', node: look.shape, tone: `viz-s${look.series % 8}` }
}))
const signItems = computed(() => {
  const present = new Set(props.edges.map((edge) => edgeSign(edge).sign))
  const hasHypothesis = props.edges.some((edge) => edgeSign(edge).hypothesis)
  return [
    ...SIGN_IDS.filter((sign) => present.has(sign)).map((sign) => ({ id: sign, label: `${SIGNS[sign].label}${SIGNS[sign].glyph.length === 1 ? ` (${SIGNS[sign].glyph})` : ''}`, kind: 'sign', sign })),
    ...(hasHypothesis ? [{ id: '__hypothesis', label: 'Hypothesis links (dashed)', kind: 'sign', sign: 'neutral', hypothesis: true }] : [])
  ]
})
const hiddenSignIds = computed(() => [...hiddenSigns.value, ...(hideHypothesis.value ? ['__hypothesis'] : [])])
const gradesPresent = computed(() => Object.values(GRADE_STYLES).filter((grade) => props.nodes.some((node) => node.grade === grade.id)))

const summaryText = computed(() => props.summary || describeGraph({ nodes: filtered.value.nodes, edges: filtered.value.edges, hiddenCount: props.nodes.length - filtered.value.nodes.length }))
const rows = computed(() => adjacencyRows(filtered.value))
const info = computed(() => {
  const id = focusId.value || (dataById.value.has(selected.value) ? selected.value : '')
  if (!id) return null
  const data = dataById.value.get(id)
  const grade = data.grade ? gradeStyle(data.grade) : null
  const step = (entry) => ({ id: entry.other, label: dataById.value.get(entry.other).label, sign: signWords(entry.edge), key: `${entry.index}` })
  return {
    id,
    data,
    sentence: `${data.type}${grade ? `, evidence ${grade.label.toLowerCase()}` : ''}. ${trail.value ? `${trail.value.up.nodes.size - 1} upstream and ${trail.value.down.nodes.size - 1} downstream nodes are highlighted.` : ''}`,
    leadsTo: adj.value.out.get(id).map(step),
    comesFrom: adj.value.in.get(id).map(step)
  }
})
const ariaLabel = computed(() => `${props.title}: graph with ${filtered.value.nodes.length} nodes. ${props.direction === 'LR' ? 'Right and left arrows follow a link forward and back, up and down arrows move within a tier' : 'Down and up arrows follow a link forward and back, left and right arrows move within a tier'}. Home and End go to the first and last node, Enter selects.`)

function toggleType(id) {
  hiddenTypes.value = hiddenTypes.value.includes(id) ? hiddenTypes.value.filter((item) => item !== id) : [...hiddenTypes.value, id]
}
function toggleSign(id) {
  if (id === '__hypothesis') hideHypothesis.value = !hideHypothesis.value
  else hiddenSigns.value = hiddenSigns.value.includes(id) ? hiddenSigns.value.filter((item) => item !== id) : [...hiddenSigns.value, id]
}
function choose(id) {
  active.value = id
  selected.value = id
  emit('select', dataById.value.get(id))
}
async function setActive(id, announce = true) {
  active.value = id
  if (announce) emit('focus-node', dataById.value.get(id))
  await nextTick()
  const element = box.value
  const placed = layoutById.value.get(id)
  if (!element || !placed || fit.value) return
  const pad = 24
  if (placed.x - pad < element.scrollLeft) element.scrollLeft = Math.max(0, placed.x - pad)
  else if (placed.x + placed.width + pad > element.scrollLeft + element.clientWidth) element.scrollLeft = placed.x + placed.width + pad - element.clientWidth
  if (placed.y - pad < element.scrollTop) element.scrollTop = Math.max(0, placed.y - pad)
  else if (placed.y + placed.height + pad > element.scrollTop + element.clientHeight) element.scrollTop = placed.y + placed.height + pad - element.clientHeight
}
function onFocus() {
  focused.value = true
  if (!dataById.value.has(active.value)) active.value = dataById.value.has(selected.value) ? selected.value : (layout.value.nodes[0]?.id ?? '')
}
function onBlur() {
  focused.value = false
}
function onKey(event) {
  if (event.key === 'Enter' || event.key === ' ') {
    if (dataById.value.has(active.value)) {
      event.preventDefault()
      choose(active.value)
    }
    return
  }
  if (event.key === 'Escape') {
    selected.value = ''
    hovered.value = ''
    return
  }
  const current = dataById.value.has(active.value) ? active.value : (layout.value.nodes[0]?.id ?? '')
  const next = stepAlong({ layout: layout.value, adj: adj.value, current, key: event.key, direction: props.direction })
  if (next === null) return
  event.preventDefault()
  if (next !== active.value) setActive(next)
}
</script>

<template lang="pug">
ChartFrame(:id="id" :title="title" :summary="summaryText" :table-label="tableLabel")
  .viz-box
    .viz-graph(ref="box" role="group" tabindex="0" :aria-label="ariaLabel" :aria-activedescendant="focused && dataById.has(active) ? domId(active) : undefined" @focus="onFocus" @blur="onBlur" @keydown="onKey")
      svg.viz-gsvg(:class="fit ? 'viz-gsvg--fit' : 'viz-gsvg--natural'" :viewBox="`0 0 ${layout.width} ${layout.height}`" :width="fit ? undefined : layout.width" :height="fit ? undefined : layout.height")
        g(v-for="tier in tierLabels" :key="`tier-${tier.index}`")
          rect.viz-tier(v-if="tier.index % 2 === 0 && direction === 'LR'" :x="tier.from" y="0" :width="tier.to - tier.from" :height="layout.height")
          rect.viz-tier(v-if="tier.index % 2 === 0 && direction !== 'LR'" x="0" :y="tier.from" :width="layout.width" :height="tier.to - tier.from")
          text.viz-tier__label(v-if="tier.name && direction === 'LR'" :x="tier.center" y="16" text-anchor="middle") {{ tier.name }}
          text.viz-tier__label(v-if="tier.name && direction !== 'LR'" x="8" :y="tier.from + 14") {{ tier.name }}
        g(v-for="edge in drawEdges" :key="`edge-${edge.key}`" :class="[`viz-edge--${edge.sign}`, `is-${edge.state || 'plain'}`]")
          path.viz-edge(:class="{ 'viz-edge--hyp': edge.hypothesis }" :d="edge.d")
            title {{ edge.title }}
          path.viz-edge-end(:class="{ 'viz-edge-end--filled': edge.head.filled }" :d="edge.head.d")
          g(v-if="edge.chip")
            rect.viz-chip-bg(:x="edge.chip.x" :y="edge.chip.y" :width="edge.chip.w" height="18")
            text.viz-chip-text(:x="edge.chip.tx" :y="edge.chip.ty" text-anchor="middle") {{ edge.text }}
        g.viz-gnode(v-for="node in drawNodes" :key="node.id" :id="node.domId" role="button" :aria-label="node.label" :aria-pressed="selected === node.id" :class="[node.colorClass, `is-${node.state || 'plain'}`, { 'is-selected': selected === node.id }]" :transform="`translate(${node.placed.cx} ${node.placed.cy})`" @pointerenter="hovered = node.id" @pointerleave="hovered = ''" @click="choose(node.id)")
          title {{ node.label }}
          path.viz-ring(v-if="focused && active === node.id" :d="node.ringD")
          path.viz-node(:d="node.d")
          text.viz-node__text(text-anchor="middle")
            tspan(v-for="(line, index) in node.lines" :key="index" x="0" :y="(index - (node.lines.length - 1) / 2) * 15 + 4") {{ line }}
          g(v-if="node.grade" :class="node.grade.cls" :transform="`translate(${node.placed.width / 2 - 3} ${-node.placed.height / 2 + 3})`")
            circle.viz-badge(r="9")
            text.viz-badge__text(y="4" text-anchor="middle") {{ node.grade.letter }}
    .viz-readout(aria-live="polite" aria-atomic="true")
      template(v-if="info")
        strong {{ info.data.label }}
        span {{ `: ${info.sentence}` }}
      span.muted(v-else) Hover or focus a node to see what leads to it and what it leads to. Arrow keys follow the links.
    .stack.stack--tight(v-if="info && (info.leadsTo.length || info.comesFrom.length)")
      .cluster.cluster--tight(v-if="info.leadsTo.length")
        span.muted Leads to:
        button.viz-chip-button(v-for="step in info.leadsTo" :key="`to-${step.key}`" type="button" @click="setActive(step.id)") {{ `${step.label} (${step.sign})` }}
      .cluster.cluster--tight(v-if="info.comesFrom.length")
        span.muted Comes from:
        button.viz-chip-button(v-for="step in info.comesFrom" :key="`from-${step.key}`" type="button" @click="setActive(step.id)") {{ `${step.label} (${step.sign})` }}
  template(#legend)
    LegendToggle(:items="typeItems" :hidden="hiddenTypes" label="Show or hide kinds of node" @toggle="toggleType")
    LegendToggle(:items="signItems" :hidden="hiddenSignIds" label="Show or hide kinds of link" @toggle="toggleSign")
    .cluster
      span.viz-key(v-for="grade in gradesPresent" :key="grade.id")
        svg.viz-swatch(viewBox="0 0 28 14" aria-hidden="true" focusable="false" :class="gradeStyle(grade.id).cls")
          circle.viz-badge(cx="14" cy="7" r="6.5")
          text.viz-badge__text(x="14" y="10.5" text-anchor="middle") {{ grade.letter }}
        | {{ ` ${grade.label}` }}
      button.button.button--secondary(type="button" :aria-pressed="fit" @click="fit = !fit") Fit to width
  template(#table)
    ul.stack.stack--tight.plain-list
      li(v-for="row in rows" :key="row.id")
        strong {{ row.label }}
        span.muted {{ ` (${row.type}${row.grade ? `, ${row.grade}` : ''})` }}
        ul
          li(v-for="(step, index) in row.leadsTo" :key="`o-${index}`") {{ `${step.sign} ${step.label}${step.edgeLabel ? ` (${step.edgeLabel})` : ''}` }}
          li(v-for="(step, index) in row.comesFrom" :key="`i-${index}`") {{ `Comes from ${step.label} (${step.sign.toLowerCase()})` }}
          li.muted(v-if="!row.leadsTo.length && !row.comesFrom.length") No links in view.
</template>
