import { Database } from "bun:sqlite";
import { dirname } from "node:path";
import { mkdirSync } from "node:fs";

const DEFAULT_DB_PATH = "./data/app.sqlite";
const BOOKING_SLOTS_HASH_KEY = "booking_slots_hash";

export class StateStore {
  private readonly db: Database;

  constructor(dbPath = process.env.DB_PATH ?? DEFAULT_DB_PATH) {
    mkdirSync(dirname(dbPath), { recursive: true });

    this.db = new Database(dbPath);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  getBookingSlotsHash(): string | undefined {
    const row = this.db
      .query<{ value: string }, [string]>(
        "SELECT value FROM app_state WHERE key = ? LIMIT 1",
      )
      .get(BOOKING_SLOTS_HASH_KEY);

    return row?.value;
  }

  saveBookingSlotsHash(hash: string): void {
    this.db
      .query(
        `INSERT INTO app_state (key, value, updated_at)
         VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET
           value = excluded.value,
           updated_at = CURRENT_TIMESTAMP`,
      )
      .run(BOOKING_SLOTS_HASH_KEY, hash);
  }

  close(): void {
    this.db.close();
  }
}
