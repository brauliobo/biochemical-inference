// Names and source locators of the two frozen challenge endpoints.
const ENDPOINT_NAMES = Object.freeze({
  'endpoint:apap-cmax:reference': 'Reference formulation Cmax',
  'endpoint:apap-cmax:test': 'Test formulation Cmax'
})

export const endpointName = (endpointId) => ENDPOINT_NAMES[endpointId] ?? endpointId

export function locatorText(locator) {
  return `PDF p. ${locator.pdf_page} · printed p. ${locator.printed_page} · ${locator.section} ¶${locator.paragraph}${locator.continuation ? ' (continued)' : ''}`
}
