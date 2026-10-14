<script setup vapor>
import InputField from '../../ui/InputField.vue'
import SliderField from '../../viz/SliderField.vue'
import EvidenceChips from './EvidenceChips.vue'
import { GLYCINE_ACID_EVIDENCE } from './gut-presets.js'

// The sliders of the gut/acid dashboard. `controls` is the page's reactive object (see GUT_DEFAULTS); the
// glycine-raises-acid control is a hypothesis, kept apart and shown with the human data about it.
defineProps({ controls: { type: Object, required: true } })
const evidence = GLYCINE_ACID_EVIDENCE.map((item) => ({ id: item.article, label: item.label }))
</script>

<template lang="pug">
.stack
  .dg-controls
    SliderField(id="gut-ppi" label="PPI: acid pumps blocked" unit="%" :min="0" :max="100" :step="5" v-model="controls.ppi" hint="Omeprazole 20 mg blocks about 60%.")
    SliderField(id="gut-bicarbonate" label="Sodium bicarbonate" unit="mg" :min="0" :max="2000" :step="50" v-model="controls.bicarbonateMg" hint="Swallowed at hour 0.5.")
    SliderField(id="gut-betaine" label="Betaine HCl" unit="g" :min="0" :max="3.9" :step="0.65" v-model="controls.betaineHclG" hint="One 650 mg capsule gives 4.2 mmol H+, with the meal.")
    SliderField(id="gut-air" label="Swallowed air" unit="x" :min="0" :max="3" :step="0.25" v-model="controls.airSwallowX" hint="1 = about 20 mL an hour, net (assumed).")
    .stack.stack--tight
      InputField(id="gut-meal" type="checkbox" label="Eat a 400 mL meal at hour 1" v-model="controls.meal")
      InputField(id="gut-alginate" type="checkbox" label="Alginate-carbonate antacid, 20 mL" v-model="controls.alginate")
  .dg-hypothesis.stack
    strong Hypothesis, not a finding
    SliderField(id="gut-glycine-acid" label="Glycine raises acid output by" unit="%" :min="0" :max="200" :step="10" v-model="controls.glycineAcidBoostPct" hint="Default 0. No human study measured this size.")
    EvidenceChips(label="Human data on glycine and stomach acid" :items="evidence")
</template>
