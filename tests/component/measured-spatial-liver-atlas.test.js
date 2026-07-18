import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MEASURED_SPATIAL_PINS } from '../../shared/measured-spatial-contracts.js'

const api = vi.hoisted(() => ({
  completeMeasuredSpatialOffline: vi.fn(),
  loadMeasuredSpatialChunk: vi.fn(),
  loadMeasuredSpatialChunkInventory: vi.fn(),
  loadMeasuredSpatialDiscovery: vi.fn(),
  loadMeasuredSpatialStatus: vi.fn(),
  loadMeasuredSpatialWorkspace: vi.fn(),
  syncMeasuredSpatial: vi.fn(),
  verifyMeasuredSpatialIntegrity: vi.fn()
}))
vi.mock('../../src/api.js', () => api)

import MeasuredSpatialLiverAtlas from '../../src/components/MeasuredSpatialLiverAtlas.vue'

const status = { state: 'ready', integrity: 'valid', releaseId: MEASURED_SPATIAL_PINS.releaseId, cachedChunks: 0, totalChunks: 400, offlineComplete: false, lastError: null }
const codec = { id: 'gzip', specification: 'RFC 1952', level: 9, mtime: 0, header_os: 3, implementation_probe_sha256: '676a53aff05d0332d03ae91ae54e0ab34a8a260e2b1840d71fb9d39980648883' }
const arrays = [
  ['anatomy-labels', 'anatomical-labels', 0, [208, 992, 380], [100, 100, 100], 2_007_078],
  ['anatomy-labels', 'anatomical-labels', 1, [104, 496, 190], [200, 200, 200], 248_736],
  ['liver-mask', 'binary-mask', 0, [208, 992, 380], [100, 100, 100], 2_007_078],
  ['liver-mask', 'binary-mask', 1, [104, 496, 190], [200, 200, 200], 248_736]
].map(([arrayId, kind, level, shape, spacing, voxels]) => ({ id: `${arrayId}:${level}`, array_id: arrayId, kind, level, shape_zyx: shape, spacing_um: spacing, liver_voxels: voxels, liver_bounds_xyz: level === 0 ? [[54, 442, 25], [293, 624, 181]] : [[27, 221, 13], [146, 311, 90]], compressor: codec }))
const attribution = {
  id: 'attribution:digimouse',
  title: 'Digimouse: A 3D Whole Body Mouse Atlas from CT and Cryosection Data',
  creators: ['B. Dogdas', 'D. Stout', 'A. Chatziioannou', 'R. M. Leahy'],
  doi: '10.1088/0031-9155/52/3/003',
  source_url: 'https://neuroimage.usc.edu/neuro/Digimouse',
  license: { name: 'Creative Commons Attribution-ShareAlike 4.0 International', url: 'https://creativecommons.org/licenses/by-sa/4.0/', redistribution: 'permitted', share_alike: true, warranty_disclaimer: 'Provided as-is without warranty.', no_endorsement: 'Attribution does not imply endorsement.' },
  modifications: ['Analyze extraction', 'explicit axis declaration', 'two-level mode pyramid', 'liver-value extraction', 'binary mask generation', 'chunk padding', 'deterministic compression'],
  software_license_boundary: 'The data license does not grant rights over repository software.'
}
const workspace = {
  acquisitions: [{ subject: { species: 'Mus musculus', mass_g: 28, sex: 'male', strain: 'nude', state: 'post-mortem' }, modalities_used_to_create_atlas: ['CT', 'cryosection'] }],
  spaces: [{ axis_polarity: 'unreported', physical_origin: 'unreported' }],
  arrays,
  labels: [{ id: 'label:18', value: 18, name: 'liver', anatomy_id: 'UBERON:0002107' }],
  registrations: [{ status: 'unavailable', reason: 'The source archive provides no transform, deformation field, landmarks, quality metrics, valid region, or inverse to SPACE:MOUSE-LOBULE-LOCAL.' }],
  limitations: [
    { id: 'limitation:0', statement: 'Axis polarity, physical origin, registration uncertainty, and quantitative registration quality are unreported.' },
    { id: 'limitation:1', statement: 'No raw modalities or executable transform is included.' },
    { id: 'limitation:2', statement: 'One mouse is not population anatomy.' }
  ],
  attribution: [attribution]
}
const chunk = {
  array_id: 'liver-mask', level: 1, grid_zyx: [0, 0, 0], voxel_origin_zyx: [0, 0, 0], voxel_shape_zyx: [32, 128, 128], stored_shape_zyx: [32, 128, 128], path: 'arrays/liver-mask/1/0.0.0', codec: 'gzip-level-9-mtime-0', media_type: 'application/vnd.zarr.chunk', encoded_bytes: 543, encoded_sha256: 'a'.repeat(64), decoded_bytes: 524_288, decoded_sha256: 'b'.repeat(64)
}

