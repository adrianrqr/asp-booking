import { Bot } from "grammy";

import { BookingSnapshotWorker } from "./booking-monitor";
import type { SubscriptionRepository } from "./modules/subscriptions/subscription.repository";
import { fetchAvailableBookingSlots } from "@api/api";
import type { BookingSlots } from "@api/api.types";
import type { BookingSnapshotRepository } from "@modules/booking-snapshot/booking-snapshot.repository";

export class LicenseBookingBot {
  private bot = new Bot(process.env.BOT_TOKEN!);
  private bookingSnapshotWorker?;

  constructor(
    private readonly bookingSnapshotRepository: BookingSnapshotRepository,
    private readonly subscriptionRepository: SubscriptionRepository,
  ) {
    this.bookingSnapshotWorker = new BookingSnapshotWorker(
      bookingSnapshotRepository,
      async (slots) => {
        if (!slots.length) {
          console.log("No available slots, skipping notification.");
          return;
        }

        const result = this.subscriptionRepository.getSubscribedChats();

        if (result.ok) {
          const message = formatResults(slots);

          for (const entries of result.data) {
            await this.bot.api.sendMessage(entries.chatId, message);
          }
        }
      },
    );

    this.bot.command("subscribe", async (ctx) => {
      const result = this.subscriptionRepository.createChatSubscription(
        ctx.chatId,
      );

      if (!result.ok) {
        if (result.error === "SubscriptionAlreadyExists") {
          console.warn(
            `${result.error} | ${ctx.chatId} is already subscribed.`,
          );
          return await ctx.reply("You're already subscribed!");
        } else {
          return console.error(result.error);
        }
      }

      if (result.ok) {
        console.log(`Chat ID ${result.data.chatId} subscribed.`);
        return await ctx.reply("You've been subscribed!");
      }
    });

    this.bot.command("unsubscribe", async (ctx) => {
      const result = this.subscriptionRepository.removeChatSubscription(
        ctx.chatId,
      );

      if (!result.ok) {
        if (result.error === "ErrorInexistentSubscription") {
          console.warn(
            `${result.error} | ${ctx.chatId} tried to unsubscribe without subscription.`,
          );
          return await ctx.reply("You weren't even subscribed.");
        }

        return console.error(result.error);
      }

      if (result.ok) {
        console.log(`Chat ID ${result.data.chatId} has unsubscribed.`);
        return await ctx.reply("You've been unsubscribed.");
      }
    });

    this.bot.command("check", async (ctx) => {
      const result = await fetchAvailableBookingSlots();

      if (!result.ok) {
        console.error("ErrorAspApiFailed", result.error);
        return await ctx.reply("Failed to fetch data.");
      }

      if (result.data.length) {
        return await ctx.reply(formatResults(result.data));
      }

      return await ctx.reply("There's no available dates.");
    });
  }

  async start() {
    await this.bookingSnapshotWorker?.start();
    await this.bookingSnapshotWorker?.trigger();
    await this.bot.start();
  }

  async stop() {
    await this.bot.stop();
    this.bookingSnapshotWorker?.stop();
  }

  async [Symbol.dispose]() {
    await this.stop();
  }
}

const formatResults = (slots: BookingSlots) =>
  slots
    .map((slot, i) => `${i + 1}. Date: ${slot.date} | Slots: ${slot.timeSlots}`)
    .join("\n");
