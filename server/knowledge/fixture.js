export const BUNDLED_RELEASE = {
  id: 'one-carbon-demo-2026.1',
  title: 'Bundled one-carbon demonstration',
  digest: 'sha256:73b87086e91320c0cd85226c8c40676fbaf58a44c1d58cf927c0b83e48ba7f8a',
  schemaVersion: '1.0.0',
  supportedTaxa: [9606, 10090],
  verified: true,
  source: 'bundled-demonstration'
}

const compounds = [
  ['CHEBI:15636', '5,10-Methylene-THF', 'C20H21N7O6', -2],
  ['CHEBI:18608', '5-Methyl-THF', 'C20H23N7O6', -2],
  ['CHEBI:57844', 'Methionine', 'C5H11NO2S', 0],
  ['CHEBI:59789', 'S-adenosylmethionine (SAM)', 'C15H23N6O5S', 1],
  ['CHEBI:57856', 'S-adenosylhomocysteine (SAH)', 'C14H20N6O5S', 0],
  ['CHEBI:58199', 'Homocysteine', 'C4H9NO2S', 0]
].map(([id, name, formula, charge]) => ({ id: String(id), name: String(name), synonyms: [], formula: String(formula), charge: Number(charge), sourceIds: ['CHEBI'], evidenceIds: [] }))

const reactionCore = [
  {
    id: 'RHEA:19819',
    rheaMasterId: 'RHEA:19817',
    name: 'MTHFR reduction',
    equation: '5,10-methylene-THF + NADPH + H(+) -> 5-methyl-THF + NADP(+)',
    physiologicalDirection: 'left-to-right',
    reactants: [{ compoundId: 'CHEBI:15636', coefficient: 1 }],
    products: [{ compoundId: 'CHEBI:18608', coefficient: 1 }]
  },
  {
    id: 'RHEA:11173',
    rheaMasterId: 'RHEA:11172',
    name: 'Methionine synthase',
    equation: '5-methyl-THF + L-homocysteine -> THF + L-methionine',
    physiologicalDirection: 'left-to-right',
    reactants: [{ compoundId: 'CHEBI:18608', coefficient: 1 }, { compoundId: 'CHEBI:58199', coefficient: 1 }],
    products: [{ compoundId: 'CHEBI:57844', coefficient: 1 }]
  }
]

const taxonProteins = {
  9606: [
    ['UniProtKB:P42898', 'Methylenetetrahydrofolate reductase', 'MTHFR'],
    ['UniProtKB:Q99707', 'Methionine synthase', 'MTR']
  ],
  10090: [
    ['UniProtKB:Q9WU20', 'Methylenetetrahydrofolate reductase', 'Mthfr'],
    ['UniProtKB:A6H5Y3', 'Methionine synthase', 'Mtr']
  ]
}

export function bundledNetwork(taxonId) {
  const proteins = taxonProteins[taxonId].map(([id, name, gene], index) => ({
    id,
    name,
    gene,
    taxonId,
    evidenceIds: [`ev-${index === 0 ? 'mthfr' : 'mtr'}-${taxonId}`]
  }))

  return {
    contractVersion: '1.0.0',
    releaseId: BUNDLED_RELEASE.id,
    taxonId,
    compounds,
    reactions: reactionCore.map((reaction) => ({
      ...reaction,
      proteinIds: reaction.id === 'RHEA:19819' ? [proteins[0].id] : [proteins[1].id],
      evidenceIds: [`ev-${reaction.id === 'RHEA:19819' ? 'mthfr' : 'mtr'}-${taxonId}`]
    })),
    proteins,
    catalysis: reactionCore.map((reaction, index) => ({
      id: `CATALYSIS:${proteins[index].id.slice('UniProtKB:'.length)}-${reaction.id.slice('RHEA:'.length)}`,
      proteinId: proteins[index].id,
      reactionId: reaction.id,
      taxonId,
      evidenceClass: taxonId === 9606 && reaction.id !== 'RHEA:19819' ? 'direct' : 'inferred',
      evidenceCode: taxonId === 9606 ? reaction.id === 'RHEA:19819' ? 'ECO:0000305' : 'ECO:0000269' : 'ECO:0000250',
      referenceIds: [`ev-${reaction.id === 'RHEA:19819' ? 'mthfr' : 'mtr'}-${taxonId}`]
    })),
    evidence: reactionCore.map((reaction) => {
      const mthfr = reaction.id === 'RHEA:19819'
      const direct = taxonId === 9606 && !mthfr
      return {
        id: `ev-${mthfr ? 'mthfr' : 'mtr'}-${taxonId}`,
        citation: `${taxonId === 9606 ? 'Human' : 'Mouse'} reviewed ${mthfr ? 'MTHFR' : 'MTR'} association${mthfr && taxonId === 9606 ? '; physiological direction is curator-inferred' : ''}`,
        kind: 'uniprot',
        url: `https://www.uniprot.org/uniprotkb/${mthfr ? proteins[0].id.slice('UniProtKB:'.length) : proteins[1].id.slice('UniProtKB:'.length)}/entry`,
        evidenceClass: direct ? 'direct' : 'inferred'
      }
    }),
    limitations: [{ id: 'LIMITATION:DEMO', statement: 'This fixture is only for explicit test and demonstration use.' }]
  }
}
