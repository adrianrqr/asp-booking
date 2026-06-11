import { Bot } from "grammy";
import { fetchAvailableBookingSlots } from "./api";
import { BookingMonitor } from "./booking-monitor";
import { StateStore } from "./state-store";
import type { BookingSlots } from "./types";

export class LicenseBookingBot {
  private stateStore = new StateStore();
  private bot = new Bot(process.env.BOT_TOKEN!);
  private bookingMonitor = new BookingMonitor(async (slots) => {
    for (const chatId of this.stateStore.getSubscribedChatIds()) {
      await this.bot.api.sendMessage(chatId, formatResults(slots));
    }
  }, this.stateStore);

  constructor() {
    const defaultNotifyChatId = Number(process.env.NOTIFY_CHAT_ID);

    if (Number.isSafeInteger(defaultNotifyChatId)) {
      this.stateStore.subscribeUser(defaultNotifyChatId);
    }

    this.bot.command("subscribe", async (ctx) => {
      console.log(`Chat id ${ctx.chatId} subscribed`);

      this.stateStore.subscribeUser(ctx.chatId);

      await ctx.reply("You've been subscribed!");
    });

    this.bot.command("unsubscribe", async (ctx) => {
      console.log(`Chat id ${ctx.chatId} unsubscribed`);

      const wasSubscribed = this.stateStore.unsubscribeUser(ctx.chatId);

      await ctx.reply(
        wasSubscribed
          ? "You've been unsubscribed."
          : "You were not subscribed.",
      );
    });

    this.bot.command("check", async (ctx) => {
      const result = await fetchAvailableBookingSlots();

      if (!result.ok) {
        await ctx.reply(
          `Failed to fetch data.\nError:${result.error}\nMessage:${result.message}`,
        );
        return;
      }

      await ctx.reply(formatResults(result.data));
    });
  }

  async start() {
    await this.bookingMonitor.start();
    await this.bot.start();
  }

  async stop() {
    await this.bot.stop();
    this.bookingMonitor.stop();
  }

  async [Symbol.dispose]() {
    await this.stop();
  }
}

const formatResults = (slots: BookingSlots) =>
  slots
    .map((slot, i) => `${i + 1}. Date: ${slot.date} | Slots: ${slot.timeSlots}`)
    .join("\n");
