// StackedBar data for the CO2 budget of the gut/acid dashboard (pure). Input: the `co2` object of gut-run.js
// (mL of gas at 37 C). Item ids keep one colour across the three bars.
const round = (value) => Math.round(value * 100) / 100

export function co2Bars(co2) {
  return [
    {
      id: 'formed',
      label: 'CO2 formed',
      items: [
        { id: 'absorbed', label: 'CO2 absorbed through the gut wall', value: round(co2.absorbedMl) },
        { id: 'carried', label: 'CO2 carried on, dissolved', value: round(co2.carriedMl + co2.heldMl) },
        { id: 'passed', label: 'CO2 passed on as gas', value: round(co2.passedMl) },
        { id: 'belched', label: 'CO2 belched', value: round(co2.belchedMl) }
      ]
    },
    {
      id: 'pocket',
      label: 'Gas in the pocket',
      items: [
        { id: 'co2-gas', label: 'CO2 that became gas', value: round(co2.co2GasMl) },
        { id: 'air', label: 'Swallowed air (assumed)', value: round(co2.swallowedAirMl) }
      ]
    },
    {
      id: 'belches',
      label: 'Gas belched',
      items: [
        { id: 'belched', label: 'CO2 belched', value: round(co2.belchedMl) },
        { id: 'air-belched', label: 'Air belched', value: round(co2.airBelchedMl) }
      ]
    }
  ]
}

const ml = (value) => `${value < 10 ? value.toFixed(1) : Math.round(value)} mL`

/** The sentence under the chart: the honest comparison in numbers. */
export function co2Summary(co2) {
  const share = co2.shareOfBelchedGas === null ? 'no gas was belched' : `${Math.round(co2.shareOfBelchedGas * 100)}% of the belched gas is CO2`
  return `Over 8 hours the model forms ${ml(co2.formedMl)} of CO2 from acid and bicarbonate; ${ml(co2.absorbedMl)} is absorbed through the gut wall and ${ml(co2.belchedMl)} is belched (${(co2.shareOfFormed * 100).toFixed(1)}% of what formed). Swallowed air adds ${ml(co2.swallowedAirMl)} (an assumption); ${share}.`
}
