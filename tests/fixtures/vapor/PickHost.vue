<script setup vapor>
import { ref } from 'vue'
import SearchBox from '../../../src/components/kb/SearchBox.vue'

// Hosts a pick-mode SearchBox the way a real parent does, and shows what was picked.
const picked = ref('')
</script>

<template lang="pug">
.stack
  SearchBox(mode="pick" label="Pick one" @select="picked = $event.id")
  p.picked {{ picked }}
</template>
