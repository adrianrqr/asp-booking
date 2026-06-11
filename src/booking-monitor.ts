import { Cron } from "croner";
import { fetchAvailableBookingSlots } from "./api";
import type { BookingCheck, BookingSlots } from "./types";
import { StateStore } from "./state-store";
import { ResultErrors, type Result } from "./utils";
import { getContentHash } from "./utils/hash";

type BookingMonitorError =
  | typeof ResultErrors.RequestFailed
  | typeof ResultErrors.InvalidResponse
  | typeof ResultErrors.MissingConfig
  | typeof ResultErrors.Unknown;

export class BookingMonitor {
  private job?: Cron;

  constructor(
    private readonly onChanged: (slots: BookingSlots) => Promise<void>,
    private readonly stateStore = new StateStore(),
  ) {}

  //for debug "*/20 * * * * *" is 20seconds"*/10 * * * *"
  async start() {
    this.job = new Cron("*/20 * * * * *", async () => {
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
    this.stateStore.close();
  }

  async check(): Promise<Result<BookingCheck, BookingMonitorError>> {
    const result = await fetchAvailableBookingSlots();

    if (!result.ok) {
      return result;
    }

    const hash = getContentHash(result.data);
    const previousHash = this.stateStore.getBookingSlotsHash();

    this.stateStore.saveBookingSlotsHash(hash);

    return {
      ok: true,
      data: {
        slots: result.data,
        changed: previousHash !== undefined && hash !== previousHash,
        hash,
      },
    };
  }
}
