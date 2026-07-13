import {
  AtlasClaimsResponseSchema,
  AtlasCoverageResponseSchema,
  AtlasEntityResponseSchema,
  AtlasNetworkSchema,
  AtlasReleaseDetailSchema,
  AtlasSubgraphSchema
} from '../../shared/atlas-contracts.js'

export const BUNDLED_ATLAS_RELEASE = {
  id: 'contextual-mthfr-human-mouse-v2.0.0',
  title: 'Contextual human and mouse MTHFR atlas slice',
  digest: 'sha256:79c9cb88780e71898b1efa7470ef314d5de5ff8ca89815f461b381cfa6b2d65f',
  schemaVersion: '2.0.0',
  supportedTaxa: [9606, 10090],
  verified: true,
  source: 'bundled-demonstration'
}

export const BUNDLED_ATLAS_DETAIL = AtlasReleaseDetailSchema.parse({
  release: BUNDLED_ATLAS_RELEASE,
  publishedAt: '2026-07-12',
  immutable: true,
  scientificScope: 'A bounded contextual atlas slice connecting human and mouse MTHFR genes, transcripts, proteins, complexes, Rhea chemistry, Reactome pathways, cytosol, liver, MTHFR deficiency, and verified phenotypes with explicit evidence derivation and measured gaps.',
  recordCounts: { entities: 23, claims: 18, evidence: 15, mappings: 4, transformations: 3, coverage: 26, limitations: 7 },
  apiContract: '2.0.0'
})

const common = (id, name, entityType, taxonId, sourceIds, extra = {}) => ({ id, name, entityType, taxonId, externalIds: [], sourceIds, ...extra })
const entities = [
  common('HGNC:7436', 'methylenetetrahydrofolate reductase', 'gene', 9606, ['HGNC', 'ENSEMBL'], { externalIds: ['Ensembl:ENSG00000177000'], symbol: 'MTHFR' }),
  common('MGI:106639', 'methylenetetrahydrofolate reductase', 'gene', 10090, ['MGI', 'ENSEMBL'], { externalIds: ['Ensembl:ENSMUSG00000029009'], symbol: 'Mthfr' }),
  common('Ensembl:ENST00000376590', 'MTHFR-201 MANE Select transcript', 'transcript', 9606, ['ENSEMBL'], { geneId: 'HGNC:7436', canonical: true }),
  common('Ensembl:ENSMUST00000097788', 'Mthfr-202 canonical transcript', 'transcript', 10090, ['ENSEMBL'], { geneId: 'MGI:106639', canonical: true }),
  common('UniProtKB:P42898', 'Methylenetetrahydrofolate reductase (NADPH)', 'protein', 9606, ['UNIPROTKB'], { geneId: 'HGNC:7436', reviewed: true }),
  common('UniProtKB:Q9WU20', 'Methylenetetrahydrofolate reductase (NADPH)', 'protein', 10090, ['UNIPROTKB'], { geneId: 'MGI:106639', reviewed: true }),
  common('UniProtKB:P42898-1', 'MTHFR isoform 1', 'isoform', 9606, ['UNIPROTKB'], { proteinId: 'UniProtKB:P42898', sequenceStatus: 'displayed' }),
  common('UniProtKB:P42898-2', 'MTHFR isoform 2', 'isoform', 9606, ['UNIPROTKB'], { proteinId: 'UniProtKB:P42898', sequenceStatus: 'alternative' }),
  common('CHEBI:15636', '(6R)-5,10-methylenetetrahydrofolate(2-)', 'compound', null, ['CHEBI'], { formula: 'C20H21N7O6', charge: -2 }),
  common('CHEBI:57783', 'NADPH(4-)', 'compound', null, ['CHEBI'], { formula: 'C21H26N7O17P3', charge: -4 }),
  common('CHEBI:15378', 'hydron', 'compound', null, ['CHEBI'], { formula: 'H', charge: 1 }),
  common('CHEBI:18608', '(6S)-5-methyltetrahydrofolate(2-)', 'compound', null, ['CHEBI'], { formula: 'C20H23N7O6', charge: -2 }),
  common('CHEBI:58349', 'NADP(3-)', 'compound', null, ['CHEBI'], { formula: 'C21H25N7O17P3', charge: -3 }),
  common('RHEA:19819', 'MTHFR physiological reduction', 'reaction', null, ['RHEA'], {
    equation: '(6R)-5,10-methylenetetrahydrofolate + NADPH + H(+) -> (6S)-5-methyltetrahydrofolate + NADP(+)',
    direction: 'left-to-right',
    participants: [
      ['CHEBI:15636', 'reactant'], ['CHEBI:57783', 'reactant'], ['CHEBI:15378', 'reactant'], ['CHEBI:18608', 'product'], ['CHEBI:58349', 'product']
    ].map(([compoundId, side]) => ({ compoundId, coefficient: 1, side }))
  }),
  common('Reactome:R-HSA-200713', 'MTHFR dimer', 'complex', 9606, ['REACTOME'], { componentIds: ['UniProtKB:P42898'] }),
  common('Reactome:R-MMU-200713', 'Mthfr dimer', 'complex', 10090, ['REACTOME'], { componentIds: ['UniProtKB:Q9WU20'] }),
  common('Reactome:R-HSA-196757', 'Metabolism of folate and pterines', 'pathway', 9606, ['REACTOME']),
  common('Reactome:R-MMU-196757', 'Metabolism of folate and pterines', 'pathway', 10090, ['REACTOME']),
  common('GO:0005829', 'cytosol', 'compartment', null, ['GO']),
  common('UBERON:0002107', 'liver', 'tissue', null, ['UBERON']),
  common('MONDO:0009353', 'homocystinuria due to methylene tetrahydrofolate reductase deficiency', 'disease', 9606, ['MONDO']),
  common('HP:0002156', 'Homocystinuria', 'phenotype', 9606, ['HPO'], { phenotypeSystem: 'HPO' }),
  common('MP:0012335', 'increased circulating homocysteine level', 'phenotype', 10090, ['MP'], { phenotypeSystem: 'MP' })
]

