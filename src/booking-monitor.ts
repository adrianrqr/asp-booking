import { Cron } from "croner";
import { fetchAvailableBookingSlots } from "./api";
import type { BookingCheck, BookingSlots } from "./types";
import { ResultErrors, type Result } from "./utils";
import { getContentHash } from "./utils/hash";

type BookingMonitorError =
  | typeof ResultErrors.RequestFailed
  | typeof ResultErrors.InvalidResponse
  | typeof ResultErrors.MissingConfig
  | typeof ResultErrors.Unknown;

export class BookingMonitor {
  private job?: Cron;
  private previousHash?: string;

  constructor(
    private readonly onChanged: (slots: BookingSlots) => Promise<void>,
  ) {}

  async start() {
    this.job = new Cron("*/10 * * * *", async () => {
      console.log("Cron running");

      const result = await this.check();

      if (!result.ok) {
        console.error("Background booking check failed:", result);
        return;
      }

      if (result.data.changed) {
        console.log("Triggered changed");

        await this.onChanged(result.data.slots);
      }
    });

    await this.job.trigger();
  }

  stop() {
    this.job?.stop();
    this.job = undefined;
  }

  async check(): Promise<Result<BookingCheck, BookingMonitorError>> {
    const result = await fetchAvailableBookingSlots();

    if (!result.ok) {
      return result;
    }

    const hash = getContentHash(result.data);
    const changed = hash !== this.previousHash;

    this.previousHash = hash;

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
