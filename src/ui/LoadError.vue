<script setup vapor>
function reload() {
  window.location.reload()
}
</script>

<template lang="pug">
.notice.notice--danger.stack.stack--tight(role="alert")
  p This page could not be loaded. Check your connection, then reload.
  button.button.button--secondary(type="button" @click="reload") Reload
</template>