const evidence = [
  ['EVIDENCE:ENSEMBL-HUMAN', 'ENSEMBL', 9606, 'Ensembl human MTHFR and MANE Select transcript records.'],
  ['EVIDENCE:ENSEMBL-MOUSE', 'ENSEMBL', 10090, 'Ensembl mouse Mthfr and canonical transcript records.'],
  ['EVIDENCE:UNIPROT-HUMAN', 'UNIPROTKB', 9606, 'Reviewed UniProtKB P42898 MTHFR record.'],
  ['EVIDENCE:UNIPROT-MOUSE', 'UNIPROTKB', 10090, 'Reviewed UniProtKB Q9WU20 record; biochemical annotations are inferred from human P42898.'],
  ['EVIDENCE:PUBMED-29891918', 'PUBMED', 9606, 'Structural basis for regulation of human MTHFR.'],
  ['EVIDENCE:PUBMED-7920641', 'PUBMED', 9606, 'Human MTHFR cDNA and liver-derived material.'],
  ['EVIDENCE:PUBMED-11181567', 'PUBMED', 10090, 'Mthfr-deficient mice exhibit measured hyperhomocysteinemia.'],
  ['EVIDENCE:PUBMED-15217352', 'PUBMED', 10090, 'Biochemical evaluation of Mthfr-deficient mouse liver and brain.'],
  ['EVIDENCE:REACTOME-HUMAN', 'REACTOME', 9606, 'Reactome demonstrated human MTHFR event and complex.'],
  ['EVIDENCE:REACTOME-MOUSE', 'REACTOME', 10090, 'Reactome mouse records computationally inferred through orthology mapping.'],
  ['EVIDENCE:GO-CYTOSOL', 'GO', null, 'Gene Ontology cytosol record.'],
  ['EVIDENCE:UBERON-LIVER', 'UBERON', null, 'Uberon liver record.'],
  ['EVIDENCE:MONDO-MTHFRD', 'MONDO', 9606, 'Mondo MTHFR deficiency disease record.'],
  ['EVIDENCE:HPO-HOMOCYSTINURIA', 'HPO', 9606, 'HPO Homocystinuria record.'],
  ['EVIDENCE:MP-HOMOCYSTEINE', 'MP', 10090, 'Mammalian Phenotype increased circulating homocysteine record.']
].map(([id, sourceId, taxonId, citation]) => ({
  id,
  kind: sourceId === 'PUBMED' ? 'publication' : ['GO', 'UBERON', 'MONDO', 'HPO', 'MP'].includes(sourceId) ? 'ontology-record' : 'database-record',
  sourceId,
  citation,
  url: `https://example.org/${id.toLowerCase()}`,
  taxonId
}))

