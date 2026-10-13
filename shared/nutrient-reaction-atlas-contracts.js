import { z } from 'zod'
import { Sha256HexSchema, FiniteNumberSchema, NonEmptyStringSchema } from './commons/schemas.js'

export const NUTRIENT_REACTION_ATLAS_FOUNDATION = Object.freeze({
  releaseId: 'nutrient-reaction-atlas-foundation-v0.1.0',
  releaseDigest: 'ee6b6e7cdf8bbd7f0066a54346a478976d2e2b8ef4f6f99fb31e7e1b4e852aa4',
  contract: 'nutrient-reaction-atlas-foundation-1.0.0',
  sourceCount: 52,
  ontologyTermCount: 85,
  nutrientConceptCount: 60,
  formClassCount: 17,
  eventKindCount: 8,
  reactionRecordCount: 0,
  simulationReadyReactionCount: 0
})

export const NUTRIENT_REACTION_SIMULATION_BOOTSTRAP = Object.freeze({
  releaseId: 'nutrient-reaction-simulation-bootstrap-v0.1.0',
  releaseDigest: '2f3afbed57ad6de9d4afff20c766eb08ed766e7e6593724f40240da147e86b69',
  contract: 'nutrient-reaction-simulation-bootstrap-1.0.0',
  candidateId: 'REACTION_CANDIDATE:MTHFR_FOLATE_REDUCTION',
  candidateDigest: 'ffce2dcbf1186295449d52892351af24060080310d85a80c547fbad93ad27974'
})

export const NUTRIENT_REACTION_RHEA_CANDIDATES = Object.freeze({
  artifactDigest: '56acf0eff87334961d3b76a2881486fa9de572dce7ba87b9f94e60dc80c48f2a',
  contentDigest: '6206e847bdc1aa5d50e928513eb2c317220eec29944e232b6716bf88f0e5b03c',
  manifestDigest: 'b97205238a9931ed0d32c102f5f00cb774e59b9bc024e7f241e56aec771024f5',
  sourceDigest: 'c5ece10984a2f7c4c95c241cde134b108f0dc865335b232bdd77e67e5f074078',
  queryDigest: 'ca53a68de50f1c9d16c38af60ca28f727e6b76486a743fc803683aad241b112a'
})

export const NUTRIENT_REACTION_REACTOME_CANDIDATES = Object.freeze({
  artifactDigest: '037752fc68e92e5d0ae66cc7cf6d1e9fd97a448a72b307d96169dd6db3f549dc',
  contentDigest: 'd039d1b1cc1c0b045a521a1a213e183cf19bda63906c25070b0c01b81631b2df',
  manifestDigest: '4083a201242cb6a2d443312f99dba4c126c99e9689709fd76ad3ea87b1ff611f',
  sbmlDigest: 'a14af431e4e6a3e46a1f819e206fdb499461af019cea7d1324ee77e19033bf4f',
  mappingDigest: '65cf7c4dbc71a872d0d03fb34ff41c646dfbe7a43c1eb3e81b55974f07d3642e',
  pmidDigest: '71400e709ab5a53810ef585d98056f34c9afd0b11fa8dc5737ade3935f559a07',
  queryDigest: 'ca53a68de50f1c9d16c38af60ca28f727e6b76486a743fc803683aad241b112a'
})

export const NUTRIENT_REACTION_I2_RECONCILIATION = Object.freeze({
  artifactDigest: 'a5dd05d05f5abb47171de33066ef1f464f868a7b9f15471743a4917135bdb98d',
  contentDigest: 'a253b7a8a26c75b00900d4f07deb3b8e8eaec25555d9654f1faa46df59f4667c',
  manifestDigest: '1ed8768d47500800dacee93f88ce8fdad387d843150e64e05dc94721578f4014'
})

const OriginSchema = z.enum(['measured', 'curated', 'submitted', 'model-derived', 'text-mined', 'computed', 'assumption', 'hypothetical'])
const ContextStatusSchema = z.enum(['known', 'unknown', 'not-reported', 'not-assessed', 'not-applicable'])

