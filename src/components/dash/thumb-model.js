// Geometry of the little pictures on the dashboard cards: lines of a precomputed result (a sparkline with a reference
// line) and a mini-map of a hand-laid layout. Pure; DashThumb.vue draws them. Data: src/sim/data/dash-thumbs.json.

const round = (x) => Math.round(x * 10) / 10

/** Polylines for series sharing one y scale: [{ d, baseline, label }] in a w x h box with `pad` around. */
export function lineThumb(series, { width = 160, height = 56, pad = 5 } = {}) {
  const all = series.flatMap((s) => s.values).filter(Number.isFinite)
  const low = Math.min(...all)
  const high = Math.max(...all)
  const span = high - low || 1
  return series.map((s) => ({
    label: s.label,
    baseline: Boolean(s.baseline),
    d: s.values.map((v, i) => `${i ? 'L' : 'M'}${round(pad + (i / (s.values.length - 1)) * (width - 2 * pad))} ${round(height - pad - ((v - low) / span) * (height - 2 * pad))}`).join('')
  }))
}

/** Edges as one path and nodes as dots, scaled into a w x h box keeping the layout's aspect ratio. */
export function mapThumb({ box, nodes, edges }, { width = 160, height = 56, pad = 4 } = {}) {
  const scale = Math.min((width - 2 * pad) / box[0], (height - 2 * pad) / box[1])
  const dx = (width - box[0] * scale) / 2
  const dy = (height - box[1] * scale) / 2
  const x = (v) => round(dx + v * scale)
  const y = (v) => round(dy + v * scale)
  return {
    d: edges.map(([a, b, c, d]) => `M${x(a)} ${y(b)}L${x(c)} ${y(d)}`).join(''),
    dots: nodes.map(([a, b, reaction]) => ({ x: x(a), y: y(b), reaction: reaction === 1 }))
  }
}

/** Vertical bars [{ x, y, width, height }] for [{ value }] in a w x h box. */
export function barThumb(bars, { width = 160, height = 56, pad = 5, gap = 3 } = {}) {
  const top = Math.max(...bars.map((b) => b.value), 1)
  const w = (width - 2 * pad - gap * (bars.length - 1)) / bars.length
  return bars.map((b, i) => {
    const h = Math.max(1.5, (b.value / top) * (height - 2 * pad))
    return { x: round(pad + i * (w + gap)), y: round(height - pad - h), width: round(w), height: round(h) }
  })
}

/** Sentence for the picture's accessible name. */
export const thumbText = (title, series = [], bars = []) => (bars.length ? `${title}: ${bars.map((b) => `${b.label} ${b.value}`).join(', ')}.` : `${title}${series.length ? `. Lines: ${series.map((s) => s.label).join(', ')}.` : '. A small map of the network.'}`)
