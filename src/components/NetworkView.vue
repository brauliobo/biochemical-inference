<script setup vapor>
import * as THREE from 'three'
import { ref, watch } from 'vue'
import { useWebglScene } from '../composables/useWebglScene.js'

// The modelled topology as a spinning 3D graph: spheres for entities, octahedra
// for reactions, arrows for direction. Optional: the topology list beside it
// carries the same information and selection.
const props = defineProps({
  model: { type: Object, required: true },
  network: { type: Object, required: true },
  result: { type: Object, default: undefined },
  selectedId: { type: String, required: true }
})
const emit = defineEmits({
  select: (id) => typeof id === 'string'
})
const host = ref()
const objects = new Map()
const arrows = []

function updateSelection() {
  const { palette } = scene.live
  if (!palette) return
  objects.forEach((mesh, id) => {
    if (id === props.selectedId) mesh.material.emissive.copy(palette.selected)
    else mesh.material.emissive.setScalar(0)
    mesh.scale.setScalar(Number(mesh.userData.baseScale ?? 1) * (id === props.selectedId ? 1.35 : 1))
  })
  scene.render()
}

// State size and reaction colour encode the latest mapped result values.
function updateResultEncoding() {
  const { palette } = scene.live
  if (!palette || !scene.live.scene) return
  const { entities, reactions } = props.model.topology
  const fluxes = reactions.map((reaction) => props.result?.fluxes.find((item) => item.id === reaction.fluxSeriesId)?.values.at(-1) ?? 0)
  const maxFlux = Math.max(...fluxes, 0.01)
  entities.forEach((entity) => {
    const mesh = objects.get(entity.id)
    if (!mesh) return
    const series = props.result?.concentrations.find((item) => item.id === entity.id)
    mesh.userData.baseScale = series ? 0.85 + Math.min((series.values.at(-1) ?? 0) / 30, 0.7) : 1
  })
  reactions.forEach((reaction, index) => {
    const mesh = objects.get(reaction.id)
    if (!mesh) return
    const mapped = !reaction.knowledgeReactionId || props.network.reactions.some((item) => item.id === reaction.knowledgeReactionId)
    const intensity = props.result && mapped ? fluxes[index] / maxFlux : 0
    mesh.userData.baseScale = 0.85 + intensity * 0.7
    mesh.material.color.copy(palette[reaction.kind]).lerp(palette.flux, intensity * 0.55)
  })
  updateSelection()
}

function build({ scene: threeScene }) {
  const compoundGeometry = new THREE.SphereGeometry(0.42, 20, 16)
  const reactionGeometry = new THREE.OctahedronGeometry(0.34)
  const { entities, reactions } = props.model.topology
  const nodes = [...entities.map((item) => ({ ...item, nodeType: 'entity' })), ...reactions.map((item) => ({ ...item, nodeType: 'reaction' }))]
  const positions = new Map()
  nodes.forEach((node, index) => {
    const angle = (index / nodes.length) * Math.PI * 2
    const radius = node.nodeType === 'entity' ? 4.4 : 2.4
    const position = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.62, node.nodeType === 'entity' ? 0 : 0.7)
    positions.set(node.id, position)
    const mesh = new THREE.Mesh(node.nodeType === 'entity' ? compoundGeometry : reactionGeometry, new THREE.MeshStandardMaterial({ roughness: 0.55 }))
    mesh.position.copy(position)
    mesh.userData = { baseScale: 1, id: node.id, kind: node.kind }
    threeScene.add(mesh)
    objects.set(node.id, mesh)
  })
  for (const reaction of reactions) {
    const links = [...reaction.reactantIds.map((id) => [id, reaction.id]), ...reaction.productIds.map((id) => [reaction.id, id])]
    for (const [sourceId, targetId] of links) {
      const source = positions.get(sourceId)
      const target = positions.get(targetId)
      if (!source || !target) continue
      const direction = target.clone().sub(source)
      const length = direction.length()
      const arrow = new THREE.ArrowHelper(direction.normalize(), source, length, undefined, Math.min(0.28, length * 0.18), 0.16)
      arrows.push({ arrow, kind: reaction.kind })
      threeScene.add(arrow)
    }
  }
}

const scene = useWebglScene(host, {
  // Semantic design tokens, resolved at runtime for the active light/dark scheme.
  tokens: {
    curated: '--color-accent',
    'model-only': '--color-warning-border',
    boundary: '--color-info-border',
    flux: '--color-success-border',
    selected: '--color-focus-ring',
    background: '--color-surface-sunken'
  },
  camera: { fov: 48, position: [0, 1.5, 13] },
  lights: { ambient: 1.8, directional: { intensity: 2.4, position: [4, 7, 9] } },
  messages: {
    unsupported: '3D network unavailable because WebGL is not supported. Use the semantic network list below.',
    failed: '3D network could not initialize. The semantic network list and all simulation results remain available.',
    lost: 'The WebGL context was lost. Use the semantic network list below.'
  },
  build,
  applyPalette: (palette) => {
    scene.live.scene.background = palette.background
    objects.forEach((mesh) => mesh.material.color.copy(palette[mesh.userData.kind]))
    arrows.forEach(({ arrow, kind }) => arrow.setColor(palette[kind]))
    updateResultEncoding()
  },
  onPointer: (event, { renderer, camera }) => {
    if (!renderer || !camera) return
    const rect = renderer.domElement.getBoundingClientRect()
    const pointer = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(pointer, camera)
    const hit = raycaster.intersectObjects([...objects.values()])[0]
    if (hit?.object.userData.id) emit('select', String(hit.object.userData.id))
  },
  onFrame: ({ scene: threeScene }) => { threeScene.rotation.y += 0.0012 },
  onTeardown: () => {
    objects.clear()
    arrows.length = 0
  }
})
const { fallback } = scene

watch(() => props.selectedId, updateSelection)
watch(() => props.result, updateResultEncoding)
</script>

<template lang="pug">
.stack.stack--tight
  .scene(ref="host" :class="{ 'scene--unavailable': fallback }")
    .stack.stack--tight(v-if="fallback" role="note")
      strong 3D view unavailable
      p {{ fallback }}
  ul.cluster.plain-list(aria-label="Network key")
    li.cluster.cluster--tight
      i.swatch.swatch--dot
      | Curated mapping
    li.cluster.cluster--tight
      i.swatch.swatch--diamond(style="--swatch-color: var(--color-warning-border)")
      | Model-only equation
    li.cluster.cluster--tight
      i.swatch.swatch--dot(style="--swatch-color: var(--color-info-border)")
      | Boundary term
  p.muted Arrows show direction; state size and reaction intensity encode the latest mapped result values.
</template>
