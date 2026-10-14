// Label placement shared by the charts: put text labels at positions along an
// axis into rows so they do not overlap, flipping the anchor near the edge.
import { textWidth } from './scale.js'

/**
 * items: [{ pos, text }] sorted by `pos`. Returns each with { anchor, row, from, to }.
 * Labels are packed into the first row where they fit; with no room they fall
 * back to row (index % rowLimit).
 */
export function stagger(items, { right = Infinity, rowLimit = 3, pad = 6, fontSize = 12 } = {}) {
  const ends = []
  return items.map((item, order) => {
    const width = textWidth(item.text, fontSize)
    const anchor = item.pos + width > right ? 'end' : 'start'
    const from = anchor === 'start' ? item.pos : item.pos - width
    const to = anchor === 'start' ? item.pos + width : item.pos
    let row = ends.findIndex((end) => end + pad < from)
    if (row === -1) row = ends.length < rowLimit ? ends.length : order % rowLimit
    ends[row] = Math.max(to, ends[row] ?? -Infinity)
    return { ...item, anchor, row, from, to }
  })
}