const context = (taxonId, compartment = null) => ({ taxonId, tissueId: 'UBERON:0002107', compartmentId: compartment, cellId: null })
const claim = (id, subjectId, relation, objectId, taxonId, evidenceIds, derivation = 'direct', transformationId = null, compartment = null) => ({
  id: `CLAIM:${id}`,
  subjectId,
  relation,
  objectId,
  context: context(taxonId, compartment),
  derivation,
  polarity: 'supporting',
  evidenceIds,
  transformationId
})
const claims = [
  claim('HUMAN-GENE-TRANSCRIPT', 'HGNC:7436', 'has_transcript', 'Ensembl:ENST00000376590', 9606, ['EVIDENCE:ENSEMBL-HUMAN']),
  claim('HUMAN-TRANSCRIPT-ISOFORM', 'Ensembl:ENST00000376590', 'translates_to', 'UniProtKB:P42898-1', 9606, ['EVIDENCE:UNIPROT-HUMAN']),
  claim('HUMAN-ISOFORM-PROTEIN', 'UniProtKB:P42898-1', 'isoform_of', 'UniProtKB:P42898', 9606, ['EVIDENCE:UNIPROT-HUMAN']),
  claim('HUMAN-GENE-ENCODES', 'HGNC:7436', 'encodes', 'UniProtKB:P42898', 9606, ['EVIDENCE:UNIPROT-HUMAN']),
  claim('HUMAN-PROTEIN-FORMS-COMPLEX', 'UniProtKB:P42898', 'forms_complex', 'Reactome:R-HSA-200713', 9606, ['EVIDENCE:PUBMED-29891918', 'EVIDENCE:REACTOME-HUMAN'], 'direct', null, 'GO:0005829'),
  claim('HUMAN-COMPLEX-CATALYZES', 'Reactome:R-HSA-200713', 'catalyzes', 'RHEA:19819', 9606, ['EVIDENCE:UNIPROT-HUMAN', 'EVIDENCE:PUBMED-29891918'], 'inferred', null, 'GO:0005829'),
  claim('HUMAN-REACTION-PATHWAY', 'RHEA:19819', 'participates_in', 'Reactome:R-HSA-196757', 9606, ['EVIDENCE:REACTOME-HUMAN', 'EVIDENCE:UNIPROT-HUMAN'], 'inferred', null, 'GO:0005829'),
  claim('HUMAN-PATHWAY-LIVER', 'Reactome:R-HSA-196757', 'studied_in', 'UBERON:0002107', 9606, ['EVIDENCE:PUBMED-7920641', 'EVIDENCE:UBERON-LIVER'], 'inferred', null, 'GO:0005829'),
  claim('HUMAN-GENE-DISEASE', 'HGNC:7436', 'causes', 'MONDO:0009353', 9606, ['EVIDENCE:UNIPROT-HUMAN', 'EVIDENCE:MONDO-MTHFRD']),
  claim('HUMAN-DISEASE-PHENOTYPE', 'MONDO:0009353', 'has_phenotype', 'HP:0002156', 9606, ['EVIDENCE:UNIPROT-HUMAN', 'EVIDENCE:HPO-HOMOCYSTINURIA']),
  claim('MOUSE-GENE-TRANSCRIPT', 'MGI:106639', 'has_transcript', 'Ensembl:ENSMUST00000097788', 10090, ['EVIDENCE:ENSEMBL-MOUSE']),
  claim('MOUSE-TRANSCRIPT-PROTEIN', 'Ensembl:ENSMUST00000097788', 'translates_to', 'UniProtKB:Q9WU20', 10090, ['EVIDENCE:UNIPROT-MOUSE']),
  claim('MOUSE-GENE-ENCODES', 'MGI:106639', 'encodes', 'UniProtKB:Q9WU20', 10090, ['EVIDENCE:UNIPROT-MOUSE']),
  claim('MOUSE-PROTEIN-FORMS-COMPLEX', 'UniProtKB:Q9WU20', 'forms_complex', 'Reactome:R-MMU-200713', 10090, ['EVIDENCE:REACTOME-MOUSE', 'EVIDENCE:UNIPROT-MOUSE'], 'orthology-transferred', 'TRANSFORMATION:MTHFR-COMPLEX-HUMAN-TO-MOUSE', 'GO:0005829'),
  claim('MOUSE-COMPLEX-CATALYZES', 'Reactome:R-MMU-200713', 'catalyzes', 'RHEA:19819', 10090, ['EVIDENCE:UNIPROT-MOUSE', 'EVIDENCE:REACTOME-MOUSE'], 'orthology-transferred', 'TRANSFORMATION:MTHFR-CATALYSIS-HUMAN-TO-MOUSE', 'GO:0005829'),
  claim('MOUSE-REACTION-PATHWAY', 'RHEA:19819', 'participates_in', 'Reactome:R-MMU-196757', 10090, ['EVIDENCE:REACTOME-MOUSE'], 'orthology-transferred', 'TRANSFORMATION:MTHFR-PATHWAY-HUMAN-TO-MOUSE', 'GO:0005829'),
  claim('MOUSE-PATHWAY-LIVER', 'Reactome:R-MMU-196757', 'studied_in', 'UBERON:0002107', 10090, ['EVIDENCE:PUBMED-15217352', 'EVIDENCE:UBERON-LIVER'], 'inferred', null, 'GO:0005829'),
  claim('MOUSE-GENE-PHENOTYPE', 'MGI:106639', 'has_phenotype', 'MP:0012335', 10090, ['EVIDENCE:PUBMED-11181567', 'EVIDENCE:MP-HOMOCYSTEINE'])
]

