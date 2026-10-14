// Geometry, keyboard order and text of the article timeline (year x design). Pure functions.
//
//   items: [{ id, title, year, group, detail?, href? }]   groups: [{ id, label }]
import { formatNumber, scaleFor } from './scale.js'
import { seriesLook } from './shapes.js'

export const DOT_STEP = 13
const LANE_PAD = 14

/** Groups in the given order, or by first appearance, each with its look and count. */
export function groupsOf(items, groups) {
  const list = groups ?? [...new Set(items.map((item) => item.group))].map((id) => ({ id, label: String(id) }))
  return list.map((group, index) => ({ ...group, look: seriesLook(group.look ?? index), count: items.filter((item) => item.group === group.id).length }))
}

export function yearTicks(first, last, width) {
  const span = Math.max(last - first, 1)
  const maxTicks = Math.max(2, Math.floor((width - 120) / 56))
  const steps = [1, 2, 5, 10, 20, 25, 50]
  const step = steps.find((candidate) => span / candidate <= maxTicks) ?? 100
  const ticks = []
  for (let year = Math.ceil(first / step) * step; year <= last; year += step) ticks.push(year)
  return ticks.length ? ticks : [first, last]
}

export function buildTimeline({ items, groups, hidden = [], width = 720 }) {
  const all = groupsOf(items, groups)
  const lanes = all.filter((group) => !hidden.includes(group.id))
  const visible = items.filter((item) => !hidden.includes(item.group))
  const years = (visible.length ? visible : items).map((item) => item.year)
  const first = Math.min(...years, Infinity)
  const last = Math.max(...years, -Infinity)
  const [from, to] = Number.isFinite(first) ? [first, last] : [0, 1]
  const left = width >= 520 ? 132 : 14
  const stackedLabels = left === 14
  const right = width - 18
  const x = scaleFor({ domain: [from - 0.5, to + 0.5], range: [left, right] })

  // On a narrow chart neighbouring years share a column so markers do not overlap sideways.
  const perYear = (right - left) / (to - from + 1)
  const bin = Math.max(1, Math.ceil(13 / perYear))
  const bucketOf = (year) => Math.floor((year - from) / bin)
  const columnX = (year) => x(from + bucketOf(year) * bin + (bin - 1) / 2)

  let cursor = 8
  const laneBoxes = lanes.map((lane) => {
    const mine = visible.filter((item) => item.group === lane.id)
    const stacks = new Map()
    const dots = mine.map((item) => {
      const key = bucketOf(item.year)
      const stack = stacks.get(key) ?? 0
      stacks.set(key, stack + 1)
      return { item, stack, key }
    })
    const tallest = Math.max(1, ...stacks.values())
    const heightOfLane = (stackedLabels ? 18 : 0) + tallest * DOT_STEP + LANE_PAD
    const top = cursor
    cursor += heightOfLane + 4
    const baseline = top + (stackedLabels ? 18 : 0) + LANE_PAD / 2 + (tallest * DOT_STEP) / 2
    return {
      id: lane.id,
      label: lane.label,
      look: lane.look,
      top,
      height: heightOfLane,
      labelY: stackedLabels ? top + 12 : baseline + 4,
      count: mine.length,
      dots: dots.map(({ item, stack, key }) => {
        const cx = bin === 1 ? x(item.year) : columnX(item.year)
        const offset = (stack - (stacks.get(key) - 1) / 2) * DOT_STEP
        return { id: item.id, item, x: cx, y: baseline + offset, group: lane.id }
      })
    }
  })
  const axisY = cursor + 4
  const order = laneBoxes.flatMap((lane) => [...lane.dots].sort((a, b) => a.item.year - b.item.year || a.y - b.y))
  return {
    width,
    height: axisY + 34,
    left,
    right,
    axisY,
    lanes: laneBoxes,
    order,
    ticks: yearTicks(from, to, width).map((year) => ({ year, pos: x(year), label: String(year) })),
    range: [from, to]
  }
}

/** Next dot id for a key press, or null. `order` is `model.order`. */
export function stepDot(order, currentId, key) {
  const index = order.findIndex((dot) => dot.id === currentId)
  if (index < 0) return order[0]?.id ?? null
  const here = order[index]
  const sameLane = order.filter((dot) => dot.group === here.group)
  const position = sameLane.indexOf(here)
  switch (key) {
    case 'ArrowRight': return sameLane[Math.min(position + 1, sameLane.length - 1)].id
    case 'ArrowLeft': return sameLane[Math.max(position - 1, 0)].id
    case 'Home': return sameLane[0].id
    case 'End': return sameLane.at(-1).id
    case 'ArrowDown':
    case 'ArrowUp': {
      const lanes = [...new Set(order.map((dot) => dot.group))]
      const target = lanes[lanes.indexOf(here.group) + (key === 'ArrowDown' ? 1 : -1)]
      if (target === undefined) return here.id
      return order.filter((dot) => dot.group === target).reduce((best, dot) => (Math.abs(dot.x - here.x) < Math.abs(best.x - here.x) ? dot : best)).id
    }
    default: return null
  }
}

export function describeTimeline({ items, groups, hidden = [] }) {
  const visible = items.filter((item) => !hidden.includes(item.group))
  if (!visible.length) return 'No articles to show.'
  const years = visible.map((item) => item.year)
  const lanes = groupsOf(items, groups).filter((group) => !hidden.includes(group.id))
  const per = lanes.map((group) => `${group.label} ${visible.filter((item) => item.group === group.id).length}`).join(', ')
  return `${visible.length} articles from ${formatNumber(Math.min(...years))} to ${formatNumber(Math.max(...years))}, by design: ${per}.`
}

/** Table rows by year, newest first, one cell per design with the count. */
export function timelineTable({ items, groups }) {
  const lanes = groupsOf(items, groups)
  const years = [...new Set(items.map((item) => item.year))].sort((a, b) => b - a)
  return {
    heads: lanes.map((lane) => lane.label),
    rows: years.map((year) => ({
      year,
      cells: lanes.map((lane) => {
        const mine = items.filter((item) => item.year === year && item.group === lane.id)
        return mine.length ? mine.map((item) => item.title).join('; ') : ''
      })
    }))
  }
}
