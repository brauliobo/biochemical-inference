// The competing explanations for belching after glycine or collagen powder, with the entries that carry their evidence
// (claims show their verdict, articles their evidence grade) and what the gastric model can say about each. Pure data;
// `model(run)` turns the latest run into the model chip, so the numbers are live.
const mlText = (value) => (value < 10 ? value.toFixed(1) : String(Math.round(value)))

export const EXPLANATIONS = Object.freeze([
  {
    id: 'swallowed-air',
    title: 'Swallowed air and supragastric belching',
    evidence: [
      { id: 'claim:belching-mostly-swallowed-air' },
      { id: 'article:bredenoord-2005-air-swallowing-belching', label: 'Bredenoord 2005' },
      { id: 'article:hemmink-2009-supragastric-belching-reflux', label: 'Hemmink 2009' }
    ],
    model: (run) => ({ label: `Modelled: ${mlText(run.co2.swallowedAirMl)} mL of air in 8 h (assumed rate) against ${mlText(run.co2.belchedMl)} mL of belched CO2`, tone: 'info' })
  },
  {
    id: 'tlesr',
    title: 'Transient lower sphincter relaxations (TLESR)',
    evidence: [
      { id: 'outcome:transient-les-relaxations', label: 'TLESR' },
      { id: 'article:shukla-2012-carbonated-beverage-tlesr', label: 'Shukla 2012: carbonated drink' }
    ],
    model: () => ({ label: 'Not modelled: the model has no oesophagus', tone: 'muted' })
  },
  {
    id: 'fermentation',
    title: 'Bacterial fermentation of free glycine (SIBO)',
    evidence: [
      { id: 'claim:sibo-bacteria-metabolize-glycine-co2-nh3' },
      { id: 'claim:sibo-gas-appears-in-15-45-min-as-belching' }
    ],
    model: () => ({ label: 'Not modelled: the model has no gut bacteria', tone: 'muted' })
  },
  {
    id: 'acid-bicarbonate',
    title: 'Acid + bicarbonate gives CO2',
    evidence: [{ id: 'claim:acid-bicarbonate-reaction-gives-co2-belching' }],
    model: (run) => ({ label: `Modelled: ${mlText(run.co2.belchedMl)} mL of CO2 belched, ${Math.round((run.co2.shareOfBelchedGas ?? 0) * 100)}% of the belched gas`, tone: 'success' })
  },
  {
    id: 'h-pylori',
    title: 'H. pylori urease makes CO2 and ammonia',
    evidence: [{ id: 'claim:h-pylori-causes-belching' }, { id: 'claim:h-pylori-urease-ammonia-co2' }],
    model: () => ({ label: 'Not modelled: no H. pylori in the model', tone: 'muted' })
  },
  {
    id: 'glycine-acid',
    title: 'Glycine raises acid output',
    evidence: [{ id: 'claim:free-glycine-stimulates-gastrin' }, { id: 'claim:glycine-buffers-gastric-acid' }],
    model: (run, controls) => ({ label: controls.glycineAcidBoostPct > 0 ? `What-if on: +${controls.glycineAcidBoostPct}% acid (hypothesis)` : 'Hypothesis control, default 0%', tone: 'warning' })
  }
])
