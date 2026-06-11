import { Cron } from "croner";

import type { BookingSlots } from "@api/api.types";
import { fetchAvailableBookingSlots } from "@api/api";
import type { Result } from "@utils/result";
import type { BookingSnapshotRepository } from "@modules/booking-snapshot/booking-snapshot.repository";
import { getContentHash } from "@utils/hash";

type BookingMonitorError =
  | "ErrorJobFetchFailed"
  | "ErrorGettingLastHash"
  | "ErrorCreatingSnapshot";

type BookingCheck = {
  slots: BookingSlots;
  changed: boolean;
  hash: string;
};

export class BookingSnapshotWorker {
  private cron?: Cron;

  constructor(
    private readonly bookingSnapshotRepository: BookingSnapshotRepository,
    private readonly onChanged: (slots: BookingSlots) => Promise<void>,
  ) {}

  async start() {
    this.cron = new Cron("*/10 * * * *", async () => {
      console.log("Cron started");

      const result = await this.job();

      if (!result.ok) {
        return console.error("Background booking check failed:", result);
      }

      if (result.data.changed) {
        console.log("Triggered changed");

        await this.onChanged(result.data.slots);
      }
    });
  }

  async trigger() {
    await this.cron?.trigger();
  }

  stop() {
    this.cron?.stop();
    this.cron = undefined;
  }

  private async job(): Promise<Result<BookingCheck, BookingMonitorError>> {
    const result = await fetchAvailableBookingSlots();

    if (!result.ok) {
      console.error("ErrorJobFetchFailed");

      return { ok: false, error: "ErrorJobFetchFailed" };
    }

    const hash = getContentHash(JSON.stringify(result.data));
    const latestHash = this.bookingSnapshotRepository.getLastSnapshotHash();

    if (!latestHash.ok && latestHash.error !== "ErrorSnapshotNoHashFound") {
      return { ok: false, error: "ErrorGettingLastHash" };
    }

    const previousHash = latestHash.ok ? latestHash.data : undefined;
    const changed = previousHash === undefined || previousHash !== hash;

    if (changed) {
      const createdSnapshot = this.bookingSnapshotRepository.createSnapshot({
        hash,
        raw: JSON.stringify(result.data),
        timeSlots: result.data,
      });

      if (!createdSnapshot.ok) {
        return { ok: false, error: "ErrorCreatingSnapshot" };
      }
    }

    return {
      ok: true,
      data: {
        slots: result.data,
        changed,
        hash,
      },
    };
  }
}
