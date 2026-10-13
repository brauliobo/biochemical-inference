<script setup vapor>
import { computed } from 'vue'
import Panel from '../../ui/Panel.vue'

// Source, rights, attribution and the modifications made to the adapted data.
const props = defineProps({ records: { type: Object, required: true } })

const attribution = computed(() => props.records.attribution[0])
const registration = computed(() => props.records.registrations[0])
</script>

<template lang="pug">
.grid
  Panel(:title="attribution.title" title-id="atlas-rights-title" eyebrow="Source, rights, and attribution" :level="3" flat)
    p {{ attribution.creators.join(', ') }}. DOI #[a(:href="`https://doi.org/${attribution.doi}`" target="_blank" rel="noreferrer") {{ attribution.doi }}].
    p #[a(:href="attribution.source_url" target="_blank" rel="noreferrer") DigiMouse source] · #[a(:href="attribution.license.url" target="_blank" rel="noreferrer") {{ attribution.license.name }}].
    p Redistribution {{ attribution.license.redistribution }}; ShareAlike {{ attribution.license.share_alike ? 'required' : 'not declared' }}. {{ attribution.license.warranty_disclaimer }}
    p {{ attribution.license.no_endorsement }}
    p {{ attribution.software_license_boundary }}
  Panel(title="Adapted material operations" title-id="atlas-modifications-title" eyebrow="Modification notice" :level="3" flat)
    ul
      li(v-for="item in attribution.modifications" :key="item") {{ item }}
    h4 Scientific limits
    ul
      li(v-for="item in records.limitations" :key="item.id") {{ item.statement }}
    p
      strong Registration:
      |  {{ ` ${registration.status}. ${registration.reason}` }}
</template>
