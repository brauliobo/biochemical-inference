// Text formatting shared by the workbenches. Pure functions, so every number,
// list and flag reads the same way everywhere.

// A number with fixed decimals; missing values read as `fallback`.
export function fixed(value, digits, fallback = 'n/a') {
  return value === null || value === undefined ? fallback : Number(value).toFixed(digits)
}

// "1 record" / "2 records" (pass the plural for irregular words).
export function plural(count, singular, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`
}

// "snake_case_value" -> "snake case value".
export function humanize(value) {
  return String(value).replaceAll('_', ' ')
}

export const yesNo = (flag) => (flag ? 'yes' : 'no')

// Values joined for display; an empty list reads as `fallback`.
export function list(values, fallback = 'none', separator = ', ') {
  return values?.length ? values.join(separator) : fallback
}
