<script setup>
import * as THREE from 'three'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

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
const objects = new Map()

const colors = {
  curated: 0x49b8a5,
  'model-only': 0xf0a65a,
  boundary: 0xa98bd4
}

function updateSelection() {
  objects.forEach((mesh, id) => {
    const material = mesh.material
    material.emissive.setHex(id === props.selectedId ? 0xffb547 : 0x000000)
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
    const material = mesh.material
    material.color.setHex(colors[reaction.kind]).lerp(new THREE.Color(0xc4d982), intensity * 0.55)
  })
  updateSelection()
}

onMounted(() => {
  if (!host.value || typeof WebGLRenderingContext === 'undefined') {
    fallback.value = '3D network unavailable because WebGL is not supported. Use the semantic network list below.'
    return
  }
  try {
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x101b1a)
    camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100)
    camera.position.set(0, 1.5, 13)
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.domElement.setAttribute('aria-hidden', 'true')
    renderer.domElement.tabIndex = -1
    host.value.append(renderer.domElement)

    scene.add(new THREE.AmbientLight(0xa8d8cb, 1.8))
    const light = new THREE.DirectionalLight(0xffffff, 2.4)
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
      const material = new THREE.MeshStandardMaterial({ color: colors[node.kind], roughness: 0.55 })
      const mesh = new THREE.Mesh(node.nodeType === 'entity' ? compoundGeometry : reactionGeometry, material)
      mesh.position.copy(position)
      mesh.userData.baseScale = 1
      mesh.userData.id = node.id
      scene.add(mesh)
      objects.set(node.id, mesh)
    })
    props.model.topology.reactions.forEach((reaction) => {
      const reactionPosition = positions.get(reaction.id)
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
        const arrow = new THREE.ArrowHelper(direction.normalize(), source, length, colors[reaction.kind], Math.min(0.28, length * 0.18), 0.16)
        scene.add(arrow)
      }
    })

    const resize = () => {
      const width = host.value.clientWidth
      const height = Math.max(290, host.value.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.render(scene, camera)
    }
    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host.value)
    resize()
    updateResultEncoding()

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const animate = () => {
        frame = requestAnimationFrame(animate)
        if (scene) scene.rotation.y += 0.0012
        renderer?.render(scene, camera)
      }
      animate()
    }

    renderer.domElement.addEventListener('pointerdown', (event) => {
      const rect = renderer.domElement.getBoundingClientRect()
      const pointer = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(pointer, camera)
      const hit = raycaster.intersectObjects([...objects.values()])[0]
      if (hit?.object.userData.id) emit('select', String(hit.object.userData.id))
    })
  } catch {
    fallback.value = '3D network could not initialize. The semantic network list and all simulation results remain available.'
  }
})

watch(() => props.selectedId, updateSelection)
watch(() => props.result, updateResultEncoding)

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  resizeObserver?.disconnect()
  scene?.traverse((object) => {
    if (!('geometry' in object) || !('material' in object)) return
    const disposable = object
    disposable.geometry.dispose()
    const materials = Array.isArray(disposable.material) ? disposable.material : [disposable.material]
    materials.forEach((material) => material.dispose())
  })
  renderer?.dispose()
  renderer?.forceContextLoss()
  renderer?.domElement.remove()
  objects.clear()
})
</script>

<template lang="pug">
.network-visual
  .webgl-host(ref="host" :class="{ unavailable: fallback }")
    .fallback(v-if="fallback" role="note")
      strong 3D view unavailable
      p {{ fallback }}
  p.visual-key
    span
      i.node-key.curated
      | Curated mapping
    span
      i.node-key.model-only
      | Model-only equation
    span
      i.node-key.boundary
      | Boundary term
    span Arrows show direction; state size and reaction intensity encode the latest mapped result values.
</template>
