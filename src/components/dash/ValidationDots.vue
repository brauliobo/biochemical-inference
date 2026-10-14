<script setup vapor>
import { computed } from 'vue'
import Disclosure from '../../ui/Disclosure.vue'
import summary from '../../sim/data/validation-summary.json'

// The validation table as one row of dots: green circle = the model agrees with the published number or direction,
// amber diamond = a documented disagreement (its reason is in the list), red square = an unexplained failure.
// The shape and the word in the list carry the meaning as well as the colour.
const GROUPS = { steady: 'Reference state', flux: 'Flux budgets', pk: 'Pharmacokinetics', direction: 'Directions of change', knockout: 'Knockouts', conservation: 'Conservation' }
const KIND = { pass: 'Agrees', mismatch: 'Documented disagreement', fail: 'Unexplained failure', info: 'Information' }
const rows = summary.rows.map((row) => ({ ...row, kind: row.status === 'mismatch' && !row.why ? 'fail' : row.status }))
const count = (kind) => rows.filter((row) => row.kind === kind).length
const grouped = computed(() => Object.entries(GROUPS).map(([id, label]) => ({ id, label, rows: rows.filter((row) => row.group === id) })).filter((group) => group.rows.length))
const line = `${count('pass')} agree, ${count('mismatch')} are documented disagreements, ${count('fail')} unexplained`
</script>

<template lang="pug">
Disclosure(:summary="`Validation: ${count('pass')} of ${summary.total} checks pass`" card)
  .stack
    p.dash-dots(role="img" :aria-label="`Validation dots. ${line}.`")
      span.dash-dot(v-for="row in rows" :key="row.id" :class="`dash-dot--${row.kind}`" aria-hidden="true")
    ul.cluster.plain-list.dash-legend
      li
        span.dash-dot.dash-dot--pass(aria-hidden="true")
        | Agrees ({{ count('pass') }})
      li
        span.dash-dot.dash-dot--mismatch(aria-hidden="true")
        | Documented disagreement ({{ count('mismatch') }})
      li
        span.dash-dot.dash-dot--fail(aria-hidden="true")
        | Unexplained failure ({{ count('fail') }})
    .stack.stack--tight(v-for="group in grouped" :key="group.id")
      strong {{ group.label }}
      ul.plain-list.stack.stack--tight
        li.dash-valid(v-for="row in group.rows" :key="row.id")
          span.dash-dot(:class="`dash-dot--${row.kind}`" aria-hidden="true")
          span
            strong {{ KIND[row.kind] }}.
            | {{ ` ${row.title}` }}
            small.dash-valid__why(v-if="row.why") {{ row.why }}
</template>
