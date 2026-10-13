<script setup vapor>
import Facts from '../../ui/Facts.vue'
import SelectField from '../../ui/SelectField.vue'
import Toolbar from '../../ui/Toolbar.vue'

// The explicit coupling controls: taxon and bounded duration are the only
// choices; cadence, interpolation, integration and refinement are fixed.
defineProps({
  busy: { type: Boolean, required: true },
  state: { type: String, required: true },
  canCreate: { type: Boolean, required: true },
  canRun: { type: Boolean, required: true }
})
const taxonId = defineModel('taxonId', { type: String, required: true })
const durationMinutes = defineModel('durationMinutes', { type: Number, required: true })
const emit = defineEmits(['create', 'run', 'change'])

const TAXA = [{ value: 'NCBITaxon:9606', label: 'Homo sapiens · supported synthetic contract' }, { value: 'NCBITaxon:10090', label: 'Mus musculus · unsupported, must block' }]
const DURATIONS = [1, 2, 3, 4].map((minute) => ({ value: minute, label: `${minute} min` }))
const FIXED = [
  { label: 'Coupling cadence', value: '1 min' },
  { label: 'Interpolation', value: 'zero-order hold' },
  { label: 'Integration', value: 'exact piecewise constant' },
  { label: 'Refinement', value: '1× / 2× / 4×' }
]
</script>

<template lang="pug">
section.stack(aria-labelledby="physiology-coupling-title")
  h3#physiology-coupling-title Coupling editor
  p.muted Four extensive #[code mg/min] exchanges use exact interval integration. Cadence and interpolation are explicit; incompatible units, shapes, ports, taxa, and extrapolations are blocked.
  SelectField(id="physiology-taxon" label="Applicability taxon" v-model="taxonId" :options="TAXA" :disabled="busy" @change="emit('change')")
  SelectField(id="physiology-duration" label="Bounded duration" v-model="durationMinutes" :options="DURATIONS" :disabled="busy" @change="emit('change')")
  Facts(rows :items="FIXED")
  Toolbar(label="Coupling actions")
    button.button(type="button" :disabled="busy || !canCreate" @click="emit('create')") {{ state === 'coupling' ? 'Validating…' : 'Create exact coupling' }}
    button.button.button--secondary(type="button" :disabled="busy || !canRun" @click="emit('run')") {{ state === 'running' ? 'Running…' : 'Run coupled fixture' }}
</template>
