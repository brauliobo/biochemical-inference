// Pure helpers for the guided-path step view (views/kb/KbPathView.vue).
import { guidedPathPath } from './paths.js'

/**
 * The step number a `?step=` value asks for, kept inside 1..length.
 * Anything that is not a whole number (missing, "abc", "2.5", "0") falls back to the first step;
 * a number past the end falls back to the last, so a stale link still lands somewhere sensible.
 */
export function clampStep(raw, length) {
  if (!Number.isInteger(length) || length < 1) return 1
  const text = String(raw ?? '').trim()
  if (!/^\d+$/.test(text)) return 1
  const value = Number(text)
  if (value < 1) return 1
  return Math.min(value, length)
}

/** "Step 3 of 12" */
export const stepLabel = (step, length) => `Step ${step} of ${length}`

/**
 * What the step view needs around the current step: its position, neighbours and links.
 * `path` is getPath()'s model; `raw` the `step` query value.
 */
export function stepView(path, raw) {
  const step = clampStep(raw, path.length)
  const at = (position) => (position >= 1 && position <= path.length ? path.steps[position - 1] : null)
  const previous = at(step - 1)
  const next = at(step + 1)
  return {
    step,
    length: path.length,
    label: stepLabel(step, path.length),
    current: at(step),
    previous: previous && { ...previous, to: guidedPathPath(path.id, previous.position) },
    next: next && { ...next, to: guidedPathPath(path.id, next.position) },
    first: step === 1,
    last: step === path.length
  }
}
