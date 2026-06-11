import { type } from "arktype";

export const SubscriptionSqlSchema = type({
  chat_id: "number",
  created_at: "string",
});

export const SubscriptionsSqlSchema = SubscriptionSqlSchema.array();

export const SubscriptionSchema = type({
  chatId: "number",
  createdAt: "string",
});

export const SubscriptionsSchema = SubscriptionSchema.array();

export type Subscription = typeof SubscriptionSchema.infer;
export type Subscriptions = typeof SubscriptionsSchema.infer;
