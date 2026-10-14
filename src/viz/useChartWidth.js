// Width of the box a chart sits in, so the SVG viewBox can match the pixels it
// is drawn at (text then keeps its real size on a phone instead of shrinking
// with the viewBox). Bind `el` to a block element around the chart:
//
//   const { el, width } = useChartWidth(640)
//   .viz-box(ref="el") svg(:viewBox="`0 0 ${width} 300`")
//
// Before the first measurement, and where there is no layout (tests), `width`
// is the fallback.
import { onBeforeUnmount, onMounted, ref } from 'vue'

export function useChartWidth(fallback = 640, { min = 240, max = 1400 } = {}) {
  const el = ref()
  const width = ref(fallback)
  let observer

  function measure() {
    const measured = el.value?.getBoundingClientRect?.().width
    if (measured && measured > 0) {
      const next = Math.round(Math.min(max, Math.max(min, measured)))
      if (next !== width.value) width.value = next
    }
  }

  onMounted(() => {
    measure()
    if (typeof ResizeObserver !== 'undefined' && el.value) {
      observer = new ResizeObserver(measure)
      observer.observe(el.value)
    }
  })
  onBeforeUnmount(() => observer?.disconnect())

  return { el, width }
}
