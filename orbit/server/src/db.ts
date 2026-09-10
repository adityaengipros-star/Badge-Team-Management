import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const DB_PATH = process.env.DATABASE_PATH || "./data/orbit.db";

mkdirSync(dirname(DB_PATH), { recursive: true });

export const db = new Database(DB_PATH);

// Pragmas tuned for a small single-instance box (2 GB RAM):
// - WAL: better read/write concurrency, fewer fsyncs
// - synchronous NORMAL: safe with WAL, much faster than FULL
// - foreign_keys: enforce referential integrity
// - cache_size negative = KB; -8000 ≈ 8 MB page cache (modest, plenty here)
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("foreign_keys = ON");
db.pragma("cache_size = -8000");

// The single (no-auth-yet) user acting on the system.
export const CURRENT_USER_ID = "u1";
