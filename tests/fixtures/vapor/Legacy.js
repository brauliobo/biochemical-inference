import { defineComponent, h } from 'vue'

// A virtual-DOM component, standing in for the not-yet-migrated workbenches.
export default defineComponent({
  emits: ['picked'],
  setup(_props, { emit }) {
    return () => h('button', { class: 'legacy', onClick: () => emit('picked', { id: 42 }) }, 'legacy')
  }
})
