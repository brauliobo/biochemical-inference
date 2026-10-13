<script setup vapor>
import * as THREE from 'three'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { minimumHeight, onSchemeChange, readSceneColors } from '../ui/scene-colors.js'

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
const fallback = ref('')
let renderer
let scene
let camera
let frame = 0
let resizeObserver
let stopSchemeWatch
let palette
const objects = new Map()
const arrows = []

// Semantic design tokens, resolved at runtime for the active light/dark scheme.
const PALETTE_TOKENS = {
  curated: '--color-accent',
  'model-only': '--color-warning-border',
  boundary: '--color-info-border',
  flux: '--color-success-border',
  selected: '--color-focus-ring',
  background: '--color-surface-sunken'
}

function updateSelection() {
  objects.forEach((mesh, id) => {
    const material = mesh.material
    if (id === props.selectedId) material.emissive.copy(palette.selected)
    else material.emissive.setScalar(0)
    const baseScale = Number(mesh.userData.baseScale ?? 1)
    mesh.scale.setScalar(baseScale * (id === props.selectedId ? 1.35 : 1))
  })
  if (renderer && scene && camera) renderer.render(scene, camera)
}

function updateResultEncoding() {
  if (!scene) return
  const reactionFluxes = props.model.topology.reactions.map((reaction) => {
    const series = props.result?.fluxes.find((item) => item.id === reaction.fluxSeriesId)
    return series?.values.at(-1) ?? 0
  })
  const maxFlux = Math.max(...reactionFluxes, 0.01)

  props.model.topology.entities.forEach((entity) => {
    const mesh = objects.get(entity.id)
    if (!mesh) return
    const series = props.result?.concentrations.find((item) => item.id === entity.id)
    mesh.userData.baseScale = series ? 0.85 + Math.min((series.values.at(-1) ?? 0) / 30, 0.7) : 1
  })
  props.model.topology.reactions.forEach((reaction, index) => {
    const mesh = objects.get(reaction.id)
    if (!mesh) return
    const mapped = !reaction.knowledgeReactionId || props.network.reactions.some((item) => item.id === reaction.knowledgeReactionId)
    const intensity = props.result && mapped ? reactionFluxes[index] / maxFlux : 0
    mesh.userData.baseScale = 0.85 + intensity * 0.7
    mesh.material.color.copy(palette[reaction.kind]).lerp(palette.flux, intensity * 0.55)
  })
  updateSelection()
}

// Re-colours everything from the current tokens (first paint and scheme change).
function applyPalette() {
  scene.background = palette.background
  objects.forEach((mesh) => mesh.material.color.copy(palette[mesh.userData.kind]))
  arrows.forEach(({ arrow, kind }) => arrow.setColor(palette[kind]))
  updateResultEncoding()
}

function selectFromPointer(event) {
  if (!renderer || !camera) return
  const rect = renderer.domElement.getBoundingClientRect()
  const pointer = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
  const raycaster = new THREE.Raycaster()
  raycaster.setFromCamera(pointer, camera)
  const hit = raycaster.intersectObjects([...objects.values()])[0]
  if (hit?.object.userData.id) emit('select', String(hit.object.userData.id))
}

function teardown(forceContextLoss = true) {
  cancelAnimationFrame(frame)
  frame = 0
  resizeObserver?.disconnect()
  resizeObserver = undefined
  stopSchemeWatch?.()
  stopSchemeWatch = undefined
  const currentRenderer = renderer
  currentRenderer?.domElement.removeEventListener('pointerdown', selectFromPointer)
  currentRenderer?.domElement.removeEventListener('webglcontextlost', contextLost)
  scene?.traverse((object) => {
    if ('geometry' in object) object.geometry?.dispose()
    if ('material' in object) (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => material?.dispose())
  })
  currentRenderer?.dispose()
  if (forceContextLoss) currentRenderer?.forceContextLoss()
  currentRenderer?.domElement.remove()
  objects.clear()
  arrows.length = 0
  renderer = undefined
  scene = undefined
  camera = undefined
}

