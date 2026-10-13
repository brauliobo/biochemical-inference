// Page-unique ids for label/for and aria-controls pairs.
let counter = 0

export const uniqueId = (prefix) => `${prefix}-${++counter}`
