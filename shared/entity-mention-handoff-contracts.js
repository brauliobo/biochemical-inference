import { z } from 'zod'

const Sha256Schema = z.string().regex(/^[a-f0-9]{64}$/)
const ContentIdSchema = z.string().regex(/^sha256:[a-f0-9]{64}$/)
const CurieSchema = z.string().regex(/^[A-Za-z][A-Za-z0-9_-]*:[A-Za-z0-9_.-]+$/)
const SafePathSchema = z.string().regex(/^[a-z0-9][a-z0-9_.-]*(?:\/[a-z0-9][a-z0-9_.-]*)*$/).refine((value) => !value.includes('..'), 'path traversal is forbidden')
const BoundedBytesSchema = z.number().int().positive().max(256 * 1024 * 1024)
const BoundedCountSchema = z.number().int().nonnegative().max(1_000_000)

export const ENTITY_MENTION_HANDOFF_CONTRACT = 'nutrient-reaction-atlas/simulation-handoff/v1'
export const ENTITY_MENTION_CONSUMER_IMPORT_CONTRACT = 'entity-mention-handoff-consumer-import/v1'
export const ENTITY_MENTION_SIMULATION_SPECIFICATION_CONTRACT = 'entity-mention-handoff-simulation-specification/v1'

const ExactParticipantSchema = z.object({
  charge: z.number().int(),
  chemical_id: CurieSchema,
  coefficient: z.string().regex(/^[1-9][0-9]*$/),
  compartment_id: CurieSchema,
  formula: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(['reactant', 'product'])
}).strict()

export const EntityMentionHandoffCandidateSchema = z.object({
  id: z.literal('REACTION_CANDIDATE:MTHFR_FOLATE_REDUCTION'),
  source_id: z.literal('RHEA:19819'),
  participants: z.array(ExactParticipantSchema).length(5),
  direction_status: z.literal('known'),
  compartments: z.array(z.object({ id: CurieSchema, name: z.string().min(1).nullable(), go_ids: z.array(CurieSchema) }).strict()).min(1).max(4),
  balance_status: z.literal('balanced'),
  human_applicability_status: z.literal('inferred'),
  simulation_eligibility_status: z.literal('eligible'),
  eligibility_rationale: z.string().min(1),
  uncertainty_status: z.string().min(1),
  disease_status: z.literal('unknown'),
  drug_status: z.literal('unknown'),
  pathogen_status: z.literal('unknown'),
  source_artifact_sha256: Sha256Schema,
  candidate_sha256: Sha256Schema
}).strict()

const HandoffReleaseSchema = z.object({
  id: z.string().min(1),
  foundation_id: z.string().min(1),
  foundation_digest: Sha256Schema,
  chebi_release: z.string().min(1),
  rhea_release: z.string().min(1),
  reactome_release: z.string().min(1),
  manifest_sha256: Sha256Schema
}).strict()

export const EntityMentionSimulationHandoffSchema = z.object({
  schema: z.literal(ENTITY_MENTION_HANDOFF_CONTRACT),
  createdAt: z.string().datetime({ offset: true }),
  intent: z.literal('external-inference-request'),
  execution: z.literal('none: this artifact contains no numerical result and this SPA runs no simulation'),
  hypothesis: z.string().trim().min(1),
  reactionIds: z.tuple([z.literal('RHEA:19819')]),
  release: HandoffReleaseSchema,
  candidates: z.tuple([EntityMentionHandoffCandidateSchema]),
  mode: z.literal('eligible-stoichiometric'),
  assumptions: z.array(z.string().min(1)).min(2).max(32),
  evidence: z.object({
    trusted: z.array(z.string()).length(0),
    unreviewed: z.tuple([z.literal('REACTION_CANDIDATE:MTHFR_FOLATE_REDUCTION')]),
    browserLocalReviews: z.literal('excluded: non-authoritative and never trusted')
  }).strict(),
  boundaries: z.object({
    simulation: z.literal('boundary: handoff only; no numerical execution'),
    unresolvedMappings: z.literal('excluded unless explicitly identified in assumptions'),
    unknownDiseaseRelations: z.literal(true),
    unknownDrugRelations: z.literal(true),
    unknownPathogenRelations: z.literal(true),
    sourceDeclaredUnknowns: z.tuple([z.literal('disease'), z.literal('drug'), z.literal('pathogen')]),
    userAddedUnknowns: z.array(z.enum(['disease', 'drug', 'pathogen'])).length(0)
  }).strict(),
  id: ContentIdSchema,
  digestAlgorithm: z.literal('SHA-256'),
  desktop: z.object({ local: z.literal(true), official: z.literal(false) }).strict().optional()
}).strict()

