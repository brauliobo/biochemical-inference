import { canonicalJson } from '../../shared/canonical-json.js'
import { SimulationRequestSchema } from '../../shared/contracts.js'
import { ImportedSimulationSpecificationSchema } from '../../shared/entity-mention-handoff-contracts.js'
import { simulate } from '../simulation.js'
import { entityMentionSha256 } from './verification.js'

const unique = (values) => [...new Set(values)].sort()

export function createImportedMthfrSimulationSpecification(reopened) {
  const { semantic, handoff, importId } = reopened
  const candidate = semantic.candidate
  const value = {
    schema: 'entity-mention-handoff-simulation-specification/v1',
    kind: 'consumer-simulation-input',
    importId,
    sourceHandoffId: handoff.id,
    selection: {
      candidateId: candidate.id,
      reactionId: semantic.reaction.id,
      taxonId: candidate.taxon_id,
      tissueId: candidate.attributes.tissue_id,
      compartmentId: candidate.attributes.compartment_id
    },
    numericalMapping: {
      modelId: 'one-carbon',
      modelReactionId: 'RHEA:19819',
      mapping: 'explicit-identity',
      stoichiometryUse: 'identity-only; existing reduced numerical topology is unchanged',
      omittedExplicitParticipants: ['CHEBI:15378', 'CHEBI:57783', 'CHEBI:58349'],
      boundaryPolicy: 'no source unknown is converted into a numerical boundary or parameter'
    },
    provenance: {
      sourceReleaseIds: unique([candidate.source_release_id, semantic.reaction.source_release_id, ...semantic.limitations.map((item) => item.source_release_id).filter(Boolean)]),
      sourceIds: unique([...candidate.attributes.source_payload.source_ids, ...semantic.sources]),
      sourceLineageRefs: unique(candidate.source_lineage_refs),
      provenanceRefs: unique(semantic.provenance),
      rightsRefs: unique(semantic.rights),
      evidenceRefs: unique(semantic.evidence),
      edgeRefs: unique(semantic.edges.map((edge) => edge.id)),
      origins: unique(['model-derived', ...semantic.edges.map((edge) => edge.origin)]),
      epistemicStatuses: unique(semantic.edges.map((edge) => edge.epistemic_status)),
      reviewStatuses: unique([candidate.attributes.source_payload.review_status, ...semantic.edges.map((edge) => edge.review_status)]),
      sourceCandidateQualifiers: {
        sourceOrigin: candidate.attributes.source_origin,
        adaptationOrigin: candidate.attributes.adaptation_origin,
        humanApplicability: candidate.attributes.human_applicability,
        reviewStatus: candidate.attributes.source_payload.review_status,
        simulationMode: candidate.attributes.simulation_mode,
        direction: candidate.attributes.direction,
        eligibilityRationale: candidate.attributes.simulation_eligibility_rationale,
        biologicalSupport: candidate.attributes.biological_support,
        trusted: candidate.attributes.trusted
      },
      contextualEdgeQualifiers: semantic.edges.map((edge) => ({
        id: edge.id,
        subjectId: edge.subject_id,
        predicate: edge.predicate,
        objectId: edge.object_id,
        origin: edge.origin,
        epistemicStatus: edge.epistemic_status,
        reviewStatus: edge.review_status,
        taxonId: edge.context.taxon_id,
        tissueId: edge.context.tissue_id,
        compartmentId: edge.context.compartment_id,
        evidenceRefs: [...edge.evidence_refs],
        canSupportBiologicalConclusion: edge.can_support_biological_conclusion,
        automaticPromotion: edge.automatic_promotion
      })),
      trustedKnowledgeEligible: false,
      canSupportBiologicalConclusion: false,
      automaticPromotion: false,
      assumptions: [...candidate.attributes.assumptions],
      uncertainty: { representation: candidate.attributes.uncertainty_representation, description: candidate.attributes.uncertainty_description },
      sourceDeclaredUnknowns: [...handoff.boundaries.sourceDeclaredUnknowns],
      limitations: semantic.limitations.map((item) => ({ id: item.id, category: item.category, statement: item.statement, sourceReleaseId: item.source_release_id ?? null }))
    }
  }
  const artifactId = `sha256:${entityMentionSha256(Buffer.from(canonicalJson(value)))}`
  return ImportedSimulationSpecificationSchema.parse({ ...value, artifactId })
}

export function simulateImportedMthfr(numericalIntent, reopened) {
  const allowed = new Set(['preset', 'mthfrActivity', 'durationHours', 'stepHours'])
  const unexpected = Object.keys(numericalIntent).filter((key) => !allowed.has(key))
  if (unexpected.length) throw new TypeError(`Imported simulation accepts numerical intent only; unsupported override: ${unexpected.sort().join(', ')}.`)
  const input = createImportedMthfrSimulationSpecification(reopened)
  const taxonId = Number(input.selection.taxonId.slice('NCBITaxon:'.length))
  const request = SimulationRequestSchema.parse({ ...numericalIntent, releaseId: reopened.manifest.release.id, taxonId })
  const release = {
    id:            reopened.manifest.release.id,
    title:         reopened.entityEnvelope.title,
    digest:        `sha256:${reopened.handoff.release.manifest_sha256}`,
    schemaVersion: reopened.manifest.schema_version,
    supportedTaxa: [taxonId],
    verified:      true,
    source:        'verified-entity-mention-handoff'
  }
  const catalysis = reopened.semantic.edges.find((edge) => edge.predicate === 'catalyzes' && edge.context.taxon_id === input.selection.taxonId)
  const protein = reopened.semantic.humanProtein
  const network = {
    proteins: [{
      id:          protein.id,
      name:        protein.canonical_label,
      gene:        protein.attributes.gene_id,
      taxonId,
      evidenceIds: [...catalysis.evidence_refs]
    }]
  }
  const output = simulate(request, release, network)
  const content = {
    schema: 'entity-mention-handoff-simulation-artifact/v1',
    kind: 'consumer-simulation-output',
    input,
    output
  }
  return { ...content, artifactId: `sha256:${entityMentionSha256(Buffer.from(canonicalJson(content)))}` }
}
