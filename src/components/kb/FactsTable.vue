<script setup vapor>
// Key facts and identifiers as a table. A fact with a url links out to the
// external database; the link text is the value itself.
defineProps({
  facts: { type: Array, required: true },
  caption: { type: String, default: 'Facts and identifiers' }
})
</script>

<template lang="pug">
table(v-if="facts.length")
  caption.visually-hidden {{ caption }}
  tbody
    tr(v-for="fact in facts" :key="fact.key")
      th(scope="row") {{ fact.label }}
      td
        template(v-if="fact.url")
          a(:href="fact.url" rel="noopener noreferrer") {{ fact.value }}
          span.visually-hidden  (external database)
        template(v-else) {{ fact.value }}
</template>
