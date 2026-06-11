import { type } from "arktype";
import type { Database } from "bun:sqlite";

import type { Result } from "@utils/result";
import {
  BookingSlotSqlSchema,
  BookingSnapshotSqlSchema,
  type BookingSnapshot,
  type BookingSnapshotCreate,
} from "./booking.types";

type BookingSnapshotRepositoryErrors =
  | "ErrorInsertingSnapshot"
  | "ErrorInsertingSlot"
  | "UnknownSnapshotInsertionError"
  | "ErrorParsingInsertedSnapshotFromSql"
  | "ErrorParsingInsertedSlotFromSql"
  | "ErrorSnapshotNoHashFound"
  | "ErrorParsingSnapshotFromSql";

export interface BookingSnapshotRepository {
  createSnapshot(
    bookingSnapshot: BookingSnapshotCreate,
  ): Result<BookingSnapshot, BookingSnapshotRepositoryErrors>;
  getLastSnapshotHash(): Result<
    BookingSnapshot["hash"],
    BookingSnapshotRepositoryErrors
  >;
}

export class BookingSnapshotRepositoryLive implements BookingSnapshotRepository {
  constructor(private readonly db: Database) {}

  createSnapshot(
    bookingSnapshot: BookingSnapshotCreate,
  ): Result<BookingSnapshot, BookingSnapshotRepositoryErrors> {
    try {
      const insertSnapshotStatement = this.db.query(`
        INSERT INTO booking_snapshot (hash, raw)
        VALUES ($hash, $raw)
        RETURNING *
      `);

      const insertSlotStatement = this.db.query(`
        INSERT INTO booking_slot (slots, date, booking_snapshot_id)
        VALUES ($slots, $date, $bookingSnapshotId)
        RETURNING *
      `);

      const insertSnapshot = this.db.transaction(
        (snapshotToInsert: BookingSnapshotCreate) => {
          const snapshotResult = insertSnapshotStatement.get({
            hash: snapshotToInsert.hash,
            raw: snapshotToInsert.raw,
          });

          if (!snapshotResult) {
            throw new Error("ErrorInsertingSnapshot");
          }

          const snapshot = BookingSnapshotSqlSchema(snapshotResult);

          if (snapshot instanceof type.errors) {
            console.error(snapshot.summary);
            throw new Error("ErrorParsingInsertedSnapshotFromSql");
          }

          const timeSlots = snapshotToInsert.timeSlots.map((slotToInsert) => {
            const slotResult = insertSlotStatement.get({
              slots: slotToInsert.timeSlots,
              date: slotToInsert.date,
              bookingSnapshotId: snapshot.id,
            });

            if (!slotResult) {
              throw new Error("ErrorInsertingSlot");
            }

            const slot = BookingSlotSqlSchema(slotResult);

            if (slot instanceof type.errors) {
              console.error(slot.summary);
              throw new Error("ErrorParsingInsertedSlotFromSql");
            }

            return {
              id: slot.id,
              timeSlots: slot.slots,
              date: slot.date,
              bookingSnapshotId: slot.booking_snapshot_id,
            };
          });

          return {
            id: snapshot.id,
            hash: snapshot.hash,
            raw: snapshot.raw,
            createdAt: snapshot.created_at,
            timeSlots,
          };
        },
      );

      return {
        ok: true,
        data: insertSnapshot(bookingSnapshot),
      };
    } catch (error) {
      console.error(error);

      if (error instanceof Error) {
        if (error.message === "ErrorInsertingSnapshot") {
          return { ok: false, error: "ErrorInsertingSnapshot" };
        }

        if (error.message === "ErrorInsertingSlot") {
          return { ok: false, error: "ErrorInsertingSlot" };
        }

        if (error.message === "ErrorParsingInsertedSnapshotFromSql") {
          return { ok: false, error: "ErrorParsingInsertedSnapshotFromSql" };
        }

        if (error.message === "ErrorParsingInsertedSlotFromSql") {
          return { ok: false, error: "ErrorParsingInsertedSlotFromSql" };
        }
      }

      return { ok: false, error: "UnknownSnapshotInsertionError" };
    }
  }

  getLastSnapshotHash(): Result<
    BookingSnapshot["hash"],
    BookingSnapshotRepositoryErrors
  > {
    try {
      const result = this.db
        .query(
          `
          SELECT hash FROM booking_snapshot
          ORDER BY created_at DESC, id DESC
          LIMIT 1
        `,
        )
        .get();

      if (!result) {
        return { ok: false, error: "ErrorSnapshotNoHashFound" };
      }

      const parsed = type({ hash: "string" })(result);

      if (parsed instanceof type.errors) {
        console.error(parsed.summary);
        return { ok: false, error: "ErrorParsingSnapshotFromSql" };
      }

      return {
        ok: true,
        data: parsed.hash,
      };
    } catch (error) {
      console.error(error);
      return { ok: false, error: "UnknownSnapshotInsertionError" };
    }
  }
}