beforeEach(() => {
  vi.clearAllMocks()
  api.loadMeasuredSpatialDiscovery.mockResolvedValue({ pins: MEASURED_SPATIAL_PINS, status })
  api.loadMeasuredSpatialStatus.mockResolvedValue(status)
  api.loadMeasuredSpatialWorkspace.mockResolvedValue(workspace)
  api.loadMeasuredSpatialChunkInventory.mockResolvedValue([chunk, { ...chunk, grid_zyx: [0, 0, 1], voxel_origin_zyx: [0, 0, 128], path: 'arrays/liver-mask/1/0.0.1' }])
  api.loadMeasuredSpatialChunk.mockResolvedValue({ descriptor: chunk, encodedBytes: 543, decodedBytes: 524_288, cacheSource: 'local' })
  api.completeMeasuredSpatialOffline.mockResolvedValue({ verifiedChunks: 400, encodedAndDecodedVerified: true })
  api.verifyMeasuredSpatialIntegrity.mockResolvedValue({ status: 'valid', verifiedDecodedChunks: 400, networkAccess: false, findings: [], offlineComplete: true })
})

describe('MeasuredSpatialLiverAtlas', () => {
  it('presents semantic liver facts, rights, orientation limits, and unavailable registration without WebGL', async () => {
    render(MeasuredSpatialLiverAtlas)
    const atlas = await screen.findByRole('region', { name: 'DigiMouse liver label atlas' })
    await within(atlas).findByTestId('measured-spatial-summary')

    expect(within(atlas).getByText('label 18 · UBERON:0002107')).toBeTruthy()
    expect(within(atlas).getByText(/Axis polarity unreported/)).toBeTruthy()
    expect(within(atlas).getAllByText(/registration uncertainty/).length).toBeGreaterThan(0)
    expect(within(atlas).getByText('Whole-body atlas to lobule registration unavailable')).toBeTruthy()
    expect(within(atlas).getByText(/Creative Commons Attribution-ShareAlike 4.0/)).toBeTruthy()
    expect(within(atlas).getByText(/The data license does not grant rights/)).toBeTruthy()
    expect(within(atlas).getByRole('table')).toBeTruthy()
    expect(atlas.querySelector('canvas')).toBeNull()
  })

  it('loads no bytes for viewport controls and requests only the selected manifest-owned chunk', async () => {
    render(MeasuredSpatialLiverAtlas)
    const map = await screen.findByTestId('measured-spatial-chunk-map')
    expect(api.loadMeasuredSpatialChunk).not.toHaveBeenCalled()

    await fireEvent.update(screen.getByLabelText('Z chunk slab'), '0')
    expect(api.loadMeasuredSpatialChunk).not.toHaveBeenCalled()
    await fireEvent.click(within(map).getByRole('button', { name: 'Request Y 0, X 0' }))

    await screen.findByText('Encoded and decoded verification passed')
    expect(api.loadMeasuredSpatialChunk).toHaveBeenCalledTimes(1)
    expect(api.loadMeasuredSpatialChunk).toHaveBeenCalledWith(chunk, expect.any(AbortSignal))
    expect(screen.getByText('local')).toBeTruthy()
  })

  it('exposes explicit 400-chunk completion and network-free integrity with mobile semantic controls', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360 })
    render(MeasuredSpatialLiverAtlas)
    await screen.findByTestId('measured-spatial-summary')

    await fireEvent.click(screen.getByTestId('measured-spatial-complete'))
    await waitFor(() => expect(api.completeMeasuredSpatialOffline).toHaveBeenCalled())
    await fireEvent.click(screen.getByTestId('measured-spatial-integrity'))
    const result = await screen.findByTestId('measured-spatial-offline-result')

    expect(within(result).getByText('400 verified')).toBeTruthy()
    expect(within(result).getByText('disabled')).toBeTruthy()
    expect(screen.getByRole('group', { name: 'liver-mask level 1, Z chunk 0' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Check local integrity without network' })).toBeTruthy()
  })
})
