// The questions the home page answers, each with the dashboard that answers it. `thumb` picks the picture
// (dash-thumbs.json); `also` is an optional second route to the same answer.
export const QUESTIONS = Object.freeze([
  { id: 'belching', question: 'Why does glycine powder make me belch?', to: '/dash/gut-acid', thumb: 'gut-acid', also: { label: 'Glycine simulator', to: '/dash/glycine' } },
  { id: 'methyl-groups', question: 'Who spends the methyl groups?', to: '/dash/methylation', thumb: 'methylation' },
  { id: 'choline', question: 'Can choline replace 10 g of glycine?', to: '/dash/choline', thumb: 'choline' },
  { id: 'night', question: 'Why 2-3 am waking and throat burn?', to: '/dash/histamine-night', thumb: 'histamine-night', also: { label: 'Gut and acid', to: '/dash/gut-acid' } },
  { id: 'evidence', question: 'What does the evidence really say?', to: '/evidence', thumb: 'evidence' },
  { id: 'ontology', question: 'Browse the ontology', to: '/atlas', thumb: 'atlas' }
])
