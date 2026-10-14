<script setup vapor>
import { computed } from 'vue'
import ErrorNotice from '../../ui/ErrorNotice.vue'
import LiveMessage from '../../ui/LiveMessage.vue'
import Notice from '../../ui/Notice.vue'

// What a model run is doing: a polite status while it runs, an alert if it failed, and the engine's warnings.
//
//   RunStatus(:running="running" :error="error" :warnings="warnings" what="the stomach model")
const props = defineProps({
  running: { type: Boolean, default: false },
  error: { type: [Error, Object, String], default: null },
  warnings: { type: Array, default: () => [] },
  what: { type: String, default: 'the model' }
})
const message = computed(() => (props.error ? '' : props.running ? `Running ${props.what}.` : ''))
const problem = computed(() => (props.error ? (props.error.message ?? String(props.error)) : ''))
</script>

<template lang="pug">
.stack.stack--tight
  LiveMessage(:text="message")
  ErrorNotice(v-if="error" :title="`Could not run ${what}`" :message="problem")
  Notice(v-if="warnings.length" tone="warning" role="status" title="The solver reported warnings")
    ul.plain-list
      li(v-for="(warning, index) in warnings" :key="index") {{ typeof warning === 'string' ? warning : (warning.message ?? JSON.stringify(warning)) }}
</template>
