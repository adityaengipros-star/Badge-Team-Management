import { db } from "./db";

// Idempotent schema creation. Safe to run on every boot.
export function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            TEXT PRIMARY KEY,
      name          TEXT NOT NULL,
      init          TEXT NOT NULL,
      color         TEXT NOT NULL,
      presence      TEXT NOT NULL DEFAULT 'offline',
      email         TEXT,
      password_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      prefix      TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      color       TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'active',
      seq         INTEGER NOT NULL DEFAULT 100,
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_members (
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (project_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id          TEXT PRIMARY KEY,
      project_id  TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title       TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
      status      TEXT NOT NULL DEFAULT 'todo',
      priority    TEXT NOT NULL DEFAULT 'medium',
      type        TEXT NOT NULL DEFAULT 'Development',
      due         TEXT NOT NULL DEFAULT '',
      overdue     INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_labels (
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      label   TEXT NOT NULL,
      PRIMARY KEY (task_id, label)
    );

    CREATE TABLE IF NOT EXISTS activity (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      action      TEXT NOT NULL,
      target      TEXT NOT NULL,
      extra       TEXT,
      from_status TEXT,
      to_status   TEXT,
      created_at  TEXT NOT NULL
    );

    -- Present now for Phase 3 (comments), no endpoints wired yet.
    CREATE TABLE IF NOT EXISTS comments (
      id         TEXT PRIMARY KEY,
      task_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body       TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    -- Indexes on the fields we filter/sort/search by.
    CREATE INDEX IF NOT EXISTS idx_tasks_status    ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_assignee  ON tasks(assignee_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_project   ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority  ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_tasks_updated   ON tasks(updated_at);
    CREATE INDEX IF NOT EXISTS idx_labels_task     ON task_labels(task_id);
    CREATE INDEX IF NOT EXISTS idx_labels_label    ON task_labels(label);
    CREATE INDEX IF NOT EXISTS idx_activity_created ON activity(created_at);
    CREATE INDEX IF NOT EXISTS idx_comments_task   ON comments(task_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
  `);

  // Backfill columns for databases created before Phase 3 (auth).
  addColumnIfMissing("users", "email", "TEXT");
  addColumnIfMissing("users", "password_hash", "TEXT");

  // Unique email (nulls allowed) so logins are unambiguous.
  db.exec("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email) WHERE email IS NOT NULL;");

  // Chat (Phase 4): channels + DMs share one table; DMs are kind='dm'.
  db.exec(`
    CREATE TABLE IF NOT EXISTS channels (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      kind        TEXT NOT NULL DEFAULT 'channel',
      created_at  TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS channel_members (
      channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      PRIMARY KEY (channel_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id         TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
      user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body       TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(channel_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_chan_members_user ON channel_members(user_id);
  `);
}

function addColumnIfMissing(table: string, column: string, type: string) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type};`);
  }
}

// Allow running directly: `npm run migrate`
if (require.main === module) {
  migrate();
  console.log("✓ migrated schema");
}
