<script setup vapor>
import { computed } from 'vue'
import Badge from '../../ui/Badge.vue'
import Fact from '../../ui/Fact.vue'
import Facts from '../../ui/Facts.vue'
import Panel from '../../ui/Panel.vue'
import { plural } from '../../ui/format.js'
import { statusTone } from '../../ui/tone.js'

// What the verified local mirror holds: the independent pins, both releases,
// the active generation with its signer, every partition and every source.
const props = defineProps({
  discovery: { type: Object, required: true },
  releases: { type: Array, required: true },
  detail: { type: Object, default: undefined },
  integrity: { type: Object, default: undefined },
  status: { type: Object, default: undefined }
})

const pins = computed(() => {
  const { baseline, candidate, catalogDigest, trustDigest, historicalKey, activeKey } = props.discovery.pins
  const release = (label, pin) => ({ label, value: pin.releaseId, code: pin.releaseDigest, note: pin.signerKeyId })
  const key = (value) => `${value.keyId} · ${value.status}`
  return [
    release('Baseline release', baseline),
    release('Candidate / active release', candidate),
    { label: 'Signed catalog / trust', code: [catalogDigest, trustDigest] },
    { label: 'Rotated Ed25519 keys', value: `${key(historicalKey)} / ${key(activeKey)}`, code: [historicalKey.publicKey, activeKey.publicKey] }
  ]
})
const published = computed(() => props.releases.map((item) => ({
  label: item.active ? 'Active candidate' : 'Readable baseline',
  value: item.release.id,
  code: item.release.digest,
  note: `${item.signerKeyId} · signed ${item.signedAt}`
})))
const generation = computed(() => {
  const { release, manifest, envelope, signer, manifestDigest, envelopeDigest } = props.detail
  const { payload } = envelope
  return [
    { label: 'Release / schema', value: `${manifest.manifest_schema_version} manifest · ${envelope.envelope_schema_version} envelope`, code: release.digest },
    { label: 'Verified signer / time', value: `${signer.keyId} · ${signer.status}`, note: `${signer.algorithm} · ${signer.signedAt}` },
    { label: 'Manifest / envelope bytes', code: [manifestDigest, envelopeDigest] },
    { label: 'Recipe / source lock', value: `${payload.recipe_path} · ${payload.source_lock_path}`, code: [payload.recipe_sha256, payload.source_lock_sha256] }
  ]
})
const partitions = computed(() => props.detail.manifest.partitions.map((partition) => ({
  label: partition.path,
  code: partition.sha256,
  note: `${partition.record_count} records · ${partition.bytes} bytes · ${partition.first_id} → ${partition.last_id}`
})))
const inputs = computed(() => props.detail.manifest.inputs)
const integrityWord = computed(() => `Integrity ${props.integrity?.status ?? props.status?.integrity ?? 'unchecked'}`)
const origin = (input) => (input.source === 'REPOSITORY' ? 'Repository curation' : 'Authority response')
</script>

<template lang="pug">
.stack
  Panel(title="Independent data-plane pins" title-id="data-plane-pins-title" :level="3")
    Facts(:items="pins")

  template(v-if="detail")
    Panel(title="Locally published releases" title-id="data-plane-releases-title" :level="3")
      Facts(:items="published")

    Panel(:title="detail.release.id" title-id="data-plane-generation-title" eyebrow="Active immutable generation" :level="3" :status="integrityWord" :tone="statusTone(integrity?.status ?? status?.integrity)")
      Facts(:items="generation")

    Panel(title="Digest, count, bytes, and ID bounds" title-id="data-plane-partitions-title" eyebrow="Exact partition closure" :level="3")
      template(#actions)
        span.muted {{ plural(partitions.length, 'immutable partition') }}
      Facts(:items="partitions")

    Panel(title="Authority and curation remain distinct" title-id="data-plane-sources-title" eyebrow="Source / adapter / rights closure" :level="3")
      template(#actions)
        span.muted {{ plural(inputs.length, 'pinned source object') }}
      Facts
        Fact(v-for="input in inputs" :key="input.name" :label="input.name")
          .stack.stack--tight
            p
              Badge(:tone="input.source === 'REPOSITORY' ? 'warning' : ''" :label="origin(input)")
            p {{ input.source }} → {{ input.record_type }} · {{ input.source_object_bytes }} bytes
            code source {{ input.source_object_sha256 }}
            code adapter {{ input.adapter.id }}@{{ input.adapter.version }}
            code implementation {{ input.adapter.implementation_sha256 }}
            code package {{ input.adapter.package_sha256 }}
            p.muted {{ input.license.id }} · {{ input.license.name }} · {{ input.license.redistribution }}
            p.muted {{ input.license.url }} · {{ input.license.attribution }}
      p.muted Courtesy of the U.S. National Library of Medicine.
</template>
