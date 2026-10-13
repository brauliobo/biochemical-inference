<script setup vapor>
import { computed } from 'vue'
import Badge from '../../ui/Badge.vue'
import Card from '../../ui/Card.vue'
import Facts from '../../ui/Facts.vue'
import Notice from '../../ui/Notice.vue'

// One signed catalog package: its digests and signature, certification (which
// is not scientific validation), the ports it exchanges, and the choice to use
// this exact package in a coupling.
const props = defineProps({
  item: { type: Object, required: true },
  ports: { type: Array, default: () => [] },
  contextName: { type: String, default: '' },
  chosen: { type: Boolean, required: true },
  locked: { type: Boolean, required: true },
  conformance: { type: Object, default: undefined }
})
const emit = defineEmits(['choose', 'check'])

const trusted = computed(() => props.item.trust.status === 'trusted')
const facts = computed(() => {
  const { packageDigest, modelDescriptorDigest, couplingDescriptorDigest, signature, manifest, certification } = props.item
  return [
    { label: 'Package digest', value: packageDigest, mono: true },
    { label: 'Model descriptor', value: modelDescriptorDigest, mono: true },
    { label: 'Coupling descriptor', value: couplingDescriptorDigest, mono: true },
    { label: 'Publisher key', value: signature.keyId, mono: true },
    { label: 'Signature', value: signature.signature, mono: true },
    { label: 'License', value: `${manifest.license.spdx} · redistributable` },
    { label: 'Certification', value: certification.status }
  ]
})
</script>

<template lang="pug">
Card(flat)
  .repel
    div
      p.eyebrow {{ item.manifest.applicability.domains[0] }}
      h4 {{ item.manifest.pluginId }}
    Badge(:label="item.trust.status" :tone="trusted ? 'success' : 'danger'")
  Facts(:items="facts")
    div
      dt Scientific validation
      dd
        Badge(tone="warning" :label="item.certification.scientificValidation")
  h5 Ports · exact evidence binding
  ul.plain-list.stack.stack--tight
    li(v-for="port in ports" :key="port.id")
      Card(flat)
        p
          strong {{ port.direction }} · {{ port.id }}
        p.muted {{ port.semantic }} · {{ port.dimension }} · {{ port.unit }}
  p.muted {{ contextName }} · {{ item.manifest.applicability.taxonIds[0] }}
  label.choice
    input(type="radio" :name="`physiology-package-${item.manifest.pluginId}`" :checked="chosen" :disabled="locked || !trusted" @change="emit('choose')")
    span Use this exact package for {{ item.manifest.pluginId }}
  button.button.button--secondary(type="button" :disabled="locked || !trusted" @click="emit('check')") Run and persist conformance
  Notice(v-if="conformance" role="status") Protocol {{ conformance.benchmark.passed ? 'passed' : 'failed' }} · scientific validation {{ conformance.scientificValidation }}
</template>
