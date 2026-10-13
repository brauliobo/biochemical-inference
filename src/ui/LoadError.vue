<script setup vapor>
import ErrorNotice from './ErrorNotice.vue'

// Shown in place of a route whose code-split chunk failed to load.
function reload() {
  window.location.reload()
}
</script>

<template lang="pug">
ErrorNotice(message="This page could not be loaded. Check your connection, then reload." retry-label="Reload" @retry="reload")
</template>
