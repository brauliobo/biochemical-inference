import { z } from 'zod'
import {
  NetworkSchema,
  ReleaseSchema,
  TaxonIdSchema
} from '../../shared/contracts.js'

const CanonicalTaxonIdSchema = z.string().regex(/^NCBITaxon:[1-9][0-9]*$/)
const CompoundIdSchema = z.string().regex(/^CHEBI:[1-9][0-9]*$/)
const ReactionIdSchema = z.string().regex(/^RHEA:[1-9][0-9]*$/)
const ProteinIdSchema = z.string().regex(/^UniProtKB:[A-Z0-9]+$/)
const ReferenceIdSchema = z.string().regex(/^(PubMed:[1-9][0-9]*|UniProtKB:[A-Z0-9]+)$/)
const DigestSchema = z.string().regex(/^[a-f0-9]{64}$/)

const CatalogEntrySchema = z.object({
  release_id: z.string().min(1),
  title: z.string().min(1),
  schema_version: z.literal('1.0.0'),
  release_digest: DigestSchema,
  supported_taxa: z.array(CanonicalTaxonIdSchema).min(1),
  manifest_path: z.string().regex(/^[a-z0-9.-]+\/manifest\.json$/)
}).strict()

export const BiochemicalDbCatalogSchema = z.object({
  catalog_schema_version: z.literal('1.0.0'),
  releases: z.array(CatalogEntrySchema)
}).strict()

const ReleaseRefSchema = z.object({
  id: z.string().min(1),
  schema_version: z.literal('1.0.0'),
  digest: DigestSchema
}).strict()

const TaxonSchema = z.object({
  id: CanonicalTaxonIdSchema,
  scientific_name: z.string().min(1),
  common_name: z.string().min(1),
  source_ids: z.array(z.string()).min(1)
}).strict()

const CompoundSchema = z.object({
  id: CompoundIdSchema,
  name: z.string().min(1),
  synonyms: z.array(z.string()),
  formula: z.string().regex(/^[A-Z][A-Za-z0-9]*$/),
  charge: z.number().int(),
  source_ids: z.array(z.string()).min(1)
}).strict()

const ParticipantSchema = z.object({
  compound_id: CompoundIdSchema,
  coefficient: z.number().int().positive()
}).strict()

const ReactionSchema = z.object({
  id: ReactionIdSchema,
  rhea_master_id: ReactionIdSchema,
  name: z.string().min(1),
  ec_numbers: z.array(z.string().regex(/^[0-9]+\.[0-9-]+\.[0-9-]+\.[0-9-]+$/)).min(1),
  physiological_direction: z.enum(['left-to-right', 'right-to-left', 'bidirectional']),
  equation: z.string().min(3),
  reactants: z.array(ParticipantSchema).min(1),
  products: z.array(ParticipantSchema).min(1),
  source_ids: z.array(z.string()).min(1)
}).strict()

const ProteinSchema = z.object({
  id: ProteinIdSchema,
  accession: z.string().regex(/^[A-Z0-9]+$/),
  taxon_id: CanonicalTaxonIdSchema,
  gene_symbol: z.string().min(1),
  recommended_name: z.string().min(1),
  reviewed: z.literal(true),
  source_ids: z.array(z.string()).min(1)
}).strict()

const CatalysisSchema = z.object({
  id: z.string().regex(/^CATALYSIS:[A-Z0-9]+-[0-9]+$/),
  protein_id: ProteinIdSchema,
  reaction_id: ReactionIdSchema,
  taxon_id: CanonicalTaxonIdSchema,
  evidence_class: z.enum(['direct', 'inferred']),
  evidence_code: z.string().regex(/^ECO:[0-9]{7}$/),
  reference_ids: z.array(ReferenceIdSchema).min(1)
}).strict()

const ReferenceSchema = z.object({
  id: ReferenceIdSchema,
  kind: z.enum(['pubmed', 'uniprot']),
  citation: z.string().min(1),
  url: z.string().url(),
  support_level: z.enum(['direct', 'inferred']),
  source_ids: z.array(z.string()).min(1)
}).strict()

