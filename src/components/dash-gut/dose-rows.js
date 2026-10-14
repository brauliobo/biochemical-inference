// RangeBar rows from the structured quantities (src/knowledge/data/quant.js) for vitamin B6 and choline, and the
// dose conversions of the B6 page. Pure; the knowledge module is passed in ({ quantOf }) so the page loads it lazily.

const value = (knowledge, id) => {
  const record = knowledge.quantOf(id)
  if (!record) throw new Error(`Missing quantity ${id}`)
  return record
}
const marker = (knowledge, kind, id) => {
  const record = value(knowledge, id)
  return record.value === null ? null : { kind, value: record.value, record }
}
const strip = (markers) => markers.filter(Boolean).map(({ kind, value: amount }) => ({ kind, value: amount }))

/** Vitamin B6, mg/day as vitamin B6: IOM 1998 (RDA 1.3, UL 100), EFSA (PRI 1.6, UL 12 from 2023), EU SCF 2000 (UL 25, superseded). */
export function b6Rows(knowledge) {
  return [
    { id: 'iom', label: 'IOM 1998 (US), adults', markers: strip([marker(knowledge, 'rda', 'quant:vitamin-b6-rda-iom-1998-adults-19-50'), marker(knowledge, 'ul', 'quant:vitamin-b6-ul-iom-1998-adults')]) },
    { id: 'efsa', label: 'EFSA 2017 and 2023 (EU), adults', markers: strip([marker(knowledge, 'pri', 'quant:vitamin-b6-pri-efsa-2017-women'), marker(knowledge, 'ul', 'quant:vitamin-b6-ul-efsa-2023-adults')]) },
    { id: 'scf', label: 'EU SCF 2000 (superseded by EFSA)', markers: strip([marker(knowledge, 'ul', 'quant:vitamin-b6-ul-scf-2000-adults')]) }
  ]
}

/** Choline, mg/day: IOM 1998 (AI 550 men, UL 3500) and EFSA 2016 (AI 400, no UL). */
export function cholineRows(knowledge) {
  const efsaUl = value(knowledge, 'quant:choline-ul-efsa')
  return [
    { id: 'iom', label: 'IOM 1998 (US), adult men', markers: strip([marker(knowledge, 'ai', 'quant:choline-ai-iom-men'), marker(knowledge, 'ul', 'quant:choline-ul-iom-adults')]) },
    { id: 'efsa', label: 'EFSA 2016 (EU), adults', markers: strip([marker(knowledge, 'ai', 'quant:choline-ai-efsa-adults')]), noUlNote: efsaUl.value === null ? 'EFSA derived no tolerable upper intake level' : undefined }
  ]
}

/** The UL of a row set, by authority id. */
export const ulOf = (rows, id) => rows.find((row) => row.id === id)?.markers.find((item) => item.kind === 'ul')?.value ?? null

// B6 supplement forms: mg of the product that carry 1 mg of vitamin B6 on the pyridoxine basis the limits use, from molar masses.
export const B6_FORMS = Object.freeze([
  { id: 'pyridoxine', label: 'Pyridoxine (base)', molarMassId: 'quant:pyridoxine-molar-mass' },
  { id: 'p5p', label: 'P5P (pyridoxal 5-phosphate)', molarMassId: 'quant:plp-molar-mass' }
])

/**
 * Convert a label dose of a B6 form to mg of vitamin B6 on the pyridoxine basis (1 mol of any vitamer = 1 mol of B6).
 * The limits are set on that basis, so 100 mg of P5P is 68 mg of B6 against a UL of 12 (EFSA) or 100 (IOM).
 */
export function b6Equivalent(knowledge, formId, mg) {
  const form = B6_FORMS.find((item) => item.id === formId)
  const base = B6_FORMS[0]
  if (!form) throw new Error(`Unknown B6 form ${formId}`)
  const fraction = value(knowledge, base.molarMassId).value / value(knowledge, form.molarMassId).value
  return { mg: mg * fraction, fraction }
}

/** Reverse: the label dose of a form that carries `mg` of B6. */
export function b6LabelDose(knowledge, formId, mg) {
  return mg / b6Equivalent(knowledge, formId, 1).fraction
}

/** How many times the dose is the UL: { times, word } with plain words for the status chip. */
export function timesUl(dose, ul) {
  if (ul === null || ul === undefined) return { times: null, word: 'No UL to compare' }
  const times = dose / ul
  return { times, word: times > 1 ? `${times.toFixed(1)} times the UL` : times > 0.995 ? 'At the UL' : `${Math.round(times * 100)}% of the UL` }
}