const mappings = [
  { id: 'MAPPING:HUMAN-GENE', sourceId: 'HGNC:7436', relation: 'exact_match', status: 'resolved', targetId: 'Ensembl:ENSG00000177000', candidateIds: [], evidenceIds: ['EVIDENCE:ENSEMBL-HUMAN'], rationale: 'HGNC and Ensembl identify the same human MTHFR gene.' },
  { id: 'MAPPING:MOUSE-GENE', sourceId: 'MGI:106639', relation: 'exact_match', status: 'resolved', targetId: 'Ensembl:ENSMUSG00000029009', candidateIds: [], evidenceIds: ['EVIDENCE:ENSEMBL-MOUSE'], rationale: 'MGI and Ensembl identify the same mouse Mthfr gene.' },
  { id: 'MAPPING:HUMAN-MANE-ISOFORM', sourceId: 'Ensembl:ENST00000376590', relation: 'related_match', status: 'resolved', targetId: 'UniProtKB:P42898-1', candidateIds: [], evidenceIds: ['EVIDENCE:UNIPROT-HUMAN'], rationale: 'The transcript and protein isoform are related, not identical entities.' },
  { id: 'MAPPING:HUMAN-PROTEIN-ISOFORM-AMBIGUITY', sourceId: 'UniProtKB:P42898', relation: 'related_match', status: 'ambiguous', targetId: null, candidateIds: ['UniProtKB:P42898-1', 'UniProtKB:P42898-2'], evidenceIds: ['EVIDENCE:UNIPROT-HUMAN'], rationale: 'The base accession does not select one of its two alternative-splicing isoforms.' }
]

