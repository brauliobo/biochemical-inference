import { reactive } from 'vue'

// Shared reactive state for Vapor test hosts: live props and recorded events.
export const hostState = reactive({ props: {}, selected: [] })
