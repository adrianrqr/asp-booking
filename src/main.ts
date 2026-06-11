import { LicenseBookingBot } from "./bot";
import { Persistence } from "./database";
import { SubscriptionRepositoryLive } from "./modules/subscriptions/subscription.repository";

export const main = async () => {
  using persistence = Persistence.getInstance();

  const subscriptionRepository = new SubscriptionRepositoryLive(
    persistence.getDb(),
  );

  await using licenseBookingBot = new LicenseBookingBot(subscriptionRepository);
  await licenseBookingBot.start();
};