const transformations = [
  {
    id: 'TRANSFORMATION:MTHFR-COMPLEX-HUMAN-TO-MOUSE', kind: 'orthology', sourceTaxonId: 9606, targetTaxonId: 10090,
    sourceClaimId: 'CLAIM:HUMAN-PROTEIN-FORMS-COMPLEX', entityPairs: [{ sourceId: 'UniProtKB:P42898', targetId: 'UniProtKB:Q9WU20' }, { sourceId: 'Reactome:R-HSA-200713', targetId: 'Reactome:R-MMU-200713' }],
    method: 'Reactome electronic inference of the human MTHFR dimer through orthology mapping.', evidenceIds: ['EVIDENCE:REACTOME-HUMAN', 'EVIDENCE:REACTOME-MOUSE'], limitations: 'The mouse complex is computationally inferred and is not direct mouse complex-formation evidence.'
  },
  {
    id: 'TRANSFORMATION:MTHFR-CATALYSIS-HUMAN-TO-MOUSE', kind: 'orthology', sourceTaxonId: 9606, targetTaxonId: 10090,
    sourceClaimId: 'CLAIM:HUMAN-COMPLEX-CATALYZES', entityPairs: [{ sourceId: 'Reactome:R-HSA-200713', targetId: 'Reactome:R-MMU-200713' }],
    method: 'Reviewed mouse annotation transferred from human P42898 and Reactome orthology inference.', evidenceIds: ['EVIDENCE:UNIPROT-HUMAN', 'EVIDENCE:UNIPROT-MOUSE'], limitations: 'The shared Rhea chemistry is taxon-neutral; only the catalyst endpoint is transformed.'
  },
  {
    id: 'TRANSFORMATION:MTHFR-PATHWAY-HUMAN-TO-MOUSE', kind: 'orthology', sourceTaxonId: 9606, targetTaxonId: 10090,
    sourceClaimId: 'CLAIM:HUMAN-REACTION-PATHWAY', entityPairs: [{ sourceId: 'Reactome:R-HSA-196757', targetId: 'Reactome:R-MMU-196757' }],
    method: 'Reactome mouse pathway electronic inference from the demonstrated human pathway through orthology mapping.', evidenceIds: ['EVIDENCE:REACTOME-HUMAN', 'EVIDENCE:REACTOME-MOUSE'], limitations: 'Pathway placement is related rather than an identity mapping.'
  }
]

const gapDetails = {
  cell: 'One liver cell-type context is required; none was curated.',
  isoform: 'One named mouse Mthfr protein isoform is required; reviewed Q9WU20 names none.',
  disease: 'One mouse disease-model ontology entity is required; none was curated or inferred from MONDO.'
}
const coverageTypes = ['gene', 'transcript', 'protein', 'isoform', 'compound', 'reaction', 'complex', 'pathway', 'compartment', 'tissue', 'cell', 'disease', 'phenotype']
const coverage = [9606, 10090].flatMap((taxonId) => coverageTypes.map((entityType) => {
  const uncovered = entityType === 'cell' || taxonId === 10090 && ['isoform', 'disease'].includes(entityType)
  const transferred = taxonId === 10090 && ['reaction', 'complex', 'pathway'].includes(entityType)
  const id = `COVERAGE:${taxonId === 9606 ? 'HUMAN' : 'MOUSE'}-${entityType.toUpperCase()}`
  const expectedId = uncovered ? `GAP:${taxonId}-${entityType.toUpperCase()}` : `${taxonId}:${entityType}`
  return {
    id,
    taxonId,
    tissueId: 'UBERON:0002107',
    entityType,
    evidenceClass: uncovered ? 'uncovered' : transferred ? 'orthology-transferred' : ['reaction', 'pathway'].includes(entityType) ? 'inferred' : 'direct',
    numerator: uncovered ? 0 : 1,
    denominator: 1,
    denominatorDefinition: uncovered ? gapDetails[entityType] : `The ${entityType} curation target for this bounded MTHFR slice.`,
    expectedIds: [expectedId],
    coveredIds: uncovered ? [] : [expectedId],
    gapIds: uncovered ? [expectedId] : []
  }
}))

