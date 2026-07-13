import { DatabaseSync } from 'node:sqlite'
import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createKnowledgeClient } from '../../server/knowledge/client.js'
import { createWorkspaceService } from '../../server/workspace/service.js'
import { workspaceSpecification } from '../fixtures/workspace.js'
import { isolatedTestRoot } from '../fixtures/test-root.js'

const roots = []
const services = []
afterEach(async () => {
  await Promise.allSettled(services.splice(0).map((service) => service.close()))
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function service(root) {
  const value = await createWorkspaceService({ root, env: { NODE_ENV: 'test', BIOCHEMICAL_WORKSPACE_CONCURRENCY: '1' }, knowledgeClient: createKnowledgeClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' }) })
  services.push(value)
  return value
}

async function terminal(workspace, attemptId) {
  for (let index = 0; index < 200; index += 1) {
    const detail = workspace.getAttempt(attemptId)
    if (detail.attempt.state === 'terminal') return detail.attempt
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw new Error('attempt did not become terminal')
}

async function experiment(workspace, specification = workspaceSpecification(), resourceProfileId = 'local-default') {
  return workspace.createExperiment({ name: 'Workspace test', description: 'Durable fixture', specification, resourceProfileId })
}

describe('durable workspace service', () => {
  it('separates scientific runs from attempts and applies exact history filters', async () => {
    const root = await isolatedTestRoot('workspace-service-test')
    roots.push(root)
    const workspace = await service(root)
    const created = await experiment(workspace, workspaceSpecification({ tissueId: 'UBERON:0002107' }))
    const first = workspace.queueRun({ revisionId: created.revisions[0].revisionId })
    expect((await terminal(workspace, first.attemptId)).outcome).toBe('successful')
    const second = workspace.queueRun({ revisionId: created.revisions[0].revisionId })
    expect((await terminal(workspace, second.attemptId)).outcome).toBe('successful')

    expect(second.runId).toBe(first.runId)
    expect(second.attemptId).not.toBe(first.attemptId)
    expect(second.kind).toBe('rerun')
    expect(workspace.listHistory({ model: 'first_order_ode', taxon: 'NCBITaxon:9606', tissue: 'UBERON:0002107', status: 'successful' }).total).toBe(2)
    expect(workspace.listHistory({ model: 'bounded_growth_fba' }).total).toBe(0)
  })

  it('makes accepted cancellation terminal and reports output budget exhaustion distinctly', async () => {
    const root = await isolatedTestRoot('workspace-limits-test')
    roots.push(root)
    const workspace = await service(root)
    workspace.createResourceProfile({ id: 'tiny-output', name: 'Tiny output', cpuCores: 1, concurrency: 1, gpu: 'disabled', memoryMb: 64, wallTimeMs: 10000, maxOutputBytes: 1024, maxStorageBytes: 5000000, isDefault: false })
    const created = await experiment(workspace)
    const cancelled = workspace.queueRun({ revisionId: created.revisions[0].revisionId })
    for (let index = 0; index < 100 && workspace.getAttempt(cancelled.attemptId).attempt.state === 'queued'; index += 1) await new Promise((resolve) => setTimeout(resolve, 1))
    expect(workspace.cancel(cancelled.attemptId)).toMatchObject({ cancellationRequested: true })
    expect((await terminal(workspace, cancelled.attemptId)).outcome).toBe('cancelled')

    const exhausted = workspace.queueRun({ revisionId: created.revisions[0].revisionId, resourceProfileId: 'tiny-output' })
    expect(await terminal(workspace, exhausted.attemptId)).toMatchObject({ outcome: 'resource-exhausted', failure: { code: 'portfolio_entry_failure' } })
    expect(workspace.artifacts(exhausted.attemptId)).toHaveLength(1)
  })

  it('enforces wall, storage, CPU-concurrency, and unavailable GPU profile limits', async () => {
    const root = await isolatedTestRoot('workspace-resource-test')
    roots.push(root)
    const workspace = await service(root)
    expect(() => workspace.createResourceProfile({ id: 'bad-cpu', name: 'Bad CPU', cpuCores: 1, concurrency: 2, gpu: 'disabled', memoryMb: 64, wallTimeMs: 1000, maxOutputBytes: 2000000, maxStorageBytes: 5000000, isDefault: false })).toThrow(/concurrency/)
    workspace.createResourceProfile({ id: 'tiny-wall', name: 'Tiny wall', cpuCores: 1, concurrency: 1, gpu: 'disabled', memoryMb: 64, wallTimeMs: 10, maxOutputBytes: 2000000, maxStorageBytes: 5000000, isDefault: false })
    workspace.createResourceProfile({ id: 'gpu-only', name: 'GPU only', cpuCores: 1, concurrency: 1, gpu: 'required', memoryMb: 64, wallTimeMs: 1000, maxOutputBytes: 2000000, maxStorageBytes: 5000000, isDefault: false })
    workspace.createResourceProfile({ id: 'tiny-storage', name: 'Tiny storage', cpuCores: 1, concurrency: 1, gpu: 'disabled', memoryMb: 64, wallTimeMs: 10000, maxOutputBytes: 2000000, maxStorageBytes: 4096, isDefault: false })
    const created = await experiment(workspace)
    const wall = workspace.queueRun({ revisionId: created.revisions[0].revisionId, resourceProfileId: 'tiny-wall' })
    expect((await terminal(workspace, wall.attemptId)).outcome).toBe('resource-exhausted')
    const gpu = workspace.queueRun({ revisionId: created.revisions[0].revisionId, resourceProfileId: 'gpu-only' })
    expect(await terminal(workspace, gpu.attemptId)).toMatchObject({ outcome: 'resource-exhausted', failure: { code: 'gpu_unavailable' } })
    const storage = workspace.queueRun({ revisionId: created.revisions[0].revisionId, resourceProfileId: 'tiny-storage' })
    expect(await terminal(workspace, storage.attemptId)).toMatchObject({ outcome: 'resource-exhausted', failure: { code: 'storage_limit' } })
    expect(workspace.artifacts(storage.attemptId)).toEqual([])
  })

  it('generates deterministic network-free report artifacts with restrictive CSP', async () => {
    const root = await isolatedTestRoot('workspace-report-test')
    roots.push(root)
    const workspace = await service(root)
    const created = await experiment(workspace)
    const queued = workspace.queueRun({ revisionId: created.revisions[0].revisionId })
    await terminal(workspace, queued.attemptId)
    const report = await workspace.createReport(queued.attemptId)
    const htmlArtifact = report.artifacts.find((item) => item.kind === 'report-html')
    const html = (await workspace.artifactContent(htmlArtifact.artifactId)).content.toString('utf8')

    expect(report.csp).toBe("default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
    expect(html).toContain('http-equiv="Content-Security-Policy"')
    expect(html).not.toMatch(/<script|(?:src|href)="https?:\/\//)
    expect((await workspace.createReport(queued.attemptId)).reportId).toBe(report.reportId)
  })

  it('terminalizes interrupted work and creates a labeled restart-from-specification attempt', async () => {
    const root = await isolatedTestRoot('workspace-recovery-test')
    roots.push(root)
    let workspace = await service(root)
    const created = await experiment(workspace)
    const queued = workspace.queueRun({ revisionId: created.revisions[0].revisionId })
    await terminal(workspace, queued.attemptId)
    await workspace.close()
    services.splice(services.indexOf(workspace), 1)

    const database = new DatabaseSync(join(root, 'workspace.sqlite3'))
    database.exec('PRAGMA foreign_keys = ON')
    database.prepare('DELETE FROM artifacts WHERE attempt_id = ?').run(queued.attemptId)
    database.prepare("UPDATE attempts SET state = 'running', outcome = NULL, completed_at = NULL, failure_json = NULL, result_artifact_id = NULL WHERE attempt_id = ?").run(queued.attemptId)
    database.close()

    workspace = await service(root)
    const run = workspace.getRun(queued.runId)
    expect(run.attempts).toHaveLength(2)
    expect(run.attempts[0]).toMatchObject({ state: 'terminal', outcome: 'failed', failure: { code: 'process_restart' } })
    expect(run.attempts[1]).toMatchObject({ kind: 'restart', restartMode: 'from-specification' })
    expect((await terminal(workspace, run.attempts[1].attemptId)).outcome).toBe('successful')
  })
})