const LimitationSchema = z.object({
  id: z.string().regex(/^LIMITATION:[A-Z0-9-]+$/),
  statement: z.string().min(1)
}).strict()

export const BiochemicalDbNetworkSchema = z.object({
  contract_version: z.literal('1.0.0'),
  release: ReleaseRefSchema,
  taxon: TaxonSchema,
  compounds: z.array(CompoundSchema),
  reactions: z.array(ReactionSchema),
  proteins: z.array(ProteinSchema),
  catalysis: z.array(CatalysisSchema),
  references: z.array(ReferenceSchema),
  limitations: z.array(LimitationSchema)
}).strict()

export function canonicalTaxonId(taxonId) {
  return `NCBITaxon:${taxonId}`
}

function internalTaxonId(taxonId) {
  return TaxonIdSchema.parse(Number(taxonId.slice('NCBITaxon:'.length)))
}

export function adaptCatalogEntry(entry) {
  return ReleaseSchema.parse({
    id: entry.release_id,
    title: entry.title,
    digest: `sha256:${entry.release_digest}`,
    schemaVersion: entry.schema_version,
    supportedTaxa: entry.supported_taxa.map(internalTaxonId),
    verified: true,
    source: 'biochemical-db'
  })
}

export function adaptNetwork(payload) {
  const taxonId = internalTaxonId(payload.taxon.id)
  const catalysisByReaction = new Map()
  const catalysisByProtein = new Map()

  for (const assertion of payload.catalysis) {
    catalysisByReaction.set(assertion.reaction_id, [...(catalysisByReaction.get(assertion.reaction_id) ?? []), assertion])
    catalysisByProtein.set(assertion.protein_id, [...(catalysisByProtein.get(assertion.protein_id) ?? []), assertion])
  }

  return NetworkSchema.parse({
    contractVersion: payload.contract_version,
    releaseId: payload.release.id,
    taxonId,
    compounds: payload.compounds.map((compound) => ({
      id: compound.id,
      name: compound.name,
      synonyms: compound.synonyms,
      formula: compound.formula,
      charge: compound.charge,
      sourceIds: compound.source_ids,
      evidenceIds: []
    })),
    reactions: payload.reactions.map((reaction) => {
      const assertions = catalysisByReaction.get(reaction.id) ?? []
      return {
        id: reaction.id,
        rheaMasterId: reaction.rhea_master_id,
        name: reaction.name,
        equation: reaction.equation,
        physiologicalDirection: reaction.physiological_direction,
        reactants: reaction.reactants.map((participant) => ({ compoundId: participant.compound_id, coefficient: participant.coefficient })),
        products: reaction.products.map((participant) => ({ compoundId: participant.compound_id, coefficient: participant.coefficient })),
        proteinIds: [...new Set(assertions.map((assertion) => assertion.protein_id))],
        evidenceIds: [...new Set(assertions.flatMap((assertion) => assertion.reference_ids))]
      }
    }),
    proteins: payload.proteins.map((protein) => ({
      id: protein.id,
      name: protein.recommended_name,
      gene: protein.gene_symbol,
      taxonId: internalTaxonId(protein.taxon_id),
      evidenceIds: [...new Set((catalysisByProtein.get(protein.id) ?? []).flatMap((assertion) => assertion.reference_ids))]
    })),
    catalysis: payload.catalysis.map((assertion) => ({
      id: assertion.id,
      proteinId: assertion.protein_id,
      reactionId: assertion.reaction_id,
      taxonId: internalTaxonId(assertion.taxon_id),
      evidenceClass: assertion.evidence_class,
      evidenceCode: assertion.evidence_code,
      referenceIds: assertion.reference_ids
    })),
    evidence: payload.references.map((reference) => ({
      id: reference.id,
      citation: reference.citation,
      kind: reference.kind,
      url: reference.url,
      evidenceClass: reference.support_level
    })),
    limitations: payload.limitations
  })
}
