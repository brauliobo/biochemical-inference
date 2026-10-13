// The guided "start here" path on the home page, in reading order. Each step is an
// entity (id) or a page of its own (to). tests/unit/kb-start-here.test.js checks that
// every id exists, so renaming an entity cannot silently break the home page.
import { CLAIMS_AUDIT_PATH, connectionPath, entityPath } from './paths.js'

const entity = (id, name, why) => ({ name, to: entityPath(id), id, why })

export const START_HERE = Object.freeze([
  entity('state:undermethylation', 'Under-methylation', 'What the word means, which parts are measurable biochemistry and which parts are contested.'),
  entity('state:overmethylation', 'Over-methylation', 'The opposite label, and why the pair is not a simple on/off switch.'),
  entity('compound:glycine', 'Glycine', 'The simplest amino acid. The body also uses it to get rid of surplus methyl groups.'),
  entity('compound:choline', 'Choline', 'A nutrient that supplies methyl groups and builds cell membranes.'),
  entity('compound:betaine', 'Betaine', 'Made from choline. It hands a methyl group to homocysteine so the cell can recycle it.'),
  entity('enzyme:gnmt', 'GNMT', 'The enzyme that uses glycine to burn off extra methyl groups.'),
  { name: 'The belching question', to: connectionPath('compound:glycine', 'outcome:belching'), id: 'outcome:belching', why: 'Follow the chain of links from glycine to belching, one labelled step at a time.' },
  { name: 'Claims audit', to: CLAIMS_AUDIT_PATH, why: 'Every claim from the source conversation, with its status and the evidence for and against.' }
])
