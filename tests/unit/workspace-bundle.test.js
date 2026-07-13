import { rm } from 'node:fs/promises'
import yauzl from 'yauzl'
import yazl from 'yazl'
import { afterEach, describe, expect, it } from 'vitest'
import { createKnowledgeClient } from '../../server/knowledge/client.js'
import { canonicalJson } from '../../shared/canonical-json.js'
import { importPortableBundle } from '../../server/workspace/bundle.js'
import { createWorkspaceService } from '../../server/workspace/service.js'
import { workspaceSpecification } from '../fixtures/workspace.js'
import { isolatedTestRoot } from '../fixtures/test-root.js'

const roots = []
const services = []
afterEach(async () => {
  await Promise.allSettled(services.splice(0).map((service) => service.close()))
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

async function workspace(knowledgeClient = createKnowledgeClient({ BIOCHEMICAL_INFERENCE_USE_FIXTURE: 'true' })) {
  const root = await isolatedTestRoot('workspace-bundle-test')
  roots.push(root)
  const service = await createWorkspaceService({ root, env: { NODE_ENV: 'test' }, knowledgeClient })
  services.push(service)
  return service
}

async function terminal(service, attemptId) {
  for (let index = 0; index < 200; index += 1) {
    const attempt = service.getAttempt(attemptId).attempt
    if (attempt.state === 'terminal') return attempt
    await new Promise((resolve) => setTimeout(resolve, 10))
  }
  throw new Error('attempt did not finish')
}

function zip(files) {
  const archive = new yazl.ZipFile()
  for (const [path, content] of files) archive.addBuffer(content, path, { compress: true })
  archive.end()
  return new Promise((resolve, reject) => {
    const chunks = []
    archive.outputStream.on('data', (chunk) => chunks.push(chunk))
    archive.outputStream.on('error', reject)
    archive.outputStream.on('end', () => resolve(Buffer.concat(chunks)))
  })
}

function unzip(buffer) {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (error, archive) => {
      if (error) return reject(error)
      const files = new Map()
      archive.on('entry', (entry) => archive.openReadStream(entry, (streamError, stream) => {
        if (streamError) return reject(streamError)
        const chunks = []
        stream.on('data', (chunk) => chunks.push(chunk))
        stream.on('end', () => {
          files.set(entry.fileName, Buffer.concat(chunks))
          archive.readEntry()
        })
      }))
      archive.on('end', () => resolve(files))
      archive.on('error', reject)
      archive.readEntry()
    })
  })
}

function replaceAllBytes(buffer, source, replacement) {
  if (source.length !== replacement.length) throw new Error('replacement length must match')
  const result = Buffer.from(buffer)
  let offset = 0
  while ((offset = result.indexOf(source, offset)) !== -1) {
    result.write(replacement, offset, source.length, 'utf8')
    offset += source.length
  }
  return result
}

describe('portable workspace bundles', () => {
  it('round-trips and reruns offline under the exported exact contract', async () => {
    const source = await workspace()
    const created = await source.createExperiment({ name: 'Portable test', description: 'Offline rerun', specification: workspaceSpecification(), resourceProfileId: 'local-default' })
    const first = source.queueRun({ revisionId: created.revisions[0].revisionId })
    expect((await terminal(source, first.attemptId)).outcome).toBe('successful')
    const exported = await source.exportExperiment(created.experiment.experimentId)

    const offline = await workspace({ async snapshot() { throw new Error('network access is forbidden during import and rerun') } })
    const imported = await offline.importExperiment(Buffer.from(exported.bundleBase64, 'base64'))
    const rerun = offline.queueRun({ revisionId: imported.revisions[0].revisionId })
    expect(await terminal(offline, rerun.attemptId)).toMatchObject({ outcome: 'successful', rerunVerification: 'pass' })
  })

  it('rejects traversal, duplicate names, digest mismatches, and compression bombs', async () => {
    const source = await workspace()
    const created = await source.createExperiment({ name: 'Attack test', description: '', specification: workspaceSpecification(), resourceProfileId: 'local-default' })
    const exported = Buffer.from((await source.exportExperiment(created.experiment.experimentId)).bundleBase64, 'base64')
    const traversal = replaceAllBytes(exported, 'manifest.json', '../xfile.json')
    await expect(importPortableBundle(traversal)).rejects.toThrow(/unsafe|invalid relative path/)

    const duplicate = await zip([['manifest.json', Buffer.from('{}')], ['manifest.json', Buffer.from('{}')]])
    await expect(importPortableBundle(duplicate)).rejects.toThrow(/duplicate/)

    const files = await unzip(exported)
    const alterManifest = async (change) => {
      const changedFiles = new Map(files)
      const manifest = JSON.parse(changedFiles.get('manifest.json').toString('utf8'))
      change(manifest)
      changedFiles.set('manifest.json', Buffer.from(canonicalJson(manifest)))
      return zip([...changedFiles])
    }
    await expect(importPortableBundle(await alterManifest((manifest) => { manifest.revision.specificationDigest = `sha256:${'0'.repeat(64)}` }))).rejects.toThrow(/specification.*digest/)
    await expect(importPortableBundle(await alterManifest((manifest) => { manifest.revision.modelDigests = [`sha256:${'0'.repeat(64)}`] }))).rejects.toThrow(/model digests/)
    await expect(importPortableBundle(await alterManifest((manifest) => { manifest.revision.engineDigests = [`sha256:${'0'.repeat(64)}`] }))).rejects.toThrow(/engine digests/)

    const objectPath = [...files.keys()].find((path) => path.startsWith('objects/sha256/'))
    files.set(objectPath, Buffer.concat([files.get(objectPath), Buffer.from('tampered')]))
    await expect(importPortableBundle(await zip([...files]))).rejects.toThrow(/size does not match|digest does not match/)

    const bomb = await zip([['objects/sha256/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', Buffer.alloc(1_000_000)]])
    await expect(importPortableBundle(bomb)).rejects.toThrow(/compression ratio/)
  })
})
