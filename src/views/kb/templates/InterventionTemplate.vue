<script setup vapor>
import { computed } from 'vue'
import CausalMini from '../../../components/kb/CausalMini.vue'
import DoseBars from '../../../components/kb/DoseBars.vue'
import EffectTable from '../../../components/kb/EffectTable.vue'
import EntityHeader from '../../../components/kb/EntityHeader.vue'
import EntityLink from '../../../components/kb/EntityLink.vue'
import EvidenceStrip from '../../../components/kb/EvidenceStrip.vue'
import NotesDrawer from '../../../components/kb/NotesDrawer.vue'
import QuantChips from '../../../components/kb/QuantChips.vue'
import Panel from '../../../ui/Panel.vue'
import { conditionsFor, effectRows } from '../../../kb/causal-view.js'
import { chipsFor, doseRows } from '../../../kb/quantities.js'

// An intervention (a supplement, a drug, a diet or a test): usual doses against the upper limits of what it
// delivers, the signed effects it has (what it increases, decreases, mitigates and aggravates) as a table and a
// small graph, the cautions as badges, and the forms and content fractions as chips. Prose is collapsed
// under "Notes & sources".
const props = defineProps({ model: { type: Object, required: true } })

const doses = computed(() => doseRows(props.model.id))
const effects = computed(() => effectRows(props.model.id))
const cautions = computed(() => conditionsFor(props.model.id).filter((group) => ['Contraindicated in', 'Aggravates'].includes(group.label)))
const forms = computed(() => String(props.model.entity.facts?.forms ?? '').split(/[;]/).map((item) => item.trim()).filter(Boolean))
const contents = computed(() => chipsFor(props.model.id, { kinds: ['content-fraction', 'conversion', 'composition', 'molar-mass', 'approved-dose'], limit: 10 }))
</script>

<template lang="pug">
.stack.stack--loose(data-testid="entity-visuals" data-template="intervention")
  EntityHeader(:model="model")
  EvidenceStrip(:model="model")
  DoseBars(:data="doses" title="Usual doses against upper limits" chart-title="Doses and upper limits" lede="Usual and trial doses as brackets; the upper level of what the product delivers as a bar. Reference points, not advice on what to take.")
  Panel(v-if="effects.length" title="What it does" data-visual="effect-table" data-testid="effects")
    EffectTable(:rows="effects" caption="Signed effects of this intervention")
  CausalMini(:entity-id="model.id" title="Effects in the causal map" direction="down")
  Panel(v-if="cautions.length" title="Cautions" data-visual="cautions" data-testid="cautions")
    .stack.stack--tight
      .cluster(v-for="group in cautions" :key="group.label")
        strong.chip-group__label {{ group.label }}
        ul.chip-list(:aria-label="group.label")
          li(v-for="item in group.items" :key="item.id")
            EntityLink.chip.chip--caution(:id="item.id" :label="item.name")
  Panel(v-if="forms.length || contents.length" title="Forms and contents" data-visual="quantity-chips")
    .stack.stack--tight
      .cluster(v-if="forms.length")
        strong.chip-group__label Forms
        ul.chip-list(aria-label="Forms")
          li(v-for="form in forms" :key="form")
            span.badge {{ form }}
      QuantChips(:chips="contents" label="Contents and conversions")
  NotesDrawer(:model="model")
</template>
