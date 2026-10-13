<script setup vapor>
import { KB_PATH } from '../../kb/paths.js'
import RouterLink from '../../ui/RouterLink.vue'
import SearchBox from './SearchBox.vue'

// A helpful 404 inside the knowledge base: says what was not found, offers a
// search seeded with the words from the address, and the ways back.
defineProps({
  title: { type: String, default: 'We could not find that entry' },
  what: { type: String, default: '' },
  query: { type: String, default: '' }
})
</script>

<template lang="pug">
.stack.stack--loose
  header.stack
    h1 {{ title }}
    p.lede(v-if="what") Nothing in the knowledge base matches “{{ what }}”. It may have been renamed, or the link may be mistyped.
    p.lede(v-else) It may have been renamed, or the link may be mistyped.
  SearchBox(label="Search for what you were looking for" :initial-query="query")
  .cluster
    RouterLink.button(:to="KB_PATH") Browse the knowledge base
    RouterLink.button.button--secondary(to="/") Go to the home page
</template>
