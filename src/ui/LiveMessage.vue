<script setup vapor>
// A polite live region for what an asynchronous operation just did. Hidden
// (screen readers only) by default; `visible` shows the text as a notice. The
// region stays in the DOM, empty, so a later message is announced.
//
//   LiveMessage(:text="announcement")                    result of a click
//   LiveMessage(visible :text="busy ? 'Loading…' : ''")  progress notice
defineProps({
  text: { type: String, default: '' },
  visible: { type: Boolean, default: false }
})
</script>

<template lang="pug">
p.visually-hidden(v-if="!visible" role="status" aria-atomic="true") {{ text }}
div(v-else role="status")
  p.notice(v-if="text") {{ text }}
</template>
