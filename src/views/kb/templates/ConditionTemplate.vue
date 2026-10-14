<script setup vapor>
import { computed } from 'vue'
import CausalMini from '../../../components/kb/CausalMini.vue'
import ConditionChips from '../../../components/kb/ConditionChips.vue'
import EffectTable from '../../../components/kb/EffectTable.vue'
import EntityHeader from '../../../components/kb/EntityHeader.vue'
import EntityLink from '../../../components/kb/EntityLink.vue'
import EvidenceStrip from '../../../components/kb/EvidenceStrip.vue'
import NotesDrawer from '../../../components/kb/NotesDrawer.vue'
import QuantChips from '../../../components/kb/QuantChips.vue'
import TypeBadge from '../../../components/kb/TypeBadge.vue'
import Disclosure from '../../../ui/Disclosure.vue'
import Panel from '../../../ui/Panel.vue'
import { getEntity, graph } from '../../../knowledge/index.js'
import { conditionsFor, effectRows } from '../../../kb/causal-view.js'
import { chipsFor } from '../../../kb/quantities.js'

// A state, disease, outcome or system: the layered causal graph around it (what leads to it on the left, what it
// leads to on the right, interventions at the top), the interventions and compounds that help or worsen it
// highlighted as chips, the reference values of what measures it, and every signed link as a table. Prose is
// collapsed under "Notes & sources".
const props = defineProps({ model: { type: Object, required: true } })

const rows = computed(() => effectRows(props.model.id))
const helps = computed(() => rows.value.filter((row) => row.phrase === 'Mitigated by'))
const worsens = computed(() => rows.value.filter((row) => row.phrase === 'Aggravated by'))
const conditions = computed(() => conditionsFor(props.model.id).filter((group) => !['Mitigated by', 'Aggravated by'].includes(group.label)))
const own = computed(() => chipsFor(props.model.id, { limit: 8 }))
const measured = computed(() => graph.links(props.model.id)
  .filter((link) => link.rel === 'measured-by' && getEntity(link.other))
  .flatMap((link) => chipsFor(link.other, { kinds: ['reference-range', 'threshold', 'concentration', 'ratio'], limit: 4 })
    .map((chip) => ({ ...chip, id: `${link.other}-${chip.id}`, label: `${getEntity(link.other).name.replace(/\s*\(.*$/, '')}: ${chip.label}` }))))
const quantities = computed(() => [...own.value, ...measured.value])
</script>

<template lang="pug">
.stack.stack--loose(data-testid="entity-visuals" data-template="condition")
  EntityHeader(:model="model")
  EvidenceStrip(:model="model")
  CausalMini(:entity-id="model.id" title="What leads to it and what it leads to" :limit="28")
  Panel(v-if="helps.length || worsens.length" title="What helps and what worsens it" data-visual="helps-worsens" data-testid="helps-worsens")
    .grid
      .stack.stack--tight(v-if="helps.length")
        h3 Helps
        ul.chip-list(aria-label="Mitigated by")
          li(v-for="row in helps" :key="row.id")
            span.cluster.cluster--tight
              span.sign.sign--mitigate
                span.sign__glyph(aria-hidden="true") eases
              EntityLink.chip(:id="row.id" :label="row.name")
              TypeBadge(:type="row.type")
              span.badge(v-if="row.hypothesis") Hypothesis
      .stack.stack--tight(v-if="worsens.length")
        h3 Worsens
        ul.chip-list(aria-label="Aggravated by")
          li(v-for="row in worsens" :key="row.id")
            span.cluster.cluster--tight
              span.sign.sign--aggravate
                span.sign__glyph(aria-hidden="true") worsens
              EntityLink.chip(:id="row.id" :label="row.name")
              TypeBadge(:type="row.type")
              span.badge(v-if="row.hypothesis") Hypothesis
  Panel(v-if="quantities.length" title="Reference values" lede="Numbers recorded for this entry or for the markers that measure it. Open one for its source." data-visual="quantity-chips")
    QuantChips(:chips="quantities" label="Reference values")
  ConditionChips(:groups="conditions" title="Related states, diseases and outcomes")
  Panel(v-if="rows.length" title="Signed links as a table" data-visual="effect-table")
    Disclosure(summary="Show every signed link")
      EffectTable(:rows="rows" caption="Signed links of this entry")
  NotesDrawer(:model="model")
</template>