export const NutrientReactionAtlasFoundationSummarySchema = z.object({
  release_id: z.literal(NUTRIENT_REACTION_ATLAS_FOUNDATION.releaseId),
  release_digest: z.literal(NUTRIENT_REACTION_ATLAS_FOUNDATION.releaseDigest),
  contract: z.literal(NUTRIENT_REACTION_ATLAS_FOUNDATION.contract),
  release_kind: z.literal('foundation-contract'),
  source_count: z.literal(NUTRIENT_REACTION_ATLAS_FOUNDATION.sourceCount),
  ontology_term_count: z.literal(NUTRIENT_REACTION_ATLAS_FOUNDATION.ontologyTermCount),
  nutrient_concept_count: z.literal(NUTRIENT_REACTION_ATLAS_FOUNDATION.nutrientConceptCount),
  form_class_count: z.literal(NUTRIENT_REACTION_ATLAS_FOUNDATION.formClassCount),
  event_kind_count: z.literal(NUTRIENT_REACTION_ATLAS_FOUNDATION.eventKindCount),
  reaction_ingestion_status: z.literal('not-started'),
  reaction_record_count: z.literal(NUTRIENT_REACTION_ATLAS_FOUNDATION.reactionRecordCount),
  simulation_ready_reaction_count: z.literal(NUTRIENT_REACTION_ATLAS_FOUNDATION.simulationReadyReactionCount),
  policies: z.object({
    trusted_knowledge: z.object({ automatic_promotion: z.literal(false), requires_human_review: z.literal(true) }).strict(),
    simulation_candidate: z.object({ automatic_promotion: z.literal(false), can_support_biological_conclusion: z.literal(false), requires_uncertainty: z.literal(true) }).strict(),
    hypothesis: z.object({ automatic_promotion: z.literal(false), can_support_biological_conclusion: z.literal(false), requires_uncertainty: z.literal(true) }).strict()
  }).strict(),
  coverage: z.object({
    source_registry: z.object({ denominator: z.literal(52), registered: z.literal(52) }).strict(),
    nutrient_roster: z.object({ denominator: z.literal(60), represented: z.literal(60) }).strict(),
    reaction_ingestion: z.object({ enumeration_status: z.literal('pending'), denominator: z.literal(0) }).strict(),
    simulation_readiness: z.object({ enumeration_status: z.literal('pending'), denominator: z.literal(0) }).strict()
  }).strict(),
  automatic_promotion: z.literal(false),
  simulation_enabled: z.literal(false),
  candidate_writes_enabled: z.literal(false)
}).strict()

export const NutrientReactionSimulationBootstrapSummarySchema = z.object({
  release_id: z.literal(NUTRIENT_REACTION_SIMULATION_BOOTSTRAP.releaseId),
  release_digest: z.literal(NUTRIENT_REACTION_SIMULATION_BOOTSTRAP.releaseDigest),
  contract: z.literal(NUTRIENT_REACTION_SIMULATION_BOOTSTRAP.contract),
  release_kind: z.literal('simulation-bootstrap'),
  candidate_count: z.literal(1),
  simulation_ready_count: z.literal(1),
  candidate_id: z.literal(NUTRIENT_REACTION_SIMULATION_BOOTSTRAP.candidateId),
  candidate_digest: z.literal(NUTRIENT_REACTION_SIMULATION_BOOTSTRAP.candidateDigest),
  simulation_mode: z.literal('stoichiometric-symbolic'),
  broad_reaction_coverage_status: z.literal('not-started'),
  trusted_knowledge_eligible: z.literal(false),
  can_support_biological_conclusion: z.literal(false),
  automatic_promotion: z.literal(false)
}).strict()

