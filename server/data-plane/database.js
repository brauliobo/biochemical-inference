import { openSecureDatabase } from '../commons/sqlite.js'

const SCHEMA = `
    CREATE TABLE IF NOT EXISTS objects (
      digest TEXT PRIMARY KEY CHECK (length(digest) = 64),
      bytes INTEGER NOT NULL CHECK (bytes > 0),
      media_type TEXT NOT NULL,
      created_at TEXT NOT NULL
    ) WITHOUT ROWID;

    CREATE TABLE IF NOT EXISTS generations (
      generation_id INTEGER PRIMARY KEY AUTOINCREMENT,
      release_id TEXT NOT NULL UNIQUE,
      release_digest TEXT NOT NULL UNIQUE,
      schema_version TEXT NOT NULL,
      catalog_digest TEXT NOT NULL,
      trust_digest TEXT NOT NULL,
      envelope_digest TEXT NOT NULL,
      manifest_digest TEXT NOT NULL,
      signer_key_id TEXT NOT NULL,
      signed_at TEXT NOT NULL,
      catalog_object_digest TEXT NOT NULL REFERENCES objects(digest),
      trust_object_digest TEXT NOT NULL REFERENCES objects(digest),
      envelope_object_digest TEXT NOT NULL REFERENCES objects(digest),
      manifest_object_digest TEXT NOT NULL REFERENCES objects(digest),
      synced_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS partitions (
      generation_id INTEGER NOT NULL REFERENCES generations(generation_id),
      path TEXT NOT NULL,
      record_type TEXT NOT NULL CHECK (record_type IN ('taxa', 'compounds', 'reactions', 'proteins', 'references', 'catalysis', 'limitations')),
      part_number INTEGER NOT NULL CHECK (part_number >= 0),
      first_id TEXT NOT NULL,
      last_id TEXT NOT NULL,
      record_count INTEGER NOT NULL CHECK (record_count > 0),
      bytes INTEGER NOT NULL CHECK (bytes > 0),
      object_digest TEXT NOT NULL REFERENCES objects(digest),
      PRIMARY KEY (generation_id, path),
      UNIQUE (generation_id, record_type, part_number)
    ) WITHOUT ROWID;

    CREATE TABLE IF NOT EXISTS records (
      generation_id INTEGER NOT NULL REFERENCES generations(generation_id),
      record_type TEXT NOT NULL CHECK (record_type IN ('taxa', 'compounds', 'reactions', 'proteins', 'references', 'catalysis', 'limitations')),
      id TEXT NOT NULL,
      taxon_id TEXT,
      reaction_id TEXT,
      protein_id TEXT,
      encoded BLOB NOT NULL,
      PRIMARY KEY (generation_id, record_type, id)
    ) WITHOUT ROWID;

    CREATE TABLE IF NOT EXISTS release_diffs (
      baseline_generation_id INTEGER NOT NULL REFERENCES generations(generation_id),
      candidate_generation_id INTEGER NOT NULL REFERENCES generations(generation_id),
      diff_digest TEXT NOT NULL UNIQUE CHECK (length(diff_digest) = 64),
      response_digest TEXT NOT NULL UNIQUE CHECK (length(response_digest) = 64),
      object_digest TEXT NOT NULL REFERENCES objects(digest),
      synced_at TEXT NOT NULL,
      PRIMARY KEY (baseline_generation_id, candidate_generation_id),
      CHECK (baseline_generation_id <> candidate_generation_id)
    ) WITHOUT ROWID;

    CREATE TABLE IF NOT EXISTS authority_closure_audits (
      report_digest TEXT PRIMARY KEY CHECK (length(report_digest) = 64),
      candidate_generation_id INTEGER NOT NULL REFERENCES generations(generation_id),
      baseline_generation_id INTEGER NOT NULL REFERENCES generations(generation_id),
      algorithm_version TEXT NOT NULL,
      created_at TEXT NOT NULL,
      encoded BLOB NOT NULL
    ) WITHOUT ROWID;

    CREATE TABLE IF NOT EXISTS active_generation (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
      generation_id INTEGER NOT NULL REFERENCES generations(generation_id)
    );

    CREATE INDEX IF NOT EXISTS data_plane_records_taxon_idx ON records(generation_id, record_type, taxon_id, id);
    CREATE INDEX IF NOT EXISTS data_plane_records_reaction_idx ON records(generation_id, record_type, reaction_id, id);
    CREATE INDEX IF NOT EXISTS data_plane_records_protein_idx ON records(generation_id, record_type, protein_id, id);

    CREATE TRIGGER IF NOT EXISTS data_plane_objects_immutable_update BEFORE UPDATE ON objects BEGIN SELECT RAISE(ABORT, 'data-plane objects are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS data_plane_objects_immutable_delete BEFORE DELETE ON objects BEGIN SELECT RAISE(ABORT, 'data-plane objects are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS data_plane_generations_immutable_update BEFORE UPDATE ON generations BEGIN SELECT RAISE(ABORT, 'data-plane generations are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS data_plane_generations_immutable_delete BEFORE DELETE ON generations BEGIN SELECT RAISE(ABORT, 'data-plane generations are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS data_plane_partitions_immutable_update BEFORE UPDATE ON partitions BEGIN SELECT RAISE(ABORT, 'data-plane partitions are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS data_plane_partitions_immutable_delete BEFORE DELETE ON partitions BEGIN SELECT RAISE(ABORT, 'data-plane partitions are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS data_plane_records_immutable_update BEFORE UPDATE ON records BEGIN SELECT RAISE(ABORT, 'data-plane records are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS data_plane_records_immutable_delete BEFORE DELETE ON records BEGIN SELECT RAISE(ABORT, 'data-plane records are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS data_plane_diffs_immutable_update BEFORE UPDATE ON release_diffs BEGIN SELECT RAISE(ABORT, 'data-plane diffs are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS data_plane_diffs_immutable_delete BEFORE DELETE ON release_diffs BEGIN SELECT RAISE(ABORT, 'data-plane diffs are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS data_plane_audits_immutable_update BEFORE UPDATE ON authority_closure_audits BEGIN SELECT RAISE(ABORT, 'data-plane audits are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS data_plane_audits_immutable_delete BEFORE DELETE ON authority_closure_audits BEGIN SELECT RAISE(ABORT, 'data-plane audits are immutable'); END;
    PRAGMA user_version = 2;
`

export function openDataPlaneDatabase(root) {
  return openSecureDatabase(root, 'data-plane.sqlite3', { label: 'data-plane', versions: [0, 2], schema: SCHEMA })
}
