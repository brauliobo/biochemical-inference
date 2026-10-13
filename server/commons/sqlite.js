import { constants, chmodSync, closeSync, fstatSync, lstatSync, openSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { join } from 'node:path'

const NOFOLLOW = constants.O_NOFOLLOW ?? 0

export const SQLITE_PRAGMAS = `
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = FULL;
    PRAGMA busy_timeout = 5000;
`

// Optional JSON text column -> value.
export const parseJsonColumn = (value) => value === null ? null : JSON.parse(value)

// Runs `action` in a BEGIN IMMEDIATE transaction, rolling back on any error.
export function transaction(database, action) {
  database.exec('BEGIN IMMEDIATE')
  try {
    const result = action()
    database.exec('COMMIT')
    return result
  } catch (error) {
    database.exec('ROLLBACK')
    throw error
  }
}

// WAL database with the standard pragmas; `schema` is idempotent DDL.
export function openDatabase(root, file, schema) {
  const database = new DatabaseSync(join(root, file))
  database.exec(`${SQLITE_PRAGMAS}${schema}`)
  return database
}

function assertRegularOrMissing(path, label) {
  try {
    const details = lstatSync(path)
    if (details.isSymbolicLink() || !details.isFile()) throw new Error(`Unsafe ${label} SQLite path: ${path}.`)
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
}

function chmodIfPresent(path) {
  try { chmodSync(path, 0o600) } catch (error) { if (error?.code !== 'ENOENT') throw error }
}

// Owner-only database that refuses symlinks and special files for the database
// and its WAL/SHM companions, and a schema version outside `versions`.
// `schema` must end by setting PRAGMA user_version.
export function openSecureDatabase(root, file, { label, versions, schema }) {
  const path = join(root, file)
  const companions = [`${path}-wal`, `${path}-shm`]
  for (const candidate of [path, ...companions]) assertRegularOrMissing(candidate, label)
  const descriptor = openSync(path, constants.O_CREAT | constants.O_RDWR | NOFOLLOW, 0o600)
  try {
    if (!fstatSync(descriptor).isFile()) throw new Error(`Unsafe ${label} SQLite descriptor: ${path}.`)
    chmodSync(path, 0o600)
  } finally {
    closeSync(descriptor)
  }
  const database = new DatabaseSync(path)
  const version = database.prepare('PRAGMA user_version').get().user_version
  if (!versions.includes(version)) {
    database.close()
    throw new Error(`Unsupported ${label} database schema version: ${version}.`)
  }
  database.exec(`${SQLITE_PRAGMAS}${schema}`)
  chmodSync(path, 0o600)
  for (const candidate of companions) {
    assertRegularOrMissing(candidate, label)
    chmodIfPresent(candidate)
  }
  return database
}
