// Geometry and encodings shared by the chart primitives: series look (colour
// class, dash class, marker shape), signed-edge encoding, end markers, node
// shapes and evidence-grade badges. Pure functions; the CSS classes they name
// live in src/styles/viz.css. Nothing is encoded by colour alone: every series
// has a dash and a marker shape, every sign a marker, a glyph and a word.

export const SERIES_COUNT = 8
export const MARKER_SHAPES = Object.freeze(['circle', 'square', 'triangle', 'diamond', 'cross', 'plus', 'triangle-down', 'hexagon'])

/** The look of the n-th series: { index, colorClass, dashClass, shape }. */
export function seriesLook(index) {
  const slot = ((index % SERIES_COUNT) + SERIES_COUNT) % SERIES_COUNT
  return { index: slot, colorClass: `viz-s${slot}`, dashClass: `viz-dash-${slot}`, shape: MARKER_SHAPES[slot] }
}

const round = (value) => Math.round(value * 100) / 100
const point = (x, y) => `${round(x)} ${round(y)}`

/** Path of a marker of radius `r` centred at (cx, cy). */
export function markerPath(shape, cx, cy, r) {
  switch (shape) {
    case 'square':
      return `M${point(cx - r, cy - r)}H${round(cx + r)}V${round(cy + r)}H${round(cx - r)}Z`
    case 'triangle':
      return `M${point(cx, cy - r * 1.15)}L${point(cx + r * 1.05, cy + r * 0.8)}L${point(cx - r * 1.05, cy + r * 0.8)}Z`
    case 'triangle-down':
      return `M${point(cx, cy + r * 1.15)}L${point(cx + r * 1.05, cy - r * 0.8)}L${point(cx - r * 1.05, cy - r * 0.8)}Z`
    case 'diamond':
      return `M${point(cx, cy - r * 1.25)}L${point(cx + r * 1.25, cy)}L${point(cx, cy + r * 1.25)}L${point(cx - r * 1.25, cy)}Z`
    case 'cross':
      return `M${point(cx - r, cy - r)}L${point(cx + r, cy + r)}M${point(cx - r, cy + r)}L${point(cx + r, cy - r)}`
    case 'plus':
      return `M${point(cx - r * 1.2, cy)}H${round(cx + r * 1.2)}M${point(cx, cy - r * 1.2)}V${round(cy + r * 1.2)}`
    case 'hexagon': {
      const corners = Array.from({ length: 6 }, (_, index) => {
        const angle = (Math.PI / 3) * index
        return point(cx + r * 1.15 * Math.cos(angle), cy + r * 1.15 * Math.sin(angle))
      })
      return `M${corners.join('L')}Z`
    }
    default:
      return `M${point(cx - r, cy)}a${round(r)} ${round(r)} 0 1 0 ${round(2 * r)} 0a${round(r)} ${round(r)} 0 1 0 ${round(-2 * r)} 0Z`
  }
}

/** Marker shapes drawn as strokes only (cross, plus) have no fill. */
export const isOpenMarker = (shape) => shape === 'cross' || shape === 'plus'

// ---- Signed edges ----

export const SIGNS = Object.freeze({
  increase: Object.freeze({ id: 'increase', label: 'Increases', glyph: '+', marker: 'arrow' }),
  decrease: Object.freeze({ id: 'decrease', label: 'Decreases', glyph: '−', marker: 'bar' }),
  mitigate: Object.freeze({ id: 'mitigate', label: 'Mitigates (eases)', glyph: 'eases', marker: 'open-arrow' }),
  aggravate: Object.freeze({ id: 'aggravate', label: 'Aggravates (worsens)', glyph: 'worsens', marker: 'diamond' }),
  neutral: Object.freeze({ id: 'neutral', label: 'Linked (no sign)', glyph: '', marker: 'dot' })
})
export const SIGN_IDS = Object.freeze(Object.keys(SIGNS))

/** { sign, hypothesis } for an edge: `sign: 'hypothesis'` means an unsigned hypothesis. */
export function edgeSign(edge) {
  const raw = edge?.sign
  const sign = Object.hasOwn(SIGNS, raw) ? raw : 'neutral'
  return { sign, hypothesis: Boolean(edge?.hypothesis) || raw === 'hypothesis' }
}

/** Short on-edge label: "+", "-", "eases", "worsens"; a hypothesis gets a question mark. */
export function signGlyph(edge) {
  const { sign, hypothesis } = edgeSign(edge)
  const glyph = SIGNS[sign].glyph
  return hypothesis ? `${glyph}?` : glyph
}

/** Text for a screen reader and the data table: "Decreases (hypothesis)". */
export function signWords(edge) {
  const { sign, hypothesis } = edgeSign(edge)
  return hypothesis ? `${SIGNS[sign].label} (hypothesis)` : SIGNS[sign].label
}

/**
 * The end marker of an edge at (x, y) pointing along `angle` (radians):
 * { d, filled }. `size` is its length.
 */
