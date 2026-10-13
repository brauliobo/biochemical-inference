<script setup vapor>
import { computed } from 'vue'
import DataTable from '../../ui/DataTable.vue'
import InputField from '../../ui/InputField.vue'
import Panel from '../../ui/Panel.vue'

// The four explicit mechanism scales of a run, beside the upstream human and
// mouse parameter records (kept separate; absence is shown, never filled in).
const props = defineProps({
  parameters: { type: Array, required: true },
  locked: { type: Boolean, required: true },
  running: { type: Boolean, required: true }
})
const scales = defineModel('scales', { type: Object, required: true })
const emit = defineEmits(['run'])

const FIELDS = [
  { key: 'cypActivity', id: 'apap-cyp', label: 'CYP activity' },
  { key: 'adductBinding', id: 'apap-binding', label: 'NAPQI adduct binding' },
  { key: 'zonation', id: 'apap-zonation', label: 'Zonation amplitude' },
  { key: 'nacGsh', id: 'apap-nac-gsh', label: 'NAC-to-GSH term' }
]
const forContext = (contextId) => props.parameters.filter((item) => item.context_id === contextId)
const rows = computed(() => {
  const human = forContext('CONTEXT:APAP-HUMAN-LIVER')
  const mouse = forContext('CONTEXT:APAP-MOUSE-LIVER')
  return Array.from({ length: Math.max(human.length, mouse.length) }, (_, index) => [human[index], mouse[index]])
})
</script>

<template lang="pug">
.grid
  Panel(title="Explicit mechanism scales" title-id="apap-controls-title" :level="3")
    form.stack(@submit.prevent="emit('run')")
      InputField(v-for="field in FIELDS" :key="field.key" :id="field.id" :label="field.label" type="number" v-model="scales[field.key]" min="0" max="2" step="0.1" :disabled="locked")
      div
        button.button(type="submit" :disabled="locked") {{ running ? 'Integrating bounded model…' : 'Run APAP benchmark' }}
  Panel(title="Upstream species parameter records" title-id="apap-species-title" :level="3")
    p.muted Values remain separate by context; absence is shown rather than filled by taxon logic.
    DataTable(caption="Human/mouse source parameter difference" :columns="['Human', 'Mouse']")
      tr(v-for="(row, index) in rows" :key="index")
        td(v-for="(parameter, side) in row" :key="side")
          .cluster(v-if="parameter")
            code {{ parameter.id }}
            span {{ parameter.quantity.value }} {{ parameter.quantity.unit }}
          span.muted(v-else) Not supplied
</template>
