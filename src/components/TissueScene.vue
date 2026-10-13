<script setup vapor>
import * as THREE from 'three'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { resolveExistingBin, scaleValue } from '../spatial.js'
import { minimumHeight, onSchemeChange, readSceneColors } from './ui/scene-colors.js'

const props = defineProps({
  cells: { type: Array, required: true },
  space: { type: Object, required: true },
  snapshot: { type: Object, required: true },
  field: { type: String, required: true },
  selectedBin: { type: Number, required: true },
  level: { type: Number, required: true }
})
const emit = defineEmits({
  selectBin: (bin) => Number.isInteger(bin) && bin >= 0 && bin < 12,
  unavailable: (message) => typeof message === 'string'
})
const host = ref()
const fallback = ref('')
let renderer
let scene
let camera
let cellsMesh
let lobule
let portal
let central
let resizeObserver
let stopSchemeWatch
let palette
let frame = 0
const pointer = new THREE.Vector2()
const raycaster = new THREE.Raycaster()
const matrix = new THREE.Matrix4()
const color = new THREE.Color()

// Semantic design tokens, resolved at runtime for the active light/dark scheme.
const PALETTE_TOKENS = {
  low: '--color-info-border',
  high: '--color-warning-border',
  selected: '--color-accent',
  portal: '--color-info-border',
  central: '--color-warning-border',
  frame: '--color-border-strong',
  background: '--color-surface-sunken'
}

function dimensions() {
  return props.space.axes.map((axis) => axis.upper - axis.lower)
}

function normalizedPosition(position) {
  const size = dimensions()
  return new THREE.Vector3(
    ((position[0] - props.space.axes[0].lower) / size[0] - 0.5) * 10,
    ((position[1] - props.space.axes[1].lower) / size[1] - 0.5) * 4.8,
    ((position[2] - props.space.axes[2].lower) / size[2] - 0.5) * 2.8
  )
}

function binForPosition(position) {
  const axis = props.space.axes[0]
  return Math.max(0, Math.min(11, Math.floor((position[0] - axis.lower) / (axis.upper - axis.lower) * 12)))
}

function updateEncoding() {
  if (!cellsMesh) return
  const values = props.snapshot[props.field]
  const minimum = Math.min(...values)
  const maximum = Math.max(...values)
  const domain = minimum === maximum ? [0, maximum || 1] : [minimum, maximum]
  props.cells.forEach((cell, index) => {
    const bin = cellsMesh.userData.bins[index]
    const scaled = scaleValue(values[bin], domain, { mode: 'forbidden', sentinel: null })
    color.copy(palette.low).lerp(palette.high, scaled.ratio)
    if (bin === props.selectedBin) color.lerp(palette.selected, 0.5)
    cellsMesh.setColorAt(index, color)
    const scale = bin === props.selectedBin ? 1.45 : 1
    matrix.makeScale(scale, scale, scale)
    matrix.setPosition(normalizedPosition(cell.position))
    cellsMesh.setMatrixAt(index, matrix)
  })
  cellsMesh.instanceColor.needsUpdate = true
  cellsMesh.instanceMatrix.needsUpdate = true
  renderer?.render(scene, camera)
}

// Re-colours the scene from the current tokens (first paint and scheme change).
function applyPalette() {
  scene.background = palette.background
  lobule.material.color.copy(palette.frame)
  portal.material.color.copy(palette.portal)
  central.material.color.copy(palette.central)
  updateEncoding()
}

function selectFromPointer(event) {
  if (!renderer || !camera || !scene) return
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
  raycaster.setFromCamera(pointer, camera)
  const intersections = raycaster.intersectObjects([cellsMesh, lobule])
  const instanceBin = resolveExistingBin(intersections, 'synthetic-benchmark')
  if (instanceBin !== undefined) return emit('selectBin', instanceBin)
  const surfaceHit = intersections.find((hit) => hit.object === lobule)
  if (surfaceHit) emit('selectBin', Math.max(0, Math.min(11, Math.floor((surfaceHit.point.x + 5) / 10 * 12))))
}

function selectFromKeyboard(event) {
  const keys = { ArrowLeft: props.selectedBin - 1, ArrowRight: props.selectedBin + 1, Home: 0, End: 11 }
  if (!(event.key in keys)) return
  event.preventDefault()
  emit('selectBin', Math.max(0, Math.min(11, keys[event.key])))
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
  renderer = undefined
  scene = undefined
  camera = undefined
  cellsMesh = undefined
  lobule = undefined
  portal = undefined
  central = undefined
}

function markUnavailable(message, forceContextLoss = true) {
  fallback.value = message
  teardown(forceContextLoss)
  emit('unavailable', message)
}

function contextLost(event) {
  event.preventDefault()
  markUnavailable('The WebGL context was lost.', false)
}

onMounted(() => {
  if (!host.value || typeof WebGLRenderingContext === 'undefined') return markUnavailable('WebGL is not supported.')
  try {
    palette = readSceneColors(host.value, PALETTE_TOKENS)
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(43, 1, 0.1, 100)
    camera.position.set(0, 6.5, 14)
    camera.lookAt(0, 0, 0)
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.setAttribute('aria-hidden', 'true')
    renderer.domElement.tabIndex = -1
    renderer.domElement.addEventListener('pointerdown', selectFromPointer)
    renderer.domElement.addEventListener('webglcontextlost', contextLost, { once: true })
    host.value.append(renderer.domElement)

    scene.add(new THREE.AmbientLight(undefined, 1.5))
    const light = new THREE.DirectionalLight(undefined, 2.5)
    light.position.set(3, 8, 9)
    scene.add(light)

    lobule = new THREE.Mesh(new THREE.BoxGeometry(10, 4.8, 2.8), new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.33, wireframe: true }))
    lobule.userData.synthetic = true
    scene.add(lobule)

    const vesselGeometry = new THREE.CylinderGeometry(0.32, 0.32, 4.2, 18)
    portal = new THREE.Mesh(vesselGeometry, new THREE.MeshStandardMaterial())
    central = new THREE.Mesh(vesselGeometry, new THREE.MeshStandardMaterial())
    portal.position.x = -5.3
    central.position.x = 5.3
    scene.add(portal, central)

    const segments = props.level === 0 ? 18 : 8
    cellsMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.38, segments, Math.max(6, segments - 4)), new THREE.MeshStandardMaterial({ roughness: 0.48 }), props.cells.length)
    cellsMesh.userData.bins = props.cells.map((cell) => binForPosition(cell.position))
    cellsMesh.userData.synthetic = true
    scene.add(cellsMesh)
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
        renderer?.render(scene, camera)
      }
      animate()
    }
  } catch {
    markUnavailable('The Three.js tissue scene could not initialize.')
  }
})

watch([() => props.snapshot, () => props.field, () => props.selectedBin], updateEncoding)

onBeforeUnmount(teardown)
</script>

<template lang="pug">
.stack.stack--tight
  .repel.muted(aria-hidden="true")
    span Portal · bin 1
    span Central · bin 12
  .scene(ref="host" role="group" tabindex="0" :class="{ 'scene--unavailable': fallback }" :aria-label="`Synthetic lobule scene. Bin ${selectedBin + 1} selected. Portal left, central right. Use left and right arrow keys to select bins.`" @keydown="selectFromKeyboard")
    .stack.stack--tight(v-if="fallback")
      strong 3D view unavailable
      p {{ fallback }}
</template>
