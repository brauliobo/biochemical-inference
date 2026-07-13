import { canonicalDigest, canonicalJson } from '../../shared/canonical-json.js'
import {
  BPP_PROFILE,
  BppCouplingDescriptorSchema,
  BppManifestSchema,
  BppModelDescriptorSchema,
  BppSignatureSchema,
  PHYSIOLOGY_RELEASE_DIGEST,
  PHYSIOLOGY_RELEASE_ID,
  PHYSIOLOGY_WARNING
} from '../../shared/physiology-contracts.js'
import { createBppArchive, digestBuffer } from './package.js'

export const REFERENCE_PUBLISHER = 'Biochemical Inference synthetic reference publisher'
export const REFERENCE_KEY_ID = 'ed25519:a3ecdaa33c234dc4'
export const REFERENCE_PUBLIC_KEY_SPKI_BASE64 = 'MCowBQYDK2VwAyEA3OEWhXxmXxSWszsO56JdqrgKZsR/vLwppN3x9fKz8Zo='

const REFERENCE_SIGNATURES = Object.freeze({
  'PLUGIN:CIRCULATION-REFERENCE': 'VmzQD3tWogY5rYB5uvE1UQ31O39idCfXDJ0XGAghX0EmRatl/bLC6Kzij6VkigPsDDvlRSAz/zd6n2zslpeLCA==',
  'PLUGIN:LIVER-REFERENCE': 'GGN/LjCTmc6tLjcQArmgkcUXw+BcfN5UFgSu8bdQ4/Aew0OM8IdyA+3tfNASCNGywAqrEr1LCD9EFSYKTZuzAQ==',
  'PLUGIN:KIDNEY-REFERENCE': 'wlTPDWndbI+8anbPzhzAuz+MqUU67QBHQGjFzKmhHYrmrzye+WKPOdTWIH7AyWen8jMTY6sv+07HZUJBBMscCg=='
})

const initialMasses = Object.freeze({
  'PLUGIN:CIRCULATION-REFERENCE': 80,
  'PLUGIN:LIVER-REFERENCE': 10,
  'PLUGIN:KIDNEY-REFERENCE': 10
})

const schedules = Object.freeze({
  'PLUGIN:CIRCULATION-REFERENCE': [
    { portId: 'PORT:CIRCULATION-LIVER-OUT', intervals: [[0, 1, 8], [1, 2, 7], [2, 4, 2.5]] },
    { portId: 'PORT:CIRCULATION-KIDNEY-OUT', intervals: [[0, 1, 2], [1, 2, 3], [2, 4, 2.5]] }
  ],
  'PLUGIN:LIVER-REFERENCE': [{ portId: 'PORT:LIVER-CIRCULATION-OUT', intervals: [[0, 4, 0]] }],
  'PLUGIN:KIDNEY-REFERENCE': [{ portId: 'PORT:KIDNEY-CIRCULATION-OUT', intervals: [[0, 4, 0]] }]
})

const packageNames = Object.freeze({
  'PLUGIN:CIRCULATION-REFERENCE': 'circulation',
  'PLUGIN:LIVER-REFERENCE': 'liver',
  'PLUGIN:KIDNEY-REFERENCE': 'kidney'
})

export function unsignedReferenceDefinitions(evidence, publisher = { keyId: REFERENCE_KEY_ID, algorithm: 'Ed25519' }) {
  return evidence.modelEvidence.map((modelEvidence) => {
    const applicability = evidence.applicability.find((item) => item.plugin_id === modelEvidence.plugin_id)
    if (!applicability) throw new Error(`Missing reference applicability for ${modelEvidence.plugin_id}`)
    const model = BppModelDescriptorSchema.parse({
      schemaVersion: '1.0.0',
      pluginId: modelEvidence.plugin_id,
      modelType: 'declarative-piecewise-flow-v1',
      contextId: modelEvidence.context_id,
      evidenceModelDigest: modelEvidence.model_digest,
      state: { id: 'STATE:DRUG-MASS', semantic: 'drug-mass', dimension: 'mass', unit: 'mg', shape: [1], initial: initialMasses[modelEvidence.plugin_id] },
      cadenceMinutes: modelEvidence.numeric_assumptions[0].value,
      outputSchedules: schedules[modelEvidence.plugin_id].map((schedule) => ({
        portId: schedule.portId,
        intervals: schedule.intervals.map(([startMinute, endMinute, value]) => ({ startMinute, endMinute, value, unit: 'mg/min' }))
      }))
    })
    const coupling = BppCouplingDescriptorSchema.parse({
      schemaVersion: '1.0.0',
      pluginId: modelEvidence.plugin_id,
      protocolEvidenceDigest: modelEvidence.protocol_digest,
      cadenceMinutes: modelEvidence.numeric_assumptions[0].value,
      interpolation: 'zero-order-hold',
      integration: 'exact-piecewise-constant',
      ports: modelEvidence.ports
    })
    const modelBytes = Buffer.from(canonicalJson(model))
    const couplingBytes = Buffer.from(canonicalJson(coupling))
    const manifest = BppManifestSchema.parse({
      profile: BPP_PROFILE,
      schemaVersion: '1.0.0',
      packageId: `org.biochemical-inference.synthetic.${packageNames[modelEvidence.plugin_id]}`,
      pluginId: modelEvidence.plugin_id,
      pluginVersion: '1.0.0',
      pluginKind: 'declarative',
      publisher,
      evidence: { releaseId: PHYSIOLOGY_RELEASE_ID, releaseDigest: PHYSIOLOGY_RELEASE_DIGEST, modelEvidenceId: modelEvidence.id, modelEvidenceDigest: modelEvidence.model_digest, protocolEvidenceDigest: modelEvidence.protocol_digest },
      license: { spdx: 'CC0-1.0', redistributable: true, notice: 'Repository-authored synthetic software conformance fixture; no measured physiology.' },
      applicability: { taxonIds: [applicability.taxon_id], contextIds: [applicability.context_id], domains: [applicability.domain], useScopes: ['bounded-three-plugin-coupling-conformance'], exclusions: applicability.exclusions },
      resources: { cpuCores: 1, memoryMb: 32, wallTimeMs: 1000, maxOutputBytes: 100_000 },
      permissions: { network: false, filesystem: 'none', subprocess: false },
      entrypoints: { model: 'model.json', coupling: 'coupling.json', process: null },
      contents: [
        { path: 'model.json', sha256: digestBuffer(modelBytes).slice('sha256:'.length), bytes: modelBytes.length, mediaType: 'application/json' },
        { path: 'coupling.json', sha256: digestBuffer(couplingBytes).slice('sha256:'.length), bytes: couplingBytes.length, mediaType: 'application/json' }
      ],
      synthetic: true,
      scientificValidation: 'unsupported',
      warning: PHYSIOLOGY_WARNING
    })
    return { manifest, model, coupling, signedDigest: canonicalDigest(manifest) }
  })
}

export async function createReferencePackages(evidence) {
  return Promise.all(unsignedReferenceDefinitions(evidence).map(async (definition) => {
    const signature = BppSignatureSchema.parse({ schemaVersion: '1.0.0', algorithm: 'Ed25519', keyId: REFERENCE_KEY_ID, signedDigest: definition.signedDigest, signature: REFERENCE_SIGNATURES[definition.manifest.pluginId] })
    return { ...definition, signature, bytes: await createBppArchive({ ...definition, signature }) }
  }))
}
