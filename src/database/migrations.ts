export const createBookingSnapshotTable = `
  CREATE TABLE IF NOT EXISTS booking_snapshot (
    id INTEGER PRIMARY KEY UNIQUE,
    hash TEXT NOT NULL,
    raw TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

export const createBookingSlotTable = `
  CREATE TABLE IF NOT EXISTS booking_slot (
    id INTEGER PRIMARY KEY UNIQUE,
    slots INTEGER NOT NULL,
    date TEXT NOT NULL,
    booking_snapshot_id INTEGER NOT NULL,
    FOREIGN KEY (booking_snapshot_id) REFERENCES booking_snapshot(id)
  );
`;

export const createChatSubscriptionTable = `
  CREATE TABLE IF NOT EXISTS chat_subscription (
    chat_id INTEGER PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;