export const NutrientReactionRheaCandidateSummarySchema = z.object({
  schema_version: z.literal('1.0.0'),
  artifact_kind: z.literal('compressed-rhea-nutrient-reaction-candidate-report'),
  artifact: z.object({
    filename: z.literal('rhea-141-nutrient-reaction-candidates.json.gz'),
    media_type: z.literal('application/gzip'),
    bytes: z.literal(1186521),
    sha256: z.literal(NUTRIENT_REACTION_RHEA_CANDIDATES.artifactDigest)
  }).strict(),
  content: z.object({
    media_type: z.literal('application/json'),
    bytes: z.literal(29097133),
    sha256: z.literal(NUTRIENT_REACTION_RHEA_CANDIDATES.contentDigest)
  }).strict(),
  source_sha256: z.literal(NUTRIENT_REACTION_RHEA_CANDIDATES.sourceDigest),
  query_sha256: z.literal(NUTRIENT_REACTION_RHEA_CANDIDATES.queryDigest),
  method: z.literal('direct-rhea-participant-to-unreviewed-chebi-candidate-v1'),
  closure_policy: z.literal('Direct Rhea reaction participants only; no chemical ancestry, pathway, or downstream reaction expansion.'),
  counts: z.object({
    source_reactions: z.literal(18558),
    source_sides: z.literal(37113),
    source_participants: z.literal(90037),
    source_compounds: z.literal(15193),
    selected_reactions: z.literal(7288),
    excluded_reactions: z.literal(11270),
    matched_nutrient_terms: z.literal(30),
    unresolved_participant_references: z.literal(0),
    unresolved_compound_references: z.literal(0),
    non_chebi_participant_references: z.literal(7646)
  }).strict(),
  trust_boundary: z.object({
    candidate_mappings_human_reviewed: z.literal(false),
    human_applicability_established: z.literal(false),
    trusted_knowledge_eligible: z.literal(false),
    simulation_eligible: z.literal(false),
    can_support_biological_conclusion: z.literal(false),
    automatic_promotion: z.literal(false)
  }).strict()
}).strict()

export const NutrientReactionReactomeCandidateSummarySchema = z.object({
  schema_version: z.literal('1.0.0'),
  artifact_kind: z.literal('compressed-reactome-nutrient-reaction-candidate-report'),
  artifact: z.object({
    filename: z.literal('reactome-97-nutrient-reaction-candidates.json.gz'),
    media_type: z.literal('application/gzip'),
    bytes: z.literal(2021476),
    sha256: z.literal(NUTRIENT_REACTION_REACTOME_CANDIDATES.artifactDigest)
  }).strict(),
  content: z.object({
    media_type: z.literal('application/json'),
    bytes: z.literal(25084441),
    sha256: z.literal(NUTRIENT_REACTION_REACTOME_CANDIDATES.contentDigest)
  }).strict(),
  source: z.object({
    id: z.literal('SOURCE:REACTOME'),
    release: z.literal('97'),
    publication_date: z.literal('2026-06'),
    license: z.literal('CC0 for Reactome database data'),
    sbml_sha256: z.literal(NUTRIENT_REACTION_REACTOME_CANDIDATES.sbmlDigest),
    mapping_sha256: z.literal(NUTRIENT_REACTION_REACTOME_CANDIDATES.mappingDigest),
    pmid_sha256: z.literal(NUTRIENT_REACTION_REACTOME_CANDIDATES.pmidDigest)
  }).strict(),
  query_sha256: z.literal(NUTRIENT_REACTION_REACTOME_CANDIDATES.queryDigest),
  method: z.literal('reactome-human-sbml-plus-chebi-reaction-mapping-v1'),
  closure_policy: z.literal('Union of unique reactions in the Reactome 97 human SBML archive and Homo sapiens reaction IDs in the versioned ChEBI mapping; direct participant or mapping ChEBI candidates only; no recursive pathway or chemical ancestry expansion.'),
  counts: z.object({
    sbml_pathways: z.literal(2883),
    sbml_reaction_instances: z.literal(74977),
    sbml_unique_reactions: z.literal(16107),
    sbml_duplicate_conflicts: z.literal(0),
    sbml_duplicate_conflict_reactions: z.literal(0),
    mapping_rows: z.literal(221901),
    mapping_human_rows: z.literal(32487),
    mapping_human_reactions: z.literal(9658),
    pmid_rows: z.literal(50195),
    pmid_missing_rows: z.literal(7),
    source_reactions: z.literal(16186),
    selected_reactions: z.literal(3595),
    excluded_reactions: z.literal(12591),
    selected_sbml_detail: z.literal(3575),
    selected_mapping_only: z.literal(20),
    matched_nutrient_terms: z.literal(27),
    unresolved_species_references: z.literal(0)
  }).strict(),
  trust_boundary: z.object({
    candidate_mappings_human_reviewed: z.literal(false),
    endogenous_human_process_established: z.literal(false),
    disease_drug_pathogen_events_separated: z.literal(false),
    stoichiometric_balance_established: z.literal(false),
    trusted_knowledge_eligible: z.literal(false),
    simulation_eligible: z.literal(false),
    can_support_biological_conclusion: z.literal(false),
    automatic_promotion: z.literal(false)
  }).strict()
}).strict()

