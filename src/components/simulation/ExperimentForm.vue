<script setup vapor>
import { computed } from 'vue'
import { TAXA } from '../../../shared/contracts.js'
import InputField from '../../ui/InputField.vue'
import Panel from '../../ui/Panel.vue'
import SelectField from '../../ui/SelectField.vue'

// Section 02: the bounded controls of one deterministic run.
const props = defineProps({
  model: { type: Object, required: true },
  locked: { type: Boolean, required: true },
  state: { type: String, required: true },
  errors: { type: Object, default: () => ({}) }
})
const taxonId = defineModel('taxonId', { type: Number, required: true })
const preset = defineModel('preset', { type: String, required: true })
const activity = defineModel('activity', { type: Number, required: true })
const duration = defineModel('duration', { type: Number, required: true })
const emit = defineEmits(['run', 'custom-activity'])

const taxa = TAXA.map((taxon) => ({ value: taxon.id, label: `${taxon.name} · ${taxon.scientificName}` }))
const presets = computed(() => props.model.presets.map((item) => ({ value: item.id, label: item.name })))
</script>

<template lang="pug">
Panel(title="Experiment" title-id="experiment-title" eyebrow="02 · Configure")
  form.stack(novalidate @submit.prevent="emit('run')")
    SelectField(id="taxon" label="Taxon and protein evidence" v-model="taxonId" :options="taxa" :disabled="locked")
    SelectField(id="preset" label="Perturbation preset" v-model="preset" :options="presets" :disabled="locked")
    InputField(id="activity" label="MTHFR relative activity" type="number" v-model="activity" min="0.1" max="1.5" step="0.05" :disabled="locked" hint="Times baseline. Supported range 0.10–1.50." :error="errors.activity ? 'Enter activity from 0.10 to 1.50.' : ''" @input="emit('custom-activity')")
    InputField(id="duration" label="Duration" type="number" v-model="duration" min="1" max="72" step="1" :disabled="locked" :hint="`Hours. Supported range 1–72 hours; fixed ${model.controls.stepHours} h step.`" :error="errors.duration ? 'Enter a duration from 1 to 72 hours.' : ''")
    div
      button.button(type="submit" :disabled="locked || state === 'incompatible'") {{ state === 'running' ? 'Integrating…' : 'Run deterministic model' }}
  p.muted
    strong Units:
    |  {{ ` ${model.concentrationUnit} concentrations; ${model.fluxUnit} fluxes.` }}
</template>
