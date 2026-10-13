import { defineVaporAsyncComponent } from 'vue'
import LoadError from './LoadError.vue'

const cache = new Map()

// Code-split component for a `() => import(...)` loader. One component per
// loader, so re-rendering a route never reloads or remounts the view.
export function lazyComponent(load) {
  if (!cache.has(load)) cache.set(load, defineVaporAsyncComponent({ loader: load, errorComponent: LoadError }))
  return cache.get(load)
}
