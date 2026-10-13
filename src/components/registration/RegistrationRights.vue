<script setup vapor>
import { computed } from 'vue'
import Panel from '../../ui/Panel.vue'

// Rights, required attribution and the limits of what the source provides.
const props = defineProps({
  attribution: { type: Object, required: true },
  acquisition: { type: Object, default: undefined },
  registration: { type: Object, required: true },
  limitations: { type: Array, required: true }
})

const source = computed(() => props.attribution.source)
</script>

<template lang="pug">
.grid
  Panel(:title="attribution.title" title-id="registration-rights-title" eyebrow="Rights and required attribution" :level="3")
    p #[a(:href="attribution.license.url" target="_blank" rel="noreferrer") {{ attribution.license.name }}] permits redistribution and adaptations with attribution. #[a(:href="attribution.license.tcia_policy_url" target="_blank" rel="noreferrer") TCIA terms] prohibit identification and require downstream attribution and policy linking.
    p {{ attribution.license.downstream_notice }}
    p {{ attribution.acknowledgement }}
    p {{ attribution.no_endorsement }}
    h4 Modification notices
    ul(data-testid="spatial-registration-modifications")
      li(v-for="notice in attribution.modifications" :key="notice") {{ notice }}
    p(data-testid="spatial-registration-software-license") #[strong Software license boundary:] {{ attribution.software_license_boundary }}
    p #[strong Source package:] #[a(:href="source.package_url" target="_blank" rel="noreferrer") {{ source.package_name }}] · {{ source.package_bytes.toLocaleString() }} bytes · retrieved {{ source.retrieved_at }} · report #[code {{ source.acquisition_report_sha256 }}]
    p(v-if="acquisition") #[strong Full acquisition:] {{ acquisition.package_verification.observed_bytes.toLocaleString() }} bytes hashed · {{ acquisition.members.length }} range-extracted members matched.
    ul
      li(v-for="citation in attribution.citations" :key="citation.doi")
        a(:href="citation.doi_url" target="_blank" rel="noreferrer") {{ citation.citation }}
  Panel(title="Source-prealigned, not recovered affine" title-id="registration-limits-title" eyebrow="Derivation and limitations" :level="3")
    p {{ registration.derivation.source_statement }} This release derives identity only because all six selected NIfTI inputs have exactly equal dimensions, spacing, and sforms.
    ul
      li(v-for="item in limitations" :key="item.id") {{ item.statement }}
</template>