export const NutrientReactionI2ReconciliationSummarySchema = z.object({
  schema_version: z.literal('1.0.0'),
  artifact_kind: z.literal('compressed-rhea-reactome-reconciliation-report'),
  artifact: z.object({
    filename: z.literal('rhea-141-reactome-97-reconciliation.json.gz'),
    media_type: z.literal('application/gzip'),
    bytes: z.literal(37378),
    sha256: z.literal(NUTRIENT_REACTION_I2_RECONCILIATION.artifactDigest)
  }).strict(),
  content: z.object({
    media_type: z.literal('application/json'),
    bytes: z.literal(998289),
    sha256: z.literal(NUTRIENT_REACTION_I2_RECONCILIATION.contentDigest)
  }).strict(),
  source_artifacts: z.object({
    rhea_sha256: z.literal(NUTRIENT_REACTION_RHEA_CANDIDATES.artifactDigest),
    reactome_sha256: z.literal(NUTRIENT_REACTION_REACTOME_CANDIDATES.artifactDigest),
    rhea_tsv_sha256: z.literal('409107649151d43289a16e99372154254670e8783034d21e5137e79e9a6aa59c')
  }).strict(),
  method: z.literal('direction-aware-exact-chebi-stoichiometric-side-comparison-v1'),
  closure_policy: z.literal('Reactome selected nutrient candidates with explicit Rhea links only; directional IDs normalize to their Rhea master; modifiers are excluded from stoichiometric side comparison; no inferred links.'),
  counts: z.object({
    reactome_selected_reactions: z.literal(3595),
    reactome_reactions_with_rhea_links: z.literal(580),
    reactome_reactions_without_rhea_links: z.literal(3015),
    links: z.literal(735),
    exact_directional_matches: z.literal(245),
    exact_undirected_matches: z.literal(7),
    side_match_direction_conflicts: z.literal(2),
    participant_mismatches: z.literal(46),
    non_comparable_non_chebi: z.literal(262),
    non_comparable_rhea_not_selected: z.literal(173),
    non_comparable_rhea_master_absent: z.literal(0),
    non_comparable_obsolete_rhea_id: z.literal(0),
    non_comparable_unknown_rhea_id: z.literal(0),
    rhea_direction_rows: z.literal(18558),
    rhea_obsolete_ids: z.literal(1184)
  }).strict(),
  trust_boundary: z.object({
    source_identity_reviewed: z.literal(false),
    mismatches_adjudicated: z.literal(false),
    human_applicability_established: z.literal(false),
    trusted_knowledge_eligible: z.literal(false),
    simulation_eligible: z.literal(false),
    can_support_biological_conclusion: z.literal(false),
    automatic_promotion: z.literal(false)
  }).strict()
}).strict()

const ParticipantSchema = z.object({
  identity_status: z.enum(['exact', 'class-level', 'unresolved']),
  chemical_id: NonEmptyStringSchema.nullable(),
  unresolved_constraints: z.array(NonEmptyStringSchema),
  role: z.enum(['reactant', 'product', 'transported-cargo', 'catalyst-bound-cofactor', 'regulator']),
  coefficient: z.string().regex(/^[1-9][0-9]*(?:\/[1-9][0-9]*)?$/),
  compartment_id: NonEmptyStringSchema.nullable()
}).strict().superRefine((value, context) => {
  if (value.identity_status === 'exact' && (value.chemical_id === null || value.unresolved_constraints.length !== 0)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'exact participants require one chemical id and no unresolved constraints' })
  }
  if (value.identity_status !== 'exact' && (value.chemical_id !== null || value.unresolved_constraints.length === 0)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'non-exact participants require unresolved constraints and no exact chemical id' })
  }
})

const UncertaintySchema = z.object({
  representation: z.enum(['distribution', 'interval', 'qualitative', 'unknown']),
  description: NonEmptyStringSchema,
  parameters: z.record(FiniteNumberSchema)
}).strict()