export const StaticFileDescriptorSchema = z.object({
  filename: SafePathSchema,
  media_type: z.enum(['application/gzip', 'application/json', 'application/ld+json', 'application/n-quads']),
  bytes: BoundedBytesSchema,
  sha256: Sha256Schema,
  content_bytes: BoundedBytesSchema,
  content_sha256: Sha256Schema,
  record_count: BoundedCountSchema.optional()
}).strict()

export const EntityMentionServingManifestSchema = z.object({
  schema_version: z.literal('1.0.0'),
  artifact_kind: z.literal('nutrient-reaction-github-pages-static-tree'),
  release: z.object({
    id: z.string().min(1),
    foundation_id: z.string().min(1),
    foundation_digest: Sha256Schema,
    chebi_release: z.string().min(1),
    rhea_release: z.string().min(1),
    reactome_release: z.string().min(1)
  }).strict(),
  cutoff_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  source_artifacts: z.array(z.object({ id: SafePathSchema, bytes: BoundedBytesSchema, sha256: Sha256Schema, media_type: z.enum(['application/gzip', 'application/json']) }).strict()).max(128),
  counts: z.object({
    ontology_terms: BoundedCountSchema, ontology_relations: BoundedCountSchema, registered_sources: BoundedCountSchema,
    acquisitions: BoundedCountSchema, rhea_reactions: BoundedCountSchema, reactome_reactions: BoundedCountSchema,
    reactions: BoundedCountSchema, detail_shards: BoundedCountSchema, source_dispositions: BoundedCountSchema,
    reconciliation_links: BoundedCountSchema, reconciliation_outcomes: BoundedCountSchema,
    entity_mention_entities: BoundedCountSchema, entity_mention_edges: BoundedCountSchema, entity_mention_articles: BoundedCountSchema,
    entity_mention_mentions: BoundedCountSchema, entity_mention_assertions: BoundedCountSchema,
    entity_mention_static_files: BoundedCountSchema.positive(), output_files: BoundedCountSchema.positive()
  }).strict(),
  files: z.array(StaticFileDescriptorSchema).min(1).max(2_000),
  boundary: z.object({ serving_model: z.literal('serverless-static-files'), access: z.literal('read-only'), runtime_database: z.literal(false), mutation_api: z.literal(false), automatic_promotion: z.literal(false) }).strict()
}).strict()