export function endMarker(kind, x, y, angle, size = 9) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const at = (along, across) => point(x + along * cos - across * sin, y + along * sin + across * cos)
  switch (kind) {
    case 'bar':
      return { d: `M${at(-1.5, -size * 0.7)}L${at(-1.5, size * 0.7)}`, filled: false }
    case 'open-arrow':
      return { d: `M${at(-size, -size * 0.55)}L${at(0, 0)}L${at(-size, size * 0.55)}`, filled: false }
    case 'diamond':
      return { d: `M${at(0, 0)}L${at(-size * 0.55, -size * 0.5)}L${at(-size * 1.1, 0)}L${at(-size * 0.55, size * 0.5)}Z`, filled: true }
    case 'dot':
      return { d: `M${at(0, 0)}L${at(-size * 0.4, -size * 0.4)}L${at(-size * 0.8, 0)}L${at(-size * 0.4, size * 0.4)}Z`, filled: true }
    case 'none':
      return { d: '', filled: false }
    default:
      return { d: `M${at(0, 0)}L${at(-size, -size * 0.5)}L${at(-size, size * 0.5)}Z`, filled: true }
  }
}

// ---- Node shapes (graphs) ----

export const NODE_SHAPES = Object.freeze(['rounded', 'rect', 'pill', 'ellipse', 'hexagon', 'diamond', 'octagon', 'parallelogram'])

/** Default shape and series colour per knowledge-base entity type. */
export const TYPE_LOOKS = Object.freeze({
  compound: { shape: 'rounded', series: 0 },
  enzyme: { shape: 'hexagon', series: 2 },
  reaction: { shape: 'rect', series: 5 },
  pathway: { shape: 'pill', series: 3 },
  state: { shape: 'ellipse', series: 4 },
  disease: { shape: 'octagon', series: 1 },
  outcome: { shape: 'diamond', series: 1 },
  system: { shape: 'rect', series: 6 },
  intervention: { shape: 'parallelogram', series: 2 },
  claim: { shape: 'rounded', series: 4 },
  article: { shape: 'rect', series: 7 }
})

/** { shape, series } for a type id, falling back to a neutral rounded box. */
export function typeLook(type, overrides = {}) {
  return overrides[type] ?? TYPE_LOOKS[type] ?? { shape: 'rounded', series: 6 }
}

/** Path of a node outline of size (w, h) centred on the origin. */
export function shapePath(shape, w, h) {
  const x = w / 2
  const y = h / 2
  switch (shape) {
    case 'rect':
      return `M${point(-x, -y)}H${round(x)}V${round(y)}H${round(-x)}Z`
    case 'pill': {
      const r = y
      return `M${point(-x + r, -y)}H${round(x - r)}A${round(r)} ${round(r)} 0 0 1 ${point(x - r, y)}H${round(-x + r)}A${round(r)} ${round(r)} 0 0 1 ${point(-x + r, -y)}Z`
    }
    case 'ellipse':
      return `M${point(-x, 0)}A${round(x)} ${round(y)} 0 1 0 ${point(x, 0)}A${round(x)} ${round(y)} 0 1 0 ${point(-x, 0)}Z`
    case 'hexagon': {
      const k = Math.min(y, x / 3)
      return `M${point(-x + k, -y)}H${round(x - k)}L${point(x, 0)}L${point(x - k, y)}H${round(-x + k)}L${point(-x, 0)}Z`
    }
    case 'diamond': {
      const k = Math.min(x * 0.28, y)
      return `M${point(-x + k, 0)}L${point(0, -y)}L${point(x - k, 0)}L${point(0, y)}Z`
    }
    case 'octagon': {
      const k = Math.min(y * 0.55, x / 3)
      return `M${point(-x + k, -y)}H${round(x - k)}L${point(x, -y + k)}V${round(y - k)}L${point(x - k, y)}H${round(-x + k)}L${point(-x, y - k)}V${round(-y + k)}Z`
    }
    case 'parallelogram': {
      const k = Math.min(y * 0.6, x / 3)
      return `M${point(-x + k, -y)}H${round(x)}L${point(x - k, y)}H${round(-x)}Z`
    }
    default: {
      const r = Math.min(y * 0.45, 10)
      return `M${point(-x + r, -y)}H${round(x - r)}Q${point(x, -y)} ${point(x, -y + r)}V${round(y - r)}Q${point(x, y)} ${point(x - r, y)}H${round(-x + r)}Q${point(-x, y)} ${point(-x, y - r)}V${round(-y + r)}Q${point(-x, -y)} ${point(-x + r, -y)}Z`
    }
  }
}

// ---- Evidence grade badges ----

export const GRADE_STYLES = Object.freeze({
  established: Object.freeze({ id: 'established', letter: 'E', label: 'Established' }),
  plausible: Object.freeze({ id: 'plausible', letter: 'P', label: 'Plausible' }),
  speculative: Object.freeze({ id: 'speculative', letter: 'S', label: 'Speculative' }),
  'conversation-only': Object.freeze({ id: 'conversation-only', letter: 'C', label: 'Conversation only' })
})

/** { id, letter, label, cls } for a grade id; unknown grades read as "?" with the neutral colour. */
export function gradeStyle(grade) {
  const known = GRADE_STYLES[grade]
  const id = known ? (grade === 'conversation-only' ? 'conversation' : grade) : 'conversation'
  return { ...(known ?? { id: String(grade), letter: '?', label: String(grade) }), cls: `viz-grade-${id}` }
}
