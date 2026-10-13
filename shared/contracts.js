import { z } from 'zod'
import { Sha256DigestSchema, OffsetDatetimeSchema, SemverSchema, KebabIdSchema, SourceIdSchema, ChebiIdSchema, RheaIdSchema, UniProtIdSchema, FactoryRecordTypeSchema, PositiveIntSchema, NonEmptyStringSchema } from './commons/schemas.js'

export const TAXA = [
  { id: 9606, name: 'Human', scientificName: 'Homo sapiens' },
  { id: 10090, name: 'Mouse', scientificName: 'Mus musculus' }
]

export const TaxonIdSchema = z.union([z.literal(9606), z.literal(10090)])


export const ReleaseSchema = z.object({
  id: NonEmptyStringSchema,
  title: NonEmptyStringSchema,
  digest: Sha256DigestSchema,
  schemaVersion: z.literal('1.0.0'),
  supportedTaxa: z.array(TaxonIdSchema),
  verified: z.literal(true),
  source: z.enum(['biochemical-db', 'bundled-demonstration'])
}).strict()

const ProvenanceArtifactSchema = z.object({
  path: z.string().regex(/^(recipes|sources\/locks)\/[a-z0-9.-]+\.json$/),
  digest: Sha256DigestSchema
}).strict()

const ProvenanceImplementationSchema = z.object({
  id: KebabIdSchema,
  version: SemverSchema,
  digest: Sha256DigestSchema
}).strict()

const ProvenanceSourceObjectSchema = z.object({
  name: KebabIdSchema,
  recordType: FactoryRecordTypeSchema,
  digest: Sha256DigestSchema,
  bytes: PositiveIntSchema,
  objectClass: z.enum(['repository-authored-normalized-fixture', 'upstream-source-object']),
  upstreamResponse: z.boolean(),
  originUrl: z.string().regex(/^(?:file|https):\/\/\S+$/),
  artifactRepository: z.string().regex(/^https:\/\/github\.com\/[^/\s]+\/[^/\s]+$/).nullable(),
  artifactCommit: z.string().regex(/^[a-f0-9]{40}$/).nullable(),
  sourceRelease: NonEmptyStringSchema,
  retrievedAt: OffsetDatetimeSchema,
  sourceIds: z.array(SourceIdSchema).min(1),
  licenseId: NonEmptyStringSchema
}).strict()

export const ProvenanceSchema = z.object({
  releaseId: NonEmptyStringSchema,
  releaseDigest: Sha256DigestSchema,
  recipe: ProvenanceArtifactSchema,
  sourceLock: ProvenanceArtifactSchema,
  sourceObjects: z.array(ProvenanceSourceObjectSchema).min(1),
  transformer: ProvenanceImplementationSchema,
  validation: ProvenanceImplementationSchema
}).strict()

export const EvidenceClassSchema = z.enum(['direct', 'inferred'])

const EvidenceSchema = z.object({
  id: z.string(),
  citation: z.string(),
  kind: z.enum(['pubmed', 'uniprot']),
  url: z.string().url(),
  evidenceClass: EvidenceClassSchema
}).strict()

const CompoundSchema = z.object({
  id: ChebiIdSchema,
  name: z.string(),
  synonyms: z.array(z.string()),
  formula: z.string(),
  charge: z.number().int(),
  sourceIds: z.array(z.string()),
  evidenceIds: z.array(z.string())
}).strict()

const ParticipantSchema = z.object({
  compoundId: ChebiIdSchema,
  coefficient: PositiveIntSchema
}).strict()

const ReactionSchema = z.object({
  id: RheaIdSchema,
  rheaMasterId: RheaIdSchema,
  name: z.string(),
  equation: z.string(),
  physiologicalDirection: z.enum(['left-to-right', 'right-to-left', 'bidirectional']),
  reactants: z.array(ParticipantSchema),
  products: z.array(ParticipantSchema),
  proteinIds: z.array(z.string()),
  evidenceIds: z.array(z.string())
}).strict()

const ProteinSchema = z.object({
  id: UniProtIdSchema,
  name: z.string(),
  gene: z.string(),
  taxonId: TaxonIdSchema,
  evidenceIds: z.array(z.string())
}).strict()

const CatalysisSchema = z.object({
  id: z.string(),
  proteinId: UniProtIdSchema,
  reactionId: RheaIdSchema,
  taxonId: TaxonIdSchema,
  evidenceClass: EvidenceClassSchema,
  evidenceCode: z.string().regex(/^ECO:[0-9]{7}$/),
  referenceIds: z.array(z.string())
}).strict()

const LimitationSchema = z.object({
  id: z.string(),
  statement: z.string()
}).strict()

