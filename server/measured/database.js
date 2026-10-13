import { openSecureDatabase } from '../commons/sqlite.js'

const SCHEMA = `
    CREATE TABLE IF NOT EXISTS objects (
      digest TEXT PRIMARY KEY CHECK (length(digest) = 64),
      bytes INTEGER NOT NULL CHECK (bytes > 0),
      media_type TEXT NOT NULL,
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
      signer_key_id TEXT NOT NULL,
      signed_at TEXT NOT NULL,
      synced_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sync_objects (
      path TEXT PRIMARY KEY,
      digest TEXT NOT NULL REFERENCES objects(digest)
    ) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS records (
      record_type TEXT NOT NULL CHECK (record_type IN ('families','studies','partitions','applicability','sources','measurements','missingness','exclusions')),
      id TEXT NOT NULL,
      role TEXT CHECK (role IS NULL OR role IN ('development','calibration','validation','external-held-out')),
      encoded BLOB NOT NULL,
      PRIMARY KEY (record_type, id)
    ) WITHOUT ROWID;
    CREATE INDEX IF NOT EXISTS measured_records_role_idx ON records(record_type, role, id);
    CREATE TABLE IF NOT EXISTS lineages (
      measurement_id TEXT PRIMARY KEY,
      role TEXT NOT NULL CHECK (role IN ('development','calibration')),
      digest TEXT NOT NULL UNIQUE CHECK (length(digest) = 64),
      encoded BLOB NOT NULL
    ) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS immutable_artifacts (
      digest TEXT PRIMARY KEY CHECK (length(digest) = 64),
      kind TEXT NOT NULL CHECK (kind IN ('calibration','parameter-policy','endpoint-mapping','metric-threshold-policy','prediction')),
      object_digest TEXT NOT NULL UNIQUE REFERENCES objects(digest),
      bytes INTEGER NOT NULL CHECK (bytes > 0),
      created_at TEXT NOT NULL
    ) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS freezes (
      commitment_digest TEXT PRIMARY KEY CHECK (length(commitment_digest) = 64),
      intent_digest TEXT NOT NULL UNIQUE CHECK (length(intent_digest) = 64),
      nonce TEXT NOT NULL UNIQUE,
      frozen_request BLOB NOT NULL UNIQUE,
      artifact_refs BLOB NOT NULL,
      receipt BLOB NOT NULL,
      created_at TEXT NOT NULL
    ) WITHOUT ROWID;
    CREATE TABLE IF NOT EXISTS disclosures (
      commitment_digest TEXT PRIMARY KEY REFERENCES freezes(commitment_digest),
      request_digest TEXT NOT NULL CHECK (length(request_digest) = 64),
      response_digest TEXT NOT NULL CHECK (length(response_digest) = 64),
      disclosed_at TEXT NOT NULL
    ) WITHOUT ROWID;
    CREATE TRIGGER IF NOT EXISTS measured_snapshot_update BEFORE UPDATE ON snapshot BEGIN SELECT RAISE(ABORT, 'measured snapshot is immutable'); END;
    CREATE TRIGGER IF NOT EXISTS measured_snapshot_delete BEFORE DELETE ON snapshot BEGIN SELECT RAISE(ABORT, 'measured snapshot is immutable'); END;
    CREATE TRIGGER IF NOT EXISTS measured_records_update BEFORE UPDATE ON records BEGIN SELECT RAISE(ABORT, 'measured records are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS measured_records_delete BEFORE DELETE ON records BEGIN SELECT RAISE(ABORT, 'measured records are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS measured_lineages_update BEFORE UPDATE ON lineages BEGIN SELECT RAISE(ABORT, 'measured lineages are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS measured_lineages_delete BEFORE DELETE ON lineages BEGIN SELECT RAISE(ABORT, 'measured lineages are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS measured_artifacts_update BEFORE UPDATE ON immutable_artifacts BEGIN SELECT RAISE(ABORT, 'measured artifacts are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS measured_artifacts_delete BEFORE DELETE ON immutable_artifacts BEGIN SELECT RAISE(ABORT, 'measured artifacts are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS measured_freezes_update BEFORE UPDATE ON freezes BEGIN SELECT RAISE(ABORT, 'measured freezes are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS measured_freezes_delete BEFORE DELETE ON freezes BEGIN SELECT RAISE(ABORT, 'measured freezes are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS measured_disclosures_update BEFORE UPDATE ON disclosures BEGIN SELECT RAISE(ABORT, 'measured disclosures are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS measured_disclosures_delete BEFORE DELETE ON disclosures BEGIN SELECT RAISE(ABORT, 'measured disclosures are immutable'); END;
    PRAGMA user_version = 2;
`

export function openMeasuredDatabase(root) {
  return openSecureDatabase(root, 'measured.sqlite3', { label: 'measured', versions: [0, 2], schema: SCHEMA })
}
