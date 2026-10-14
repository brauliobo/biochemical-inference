<script setup vapor>
import { computed } from 'vue'
import Badge from '../../ui/Badge.vue'
import Disclosure from '../../ui/Disclosure.vue'

// Does the reaction balance? One badge with the verdict in words (atoms, hydrogens and charge; heavy
// atoms only; not balanced; not checked) and, behind a disclosure, the element-by-element count on
// each side. `balance` comes from kb/balance.js. Nothing is drawn when no formula is available at all.
const props = defineProps({ balance: { type: Object, required: true } })

const TONES = { balanced: 'success', 'heavy-atoms': 'info', unbalanced: 'danger', unknown: '' }
const TITLES = { balanced: 'Balanced: atoms, hydrogens and charge', 'heavy-atoms': 'Heavy atoms balance', unbalanced: 'Does not balance', unknown: 'Balance not checked' }
const checked = computed(() => props.balance.elements.length > 0)
</script>

<template lang="pug">
.stack.stack--tight(v-if="checked || balance.status === 'unknown'" data-visual="balance")
  .cluster
    Badge(:label="TITLES[balance.status]" :tone="TONES[balance.status]")
    span.muted {{ balance.words }}
  Disclosure(v-if="checked" summary="Show the count of each element")
    table
      caption.visually-hidden Atoms and charge on each side
      thead
        tr
          th(scope="col") Element
          th(scope="col") Left side
          th(scope="col") Right side
          th(scope="col") Result
      tbody
        tr(v-for="row in balance.elements" :key="row.element")
          th(scope="row") {{ row.element }}
          td {{ row.left }}
          td {{ row.right }}
          td {{ row.balanced ? 'equal' : 'differs' }}
        tr
          th(scope="row") Charge
          td {{ balance.charge.left }}
          td {{ balance.charge.right }}
          td {{ balance.charge.balanced ? 'equal' : 'differs' }}
</template>