const limitations = [
  ['MTHFR-SLICE-ONLY', 'scope', 'This release is a deliberately small MTHFR contextual slice, not a complete human or mouse biochemical atlas.', []],
  ['NO-CONTRADICTORY-EVIDENCE', 'evidence', 'No verified contradictory claim was identified. Absence of a contradicting record is not evidence of consensus or biological absence.', []],
  ['REACTOME-RHEA-GRANULARITY', 'mapping', 'Reactome and Rhea use different folate granularity; no exact reaction identity mapping is asserted.', ['COVERAGE:HUMAN-REACTION', 'COVERAGE:MOUSE-REACTION']],
  ['MOUSE-ORTHOLOGY', 'evidence', 'Mouse complex, catalysis, and pathway assertions are orthology-transferred through explicit transformations, not direct mouse demonstrations.', ['COVERAGE:MOUSE-COMPLEX', 'COVERAGE:MOUSE-REACTION', 'COVERAGE:MOUSE-PATHWAY']],
  ['CELL-CONTEXT-GAP', 'coverage', 'No liver cell type is asserted for either species; organ context must not be interpreted as hepatocyte-specific localization.', ['COVERAGE:HUMAN-CELL', 'COVERAGE:MOUSE-CELL']],
  ['MOUSE-ISOFORM-DISEASE-GAPS', 'coverage', 'The slice contains no named reviewed mouse protein isoform and no mouse disease-model ontology mapping; these are explicit denominator gaps rather than inferred absences.', ['COVERAGE:MOUSE-ISOFORM', 'COVERAGE:MOUSE-DISEASE']],
  ['LIVER-CONTEXT', 'scope', 'Liver links identify bounded evidence context and do not claim liver specificity, abundance, cell localization, or clinical applicability.', ['COVERAGE:HUMAN-TISSUE', 'COVERAGE:MOUSE-TISSUE']]
].map(([id, category, statement, coverageIds]) => ({ id: `LIMITATION:${id}`, category, statement, coverageIds }))

const envelope = { releaseId: BUNDLED_ATLAS_RELEASE.id, releaseDigest: BUNDLED_ATLAS_RELEASE.digest }

function compatibleEntity(entity, taxonId) {
  return entity.taxonId === null || entity.taxonId === taxonId
}

export function bundledAtlasNetwork(taxonId) {
  return AtlasNetworkSchema.parse({
    contractVersion: '2.0.0',
    ...envelope,
    taxonId,
    tissueId: null,
    entities: entities.filter((entity) => compatibleEntity(entity, taxonId)),
    claims: claims.filter((item) => item.context.taxonId === taxonId),
    evidence: evidence.filter((item) => item.taxonId === null || item.taxonId === taxonId),
    mappings: mappings.filter((item) => taxonId === 9606 ? item.id.includes('HUMAN') : item.id.includes('MOUSE')),
    transformations: transformations.filter((item) => item.targetTaxonId === taxonId),
    coverage: coverage.filter((item) => item.taxonId === taxonId),
    limitations
  })
}

