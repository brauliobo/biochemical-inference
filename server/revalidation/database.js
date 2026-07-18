import { DatabaseSync } from 'node:sqlite'
import { join } from 'node:path'

export function acquireRevalidationEngineRootLock(root) {
  const lock = new DatabaseSync(join(root, 'engine-owner.sqlite3'))
  try {
    lock.exec(`
      PRAGMA busy_timeout = 0;
      PRAGMA journal_mode = DELETE;
      CREATE TABLE IF NOT EXISTS owner (singleton INTEGER PRIMARY KEY CHECK (singleton = 1), pid INTEGER NOT NULL, acquired_at TEXT NOT NULL);
      BEGIN EXCLUSIVE;
      INSERT INTO owner (singleton, pid, acquired_at) VALUES (1, ${process.pid}, '${new Date().toISOString()}')
        ON CONFLICT(singleton) DO UPDATE SET pid = excluded.pid, acquired_at = excluded.acquired_at;
    `)
  } catch (error) {
    lock.close()
    throw new Error('Revalidation engine root already has an exclusive owner; a second process cannot recover leases or clear reservations.', { cause: error })
  }
  let released = false
  return Object.freeze({
    release() {
      if (released) return
      lock.exec('ROLLBACK')
      lock.close()
      released = true
    }
  })
}

