import { describe, expect, it } from 'vitest'
import { resolveRoute } from '../../src/router.js'
import { CLAIMS_AUDIT_PATH, connectionPath, entityPath, idFromParams, mapPath, resolveType, slugWords, typePath } from '../../src/kb/paths.js'

describe('kb paths', () => {
  it('builds entity, type and map paths from ids', () => {
    expect(entityPath('enzyme:gnmt')).toBe('/kb/enzyme/gnmt')
    expect(typePath('compound')).toBe('/kb/compound')
    expect(CLAIMS_AUDIT_PATH).toBe('/kb/claim')
    expect(mapPath()).toBe('/kb/map')
    expect(mapPath('compound:glycine')).toBe('/kb/map?id=compound%3Aglycine')
    expect(connectionPath('compound:glycine', 'outcome:belching')).toBe('/kb/compound/glycine?to=outcome%3Abelching')
  })

  it('falls back to the hub for anything that is not an id', () => {
    expect(entityPath('nonsense')).toBe('/kb')
    expect(entityPath(undefined)).toBe('/kb')
  })

  it('accepts singular and plural type spellings', () => {
    expect(resolveType('enzyme')).toBe('enzyme')
    expect(resolveType('Enzymes')).toBe('enzyme')
    expect(resolveType('nope')).toBeNull()
    expect(resolveType(undefined)).toBeNull()
  })

  it('turns route params into an id, or null for an unknown type', () => {
    expect(idFromParams({ type: 'enzymes', slug: 'GNMT' })).toBe('enzyme:gnmt')
    expect(idFromParams({ type: 'nope', slug: 'x' })).toBeNull()
    expect(idFromParams({ type: 'enzyme' })).toBeNull()
  })

  it('seeds a search from a slug', () => {
    expect(slugWords('under-methylation')).toBe('under methylation')
  })

  it('produces paths the router resolves to the right route', () => {
    expect(resolveRoute(entityPath('enzyme:gnmt')).route.name).toBe('kb-entity')
    expect(resolveRoute(typePath('enzyme')).route.name).toBe('kb-type')
    expect(resolveRoute('/kb/map').route.name).toBe('kbMap')
    expect(resolveRoute('/kb').route.name).toBe('kb-hub')
    expect(resolveRoute('/kb/paths').route.name).toBe('kb-paths')
    expect(resolveRoute('/kb/paths/methyl-budget').route.name).toBe('kb-path')
  })
})
