<script setup vapor>
// A table with a visible caption and column headers, inside a keyboard
// focusable, named scroll region so wide tables never overflow the page. The
// default slot is the body rows; a row's first cell should be
// `th(scope="row")`. When `count` is 0 and `emptyText` is set, a single
// full-width row explains the empty state.
//
//   DataTable(caption="Attempts" :columns="['Name', 'State']" :count="items.length" empty-text="No attempts.")
//     tr(v-for="item in items" :key="item.id")
//       th(scope="row") {{ item.name }}
//       td {{ item.state }}
defineProps({
  caption: { type: String, required: true },
  columns: { type: Array, required: true },
  count: { type: Number, default: undefined },
  emptyText: { type: String, default: '' },
  busy: { type: Boolean, default: false }
})
</script>

<template lang="pug">
.data-table(role="region" tabindex="0" :aria-label="caption")
  table(:aria-busy="busy")
    caption {{ caption }}
    thead
      tr
        th(v-for="column in columns" :key="column" scope="col") {{ column }}
    tbody
      slot
      tr(v-if="emptyText && count === 0")
        td(:colspan="columns.length") {{ emptyText }}
</template>
