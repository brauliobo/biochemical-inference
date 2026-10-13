<script setup vapor>
import { computed } from 'vue'
import { truncate, radialLayout } from '../../kb/neighbourhood.js'
import { entityPath } from '../../kb/paths.js'
import { href } from '../../router.js'

// Optional picture of an entity (centre) and some of its direct neighbours. Every
// node is a real link. It is shown on wider screens only; the text lists on the
// same page (RelationGroups) carry all the information and are the primary view.
const props = defineProps({
  center: { type: Object, required: true },
  nodes: { type: Array, required: true }
})
const layout = computed(() => radialLayout(props.nodes.length))
const viewBox = computed(() => `0 0 ${layout.value.width} ${layout.value.height}`)

function labelX(point) {
  return point.x + (point.anchor === 'start' ? 18 : point.anchor === 'end' ? -18 : 0)
}
function labelY(point) {
  if (point.anchor !== 'middle') return point.y + 5
  return point.above ? point.y - 20 : point.y + 32
}
</script>

<template lang="pug">
figure.graph.stack.stack--tight
  svg(:viewBox="viewBox" role="group" :aria-label="'Picture of the closest entries around ' + center.name")
    line.graph-edge(v-for="(point, index) in layout.points" :key="'edge-' + index" :x1="layout.center.x" :y1="layout.center.y" :x2="point.x" :y2="point.y")
    a(v-for="(node, index) in nodes" :key="node.id" :href="href(entityPath(node.id))" :aria-label="node.name + ' (' + node.label + ')'")
      circle.graph-node(:cx="layout.points[index].x" :cy="layout.points[index].y" r="12")
      text.graph-label(:x="labelX(layout.points[index])" :y="labelY(layout.points[index])" :text-anchor="layout.points[index].anchor") {{ truncate(node.name) }}
    a(:href="href(entityPath(center.id))" :aria-label="center.name + ' (this entry)'")
      circle.graph-node.graph-node--center(:cx="layout.center.x" :cy="layout.center.y" r="20")
      text.graph-label(:x="layout.center.x" :y="layout.center.y + 40" text-anchor="middle") {{ truncate(center.name, 30) }}
  figcaption.muted Each circle links to its entry. The lists below name the relationship for every neighbour.
</template>