export function bundledAtlasEntity(entityId, taxonId) {
  const entity = entities.find((item) => item.id === entityId && (taxonId === undefined || compatibleEntity(item, taxonId)))
  return entity ? AtlasEntityResponseSchema.parse({ ...envelope, entity }) : undefined
}

export function bundledAtlasClaims(filters = {}) {
  return AtlasClaimsResponseSchema.parse({
    ...envelope,
    items: claims.filter((item) =>
      (filters.subjectId === undefined || item.subjectId === filters.subjectId)
      && (filters.objectId === undefined || item.objectId === filters.objectId)
      && (filters.relation === undefined || item.relation === filters.relation)
      && (filters.taxonId === undefined || item.context.taxonId === filters.taxonId)
      && (filters.tissueId === undefined || item.context.tissueId === filters.tissueId)
      && (filters.derivation === undefined || item.derivation === filters.derivation)
      && (filters.polarity === undefined || item.polarity === filters.polarity)
    )
  })
}

export function bundledAtlasCoverage(filters = {}) {
  return AtlasCoverageResponseSchema.parse({
    ...envelope,
    items: coverage.filter((item) =>
      (filters.taxonId === undefined || item.taxonId === filters.taxonId)
      && (filters.tissueId === undefined || item.tissueId === filters.tissueId)
      && (filters.entityType === undefined || item.entityType === filters.entityType)
      && (filters.evidenceClass === undefined || item.evidenceClass === filters.evidenceClass)
    )
  })
}

function entityLinks(entity) {
  if (['transcript', 'protein'].includes(entity.entityType)) return [entity.geneId]
  if (entity.entityType === 'isoform') return [entity.proteinId]
  if (entity.entityType === 'complex') return entity.componentIds
  if (entity.entityType === 'reaction') return entity.participants.map((item) => item.compoundId)
  return []
}

export function bundledAtlasSubgraph(rootId, taxonId, maxDepth, maxNodes) {
  const available = new Map(entities.filter((entity) => compatibleEntity(entity, taxonId)).map((entity) => [entity.id, entity]))
  if (!available.has(rootId)) return undefined
  const taxonClaims = claims.filter((item) => item.context.taxonId === taxonId)
  const seen = new Set([rootId])
  const selectedClaims = new Map()
  const queue = [[rootId, 0]]
  let truncated = false
  while (queue.length) {
    const [entityId, depth] = queue.shift()
    if (depth >= maxDepth) continue
    const linkedClaims = taxonClaims.filter((item) => item.subjectId === entityId || item.objectId === entityId)
    const neighbors = [
      ...entityLinks(available.get(entityId)),
      ...linkedClaims.map((item) => item.subjectId === entityId ? item.objectId : item.subjectId)
    ]
    for (const item of linkedClaims) selectedClaims.set(item.id, item)
    for (const neighbor of neighbors.sort()) {
      if (seen.has(neighbor)) continue
      if (seen.size >= maxNodes) {
        truncated = true
        continue
      }
      if (available.has(neighbor)) {
        seen.add(neighbor)
        queue.push([neighbor, depth + 1])
      }
    }
  }
  const selected = [...selectedClaims.values()].filter((item) => seen.has(item.subjectId) && seen.has(item.objectId))
  const evidenceIds = new Set(selected.flatMap((item) => item.evidenceIds))
  const transformationIds = new Set(selected.map((item) => item.transformationId).filter(Boolean))
  return AtlasSubgraphSchema.parse({
    contractVersion: '2.0.0',
    ...envelope,
    rootId,
    taxonId,
    maxDepth,
    maxNodes,
    truncated,
    entities: [...seen].sort().map((id) => available.get(id)),
    claims: selected.sort((left, right) => left.id.localeCompare(right.id)),
    evidence: evidence.filter((item) => evidenceIds.has(item.id)),
    transformations: transformations.filter((item) => transformationIds.has(item.id))
  })
}
