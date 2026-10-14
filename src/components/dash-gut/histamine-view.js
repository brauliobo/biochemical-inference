// Tiles, chart series and bars of the histamine/night dashboard from a histamine-run.js result (pure).
const x2 = (value) => `${value.toFixed(2)}x`
const pct = (value) => `${Math.round(value * 100)}%`
const plusMinus = (value, base) => {
  const d = (value / base - 1) * 100
  return Math.abs(d) < 0.5 ? 'same as the reference' : `${d > 0 ? '+' : '-'}${Math.abs(d).toFixed(0)}% vs the reference`
}

export function histamineTiles(run, controls) {
  const tiles = [
    { label: 'Systemic histamine', value: x2(run.state.plasma), unit: 'of the reference', delta: plusMinus(run.state.plasma, run.baselineState.plasma), tone: '', note: 'Steady state, relative units. Qualitative: pools are lumped.' },
    { label: 'Brain (CNS) histamine', value: x2(run.state.cns), unit: 'of the reference', delta: plusMinus(run.state.cns, run.baselineState.cns), tone: '', note: 'The brain has no usable DAO, so HNMT carries more of it.' },
    { label: 'HNMT capacity', value: pct(run.hnmtCapacity), unit: 'of normal', delta: run.ratio === null ? '' : `SAM:SAH ${run.ratio.toFixed(1)} (reference 5.0)`, tone: '', note: 'Follows the SAM:SAH ratio, not SAM alone.' }
  ]
  if (controls.diurnal) {
    tiles.push({ label: 'Plasma at 04:00 against 16:00', value: `${(run.at04 / run.at16).toFixed(1)}x`, unit: '', delta: 'one study (Szefler 1991)', tone: 'warning', note: 'Weak evidence: urinary markers show no rhythm.' })
  }
  return tiles
}

/** Relative histamine over one clock day: this scenario, the brain, and the reference as a dashed baseline. */
export function daySeries(run) {
  return [
    { id: 'plasma', label: 'Systemic histamine', values: run.day.plasma, look: 0 },
    { id: 'cns', label: 'Brain (CNS) histamine', values: run.day.cns, look: 3 },
    { id: 'plasma-ref', label: 'Systemic, reference', values: run.baselineDay.plasma, baseline: true }
  ]
}

export const dayEvents = (controls) => (controls.diurnal ? [{ x: 4, label: '04:00' }, { x: 16, label: '16:00' }] : [])

/** Steady-state histamine against SAM, with the current SAM marked. */
export function sweepView(run, controls) {
  return {
    x: run.sweep.map((point) => point.sam),
    series: [
      { id: 'plasma', label: 'Systemic histamine', values: run.sweep.map((point) => point.plasma), look: 0 },
      { id: 'cns', label: 'Brain (CNS) histamine', values: run.sweep.map((point) => point.cns), look: 3 }
    ],
    events: [{ x: controls.samUM, label: 'This scenario' }]
  }
}

/** Who clears histamine: HNMT (needs SAM) against the other routes, reference against this scenario. */
export function shareBars(run) {
  const bar = (id, label, pair) => ({
    id,
    label,
    items: [
      { id: 'hnmt', label: 'HNMT (needs SAM)', value: Math.round(pair.hnmt * 1000) / 1000 },
      { id: 'other', label: 'DAO, uptake and other routes', value: Math.round(pair.other * 1000) / 1000 }
    ]
  })
  return [
    bar('sys-ref', 'Blood, reference', run.baselineState.shares.systemic),
    bar('sys-now', 'Blood, this run', run.state.shares.systemic),
    bar('cns-ref', 'Brain, reference', run.baselineState.shares.cns),
    bar('cns-now', 'Brain, this run', run.state.shares.cns)
  ]
}
