// Presentation of entity.facts: readable labels and links to external databases.

const LABELS = {
  ec: 'EC number',
  chebi: 'ChEBI',
  rhea: 'Rhea',
  reactome: 'Reactome',
  uniprot: 'UniProt',
  doi: 'DOI',
  pmid: 'PMID',
  gene: 'Gene',
  formula: 'Formula',
  cas: 'CAS',
  pubchem: 'PubChem',
  hmdb: 'HMDB'
}

const SIMPLE_VALUE = /^[\w:.-]+$/

const URLS = {
  ec: (v) => `https://enzyme.expasy.org/EC/${v}`,
  chebi: (v) => `https://www.ebi.ac.uk/chebi/searchId.do?chebiId=${v.startsWith('CHEBI:') ? v : `CHEBI:${v}`}`,
  rhea: (v) => `https://www.rhea-db.org/rhea/${v.replace(/^RHEA:/i, '')}`,
  reactome: (v) => `https://reactome.org/content/detail/${v}`,
  uniprot: (v) => `https://www.uniprot.org/uniprotkb/${v}`,
  pubchem: (v) => `https://pubchem.ncbi.nlm.nih.gov/compound/${v}`,
  pmid: (v) => `https://pubmed.ncbi.nlm.nih.gov/${v}/`
}

export function factLabel(key) {
  if (LABELS[key]) return LABELS[key]
  const words = key.replace(/[-_]+/g, ' ').trim()
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** External URL for a fact, or null when none is known. */
export function factUrl(key, value) {
  if (key === 'doi') return /^10\.\d{4,9}\/\S+$/.test(value) ? `https://doi.org/${value}` : null
  if (!URLS[key] || !SIMPLE_VALUE.test(value)) return null
  return URLS[key](value)
}

/** [{ key, label, value, url }] in authoring order. */
export function describeFacts(facts = {}) {
  return Object.entries(facts).map(([key, value]) => ({ key, label: factLabel(key), value, url: factUrl(key, value) }))
}
