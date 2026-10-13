import { constants } from 'node:fs'
import { open, rename, unlink } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { z } from 'zod'
import { canonicalJson } from '../../shared/canonical-json.js'
import { MEASURED_RELEASE_DIGEST, MEASURED_RELEASE_ID, Sha256Schema } from '../../shared/measured-contracts.js'
import { openDirectoryNoFollow, openRegularNoFollow, NOFOLLOW } from '../data-plane/safe-path.js'
import { MeasuredVerificationError } from './verification.js'

const SortedDigestsSchema = z.array(Sha256Schema).min(1).max(256).refine((value) => value.join('\0') === [...new Set(value)].sort().join('\0'), 'Journal object digests must be uniquely sorted.')
const ArtifactKindSchema = z.enum(['calibration', 'parameter-policy', 'endpoint-mapping', 'metric-threshold-policy', 'prediction'])
const JournalSchema = z.discriminatedUnion('publicationType', [
  z.object({
    journalSchemaVersion: z.literal('1.1.0'),
    publicationType: z.literal('sync'),
    publicationId: z.literal(MEASURED_RELEASE_DIGEST),
    releaseId: z.literal(MEASURED_RELEASE_ID),
    objectDigests: SortedDigestsSchema
  }).strict(),
  z.object({
    journalSchemaVersion: z.literal('1.1.0'),
    publicationType: z.literal('immutable-artifact'),
    publicationId: Sha256Schema,
    artifactKind: ArtifactKindSchema,
    objectDigests: z.tuple([Sha256Schema])
  }).strict()
])

function parseJournal(value) {
  const parsed = JournalSchema.parse(value)
  if (parsed.publicationType === 'immutable-artifact' && parsed.publicationId !== parsed.objectDigests[0]) throw new MeasuredVerificationError('Measured artifact journal publication identity does not match its exact object digest.')
  return parsed
}

function measuredJournalPath(root) {
  return join(root, 'publication-journal.json')
}

async function syncDirectory(path) {
  const directory = await openDirectoryNoFollow(path)
  try { await directory.sync() } finally { await directory.close() }
}

export async function writeMeasuredJournal(root, publication) {
  const value = parseJournal(publication.publicationType === 'sync'
    ? { journalSchemaVersion: '1.1.0', publicationType: 'sync', publicationId: MEASURED_RELEASE_DIGEST, releaseId: MEASURED_RELEASE_ID, objectDigests: [...new Set(publication.objectDigests)].sort() }
    : { journalSchemaVersion: '1.1.0', publicationType: 'immutable-artifact', publicationId: publication.publicationId, artifactKind: publication.artifactKind, objectDigests: [...publication.objectDigests] })
  const path = measuredJournalPath(root)
  const temporary = `${path}.tmp`
  const handle = await open(temporary, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | NOFOLLOW, 0o600)
  try {
    await handle.writeFile(canonicalJson(value))
    await handle.chmod(0o600)
    await handle.sync()
  } finally {
    await handle.close()
  }
  await rename(temporary, path)
  await syncDirectory(dirname(path))
  return value
}

async function readMeasuredJournal(root) {
  const path = measuredJournalPath(root)
  let handle
  try {
    handle = await openRegularNoFollow(path)
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
  try {
    const bytes = await handle.readFile()
    if (bytes.length === 0 || bytes.length > 32 * 1024) throw new MeasuredVerificationError('Measured publication journal has an invalid size.')
    const text = bytes.toString('utf8')
    const value = parseJournal(JSON.parse(text))
    if (canonicalJson(value) !== text) throw new MeasuredVerificationError('Measured publication journal is not canonical JSON.')
    return value
  } catch (error) {
    if (error instanceof MeasuredVerificationError) throw error
    throw new MeasuredVerificationError('Measured publication journal is invalid.')
  } finally {
    await handle.close()
  }
}

export async function clearMeasuredJournal(root) {
  try {
    await unlink(measuredJournalPath(root))
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
  await syncDirectory(root)
}

export async function recoverMeasuredJournal(root, database, objects) {
  const temporary = `${measuredJournalPath(root)}.tmp`
  try {
    const handle = await openRegularNoFollow(temporary)
    await handle.close()
    await unlink(temporary)
    await syncDirectory(root)
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
  const journal = await readMeasuredJournal(root)
  if (!journal) return { recovered: false, committed: false }
  let committed
  if (journal.publicationType === 'sync') {
    committed = Boolean(database.prepare('SELECT singleton FROM snapshot WHERE singleton=1').get())
  } else {
    const artifact = database.prepare('SELECT * FROM immutable_artifacts WHERE digest=?').get(journal.publicationId)
    committed = Boolean(artifact)
    if (artifact && (artifact.kind !== journal.artifactKind || artifact.object_digest !== journal.publicationId || !database.prepare('SELECT digest FROM objects WHERE digest=?').get(journal.publicationId))) throw new MeasuredVerificationError('Committed measured artifact journal does not match the immutable artifact index.')
  }
  if (!committed) {
    for (const digest of journal.objectDigests) {
      if (database.prepare('SELECT digest FROM objects WHERE digest=?').get(digest)) continue
      await objects.remove(digest).catch((error) => { if (error?.code !== 'ENOENT') throw error })
    }
  }
  await clearMeasuredJournal(root)
  return { recovered: true, committed }
}
