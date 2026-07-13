import { DatabaseSync } from 'node:sqlite'
import { join } from 'node:path'

export function openPhysiologyDatabase(root) {
  const database = new DatabaseSync(join(root, 'physiology.sqlite3'))
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = FULL;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS trust_keys (
      key_id TEXT PRIMARY KEY,
      algorithm TEXT NOT NULL CHECK (algorithm = 'Ed25519'),
      publisher TEXT NOT NULL,
      public_key_spki_base64 TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('trusted', 'revoked')),
      created_at TEXT NOT NULL,
      revoked_at TEXT
    );
    CREATE TABLE IF NOT EXISTS objects (
      digest TEXT PRIMARY KEY,
      bytes INTEGER NOT NULL CHECK (bytes > 0),
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS packages (
      package_digest TEXT PRIMARY KEY REFERENCES objects(digest),
      plugin_id TEXT NOT NULL,
      model_descriptor_digest TEXT NOT NULL,
      coupling_descriptor_digest TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      model_json TEXT NOT NULL,
      coupling_json TEXT NOT NULL,
      process_content BLOB,
      installed_at TEXT NOT NULL,
      built_in INTEGER NOT NULL CHECK (built_in IN (0, 1)),
      UNIQUE (plugin_id, package_digest)
    );
    CREATE TABLE IF NOT EXISTS conformance_results (
      package_digest TEXT PRIMARY KEY REFERENCES packages(package_digest),
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS couplings (
      coupling_digest TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS physiology_runs (
      run_digest TEXT PRIMARY KEY,
      coupling_digest TEXT NOT NULL REFERENCES couplings(coupling_digest),
      payload_json TEXT NOT NULL,
      completed_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS packages_plugin_idx ON packages(plugin_id, installed_at);
    CREATE INDEX IF NOT EXISTS runs_coupling_idx ON physiology_runs(coupling_digest, completed_at);

    CREATE TRIGGER IF NOT EXISTS packages_immutable_update BEFORE UPDATE ON packages BEGIN SELECT RAISE(ABORT, 'physiology packages are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS packages_immutable_delete BEFORE DELETE ON packages BEGIN SELECT RAISE(ABORT, 'physiology packages are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS couplings_immutable_update BEFORE UPDATE ON couplings BEGIN SELECT RAISE(ABORT, 'physiology couplings are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS couplings_immutable_delete BEFORE DELETE ON couplings BEGIN SELECT RAISE(ABORT, 'physiology couplings are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS physiology_runs_immutable_update BEFORE UPDATE ON physiology_runs BEGIN SELECT RAISE(ABORT, 'physiology runs are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS physiology_runs_immutable_delete BEFORE DELETE ON physiology_runs BEGIN SELECT RAISE(ABORT, 'physiology runs are immutable'); END;
    PRAGMA user_version = 1;
  `)
  return database
}
