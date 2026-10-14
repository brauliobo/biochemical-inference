<script setup vapor>
import { computed } from 'vue'
import Notice from '../../ui/Notice.vue'
import ScenarioPicker from '../../viz/ScenarioPicker.vue'
import { medianOf, percent } from './robust-model.js'

// The contested constants of the model as switches, with a warning that they change conclusions and the size of the
// change from the ensemble table. `variants` is the current selection ({ key: option }); `update(key, option)` is emitted.
//
//   VariantSwitches(:switches="variantSwitches()" :variants="state.variants" :rows="robustness.rows" @update="setVariant")
const props = defineProps({
  switches: { type: Array, required: true },
  variants: { type: Object, required: true },
  rows: { type: Array, default: () => [] },
  keys: { type: Array, default: () => ['gnmtGlycineKm', 'bhmtBetaineKm'] }
})
const emit = defineEmits(['update'])

const SHORT = {
  reed130: 'Km 130 µM (Reed)', luka2000: 'Km 2 mM (Luka)', reed100: 'Km 100 µM (Reed)', human2200: 'Km 2.2 mM (human enzyme)',
  reed2015: 'Reed 2015 liver split', b2budget: 'Whole-body budget split'
}
const TITLE = { gnmtGlycineKm: 'GNMT Km for glycine', bhmtBetaineKm: 'BHMT Km for betaine', samConsumerBudget: 'Who spends the methyl groups' }
const shown = computed(() => props.switches.filter((s) => props.keys.includes(s.key)).map((s) => ({
  ...s, title: TITLE[s.key] ?? s.label, options: s.options.map((o) => ({ value: o.value, label: SHORT[o.value] ?? o.label })), changed: props.variants[s.key] !== s.default
})))
const evidence = computed(() => ({
  gnmtGlycineKm: [medianOf(props.rows, 'g10-reed', 'trough'), medianOf(props.rows, 'g10-luka', 'trough')],
  bhmtBetaineKm: [medianOf(props.rows, 'bet6-reed', 'thcy'), medianOf(props.rows, 'bet6-human', 'thcy')]
}))
const sentence = (key) => {
  const [a, b] = evidence.value[key] ?? []
  if (a === null || a === undefined || b === null || b === undefined) return ''
  return key === 'gnmtGlycineKm'
    ? `A 10 g glycine dose changes the trough SAM:SAH by ${percent(a)} with Km 130 µM and by ${percent(b)} with Km 2 mM (median of 100 parameter sets).`
    : `Betaine 6 g per day changes plasma tHcy by ${percent(a)} with Km 100 µM and by ${percent(b)} with Km 2.2 mM (median of 100 parameter sets); the trials saw about −20%.`
}
</script>

<template lang="pug">
.dash-variants.stack
  Notice(tone="warning" role="note" title="These switches change the conclusions")
    p Two enzyme constants are contested in the literature. Which one you pick decides whether glycine moves SAM:SAH and whether betaine lowers homocysteine.
  .dash-variants__group.stack.stack--tight(v-for="item in shown" :key="item.key")
    ScenarioPicker(:label="item.title" :options="item.options" :model-value="variants[item.key]" @change="(value) => emit('update', item.key, value)")
    p.muted(v-if="sentence(item.key)") {{ sentence(item.key) }}
    p.dash-variants__changed(v-if="item.changed" role="status") Not the default: the charts above use this choice.
</template>
