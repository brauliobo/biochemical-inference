<script setup vapor>
import EntityLink from './EntityLink.vue'

// One quantity as a chip you can open: the summary line is "label: value"; the body says where the
// number comes from (authority, population, basis, whether it is established, the note and the
// source articles). A native <details>, so it works from the keyboard and needs no script.
//
// `chip` comes from kb/quantities.js chipFor(), or is { label, text, rows: [{ term, value }], refs, note }.
defineProps({ chip: { type: Object, required: true } })
</script>

<template lang="pug">
details.provenance(:class="{ 'provenance--absent': chip.absent }")
  summary
    span.provenance__label {{ chip.label }}
    strong.provenance__value {{ chip.text }}
  .provenance__body.stack.stack--tight
    dl.provenance__facts
      template(v-for="row in chip.rows" :key="row.term")
        dt {{ row.term }}
        dd {{ row.value }}
      template(v-if="chip.kindLabel")
        dt Kind
        dd {{ chip.kindLabel }}
      template(v-if="chip.authority")
        dt Authority
        dd {{ chip.authority }}
      template(v-if="chip.population")
        dt Population
        dd {{ chip.population }}
      template(v-if="chip.basis")
        dt Basis
        dd {{ chip.basis }}
      template(v-if="chip.target")
        dt About
        dd {{ chip.target }}
      template(v-if="chip.established === false")
        dt Status
        dd Not established: the source states there is no value.
    p.muted(v-if="chip.note") {{ chip.note }}
    .cluster.cluster--tight(v-if="chip.refs?.length")
      span.muted Sources
      ul.chip-list
        li(v-for="ref in chip.refs" :key="ref")
          EntityLink(:id="ref")
    p.muted(v-else-if="chip.derived") Computed from other values in this knowledge base, not quoted from a source.
</template>
