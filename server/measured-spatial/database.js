import { openSecureDatabase } from '../commons/sqlite.js'

const SCHEMA = `
    CREATE TABLE IF NOT EXISTS snapshot (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
      release_id TEXT NOT NULL UNIQUE,
      release_digest TEXT NOT NULL UNIQUE CHECK (length(release_digest) = 64),
      trust_digest TEXT NOT NULL CHECK (length(trust_digest) = 64),
      catalog_digest TEXT NOT NULL CHECK (length(catalog_digest) = 64),
      manifest_digest TEXT NOT NULL CHECK (length(manifest_digest) = 64),
      envelope_digest TEXT NOT NULL CHECK (length(envelope_digest) = 64),
      metadata_digest TEXT NOT NULL CHECK (length(metadata_digest) = 64),
      inventory_digest TEXT NOT NULL CHECK (length(inventory_digest) = 64),
      bundle_digest TEXT NOT NULL UNIQUE CHECK (length(bundle_digest) = 64),
      bundle_bytes INTEGER NOT NULL CHECK (bundle_bytes > 0),
      synced_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS offline_completion (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
      release_id TEXT NOT NULL UNIQUE,
      release_digest TEXT NOT NULL UNIQUE CHECK (length(release_digest) = 64),
      inventory_digest TEXT NOT NULL CHECK (length(inventory_digest) = 64),
      verified_chunks INTEGER NOT NULL CHECK (verified_chunks = 400),
      encoded_bytes INTEGER NOT NULL CHECK (encoded_bytes = 1003982),
      completed_at TEXT NOT NULL
    );
    CREATE TRIGGER IF NOT EXISTS goal14_snapshot_update BEFORE UPDATE ON snapshot BEGIN SELECT RAISE(ABORT, 'Goal 14 snapshot is immutable'); END;
    CREATE TRIGGER IF NOT EXISTS goal14_snapshot_delete BEFORE DELETE ON snapshot BEGIN SELECT RAISE(ABORT, 'Goal 14 snapshot is immutable'); END;
    CREATE TRIGGER IF NOT EXISTS goal14_completion_update BEFORE UPDATE ON offline_completion BEGIN SELECT RAISE(ABORT, 'Goal 14 offline completion is immutable'); END;
    CREATE TRIGGER IF NOT EXISTS goal14_completion_delete BEFORE DELETE ON offline_completion BEGIN SELECT RAISE(ABORT, 'Goal 14 offline completion is immutable'); END;
    PRAGMA user_version = 1;
`

export function openMeasuredSpatialDatabase(root) {
  return openSecureDatabase(root, 'goal14.sqlite3', { label: 'Goal 14', versions: [0, 1], schema: SCHEMA })
}
