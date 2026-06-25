import { BookingSnapshotRepositoryLive } from "@modules/booking-snapshot/booking-snapshot.repository";
import { SubscriptionRepositoryLive } from "@modules/subscriptions/subscription.repository";
import { LicenseBookingBot } from "./bot";
import { Persistence } from "./database";

export const main = async () => {
  using persistence = Persistence.getInstance();

  const subscriptionRepository = new SubscriptionRepositoryLive(
    persistence.getDb(),
  );
  const bookingSnapshotRepository = new BookingSnapshotRepositoryLive(
    persistence.getDb(),
  );

  await using licenseBookingBot = new LicenseBookingBot(
    bookingSnapshotRepository,
    subscriptionRepository,
  );
  await licenseBookingBot.start();
};