export const NetworkSchema = z.object({
  contractVersion: z.literal('1.0.0'),
  releaseId: z.string(),
  taxonId: TaxonIdSchema,
  compounds: z.array(CompoundSchema),
  reactions: z.array(ReactionSchema),
  proteins: z.array(ProteinSchema),
  catalysis: z.array(CatalysisSchema),
  evidence: z.array(EvidenceSchema),
  limitations: z.array(LimitationSchema)
}).strict()

export const PresetSchema = z.enum(['baseline', 'reduced-mthfr', 'custom'])

export const SimulationRequestSchema = z.object({
  releaseId: NonEmptyStringSchema,
  taxonId: TaxonIdSchema,
  preset: PresetSchema,
  mthfrActivity: z.number().min(0.1).max(1.5),
  durationHours: z.number().min(1).max(72),
  stepHours: z.number().min(0.01).max(0.5).default(0.05)
}).strict().superRefine((request, context) => {
  const presetActivity = request.preset === 'baseline' ? 1 : request.preset === 'reduced-mthfr' ? 0.35 : undefined
  if (presetActivity !== undefined && request.mthfrActivity !== presetActivity) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['mthfrActivity'],
      message: `${request.preset} requires MTHFR activity ${presetActivity}`
    })
  }

  const integrationSteps = request.durationHours / request.stepHours
  if (Math.abs(integrationSteps - Math.round(integrationSteps)) > 1e-9) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['stepHours'],
      message: 'stepHours must divide durationHours into a whole number of fixed steps'
    })
  }
})

export const TopologyKindSchema = z.enum(['curated', 'model-only', 'boundary'])

const TopologyEntitySchema = z.object({
  id: NonEmptyStringSchema,
  name: NonEmptyStringSchema,
  kind: TopologyKindSchema,
  stateVariable: z.boolean(),
  knowledgeCompoundId: ChebiIdSchema.optional()
}).strict()

const TopologyReactionSchema = z.object({
  id: NonEmptyStringSchema,
  name: NonEmptyStringSchema,
  kind: TopologyKindSchema,
  reactantIds: z.array(z.string()),
  productIds: z.array(z.string()),
  fluxSeriesId: NonEmptyStringSchema,
  knowledgeReactionId: RheaIdSchema.optional()
}).strict()

export const ModelSchema = z.object({
  id: z.literal('one-carbon'),
  version: z.string(),
  engineVersion: z.string(),
  concentrationUnit: z.literal('illustrative µM'),
  fluxUnit: z.literal('illustrative µM/h'),
  supportedTaxa: z.array(TaxonIdSchema),
  presets: z.array(z.object({ id: PresetSchema, name: z.string(), mthfrActivity: z.number().nullable() }).strict()),
  controls: z.object({
    mthfrActivity: z.object({ min: z.number(), max: z.number() }).strict(),
    durationHours: z.object({ min: z.number(), max: z.number() }).strict(),
    stepHours: z.number()
  }).strict(),
  topology: z.object({
    entities: z.array(TopologyEntitySchema),
    reactions: z.array(TopologyReactionSchema)
  }).strict(),
  limitations: z.array(z.string())
}).strict()

const SeriesSchema = z.object({
  id: z.string(),
  name: z.string(),
  unit: z.string(),
  values: z.array(z.number())
}).strict()

export const SimulationResultSchema = z.object({
  status: z.literal('successful'),
  runId: Sha256DigestSchema,
  release: ReleaseSchema,
  modelVersion: z.string(),
  engineVersion: z.string(),
  taxonId: TaxonIdSchema,
  preset: PresetSchema,
  effectiveInputs: z.object({
    mthfrActivity: z.number(),
    durationHours: z.number(),
    stepHours: z.number(),
    initialConcentrations: z.record(z.number())
  }).strict(),
  timeHours: z.array(z.number()),
  concentrations: z.array(SeriesSchema),
  fluxes: z.array(SeriesSchema),
  summary: z.object({
    finalHomocysteine: z.number(),
    finalSamSahRatio: z.number(),
    homocysteineChangePercent: z.number(),
    samSahRatioChangePercent: z.number()
  }).strict(),
  diagnostics: z.object({
    method: z.literal('fixed-step RK4'),
    integrationSteps: z.number().int(),
    integrationStepHours: z.number(),
    maxAbsoluteDerivative: z.number(),
    nonNegative: z.boolean(),
    netRepresentedPoolChange: z.number(),
    deterministic: z.literal(true)
  }).strict(),
  warnings: z.array(z.string()),
  predictionLabel: z.literal('Illustrative model prediction; not measured physiology.'),
  proteinAssociations: z.array(ProteinSchema)
}).strict()

export const ApiErrorSchema = z.object({
  statusCode: z.number(),
  code: z.string(),
  error: z.string(),
  message: z.string(),
  fieldErrors: z.record(z.array(z.string())).optional()
}).strict()
