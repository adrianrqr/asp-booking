import { LicenseBookingBot } from "./bot";

export const main = async () => {
  await using licenseBookingBot = new LicenseBookingBot();
  await licenseBookingBot.start();
};
