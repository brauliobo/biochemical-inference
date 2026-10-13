import valid from './valid.js'

/** A fresh deep copy of the valid fixture that tests may mutate. */
export function fixture() {
  return structuredClone(valid)
}

/** Fixture after applying `edit(entities, find)`; `find(id)` returns the entity to mutate. */
export function edited(edit) {
  const entities = fixture()
  edit(entities, (id) => entities.find((entity) => entity.id === id))
  return entities
}

export { valid }
