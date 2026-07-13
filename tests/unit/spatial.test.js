import { describe, expect, it } from 'vitest'
import { createSpatialFixtureClient, PINNED_SPATIAL_TRANSFORMS } from '../../server/spatial/fixture.js'
import { parseSpatialRange, SpatialRangeError } from '../../server/spatial/range.js'
import { SpatialDetailSchema } from '../../shared/spatial-contracts.js'
import { applyCoordinateTransform, interpolateValue, resolveExistingBin, scaleValue, selectLod, valueState } from '../../src/spatial.js'

describe('spatial contracts and utilities', () => {
  it('strictly pins release and content digests', async () => {
    const detail = await createSpatialFixtureClient().detail()
    expect(SpatialDetailSchema.parse(detail).release.digest).toBe('fd838be6771c61b79eb97561320ffee8096f538e31ec769480c0a4979101290b')
    expect(() => SpatialDetailSchema.parse({ ...detail, release: { ...detail.release, digest: '0'.repeat(64) } })).toThrow()
    expect(() => SpatialDetailSchema.parse({ ...detail, inventory: detail.inventory.slice(1) })).toThrow()
  })

  it('applies homogeneous coordinate transforms without crossing taxa', () => {
    expect(applyCoordinateTransform(PINNED_SPATIAL_TRANSFORMS[0].matrix, [40, 50, 60])).toEqual([1040, 2050, 3060])
    expect(applyCoordinateTransform(PINNED_SPATIAL_TRANSFORMS[1].matrix, [40, 50, 60])).toEqual([-460, 550, 160])
    expect(() => applyCoordinateTransform([[1]], [0, 0, 0])).toThrow()
  })

  it('chooses deterministic LODs and rejects invalid projected size', () => {
    const levels = [{ level: 0 }, { level: 1 }]
    expect(selectLod(levels, 8).level).toBe(0)
    expect(selectLod(levels, 0.5).level).toBe(1)
    expect(() => selectLod(levels, -1)).toThrow()
  })

  it('makes scaling, interpolation, and missing values explicit', () => {
    const policy = { mode: 'sentinel', sentinel: -1 }
    expect(valueState(-1, policy)).toEqual({ missing: true, reason: 'sentinel' })
    expect(scaleValue(5, [0, 10], policy).ratio).toBe(0.5)
    expect(interpolateValue(2, 6, 0.25, 'linear', policy).value).toBe(3)
    expect(interpolateValue(2, 6, 0.75, 'nearest', policy).value).toBe(6)
    expect(interpolateValue(2, 6, 0.5, 'none', policy)).toMatchObject({ missing: true, reason: 'interpolation-forbidden' })
  })

  it('refuses HRA mouse selection and only resolves existing instance bins', () => {
    const intersections = [{ instanceId: 0, object: { userData: { bins: [4] } } }]
    expect(resolveExistingBin(intersections)).toBe(4)
    expect(resolveExistingBin(intersections, 'HRA')).toBeUndefined()
    expect(resolveExistingBin([{ point: { x: 1 } }])).toBeUndefined()
  })

  it('normalizes one safe immutable byte range', () => {
    expect(parseSpatialRange('bytes=2-5', 10)).toMatchObject({ start: 2, end: 5, header: 'bytes=2-5' })
    expect(parseSpatialRange('bytes=-3', 10)).toMatchObject({ start: 7, end: 9 })
    expect(parseSpatialRange('bytes=7-', 10)).toMatchObject({ start: 7, end: 9 })
    expect(() => parseSpatialRange('bytes=0-1,4-5', 10)).toThrow(SpatialRangeError)
  })
})
