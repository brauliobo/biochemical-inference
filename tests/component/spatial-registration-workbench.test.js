import { fireEvent, render, screen, waitFor, within } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { expectAccessible } from '../helpers/axe.js'
import { SPATIAL_REGISTRATION_PINS } from '../../shared/spatial-registration-contracts.js'
import { pressWhenEnabled } from '../helpers/interactions.js'

const api = vi.hoisted(() => ({
  completeSpatialRegistrationOffline: vi.fn(),
  loadSpatialRegistrationChunk: vi.fn(),
  loadSpatialRegistrationChunkInventory: vi.fn(),
  loadSpatialRegistrationDiscovery: vi.fn(),
  loadSpatialRegistrationStatus: vi.fn(),
  loadSpatialRegistrationWorkspace: vi.fn(),
  syncSpatialRegistration: vi.fn(),
  transformSpatialRegistrationPoint: vi.fn(),
  verifySpatialRegistrationIntegrity: vi.fn(),
  recomputeSpatialRegistrationResidualOverlap: vi.fn()
}))
vi.mock('../../src/api.js', () => api)

import SpatialRegistrationWorkbench from '../../src/components/SpatialRegistrationWorkbench.vue'

const CT_SPACE = 'SPACE:L2R-ABDOMEN-MRCT-0001-CT-PREALIGNED'
const MR_SPACE = 'SPACE:L2R-ABDOMEN-MRCT-0001-MR-PREALIGNED'
const status = { state: 'ready', integrity: 'valid', releaseId: SPATIAL_REGISTRATION_PINS.releaseId, cachedChunks: 288, totalChunks: 304, offlineComplete: false, residualOverlapRecomputed: true, lastError: null }
const metric = (anatomy, label, dice, fixed, moving) => ({ anatomy, label, status: dice == null ? 'not-evaluable' : 'observed', metric: 'Recomputed residual Dice overlap under published identity affine within repository-derived evaluation ROI', dice, centroid_distance_mm: dice == null ? null : 12, fixed_mr_voxels: fixed, moving_ct_voxels: moving, reason: dice == null ? 'left kidney is absent from moving CT source labels inside the repository-derived evaluation ROI.' : null })
const metrics = [metric('liver', 1, 0.6823498512713702, 147_635, 179_807), metric('spleen', 2, 0.6056176293676977, 29_215, 25_648), metric('right kidney', 3, 0.40082075057953764, 34_725, 29_119), metric('left kidney', 4, null, 18_285, 0)]
const modifications = [
  'bounded extraction of source pair 0001 and its source labels and masks',
  'identity-affine materialization between identical prealigned NIfTI sform grids',
  'repository-derived intersection of source evaluation masks for metric scope',
  'recomputed residual source-label overlap and centroid-distance characterization',
  'center-voxel decimation for non-diagnostic intensity previews',
  'deterministic chunking and compression'
]
const softwareLicenseBoundary = 'The CC BY 3.0 data terms apply to redistributed data and adaptations; repository software remains under its own license.'
const registration = {
  id: 'REGISTRATION:L2R-ABDOMEN-MRCT-0001-CT-TO-MR-PREALIGNED', source_space_id: CT_SPACE, target_space_id: MR_SPACE,
  evaluation_roi: { voxel_count: 1_444_952, bounds_xyz_inclusive: [[13, 12, 56], [185, 140, 177]] },
  derivation: { source_statement: 'Released using affine pre-registration based on the deeds-linear algorithm as part of Learn2Reg.' }
}
const workspace = {
  datasets: [{ id: 'Learn2Reg:AbdomenMRCT:1.1:pair-0001' }],
  spaces: [
    { id: MR_SPACE, modality: 'MR T1w', shape_xyz: [192, 160, 192], spacing_xyz: [2, 2, 2] },
    { id: CT_SPACE, modality: 'CT', shape_xyz: [192, 160, 192], spacing_xyz: [2, 2, 2] }
  ],
  arrays: [
    { id: 'ct-intensity-preview:0', kind: 'measured-intensity-preview', modality: 'CT', shape_zyx: [48, 40, 48], spacing_mm_zyx: [8, 8, 8], space_id: CT_SPACE, index_axis_order: ['z', 'y', 'x'], index_zyx_to_space_xyz_mm: [[0, 0, 8, 4], [0, 8, 0, 4], [8, 0, 0, 4], [0, 0, 0, 1]] },
    { id: 'evaluation-roi:0', kind: 'repository-derived-evaluation-roi', modality: 'cross-modality', shape_zyx: [192, 160, 192], spacing_mm_zyx: [2, 2, 2], space_id: MR_SPACE, index_axis_order: ['z', 'y', 'x'], index_zyx_to_space_xyz_mm: [[0, 0, 2, 0], [0, 2, 0, 0], [2, 0, 0, 0], [0, 0, 0, 1]] }
  ],
  registrations: [registration], 'residual-overlap': metrics,
  acquisitions: [{ package_verification: { observed_bytes: 1_916_666_413 }, members: Array.from({ length: 10 }, () => ({ matched_lock: true })) }],
  limitations: [{ id: 'limitation:0', statement: 'The release materializes an identity affine between source-published prealigned output grids.' }],
  attribution: [{
    title: 'Learn2Reg AbdomenMRCT pair 0001 prealigned registration data',
    license: { name: 'Creative Commons Attribution 3.0 Unported', url: 'https://creativecommons.org/licenses/by/3.0/', tcia_policy_url: 'https://www.cancerimagingarchive.net/data-usage-policies-and-restrictions/', downstream_notice: 'Downstream users must retain all license, policy, named citation, acknowledgement, modification, and identification notices.' },
    source: { package_name: 'AbdomenMRCT.zip', package_url: 'https://cloud.imi.uni-luebeck.de/public.php/dav/files/yiQZfo43YBBg7zL/?accept=zip', package_bytes: 1_916_666_413, retrieved_at: '2026-07-17T20:28:35Z', acquisition_report_sha256: SPATIAL_REGISTRATION_PINS.sourceAcquisitionReportDigest },
    acknowledgement: 'The results shown here are in whole or part based upon data generated by the TCGA Research Network.',
    no_endorsement: 'No endorsement is implied.', modifications, software_license_boundary: softwareLicenseBoundary, citations: [{ doi: '10.48550/arXiv.2112.04489', doi_url: 'https://doi.org/10.48550/arXiv.2112.04489', citation: 'Alessa Hering; Lasse Hansen; and named Learn2Reg authors. (2022). Learn2Reg Dataset v1.1.' }]
  }]
}
const descriptor = { array_id: 'evaluation-roi', level: 0, grid_zyx: [0, 0, 0], voxel_origin_zyx: [0, 0, 0], voxel_shape_zyx: [32, 40, 48], path: 'arrays/evaluation-roi/0/0.0.0', codec: 'gzip-level-9-mtime-0', media_type: 'application/vnd.zarr.chunk', encoded_bytes: 94, encoded_sha256: 'a'.repeat(64), decoded_bytes: 61_440, decoded_sha256: 'b'.repeat(64) }

