import { Database } from "bun:sqlite";

import {
  createBookingSlotTable,
  createBookingSnapshotTable,
  createChatSubscriptionTable,
} from "./migrations";

export class Persistence {
  private static instance: Persistence | null = null;
  private db: Database;

  private constructor() {
    this.db = new Database(process.env.DB_PATH!, { strict: true });
    this.db.run("PRAGMA journal_mode = WAL;");
    this.db.run("PRAGMA foreign_keys = ON;");

    this.runMigrations();
  }

  static getInstance(): Persistence {
    if (Persistence.instance === null) {
      Persistence.instance = new this();
    }

    return Persistence.instance;
  }

  getDb() {
    return this.db;
  }

  private runMigrations() {
    this.db.run(createBookingSnapshotTable);
    this.db.run(createBookingSlotTable);
    this.db.run(createChatSubscriptionTable);
  }

  private stop() {
    this.db.close();
  }

  [Symbol.dispose]() {
    this.stop();
  }
}