export function openRevalidationDatabase(root) {
  const database = new DatabaseSync(join(root, 'revalidation.sqlite3'))
  database.exec(`
    PRAGMA foreign_keys = ON;
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = FULL;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS objects (
      digest TEXT PRIMARY KEY,
      bytes INTEGER NOT NULL CHECK (bytes >= 0),
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS campaign_specs (
      campaign_id TEXT PRIMARY KEY,
      specification_digest TEXT NOT NULL UNIQUE REFERENCES objects(digest),
      specification_json TEXT NOT NULL,
      producer_plan_digest TEXT NOT NULL REFERENCES objects(digest),
      dependency_snapshot_digest TEXT NOT NULL REFERENCES objects(digest),
      change_set_digest TEXT NOT NULL REFERENCES objects(digest),
      impact_policy_digest TEXT NOT NULL REFERENCES objects(digest),
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS campaigns (
      campaign_id TEXT PRIMARY KEY REFERENCES campaign_specs(campaign_id),
      state TEXT NOT NULL CHECK (state IN ('active', 'terminal')),
      cancellation_requested INTEGER NOT NULL DEFAULT 0 CHECK (cancellation_requested IN (0, 1)),
      projection_revision INTEGER NOT NULL DEFAULT 0 CHECK (projection_revision >= 0),
      created_at TEXT NOT NULL,
      completed_at TEXT
    );
    CREATE TABLE IF NOT EXISTS campaign_inputs (
      campaign_id TEXT NOT NULL REFERENCES campaign_specs(campaign_id),
      name TEXT NOT NULL,
      digest TEXT NOT NULL REFERENCES objects(digest),
      bytes INTEGER NOT NULL CHECK (bytes >= 0),
      media_type TEXT NOT NULL,
      PRIMARY KEY (campaign_id, name)
    );
    CREATE TABLE IF NOT EXISTS work_items (
      work_id TEXT NOT NULL,
      campaign_id TEXT NOT NULL REFERENCES campaign_specs(campaign_id),
      ordinal INTEGER NOT NULL CHECK (ordinal >= 0),
      payload_json TEXT NOT NULL,
      state TEXT NOT NULL CHECK (state IN ('queued', 'leased', 'running', 'terminal')),
      attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
      cancellation_requested INTEGER NOT NULL DEFAULT 0 CHECK (cancellation_requested IN (0, 1)),
      available_at TEXT NOT NULL,
      current_attempt_id TEXT,
      outcome TEXT CHECK (outcome IS NULL OR outcome IN ('succeeded', 'failed', 'cancelled', 'resource-exhausted')),
      failure_json TEXT,
      accepted_result_id TEXT,
      completed_at TEXT,
      PRIMARY KEY (campaign_id, work_id),
      UNIQUE (campaign_id, ordinal)
    );
    CREATE TABLE IF NOT EXISTS attempts (
      attempt_id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL REFERENCES campaign_specs(campaign_id),
      work_id TEXT NOT NULL,
      attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
      state TEXT NOT NULL CHECK (state IN ('leased', 'running', 'terminal')),
      execution_mode TEXT NOT NULL CHECK (execution_mode IN ('isolated-worker', 'inline-evidence-only', 'unrecorded')),
      lease_owner TEXT NOT NULL,
      lease_expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL,
      started_at TEXT,
      completed_at TEXT,
      peak_rss_bytes INTEGER CHECK (peak_rss_bytes IS NULL OR peak_rss_bytes >= 0),
      runtime_ms INTEGER CHECK (runtime_ms IS NULL OR runtime_ms >= 0),
      outcome TEXT CHECK (outcome IS NULL OR outcome IN ('succeeded', 'failed', 'cancelled', 'resource-exhausted')),
      failure_json TEXT,
      FOREIGN KEY (campaign_id, work_id) REFERENCES work_items(campaign_id, work_id),
      UNIQUE (campaign_id, work_id, attempt_number)
    );
    CREATE TABLE IF NOT EXISTS accepted_results (
      result_id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL REFERENCES campaign_specs(campaign_id),
      work_id TEXT NOT NULL,
      accepted_attempt_id TEXT NOT NULL REFERENCES attempts(attempt_id),
      artifact_digest TEXT NOT NULL REFERENCES objects(digest),
      artifact_bytes INTEGER NOT NULL CHECK (artifact_bytes >= 0),
      result_json TEXT NOT NULL,
      execution_mode TEXT NOT NULL CHECK (execution_mode IN ('isolated-worker', 'inline-evidence-only', 'unrecorded')),
      peak_rss_bytes INTEGER CHECK (peak_rss_bytes IS NULL OR peak_rss_bytes >= 0),
      runtime_ms INTEGER CHECK (runtime_ms IS NULL OR runtime_ms >= 0),
      accepted_at TEXT NOT NULL,
      FOREIGN KEY (campaign_id, work_id) REFERENCES work_items(campaign_id, work_id),
      UNIQUE (campaign_id, work_id)
    );
    CREATE TABLE IF NOT EXISTS checkpoints (
      checkpoint_id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL REFERENCES campaign_specs(campaign_id),
      work_id TEXT NOT NULL,
      attempt_id TEXT NOT NULL REFERENCES attempts(attempt_id),
      compatibility_id TEXT NOT NULL,
      state_digest TEXT NOT NULL REFERENCES objects(digest),
      checkpoint_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (campaign_id, work_id) REFERENCES work_items(campaign_id, work_id),
      UNIQUE (campaign_id, work_id, checkpoint_id)
    );
    CREATE TABLE IF NOT EXISTS storage_reservations (
      reservation_id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL REFERENCES campaign_specs(campaign_id),
      bytes INTEGER NOT NULL CHECK (bytes >= 0)
    );
    CREATE TABLE IF NOT EXISTS producer_campaigns (
      local_campaign_id TEXT PRIMARY KEY REFERENCES campaign_specs(campaign_id),
      producer_campaign_id TEXT NOT NULL UNIQUE,
      producer_plan_id TEXT NOT NULL,
      campaign_json TEXT NOT NULL,
      receipt_json TEXT NOT NULL,
      event_sequence INTEGER NOT NULL CHECK (event_sequence > 0),
      event_digest TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS producer_outcome_receipts (
      local_campaign_id TEXT NOT NULL,
      work_id TEXT NOT NULL,
      outcome_id TEXT NOT NULL UNIQUE,
      request_json TEXT NOT NULL,
      receipt_json TEXT NOT NULL,
      event_sequence INTEGER NOT NULL CHECK (event_sequence > 0),
      event_digest TEXT NOT NULL UNIQUE,
      PRIMARY KEY (local_campaign_id, work_id),
      FOREIGN KEY (local_campaign_id, work_id) REFERENCES work_items(campaign_id, work_id)
    );
    CREATE TABLE IF NOT EXISTS producer_events (
      sequence INTEGER PRIMARY KEY CHECK (sequence > 0),
      event_digest TEXT NOT NULL UNIQUE,
      event_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS producer_head_pins (
      local_campaign_id TEXT NOT NULL REFERENCES producer_campaigns(local_campaign_id),
      sequence INTEGER NOT NULL CHECK (sequence > 0),
      digest TEXT NOT NULL,
      pinned_at TEXT NOT NULL,
      PRIMARY KEY (local_campaign_id, sequence),
      UNIQUE (local_campaign_id, digest)
    );
    CREATE INDEX IF NOT EXISTS work_queue_idx ON work_items(state, available_at, campaign_id, ordinal);
    CREATE INDEX IF NOT EXISTS attempts_lease_idx ON attempts(state, lease_expires_at);
    CREATE INDEX IF NOT EXISTS checkpoints_work_idx ON checkpoints(work_id, created_at, checkpoint_id);

    CREATE TRIGGER IF NOT EXISTS campaign_specs_immutable_update BEFORE UPDATE ON campaign_specs BEGIN SELECT RAISE(ABORT, 'campaign specifications are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS campaign_specs_immutable_delete BEFORE DELETE ON campaign_specs BEGIN SELECT RAISE(ABORT, 'campaign specifications are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS campaign_inputs_immutable_update BEFORE UPDATE ON campaign_inputs BEGIN SELECT RAISE(ABORT, 'campaign inputs are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS campaign_inputs_immutable_delete BEFORE DELETE ON campaign_inputs BEGIN SELECT RAISE(ABORT, 'campaign inputs are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS accepted_results_immutable_update BEFORE UPDATE ON accepted_results BEGIN SELECT RAISE(ABORT, 'accepted results are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS accepted_results_immutable_delete BEFORE DELETE ON accepted_results BEGIN SELECT RAISE(ABORT, 'accepted results are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS checkpoints_immutable_update BEFORE UPDATE ON checkpoints BEGIN SELECT RAISE(ABORT, 'checkpoints are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS checkpoints_immutable_delete BEFORE DELETE ON checkpoints BEGIN SELECT RAISE(ABORT, 'checkpoints are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS producer_campaigns_immutable_update BEFORE UPDATE ON producer_campaigns BEGIN SELECT RAISE(ABORT, 'producer campaigns are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS producer_campaigns_immutable_delete BEFORE DELETE ON producer_campaigns BEGIN SELECT RAISE(ABORT, 'producer campaigns are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS producer_outcome_receipts_immutable_update BEFORE UPDATE ON producer_outcome_receipts BEGIN SELECT RAISE(ABORT, 'producer outcome receipts are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS producer_outcome_receipts_immutable_delete BEFORE DELETE ON producer_outcome_receipts BEGIN SELECT RAISE(ABORT, 'producer outcome receipts are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS producer_events_immutable_update BEFORE UPDATE ON producer_events BEGIN SELECT RAISE(ABORT, 'producer events are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS producer_events_immutable_delete BEFORE DELETE ON producer_events BEGIN SELECT RAISE(ABORT, 'producer events are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS producer_head_pins_immutable_update BEFORE UPDATE ON producer_head_pins BEGIN SELECT RAISE(ABORT, 'producer head pins are immutable'); END;
    CREATE TRIGGER IF NOT EXISTS producer_head_pins_immutable_delete BEFORE DELETE ON producer_head_pins BEGIN SELECT RAISE(ABORT, 'producer head pins are immutable'); END;
  `)
  const attemptColumns = new Set(database.prepare('PRAGMA table_info(attempts)').all().map((column) => column.name))
  if (!attemptColumns.has('execution_mode')) database.exec("ALTER TABLE attempts ADD COLUMN execution_mode TEXT NOT NULL DEFAULT 'unrecorded' CHECK (execution_mode IN ('isolated-worker', 'inline-evidence-only', 'unrecorded'))")
  const resultColumns = new Set(database.prepare('PRAGMA table_info(accepted_results)').all().map((column) => column.name))
  if (!resultColumns.has('execution_mode')) database.exec("ALTER TABLE accepted_results ADD COLUMN execution_mode TEXT NOT NULL DEFAULT 'unrecorded' CHECK (execution_mode IN ('isolated-worker', 'inline-evidence-only', 'unrecorded'))")
  if (!resultColumns.has('peak_rss_bytes')) database.exec('ALTER TABLE accepted_results ADD COLUMN peak_rss_bytes INTEGER CHECK (peak_rss_bytes IS NULL OR peak_rss_bytes >= 0)')
  if (!resultColumns.has('runtime_ms')) database.exec('ALTER TABLE accepted_results ADD COLUMN runtime_ms INTEGER CHECK (runtime_ms IS NULL OR runtime_ms >= 0)')
  if (!resultColumns.has('execution_mode') || !resultColumns.has('peak_rss_bytes') || !resultColumns.has('runtime_ms')) {
    database.exec(`
      BEGIN IMMEDIATE;
      DROP TRIGGER accepted_results_immutable_update;
      UPDATE accepted_results SET
        peak_rss_bytes = (SELECT peak_rss_bytes FROM attempts WHERE attempts.attempt_id = accepted_results.accepted_attempt_id),
        runtime_ms = (SELECT runtime_ms FROM attempts WHERE attempts.attempt_id = accepted_results.accepted_attempt_id);
      CREATE TRIGGER accepted_results_immutable_update BEFORE UPDATE ON accepted_results BEGIN SELECT RAISE(ABORT, 'accepted results are immutable'); END;
      COMMIT;
    `)
  }
  database.exec('PRAGMA user_version = 4')
  return database
}

export function revalidationTransaction(database, action) {
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
