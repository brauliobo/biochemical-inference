// Reads semantic design tokens (src/styles/tokens.semantic.css) as three.js
// colours at runtime, so the WebGL scenes follow the same palette, and the same
// light/dark scheme, as the rest of the page. No colour literal lives in JS.
import * as THREE from 'three'

function toColor(computed) {
  const numbers = (computed.match(/-?\d*\.?\d+/g) ?? []).map(Number)
  if (numbers.length < 3) return new THREE.Color()
  const scale = computed.startsWith('color(') ? 1 : 255
  return new THREE.Color().setRGB(numbers[0] / scale, numbers[1] / scale, numbers[2] / scale, THREE.SRGBColorSpace)
}

// tokens: { name: '--color-token' }. Returns { name: THREE.Color } resolved for
// the scheme in effect at `host`.
export function readSceneColors(host, tokens) {
  const probe = document.createElement('span')
  probe.hidden = true
  host.append(probe)
  const colors = {}
  for (const [name, token] of Object.entries(tokens)) {
    probe.style.color = `var(${token})`
    colors[name] = toColor(getComputedStyle(probe).color)
  }
  probe.remove()
  return colors
}

// Calls `callback` when the user switches between light and dark. Returns a
// function that stops listening.
export function onSchemeChange(callback) {
  const query = window.matchMedia?.('(prefers-color-scheme: dark)')
  query?.addEventListener?.('change', callback)
  return () => query?.removeEventListener?.('change', callback)
}

// Minimum height the stylesheet gives a scene host, so JS never repeats a size.
export function minimumHeight(host) {
  return Number.parseFloat(getComputedStyle(host).minHeight) || host.clientHeight
}
