import { openSecureDatabase } from '../commons/sqlite.js'

const SCHEMA = `
    CREATE TABLE IF NOT EXISTS snapshot (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1), release_id TEXT NOT NULL UNIQUE,
      release_digest TEXT NOT NULL UNIQUE CHECK (length(release_digest) = 64), trust_digest TEXT NOT NULL CHECK (length(trust_digest) = 64),
      catalog_digest TEXT NOT NULL CHECK (length(catalog_digest) = 64), manifest_digest TEXT NOT NULL CHECK (length(manifest_digest) = 64),
      envelope_digest TEXT NOT NULL CHECK (length(envelope_digest) = 64), metadata_digest TEXT NOT NULL CHECK (length(metadata_digest) = 64),
      inventory_digest TEXT NOT NULL CHECK (length(inventory_digest) = 64), bundle_digest TEXT NOT NULL UNIQUE CHECK (length(bundle_digest) = 64),
      bundle_bytes INTEGER NOT NULL CHECK (bundle_bytes > 0), synced_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS residual_overlap_recomputation (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1), release_id TEXT NOT NULL UNIQUE, inventory_digest TEXT NOT NULL CHECK (length(inventory_digest) = 64),
      metrics_digest TEXT NOT NULL CHECK (length(metrics_digest) = 64), verified_evidence_chunks INTEGER NOT NULL CHECK (verified_evidence_chunks = 288), verified_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS offline_completion (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1), release_id TEXT NOT NULL UNIQUE, inventory_digest TEXT NOT NULL CHECK (length(inventory_digest) = 64),
      verified_chunks INTEGER NOT NULL CHECK (verified_chunks = 304), encoded_bytes INTEGER NOT NULL CHECK (encoded_bytes = 508201), completed_at TEXT NOT NULL
    );
    CREATE TRIGGER IF NOT EXISTS goal14_registration_snapshot_update BEFORE UPDATE ON snapshot BEGIN SELECT RAISE(ABORT, 'Goal 14 registration snapshot is immutable'); END;
    CREATE TRIGGER IF NOT EXISTS goal14_registration_snapshot_delete BEFORE DELETE ON snapshot BEGIN SELECT RAISE(ABORT, 'Goal 14 registration snapshot is immutable'); END;
    CREATE TRIGGER IF NOT EXISTS goal14_registration_residual_overlap_update BEFORE UPDATE ON residual_overlap_recomputation BEGIN SELECT RAISE(ABORT, 'Goal 14 registration residual-overlap proof is immutable'); END;
    CREATE TRIGGER IF NOT EXISTS goal14_registration_residual_overlap_delete BEFORE DELETE ON residual_overlap_recomputation BEGIN SELECT RAISE(ABORT, 'Goal 14 registration residual-overlap proof is immutable'); END;
    CREATE TRIGGER IF NOT EXISTS goal14_registration_completion_update BEFORE UPDATE ON offline_completion BEGIN SELECT RAISE(ABORT, 'Goal 14 registration completion is immutable'); END;
    CREATE TRIGGER IF NOT EXISTS goal14_registration_completion_delete BEFORE DELETE ON offline_completion BEGIN SELECT RAISE(ABORT, 'Goal 14 registration completion is immutable'); END;
    PRAGMA user_version = 2;
`

export function openSpatialRegistrationDatabase(root) {
  return openSecureDatabase(root, 'goal14-registration-v1-1.sqlite3', { label: 'Goal 14 registration', versions: [0, 2], schema: SCHEMA })
}