export const NutrientReactionSimulationCandidateSchema = z.object({
  id: z.string().regex(/^REACTION_CANDIDATE:[A-Z0-9][A-Z0-9_.-]*$/),
  content_digest: Sha256HexSchema,
  origin: OriginSchema,
  event_kind_id: z.string().regex(/^EVENT_KIND:[A-Z0-9][A-Z0-9_.-]*$/),
  nutrient_concept_ids: z.array(z.string().regex(/^NUTRIENT:[A-Z0-9][A-Z0-9_.-]*$/)).min(1),
  participants: z.array(ParticipantSchema).min(1),
  direction_status: ContextStatusSchema,
  compartment_status: ContextStatusSchema,
  source_ids: z.array(z.string().regex(/^SOURCE:[A-Z0-9][A-Z0-9_.-]*$/)),
  generation_lineage: z.array(Sha256HexSchema),
  assumptions: z.array(NonEmptyStringSchema),
  uncertainty: UncertaintySchema,
  simulation_eligible: z.boolean(),
  simulation_eligibility_rationale: NonEmptyStringSchema,
  trusted_knowledge_eligible: z.literal(false),
  can_support_biological_conclusion: z.literal(false),
  automatic_promotion: z.literal(false),
  review_status: z.enum(['unreviewed', 'reviewed-derived', 'rejected'])
}).strict().superRefine((value, context) => {
  if (new Set(value.nutrient_concept_ids).size !== value.nutrient_concept_ids.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'nutrient concepts must be unique' })
  }
  if (value.source_ids.length === 0 && value.generation_lineage.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'source or generation lineage is required' })
  }
  if (['model-derived', 'text-mined', 'computed', 'assumption', 'hypothetical'].includes(value.origin) && value.assumptions.length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: `${value.origin} candidates require assumptions` })
  }
  if (value.simulation_eligible && (value.direction_status !== 'known' || value.compartment_status !== 'known')) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'simulation-ready candidates require known direction and compartment status' })
  }
  if (value.review_status === 'reviewed-derived' && value.origin === 'measured') {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'review cannot relabel measured source origin as reviewed-derived' })
  }
})

export const NutrientReactionHypothesisSchema = z.object({
  id: z.string().regex(/^HYPOTHESIS:[A-Z0-9][A-Z0-9_.-]*$/),
  content_digest: Sha256HexSchema,
  candidate_ids: z.array(z.string().regex(/^REACTION_CANDIDATE:[A-Z0-9][A-Z0-9_.-]*$/)).min(1),
  input_digests: z.array(Sha256HexSchema).min(1),
  generation_method: NonEmptyStringSchema,
  assumptions: z.array(NonEmptyStringSchema).min(1),
  uncertainty: UncertaintySchema,
  falsifiable_statement: NonEmptyStringSchema,
  proposed_test: NonEmptyStringSchema,
  status: z.enum(['unreviewed', 'accepted-for-testing', 'rejected', 'tested-supported-within-boundary', 'tested-failed', 'not-evaluable']),
  trusted_knowledge_eligible: z.literal(false),
  can_support_biological_conclusion: z.literal(false),
  automatic_promotion: z.literal(false)
}).strict().superRefine((value, context) => {
  if (new Set(value.candidate_ids).size !== value.candidate_ids.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'hypothesis candidates must be unique' })
  }
})

export function verifyNutrientReactionAtlasFoundationSummary(value) {
  return NutrientReactionAtlasFoundationSummarySchema.parse(value)
}

export function verifyNutrientReactionSimulationBootstrapSummary(value) {
  return NutrientReactionSimulationBootstrapSummarySchema.parse(value)
}

export function verifyNutrientReactionRheaCandidateSummary(value) {
  return NutrientReactionRheaCandidateSummarySchema.parse(value)
}

export function verifyNutrientReactionReactomeCandidateSummary(value) {
  return NutrientReactionReactomeCandidateSummarySchema.parse(value)
}

export function verifyNutrientReactionI2ReconciliationSummary(value) {
  return NutrientReactionI2ReconciliationSummarySchema.parse(value)
}

export function verifyNutrientReactionSimulationCandidate(value) {
  return NutrientReactionSimulationCandidateSchema.parse(value)
}

export function verifyNutrientReactionHypothesis(value) {
  return NutrientReactionHypothesisSchema.parse(value)
}

