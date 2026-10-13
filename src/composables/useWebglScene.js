// The three.js plumbing every 3D view repeats: feature check, scene, camera,
// lights, renderer, resize, light/dark palette from design tokens, pointer
// input, an optional spin animation (skipped under prefers-reduced-motion),
// teardown, and a visible fallback when WebGL is missing, fails or is lost.
// A component supplies only what is specific to its picture.
//
//   const { fallback, scene, render } = useWebglScene(host, {
//     tokens: { low: '--color-info-border' },          // semantic tokens read as colours
//     camera: { fov: 43, position: [0, 6.5, 14] },
//     lights: { ambient: 1.5, directional: { intensity: 2.5, position: [3, 8, 9] } },
//     messages: { unsupported: '…', failed: '…', lost: '…' },
//     build: ({ scene, palette }) => { /* add meshes */ },
//     applyPalette: (palette) => { /* recolour after build and on scheme change */ },
//     onPointer: (event, { renderer, camera }) => {},
//     onFrame: ({ scene }) => { scene.rotation.y += 0.001 },   // optional spin
//     onTeardown: () => { /* drop references to meshes */ },
//     onUnavailable: (message) => {}
//   })
import * as THREE from 'three'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { minimumHeight, onSchemeChange, readSceneColors } from '../ui/scene-colors.js'

export function useWebglScene(host, options) {
  const { tokens, camera: cameraOptions, lights, messages, build, applyPalette, onPointer, onFrame, onTeardown, onUnavailable } = options
  const fallback = ref('')
  // Live objects; undefined once torn down.
  const live = { renderer: undefined, scene: undefined, camera: undefined, palette: undefined }
  let frame = 0
  let resizeObserver
  let stopSchemeWatch

  function render() {
    if (live.renderer && live.scene && live.camera) live.renderer.render(live.scene, live.camera)
  }

  const pointerDown = (event) => onPointer?.(event, live)

  function teardown(forceContextLoss = true) {
    cancelAnimationFrame(frame)
    frame = 0
    resizeObserver?.disconnect()
    resizeObserver = undefined
    stopSchemeWatch?.()
    stopSchemeWatch = undefined
    const { renderer, scene } = live
    renderer?.domElement.removeEventListener('pointerdown', pointerDown)
    renderer?.domElement.removeEventListener('webglcontextlost', contextLost)
    scene?.traverse((object) => {
      if ('geometry' in object) object.geometry?.dispose()
      if ('material' in object) (Array.isArray(object.material) ? object.material : [object.material]).forEach((material) => material?.dispose())
    })
    renderer?.dispose()
    if (forceContextLoss) renderer?.forceContextLoss()
    renderer?.domElement.remove()
    Object.assign(live, { renderer: undefined, scene: undefined, camera: undefined })
    onTeardown?.()
  }

  function markUnavailable(message, forceContextLoss = true) {
    fallback.value = message
    teardown(forceContextLoss)
    onUnavailable?.(message)
  }

  function contextLost(event) {
    event.preventDefault()
    markUnavailable(messages.lost, false)
  }

  function recolour() {
    live.palette = readSceneColors(host.value, tokens)
    applyPalette(live.palette)
  }

  function resize() {
    if (!live.renderer || !live.camera || !host.value) return
    const width = host.value.clientWidth
    const height = Math.max(minimumHeight(host.value), host.value.clientHeight)
    live.renderer.setSize(width, height, false)
    live.camera.aspect = width / height
    live.camera.updateProjectionMatrix()
    render()
  }

  function start() {
    live.palette = readSceneColors(host.value, tokens)
    live.scene = new THREE.Scene()
    live.camera = new THREE.PerspectiveCamera(cameraOptions.fov, 1, 0.1, 100)
    live.camera.position.set(...cameraOptions.position)
    if (cameraOptions.lookAt) live.camera.lookAt(...cameraOptions.lookAt)
    live.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
    live.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    live.renderer.domElement.setAttribute('aria-hidden', 'true')
    live.renderer.domElement.tabIndex = -1
    live.renderer.domElement.addEventListener('pointerdown', pointerDown)
    live.renderer.domElement.addEventListener('webglcontextlost', contextLost, { once: true })
    host.value.append(live.renderer.domElement)

    live.scene.add(new THREE.AmbientLight(undefined, lights.ambient))
    const light = new THREE.DirectionalLight(undefined, lights.directional.intensity)
    light.position.set(...lights.directional.position)
    live.scene.add(light)

    build(live)
    applyPalette(live.palette)
    stopSchemeWatch = onSchemeChange(() => {
      if (live.scene && host.value) recolour()
    })

    resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(host.value)
    resize()

    if (onFrame && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const animate = () => {
        frame = requestAnimationFrame(animate)
        onFrame(live)
        render()
      }
      animate()
    }
  }

  onMounted(() => {
    if (!host.value || typeof WebGLRenderingContext === 'undefined') {
      markUnavailable(messages.unsupported)
      return
    }
    try {
      start()
    } catch {
      markUnavailable(messages.failed)
    }
  })
  onBeforeUnmount(teardown)

  return { fallback, live, render }
}
