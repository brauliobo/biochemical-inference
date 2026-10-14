// Spatial keyboard navigation over points on a plane. Pure functions.

const DIRECTIONS = Object.freeze({
  ArrowRight: [1, 0],
  ArrowLeft: [-1, 0],
  ArrowDown: [0, 1],
  ArrowUp: [0, -1]
})

/**
 * The point to move to from `currentId` for an arrow key: the nearest point
 * inside a 100-degree cone around that direction, with a penalty for being off
 * axis. Returns the current id when nothing lies that way, null for other keys.
 * points: [{ id, x, y }]
 */
export function nearestInDirection(points, currentId, key) {
  const direction = DIRECTIONS[key]
  if (!direction) return null
  const here = points.find((point) => point.id === currentId)
  if (!here) return points[0]?.id ?? null
  let best = null
  let bestScore = Infinity
  for (const point of points) {
    if (point.id === currentId) continue
    const dx = point.x - here.x
    const dy = point.y - here.y
    const along = dx * direction[0] + dy * direction[1]
    if (along <= 0) continue
    const across = Math.abs(dx * direction[1] - dy * direction[0])
    if (across > along * 1.2) continue
    const score = along + across * 2
    if (score < bestScore || (score === bestScore && String(point.id) < String(best))) {
      best = point.id
      bestScore = score
    }
  }
  return best ?? currentId
}