beforeEach(() => {
  vi.clearAllMocks()
  api.loadSpatialRegistrationDiscovery.mockResolvedValue({ pins: SPATIAL_REGISTRATION_PINS, status })
  api.loadSpatialRegistrationStatus.mockResolvedValue(status)
  api.loadSpatialRegistrationWorkspace.mockResolvedValue(workspace)
  api.loadSpatialRegistrationChunkInventory.mockResolvedValue([descriptor])
  api.loadSpatialRegistrationChunk.mockResolvedValue({ descriptor, encodedBytes: 94, decodedBytes: 61_440, cacheSource: 'local' })
  api.recomputeSpatialRegistrationResidualOverlap.mockResolvedValue({ recomputed: true, metrics, cachedEvidenceChunks: 288 })
  api.transformSpatialRegistrationPoint.mockResolvedValue({ direction: 'forward', inputPointXyzMm: [192, 160, 192], outputPointXyzMm: [192, 160, 192], evaluationRoiMembership: 'inside' })
  api.completeSpatialRegistrationOffline.mockResolvedValue({ verifiedChunks: 304 })
  api.verifySpatialRegistrationIntegrity.mockResolvedValue({ status: 'valid', verifiedDecodedChunks: 304, networkAccess: false, findings: [] })
})

describe('SpatialRegistrationWorkbench', () => {
  it('presents array transforms, residual overlap, acquisition rights, and honest Goal 14 boundaries without WebGL', async () => {
    render(SpatialRegistrationWorkbench)
    const workbench = await screen.findByRole('region', { name: 'Learn2Reg MR–CT prealigned pair' })
    await within(workbench).findByTestId('spatial-registration-summary')

    expect(within(workbench).getByText('Goal 14 remains active')).toBeTruthy()
    expect(within(workbench).getByText(/source supplies prealigned arrays/i)).toBeTruthy()
    expect(within(workbench).getByText(/Creative Commons Attribution 3.0 Unported/)).toBeTruthy()
    expect(within(workbench).getByText(/TCIA terms/)).toBeTruthy()
    expect(workbench.textContent).toMatch(/1[,.]916[,.]666[,.]413 bytes hashed/)
    expect(workbench.textContent).toContain('translation 4, 4, 4 mm')
    expect(within(screen.getByTestId('spatial-registration-modifications')).getAllByRole('listitem').map((item) => item.textContent)).toEqual(modifications)
    expect(screen.getByTestId('spatial-registration-software-license').textContent).toContain(softwareLicenseBoundary)
    expect(within(workbench).getAllByText('not evaluable')).toHaveLength(2)
    expect(within(workbench).getAllByRole('table')).toHaveLength(2)
    expect(workbench.querySelector('canvas')).toBeNull()
  })

  it('recomputes residual overlap, verifies a selected ROI chunk, and reports ROI separately from transform validity', async () => {
    render(SpatialRegistrationWorkbench)
    await screen.findByTestId('spatial-registration-summary')

    await pressWhenEnabled('spatial-registration-residual-overlap')
    await waitFor(() => expect(api.recomputeSpatialRegistrationResidualOverlap).toHaveBeenCalled())
    await pressWhenEnabled('spatial-registration-chunk')
    await waitFor(() => expect(api.loadSpatialRegistrationChunk).toHaveBeenCalledWith(descriptor, expect.any(AbortSignal)))
    await pressWhenEnabled('spatial-registration-transform')
    const result = await screen.findByTestId('spatial-registration-transform-result')

    expect(api.transformSpatialRegistrationPoint).toHaveBeenCalledWith({ sourceSpaceId: CT_SPACE, targetSpaceId: MR_SPACE, pointXyzMm: [192, 160, 192] }, expect.any(AbortSignal))
    expect(within(result).getAllByText('192, 160, 192')).toHaveLength(2)
    expect(within(result).getByText(/inside \(metric scope only\)/)).toBeTruthy()
    expect(screen.getByText(/arrays\/evaluation-roi\/0\/0.0.0/)).toBeTruthy()
  })

  it('completes all chunks and reports network-free integrity on a mobile viewport', async () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 360 })
    render(SpatialRegistrationWorkbench)
    await screen.findByTestId('spatial-registration-summary')

    await pressWhenEnabled('spatial-registration-complete')
    await waitFor(() => expect(api.completeSpatialRegistrationOffline).toHaveBeenCalled())
    await pressWhenEnabled('spatial-registration-integrity')
    const result = await screen.findByTestId('spatial-registration-offline-result')

    expect(within(result).getByText('304')).toBeTruthy()
    expect(await within(result).findByText('disabled')).toBeTruthy()
    expect(await screen.findByRole('button', { name: 'Check integrity without network' })).toBeTruthy()
  })

  it('reverses the UI direction and submits a fractional inverse point without treating ROI scope as validity', async () => {
    api.transformSpatialRegistrationPoint.mockResolvedValue({ direction: 'inverse', inputPointXyzMm: [1, 0, 0], outputPointXyzMm: [1, 0, 0], evaluationRoiMembership: 'not-assessed-off-grid' })
    render(SpatialRegistrationWorkbench)
    await screen.findByTestId('spatial-registration-summary')

    await fireEvent.click(screen.getByTestId('spatial-registration-reverse'))
    expect(screen.getByLabelText('Source').value).toBe('MR prealigned')
    expect(screen.getByLabelText('Target').value).toBe('CT prealigned')
    await fireEvent.update(screen.getByLabelText('X mm'), '1')
    await fireEvent.update(screen.getByLabelText('Y mm'), '0')
    await fireEvent.update(screen.getByLabelText('Z mm'), '0')
    await fireEvent.click(screen.getByTestId('spatial-registration-transform'))

    expect(api.transformSpatialRegistrationPoint).toHaveBeenCalledWith({ sourceSpaceId: MR_SPACE, targetSpaceId: CT_SPACE, pointXyzMm: [1, 0, 0] }, expect.any(AbortSignal))
    const result = await screen.findByTestId('spatial-registration-transform-result')
    expect(within(result).getByText('inverse')).toBeTruthy()
    expect(within(result).getByText(/not-assessed-off-grid \(metric scope only\)/)).toBeTruthy()
  })

  it('has no WCAG 2.2 AA violations with overlap metrics and a transform result', async () => {
    render(SpatialRegistrationWorkbench)
    await screen.findByTestId('spatial-registration-summary')
    await pressWhenEnabled('spatial-registration-residual-overlap')
    await pressWhenEnabled('spatial-registration-transform')
    await screen.findByTestId('spatial-registration-transform-result')
    await expectAccessible()
  })
})
