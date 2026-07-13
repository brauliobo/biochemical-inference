import { DatabaseSync } from 'node:sqlite'
import { join } from 'node:path'

export function openWorkspaceDatabase(root) {
  const database = new DatabaseSync(join(root, 'workspace.sqlite3'))
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = FULL;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS resource_profiles (
      id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS objects (
      digest TEXT PRIMARY KEY,
      bytes INTEGER NOT NULL CHECK (bytes >= 0),
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS experiments (
      experiment_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      latest_revision_id TEXT
    );
    CREATE TABLE IF NOT EXISTS revisions (
      revision_id TEXT PRIMARY KEY,
      experiment_id TEXT NOT NULL REFERENCES experiments(experiment_id),
      ordinal INTEGER NOT NULL CHECK (ordinal > 0),
      parent_revision_id TEXT REFERENCES revisions(revision_id),
      specification_digest TEXT NOT NULL,
      specification_object_digest TEXT NOT NULL REFERENCES objects(digest),
      snapshot_digest TEXT NOT NULL,
      snapshot_object_digest TEXT NOT NULL REFERENCES objects(digest),
      model_digests_json TEXT NOT NULL,
      engine_digests_json TEXT NOT NULL,
      release_ids_json TEXT NOT NULL,
      model_ids_json TEXT NOT NULL,
      taxon_id TEXT NOT NULL,
      tissue_id TEXT,
      resource_profile_id TEXT NOT NULL REFERENCES resource_profiles(id),
      source TEXT NOT NULL CHECK (source IN ('local', 'clone', 'import')),
      specification_json TEXT NOT NULL,
      expected_result_object_digest TEXT REFERENCES objects(digest),
      created_at TEXT NOT NULL,
      UNIQUE (experiment_id, ordinal)
    );
    CREATE TABLE IF NOT EXISTS runs (
      run_id TEXT PRIMARY KEY,
      revision_id TEXT NOT NULL REFERENCES revisions(revision_id),
      identity_version TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS attempts (
      attempt_id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES runs(run_id),
      revision_id TEXT NOT NULL REFERENCES revisions(revision_id),
      attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
      kind TEXT NOT NULL CHECK (kind IN ('initial', 'rerun', 'restart')),
      restart_mode TEXT CHECK (restart_mode IS NULL OR restart_mode = 'from-specification'),
      checkpoint_id TEXT,
      state TEXT NOT NULL CHECK (state IN ('queued', 'running', 'terminal')),
      outcome TEXT,
      resource_profile_id TEXT NOT NULL REFERENCES resource_profiles(id),
      created_at TEXT NOT NULL,
      started_at TEXT,
      completed_at TEXT,
      cancellation_requested INTEGER NOT NULL DEFAULT 0 CHECK (cancellation_requested IN (0, 1)),
      failure_json TEXT,
      result_artifact_id TEXT,
      rerun_verification TEXT NOT NULL DEFAULT 'not-declared',
      UNIQUE (run_id, attempt_number)
    );
    CREATE TABLE IF NOT EXISTS events (
      event_id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL REFERENCES attempts(attempt_id),
      sequence INTEGER NOT NULL CHECK (sequence > 0),
      type TEXT NOT NULL,
      at TEXT NOT NULL,
      data_json TEXT NOT NULL,
      UNIQUE (attempt_id, sequence)
    );
    CREATE TABLE IF NOT EXISTS checkpoints (
      checkpoint_id TEXT PRIMARY KEY,
      run_id TEXT NOT NULL REFERENCES runs(run_id),
      attempt_id TEXT NOT NULL REFERENCES attempts(attempt_id),
      specification_digest TEXT NOT NULL,
      specification_object_digest TEXT NOT NULL REFERENCES objects(digest),
      snapshot_digest TEXT NOT NULL,
      model_digests_json TEXT NOT NULL,
      engine_digests_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS artifacts (
      artifact_id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL REFERENCES attempts(attempt_id),
      name TEXT NOT NULL,
      kind TEXT NOT NULL,
      media_type TEXT NOT NULL,
      digest TEXT NOT NULL REFERENCES objects(digest),
      bytes INTEGER NOT NULL CHECK (bytes >= 0),
      created_at TEXT NOT NULL,
      UNIQUE (attempt_id, name)
    );
    CREATE TABLE IF NOT EXISTS comparisons (
      comparison_id TEXT PRIMARY KEY,
      left_attempt_id TEXT NOT NULL REFERENCES attempts(attempt_id),
      right_attempt_id TEXT NOT NULL REFERENCES attempts(attempt_id),
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reports (
      report_id TEXT PRIMARY KEY,
      attempt_id TEXT NOT NULL REFERENCES attempts(attempt_id),
      payload_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS attempts_state_created_idx ON attempts(state, created_at);
    CREATE INDEX IF NOT EXISTS attempts_outcome_idx ON attempts(outcome);
    CREATE INDEX IF NOT EXISTS revisions_filter_idx ON revisions(taxon_id, tissue_id);

    CREATE TRIGGER IF NOT EXISTS revisions_immutable_update BEFORE UPDATE ON revisions BEGIN SELECT RAISE(ABORT, 'revisions are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS revisions_immutable_delete BEFORE DELETE ON revisions BEGIN SELECT RAISE(ABORT, 'revisions are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS checkpoints_immutable_update BEFORE UPDATE ON checkpoints BEGIN SELECT RAISE(ABORT, 'checkpoints are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS checkpoints_immutable_delete BEFORE DELETE ON checkpoints BEGIN SELECT RAISE(ABORT, 'checkpoints are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS events_immutable_update BEFORE UPDATE ON events BEGIN SELECT RAISE(ABORT, 'events are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS events_immutable_delete BEFORE DELETE ON events BEGIN SELECT RAISE(ABORT, 'events are immutable'); END;
    PRAGMA user_version = 1;
  `)
  return database
}
