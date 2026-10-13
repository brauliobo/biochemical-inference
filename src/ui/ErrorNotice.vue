<script setup vapor>
// The one way to show a failed operation: an alert with a title, the error
// message, optional extra explanation (default slot) and a retry button.
//
//   ErrorNotice(title="Atlas unavailable" :message="message" retry-label="Retry" @retry="load")
//     p No atlas facts are inferred.
defineProps({
  title: { type: String, default: '' },
  message: { type: String, default: '' },
  retryLabel: { type: String, default: '' }
})
const emit = defineEmits(['retry'])
</script>

<template lang="pug">
.notice.notice--danger.stack.stack--tight(role="alert")
  strong(v-if="title") {{ title }}
  p(v-if="message") {{ message }}
  slot
  button.button.button--secondary(v-if="retryLabel" type="button" @click="emit('retry')") {{ retryLabel }}
</template>
