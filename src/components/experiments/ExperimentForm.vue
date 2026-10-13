<script setup vapor>
import { computed } from 'vue'
import Field from '../../ui/Field.vue'
import InputField from '../../ui/InputField.vue'
import Notice from '../../ui/Notice.vue'
import Panel from '../../ui/Panel.vue'
import SelectField from '../../ui/SelectField.vue'
import { exactModelKey } from './draft.js'

// Create an experiment, or write the next immutable revision of the selected
// one. Revisions that embed a model outside the exact local registry are
// read-only. `draft` is edited in place (see draft.js).
const props = defineProps({
  draft: { type: Object, required: true },
  models: { type: Array, required: true },
  engine: { type: String, default: 'ode' },
  isRegistry: { type: Function, required: true },
  targets: { type: Array, required: true },
  experiments: { type: Array, required: true },
  profiles: { type: Array, required: true },
  selectedId: { type: String, default: '' },
  readOnly: { type: Boolean, required: true },
  saving: { type: Boolean, required: true },
  revising: { type: Boolean, required: true }
})
const emit = defineEmits(['submit', 'select', 'model'])

const TAXA = [{ value: 'NCBITaxon:9606', label: 'Human · NCBITaxon:9606' }, { value: 'NCBITaxon:10090', label: 'Mouse · NCBITaxon:10090' }]
const DESIGNS = [{ value: 'single', label: 'Single specification' }, { value: 'ensemble', label: 'Seeded ensemble' }, { value: 'intervention-schedule', label: 'Intervention schedule' }]
const CONTRACTS = [{ value: 'exact', label: 'Exact canonical result' }, { value: 'tolerance', label: 'Absolute + relative tolerance' }]

const existingOptions = computed(() => [{ value: '', label: 'New experiment' }, ...props.experiments.map((item) => ({ value: item.experimentId, label: item.name }))])
const modelOptions = computed(() => props.models.map((item) => ({ value: exactModelKey(item), label: `${item.name} · ${item.id} · ${item.digest}${props.isRegistry(item) ? '' : ' · embedded external'}` })))
const targetOptions = computed(() => props.targets.map((target) => ({ value: target.id, label: `${target.id} · ${target.unit.symbol}` })))
const profileOptions = computed(() => props.profiles.map((item) => ({ value: item.id, label: `${item.name} · ${item.concurrency} workers · ${item.memoryMb} MB` })))
</script>

<template lang="pug">
Panel(:title="revising ? 'Edit as a new revision' : 'Create experiment'" title-id="workspace-editor-title" :level="3")
  form.stack(@submit.prevent="emit('submit')")
    Notice(v-if="readOnly" tone="warning" role="note") This revision embeds a model that is not in the exact local registry. Its ID and digest remain inspectable and exportable, but revision and execution controls are read-only.
    SelectField(id="workspace-existing" label="Existing experiment" :model-value="selectedId" :options="existingOptions" @change="emit('select', $event.target.value)")
    InputField(id="workspace-name" label="Name" v-model="draft.name" maxlength="160" required :disabled="readOnly")
    Field(id="workspace-description" label="Description")
      textarea#workspace-description(v-model="draft.description" rows="3" maxlength="2000" :disabled="readOnly")
    SelectField(id="workspace-model" label="Portfolio model" v-model="draft.modelKey" :options="modelOptions" :disabled="readOnly" @change="emit('model')")
    .grid
      SelectField(id="workspace-taxon" label="Taxon" v-model="draft.taxonId" :options="TAXA" :disabled="readOnly")
      InputField(id="workspace-tissue" label="Tissue CURIE (optional)" v-model="draft.tissueId" placeholder="UBERON:0002107" :disabled="readOnly")
    SelectField(id="workspace-design" label="Portfolio design" v-model="draft.design" :options="DESIGNS" :disabled="readOnly")
    InputField(v-if="draft.design === 'ensemble'" id="workspace-members" label="Ensemble members" type="number" v-model="draft.ensembleMembers" min="2" max="8" :disabled="readOnly")
    template(v-if="draft.design === 'intervention-schedule'")
      SelectField(id="workspace-intervention-target" label="Assignment target" v-model="draft.interventionTarget" :options="targetOptions" :disabled="readOnly")
      .grid
        InputField(id="workspace-intervention-time" label="Time" type="number" v-model="draft.interventionTime" min="0" :disabled="readOnly || engine === 'fba'")
        InputField(id="workspace-intervention-value" label="Assigned value" type="number" v-model="draft.interventionValue" min="0" :disabled="readOnly")
    .grid
      InputField(v-if="engine !== 'fba'" id="workspace-duration" label="Duration (s)" type="number" v-model="draft.duration" min="1" max="100000" :disabled="readOnly")
      InputField(id="workspace-seed" label="Seed" type="number" v-model="draft.seed" min="0" max="4294967295" :disabled="readOnly")
    SelectField(id="workspace-contract" label="Rerun contract" v-model="draft.numericalKind" :options="CONTRACTS" :disabled="readOnly")
    .grid(v-if="draft.numericalKind === 'tolerance'")
      InputField(id="workspace-absolute" label="Absolute tolerance" type="number" v-model="draft.absoluteTolerance" min="0" step="any" :disabled="readOnly")
      InputField(id="workspace-relative" label="Relative tolerance" type="number" v-model="draft.relativeTolerance" min="0" step="any" :disabled="readOnly")
    SelectField(id="workspace-profile" label="Resource profile" v-model="draft.resourceProfileId" :options="profileOptions" :disabled="readOnly")
    div
      button.button(type="submit" :disabled="saving || readOnly") {{ revising ? 'Create immutable revision' : 'Create experiment' }}
</template>