function markUnavailable(message, forceContextLoss = true) {
  fallback.value = message
  teardown(forceContextLoss)
}

function contextLost(event) {
  event.preventDefault()
  markUnavailable('The WebGL context was lost. Use the semantic network list below.', false)
}

onMounted(() => {
  if (!host.value || typeof WebGLRenderingContext === 'undefined') {
    markUnavailable('3D network unavailable because WebGL is not supported. Use the semantic network list below.')
    return
  }
  try {
    palette = readSceneColors(host.value, PALETTE_TOKENS)
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)
    camera.position.set(0, 1.5, 13)
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.setAttribute('aria-hidden', 'true')
    renderer.domElement.tabIndex = -1
    renderer.domElement.addEventListener('pointerdown', selectFromPointer)
    renderer.domElement.addEventListener('webglcontextlost', contextLost, { once: true })
    host.value.append(renderer.domElement)

    scene.add(new THREE.AmbientLight(undefined, 1.8))
    const light = new THREE.DirectionalLight(undefined, 2.4)
    light.position.set(4, 7, 9)
    scene.add(light)

    const compoundGeometry = new THREE.SphereGeometry(0.42, 20, 16)
    const reactionGeometry = new THREE.OctahedronGeometry(0.34)
    const nodes = [
      ...props.model.topology.entities.map((item) => ({ ...item, nodeType: 'entity' })),
      ...props.model.topology.reactions.map((item) => ({ ...item, nodeType: 'reaction' }))
    ]
    const positions = new Map()
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * Math.PI * 2
      const radius = node.nodeType === 'entity' ? 4.4 : 2.4
      const position = new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.62, node.nodeType === 'entity' ? 0 : 0.7)
      positions.set(node.id, position)
      const material = new THREE.MeshStandardMaterial({ roughness: 0.55 })
      const mesh = new THREE.Mesh(node.nodeType === 'entity' ? compoundGeometry : reactionGeometry, material)
      mesh.position.copy(position)
      mesh.userData.baseScale = 1
      mesh.userData.id = node.id
      mesh.userData.kind = node.kind
      scene.add(mesh)
      objects.set(node.id, mesh)
    })
    props.model.topology.reactions.forEach((reaction) => {
      const directedLinks = [
        ...reaction.reactantIds.map((id) => [id, reaction.id]),
        ...reaction.productIds.map((id) => [reaction.id, id])
      ]
      for (const [sourceId, targetId] of directedLinks) {
        const source = positions.get(sourceId)
        const target = positions.get(targetId)
        if (!source || !target) continue
        const direction = target.clone().sub(source)
        const length = direction.length()
        const arrow = new THREE.ArrowHelper(direction.normalize(), source, length, undefined, Math.min(0.28, length * 0.18), 0.16)
        arrows.push({ arrow, kind: reaction.kind })
        scene.add(arrow)
      }
    })
    applyPalette()
    stopSchemeWatch = onSchemeChange(() => {
      if (!scene || !host.value) return
      palette = readSceneColors(host.value, PALETTE_TOKENS)
      applyPalette()
    })

    const resize = () => {
      if (!renderer || !camera || !host.value) return
      const width = host.value.clientWidth
      const height = Math.max(minimumHeight(host.value), host.value.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
    }
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host.value)
    resize()

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const animate = () => {
        frame = requestAnimationFrame(animate)
        if (scene) scene.rotation.y += 0.0012
        renderer?.render(scene, camera)
      }
      animate()
    }
  } catch {
    markUnavailable('3D network could not initialize. The semantic network list and all simulation results remain available.')
  }
})

watch(() => props.selectedId, updateSelection)
watch(() => props.result, updateResultEncoding)

onBeforeUnmount(teardown)
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
