import { constants, chmodSync, closeSync, fstatSync, lstatSync, openSync } from 'node:fs'
import { DatabaseSync } from 'node:sqlite'
import { join } from 'node:path'

const NOFOLLOW = constants.O_NOFOLLOW ?? 0

function assertRegularOrMissing(path) {
  try {
    const details = lstatSync(path)
    if (details.isSymbolicLink() || !details.isFile()) throw new Error(`Unsafe Goal 13 SQLite path: ${path}.`)
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error
  }
}

export function openChallengeDatabase(root) {
  const path = join(root, 'goal13.sqlite3')
  for (const candidate of [path, `${path}-wal`, `${path}-shm`]) assertRegularOrMissing(candidate)
  const descriptor = openSync(path, constants.O_CREAT | constants.O_RDWR | NOFOLLOW, 0o600)
  try {
    if (!fstatSync(descriptor).isFile()) throw new Error(`Unsafe Goal 13 SQLite descriptor: ${path}.`)
    chmodSync(path, 0o600)
  } finally {
    closeSync(descriptor)
  }
  const database = new DatabaseSync(path)
  const version = database.prepare('PRAGMA user_version').get().user_version
  if (![0, 2].includes(version)) {
    database.close()
    throw new Error(`Unsupported Goal 13 database schema version: ${version}.`)
  }
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = FULL;
    PRAGMA busy_timeout = 5000;
    CREATE TABLE IF NOT EXISTS objects (
      digest TEXT PRIMARY KEY CHECK (length(digest) = 64),
      bytes INTEGER NOT NULL CHECK (bytes > 0),
      created_at TEXT NOT NULL
    ) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS artifacts (
      digest TEXT PRIMARY KEY REFERENCES objects(digest),
      kind TEXT NOT NULL CHECK (kind IN ('release-snapshot','model','equation-set','parameter-policy','concentration-mapping','solver','software','diagnostics','prediction','public-lineage','disclosure','report')),
      bytes INTEGER NOT NULL CHECK (bytes > 0),
      created_at TEXT NOT NULL
    ) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS snapshot (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
      release_id TEXT NOT NULL UNIQUE,
      release_digest TEXT NOT NULL UNIQUE CHECK (length(release_digest) = 64),
      catalog_digest TEXT NOT NULL CHECK (length(catalog_digest) = 64),
      trust_digest TEXT NOT NULL CHECK (length(trust_digest) = 64),
      manifest_digest TEXT NOT NULL CHECK (length(manifest_digest) = 64),
      envelope_digest TEXT NOT NULL CHECK (length(envelope_digest) = 64),
      bundle_digest TEXT NOT NULL UNIQUE REFERENCES artifacts(digest),
      synced_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS commitments (
      commitment_digest TEXT PRIMARY KEY CHECK (length(commitment_digest) = 64),
      nonce TEXT NOT NULL UNIQUE,
      release_id TEXT NOT NULL,
      partition_digest TEXT NOT NULL CHECK (length(partition_digest) = 64),
      model_digest TEXT NOT NULL CHECK (length(model_digest) = 64),
      parameter_policy_digest TEXT NOT NULL CHECK (length(parameter_policy_digest) = 64),
      artifact_refs_digest TEXT NOT NULL CHECK (length(artifact_refs_digest) = 64),
      frozen_commitment BLOB NOT NULL UNIQUE,
      artifact_refs BLOB NOT NULL,
      receipt BLOB NOT NULL,
      created_at TEXT NOT NULL,
      committed_at TEXT NOT NULL,
      CHECK (created_at <= committed_at)
    ) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS disclosure_epochs (
      release_id TEXT NOT NULL,
      partition_digest TEXT NOT NULL CHECK (length(partition_digest) = 64),
      opened_at TEXT NOT NULL,
      first_commitment_digest TEXT NOT NULL UNIQUE REFERENCES commitments(commitment_digest),
      PRIMARY KEY (release_id, partition_digest)
    ) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS disclosures (
      commitment_digest TEXT PRIMARY KEY REFERENCES commitments(commitment_digest),
      disclosure_digest TEXT NOT NULL UNIQUE CHECK (length(disclosure_digest) = 64),
      request_digest TEXT NOT NULL CHECK (length(request_digest) = 64),
      response_artifact_digest TEXT NOT NULL UNIQUE REFERENCES artifacts(digest),
      disclosed_at TEXT NOT NULL
    ) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS reports (
      result_digest TEXT PRIMARY KEY CHECK (length(result_digest) = 64),
      commitment_digest TEXT NOT NULL UNIQUE REFERENCES commitments(commitment_digest),
      disclosure_digest TEXT NOT NULL UNIQUE REFERENCES disclosures(disclosure_digest),
      submission_digest TEXT NOT NULL UNIQUE CHECK (length(submission_digest) = 64),
      submission BLOB NOT NULL UNIQUE,
      report_digest TEXT NOT NULL UNIQUE REFERENCES artifacts(digest),
      submitted_at TEXT NOT NULL
    ) WITHOUT ROWID;
    CREATE TRIGGER IF NOT EXISTS goal13_snapshot_update BEFORE UPDATE ON snapshot BEGIN SELECT RAISE(ABORT, 'Goal 13 snapshot is immutable'); END;
    CREATE TRIGGER IF NOT EXISTS goal13_snapshot_delete BEFORE DELETE ON snapshot BEGIN SELECT RAISE(ABORT, 'Goal 13 snapshot is immutable'); END;
    CREATE TRIGGER IF NOT EXISTS goal13_artifacts_update BEFORE UPDATE ON artifacts BEGIN SELECT RAISE(ABORT, 'Goal 13 artifacts are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS goal13_artifacts_delete BEFORE DELETE ON artifacts BEGIN SELECT RAISE(ABORT, 'Goal 13 artifacts are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS goal13_commitments_update BEFORE UPDATE ON commitments BEGIN SELECT RAISE(ABORT, 'Goal 13 commitments are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS goal13_commitments_delete BEFORE DELETE ON commitments BEGIN SELECT RAISE(ABORT, 'Goal 13 commitments are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS goal13_epochs_update BEFORE UPDATE ON disclosure_epochs BEGIN SELECT RAISE(ABORT, 'Goal 13 disclosure epochs are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS goal13_epochs_delete BEFORE DELETE ON disclosure_epochs BEGIN SELECT RAISE(ABORT, 'Goal 13 disclosure epochs are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS goal13_disclosures_update BEFORE UPDATE ON disclosures BEGIN SELECT RAISE(ABORT, 'Goal 13 disclosures are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS goal13_disclosures_delete BEFORE DELETE ON disclosures BEGIN SELECT RAISE(ABORT, 'Goal 13 disclosures are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS goal13_reports_update BEFORE UPDATE ON reports BEGIN SELECT RAISE(ABORT, 'Goal 13 reports are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS goal13_reports_delete BEFORE DELETE ON reports BEGIN SELECT RAISE(ABORT, 'Goal 13 reports are immutable'); END;
    PRAGMA user_version = 2;
  `)
  chmodSync(path, 0o600)
  for (const candidate of [`${path}-wal`, `${path}-shm`]) {
    try { chmodSync(candidate, 0o600) } catch (error) { if (error?.code !== 'ENOENT') throw error }
  }
  return database
}
