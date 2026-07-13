import { z } from 'zod'

export const TAXA = [
  { id: 9606, name: 'Human', scientificName: 'Homo sapiens' },
  { id: 10090, name: 'Mouse', scientificName: 'Mus musculus' }
]

export const TaxonIdSchema = z.union([z.literal(9606), z.literal(10090)])

const Sha256Schema = z.string().regex(/^sha256:[a-f0-9]{64}$/)

export const ReleaseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  digest: Sha256Schema,
  schemaVersion: z.literal('1.0.0'),
  supportedTaxa: z.array(TaxonIdSchema),
  verified: z.literal(true),
  source: z.enum(['biochemical-db', 'bundled-demonstration'])
}).strict()

const ProvenanceArtifactSchema = z.object({
  path: z.string().regex(/^(recipes|sources\/locks)\/[a-z0-9.-]+\.json$/),
  digest: Sha256Schema
}).strict()

const ProvenanceImplementationSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  version: z.string().regex(/^[0-9]+\.[0-9]+\.[0-9]+$/),
  digest: Sha256Schema
}).strict()

const ProvenanceSourceObjectSchema = z.object({
  name: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  recordType: z.enum(['taxa', 'compounds', 'reactions', 'proteins', 'references', 'catalysis', 'limitations']),
  digest: Sha256Schema,
  bytes: z.number().int().positive(),
  objectClass: z.enum(['repository-authored-normalized-fixture', 'upstream-source-object']),
  upstreamResponse: z.boolean(),
  originUrl: z.string().regex(/^(?:file|https):\/\/\S+$/),
  artifactRepository: z.string().regex(/^https:\/\/github\.com\/[^/\s]+\/[^/\s]+$/).nullable(),
  artifactCommit: z.string().regex(/^[a-f0-9]{40}$/).nullable(),
  sourceRelease: z.string().min(1),
  retrievedAt: z.string().datetime({ offset: true }),
  sourceIds: z.array(z.string().regex(/^[A-Z][A-Z0-9_]*$/)).min(1),
  licenseId: z.string().min(1)
}).strict()

export const ProvenanceSchema = z.object({
  releaseId: z.string().min(1),
  releaseDigest: Sha256Schema,
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
  id: z.string().regex(/^CHEBI:[1-9][0-9]*$/),
  name: z.string(),
  synonyms: z.array(z.string()),
  formula: z.string(),
  charge: z.number().int(),
  sourceIds: z.array(z.string()),
  evidenceIds: z.array(z.string())
}).strict()

const ParticipantSchema = z.object({
  compoundId: z.string().regex(/^CHEBI:[1-9][0-9]*$/),
  coefficient: z.number().int().positive()
}).strict()

const ReactionSchema = z.object({
  id: z.string().regex(/^RHEA:[1-9][0-9]*$/),
  rheaMasterId: z.string().regex(/^RHEA:[1-9][0-9]*$/),
  name: z.string(),
  equation: z.string(),
  physiologicalDirection: z.enum(['left-to-right', 'right-to-left', 'bidirectional']),
  reactants: z.array(ParticipantSchema),
  products: z.array(ParticipantSchema),
  proteinIds: z.array(z.string()),
  evidenceIds: z.array(z.string())
}).strict()

const ProteinSchema = z.object({
  id: z.string().regex(/^UniProtKB:[A-Z0-9]+$/),
  name: z.string(),
  gene: z.string(),
  taxonId: TaxonIdSchema,
  evidenceIds: z.array(z.string())
}).strict()

const CatalysisSchema = z.object({
  id: z.string(),
  proteinId: z.string().regex(/^UniProtKB:[A-Z0-9]+$/),
  reactionId: z.string().regex(/^RHEA:[1-9][0-9]*$/),
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
  releaseId: z.string().min(1),
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
  id: z.string().min(1),
  name: z.string().min(1),
  kind: TopologyKindSchema,
  stateVariable: z.boolean(),
  knowledgeCompoundId: z.string().regex(/^CHEBI:[1-9][0-9]*$/).optional()
}).strict()

const TopologyReactionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: TopologyKindSchema,
  reactantIds: z.array(z.string()),
  productIds: z.array(z.string()),
  fluxSeriesId: z.string().min(1),
  knowledgeReactionId: z.string().regex(/^RHEA:[1-9][0-9]*$/).optional()
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
  runId: z.string().regex(/^sha256:[a-f0-9]{64}$/),
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