export const ProducerLocalSignatureSchema = z.object({
  schema_version: z.literal('1.0.0'),
  artifact_kind: z.literal('nutrient-reaction-desktop-local-signature'),
  official: z.literal(false),
  release_id: z.string().min(1),
  manifest: z.object({ filename: z.literal('manifest.json'), bytes: z.number().int().positive(), sha256: Sha256Schema }).strict(),
  signer: z.object({
    algorithm: z.literal('Ed25519'),
    key_id: ContentIdSchema,
    public_jwk: z.object({ crv: z.literal('Ed25519'), kty: z.literal('OKP'), x: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).strict(),
    scope: z.literal('workspace-local-user-key')
  }).strict(),
  signature: z.string().regex(/^[A-Za-z0-9+/]{86}==$/)
}).strict()

export const ProducerPagesSignatureEnvelopeSchema = z.object({
  schema_version: z.literal('1.0.0'),
  artifact_kind: z.literal('nutrient-reaction-pages-manifest-signature'),
  manifest: z.object({ filename: z.literal('manifest.json'), bytes: BoundedBytesSchema, sha256: Sha256Schema }).strict(),
  signer: z.object({
    algorithm: z.literal('Ed25519'),
    key_id: ContentIdSchema,
    public_jwk: z.object({ crv: z.literal('Ed25519'), kty: z.literal('OKP'), x: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).strict()
  }).strict(),
  signature: z.string().regex(/^[A-Za-z0-9+/]{86}==$/)
}).strict()

const StoredObjectSchema = z.object({ sha256: Sha256Schema, bytes: z.number().int().positive() }).strict()

export const EntityMentionStoredImportSchema = z.object({
  schema: z.literal(ENTITY_MENTION_CONSUMER_IMPORT_CONTRACT),
  trust: z.enum(['official-pages-signed', 'workspace-local-signed', 'workspace-local-unsigned']),
  release: z.object({ id: z.string().min(1), manifest_sha256: Sha256Schema, entity_release_id: z.string().min(1), entity_release_digest: Sha256Schema }).strict(),
  handoff: z.object({ id: ContentIdSchema, object: StoredObjectSchema }).strict(),
  signature: StoredObjectSchema.nullable(),
  files: z.array(z.object({ path: SafePathSchema, object: StoredObjectSchema }).strict()).min(1).max(2_000),
  required_paths: z.array(SafePathSchema).min(1),
  separation: z.object({
    producer_facts: z.literal('entity-records/entities.json and entity-records/edges.json'),
    article_mentions: z.literal('entity-records/articles.json, entity-records/mentions.json, and entity-records/mention_resolutions.json'),
    machine_assertions: z.literal('entity-records/text_assertions.json and entity-records/model_provenance.json'),
    consumer_inputs: z.literal('derived-only; not a producer record'),
    simulation_outputs: z.literal('not present in imported closure')
  }).strict()
}).strict()

export const ImportedSimulationSpecificationSchema = z.object({
  schema: z.literal(ENTITY_MENTION_SIMULATION_SPECIFICATION_CONTRACT),
  kind: z.literal('consumer-simulation-input'),
  artifactId: ContentIdSchema,
  importId: ContentIdSchema,
  sourceHandoffId: ContentIdSchema,
  selection: z.object({ candidateId: z.literal('REACTION_CANDIDATE:MTHFR_FOLATE_REDUCTION'), reactionId: z.literal('RHEA:19819'), taxonId: z.literal('NCBITaxon:9606'), tissueId: z.literal('UBERON:0002107'), compartmentId: z.literal('GO:0005829') }).strict(),
  numericalMapping: z.object({
    modelId: z.literal('one-carbon'),
    modelReactionId: z.literal('RHEA:19819'),
    mapping: z.literal('explicit-identity'),
    stoichiometryUse: z.literal('identity-only; existing reduced numerical topology is unchanged'),
    omittedExplicitParticipants: z.tuple([z.literal('CHEBI:15378'), z.literal('CHEBI:57783'), z.literal('CHEBI:58349')]),
    boundaryPolicy: z.literal('no source unknown is converted into a numerical boundary or parameter')
  }).strict(),
  provenance: z.object({
    sourceReleaseIds: z.array(z.string().min(1)).min(1), sourceIds: z.array(CurieSchema).min(1), sourceLineageRefs: z.array(CurieSchema).min(1),
    provenanceRefs: z.array(CurieSchema).min(1), rightsRefs: z.array(CurieSchema).min(1), evidenceRefs: z.array(CurieSchema),
    edgeRefs: z.array(CurieSchema).min(1), origins: z.array(z.enum(['direct', 'inferred', 'orthology-transferred', 'model-derived'])).min(1),
    epistemicStatuses: z.array(z.enum(['asserted', 'supported', 'disputed', 'hypothetical'])).min(1), reviewStatuses: z.array(z.enum(['unreviewed', 'reviewed', 'rejected'])).min(1),
    sourceCandidateQualifiers: z.object({
      sourceOrigin: z.literal('curated'), adaptationOrigin: z.literal('model-derived'), humanApplicability: z.literal('inferred'), reviewStatus: z.literal('unreviewed'),
      simulationMode: z.literal('stoichiometric-symbolic'), direction: z.literal('left-to-right'), eligibilityRationale: z.string().min(1), biologicalSupport: z.literal(false), trusted: z.literal(false)
    }).strict(),
    contextualEdgeQualifiers: z.array(z.object({
      id: CurieSchema, subjectId: CurieSchema, predicate: z.enum(['catalyzes', 'participates_in']), objectId: CurieSchema,
      origin: z.enum(['inferred', 'orthology-transferred']), epistemicStatus: z.literal('supported'), reviewStatus: z.literal('reviewed'),
      taxonId: z.enum(['NCBITaxon:9606', 'NCBITaxon:10090']), tissueId: z.literal('UBERON:0002107'), compartmentId: z.literal('GO:0005829'),
      evidenceRefs: z.array(CurieSchema).min(1), canSupportBiologicalConclusion: z.literal(false), automaticPromotion: z.literal(false)
    }).strict()).length(4),
    trustedKnowledgeEligible: z.literal(false), canSupportBiologicalConclusion: z.literal(false), automaticPromotion: z.literal(false),
    assumptions: z.array(z.string().min(1)).min(2), uncertainty: z.object({ representation: z.literal('qualitative'), description: z.string().min(1) }).strict(),
    sourceDeclaredUnknowns: z.tuple([z.literal('disease'), z.literal('drug'), z.literal('pathogen')]), limitations: z.array(z.object({ id: CurieSchema, category: z.string().min(1), statement: z.string().min(1), sourceReleaseId: z.string().nullable() }).strict()).min(5)
  }).strict()
}).strict()
