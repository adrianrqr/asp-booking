import { Bot } from "grammy";
import { fetchAvailableBookingSlots } from "./api";
import { BookingMonitor } from "./booking-monitor";
import type { BookingSlots } from "./types";

export class LicenseBookingBot {
  private subscribedChatIds: number[] = [+process.env.NOTIFY_CHAT_ID!];
  private bot = new Bot(process.env.BOT_TOKEN!);
  private bookingMonitor = new BookingMonitor(async (slots) => {
    for (const chatId of this.subscribedChatIds) {
      await this.bot.api.sendMessage(chatId, formatResults(slots));
    }
  });

  constructor() {
    this.bot.command("subscribe", async ({ chatId, reply }) => {
      console.log(`Chat id ${chatId} subscribed`);

      this.subscribedChatIds.push(chatId);

      reply("You've been subscribed!");
    });

    this.bot.command("check", async (ctx) => {
      const result = await fetchAvailableBookingSlots();

      if (!result.ok)
        ctx.reply(
          `Failed to fetch data.\nError:${result.error}\nMessage:${result.message}`,
        );

      if (result.ok) {
        ctx.reply(formatResults(result.data));
      }
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
