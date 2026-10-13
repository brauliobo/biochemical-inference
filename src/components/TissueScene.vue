<script setup vapor>
import * as THREE from 'three'
import { ref, watch } from 'vue'
import { useWebglScene } from '../composables/useWebglScene.js'
import { resolveExistingBin, scaleValue } from '../spatial.js'

// The synthetic lobule cuboid with one instanced sphere per cell, coloured by
// the chosen field. Optional: the bin buttons and the numeric table beside it
// do everything it does. Arrow keys, Home and End select bins from the keyboard.
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
const BINS = 12
const clampBin = (bin) => Math.max(0, Math.min(BINS - 1, bin))
const pointer = new THREE.Vector2()
const raycaster = new THREE.Raycaster()
const matrix = new THREE.Matrix4()
const color = new THREE.Color()
let cellsMesh
let lobule
let portal
let central

function normalizedPosition(position) {
  const { axes } = props.space
  const size = axes.map((axis) => axis.upper - axis.lower)
  return new THREE.Vector3(
    ((position[0] - axes[0].lower) / size[0] - 0.5) * 10,
    ((position[1] - axes[1].lower) / size[1] - 0.5) * 4.8,
    ((position[2] - axes[2].lower) / size[2] - 0.5) * 2.8
  )
}

function binForPosition(position) {
  const axis = props.space.axes[0]
  return clampBin(Math.floor((position[0] - axis.lower) / (axis.upper - axis.lower) * BINS))
}

function updateEncoding() {
  const { palette } = scene.live
  if (!cellsMesh || !palette) return
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
  scene.render()
}

function build({ scene: threeScene }) {
  lobule = new THREE.Mesh(new THREE.BoxGeometry(10, 4.8, 2.8), new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.33, wireframe: true }))
  lobule.userData.synthetic = true
  threeScene.add(lobule)

  const vesselGeometry = new THREE.CylinderGeometry(0.32, 0.32, 4.2, 18)
  portal = new THREE.Mesh(vesselGeometry, new THREE.MeshStandardMaterial())
  central = new THREE.Mesh(vesselGeometry, new THREE.MeshStandardMaterial())
  portal.position.x = -5.3
  central.position.x = 5.3
  threeScene.add(portal, central)

  const segments = props.level === 0 ? 18 : 8
  cellsMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.38, segments, Math.max(6, segments - 4)), new THREE.MeshStandardMaterial({ roughness: 0.48 }), props.cells.length)
  cellsMesh.userData.bins = props.cells.map((cell) => binForPosition(cell.position))
  cellsMesh.userData.synthetic = true
  threeScene.add(cellsMesh)
}

function selectFromPointer(event, { renderer, camera, scene: threeScene }) {
  if (!renderer || !camera || !threeScene) return
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
  raycaster.setFromCamera(pointer, camera)
  const intersections = raycaster.intersectObjects([cellsMesh, lobule])
  const instanceBin = resolveExistingBin(intersections, 'synthetic-benchmark')
  if (instanceBin !== undefined) return emit('selectBin', instanceBin)
  const surfaceHit = intersections.find((hit) => hit.object === lobule)
  if (surfaceHit) emit('selectBin', clampBin(Math.floor((surfaceHit.point.x + 5) / 10 * BINS)))
}

function selectFromKeyboard(event) {
  const keys = { ArrowLeft: props.selectedBin - 1, ArrowRight: props.selectedBin + 1, Home: 0, End: BINS - 1 }
  if (!(event.key in keys)) return
  event.preventDefault()
  emit('selectBin', clampBin(keys[event.key]))
}

const scene = useWebglScene(host, {
  // Semantic design tokens, resolved at runtime for the active light/dark scheme.
  tokens: {
    low: '--color-info-border',
    high: '--color-warning-border',
    selected: '--color-accent',
    portal: '--color-info-border',
    central: '--color-warning-border',
    frame: '--color-border-strong',
    background: '--color-surface-sunken'
  },
  camera: { fov: 43, position: [0, 6.5, 14], lookAt: [0, 0, 0] },
  lights: { ambient: 1.5, directional: { intensity: 2.5, position: [3, 8, 9] } },
  messages: {
    unsupported: 'WebGL is not supported.',
    failed: 'The Three.js tissue scene could not initialize.',
    lost: 'The WebGL context was lost.'
  },
  build,
  applyPalette: (palette) => {
    scene.live.scene.background = palette.background
    lobule.material.color.copy(palette.frame)
    portal.material.color.copy(palette.portal)
    central.material.color.copy(palette.central)
    updateEncoding()
  },
  onPointer: selectFromPointer,
  onTeardown: () => {
    cellsMesh = undefined
    lobule = undefined
    portal = undefined
    central = undefined
  },
  onUnavailable: (message) => emit('unavailable', message)
})
const { fallback } = scene

watch([() => props.snapshot, () => props.field, () => props.selectedBin], updateEncoding)
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
