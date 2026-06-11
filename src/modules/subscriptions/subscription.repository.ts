import type { Database } from "bun:sqlite";
import { type } from "arktype";

import type { Result } from "../../utils/result";
import {
  SubscriptionSchema,
  SubscriptionSqlSchema,
  SubscriptionsSqlSchema,
  type Subscription,
  type Subscriptions,
} from "./subscription.types";

type SubscriptionRepositoryErrors =
  | "SubscriptionAlreadyExists"
  | "ErrorParsingSubscriptionFromSql"
  | "ErrorSqlCreatingSubscription"
  | "ErrorSelectingSubscriptions"
  | "ErrorParsingSubscriptionsFromSql"
  | "UnknownErrorSelectingSubscriptions"
  | "ErrorInexistentSubscription"
  | "ErrorSqlRemovingSubscription";

export interface SubscriptionRepository {
  createChatSubscription(
    chatId: number,
  ): Result<Subscription, SubscriptionRepositoryErrors>;
  getSubscribedChats(): Result<Subscriptions>;
  removeChatSubscription(
    chatId: number,
  ): Result<Subscription, SubscriptionRepositoryErrors>;
}

export class SubscriptionRepositoryLive implements SubscriptionRepository {
  constructor(private readonly db: Database) {}

  createChatSubscription(
    chatId: number,
  ): Result<Subscription, SubscriptionRepositoryErrors> {
    try {
      const statement = this.db.query(`
        INSERT OR IGNORE INTO chat_subscription (chat_id) 
        VALUES ($chat_id)
        RETURNING *
      `);

      const result = statement.get({ chat_id: chatId });

      if (!result) {
        return { ok: false, error: "SubscriptionAlreadyExists" };
      }

      const subscription = SubscriptionSqlSchema(result);

      if (subscription instanceof type.errors) {
        console.error(subscription.summary);
        return { ok: false, error: "ErrorParsingSubscriptionFromSql" };
      }

      return {
        ok: true,
        data: {
          chatId: subscription.chat_id,
          createdAt: subscription.created_at,
        },
      };
    } catch (error) {
      console.error(error);
      return { ok: false, error: "ErrorSqlCreatingSubscription" };
    }
  }

  getSubscribedChats(): Result<Subscriptions> {
    try {
      const result = this.db.query(`SELECT * FROM chat_subscription`).get();

      if (!result) {
        return { ok: false, error: "ErrorSelectingSubscriptions" };
      }

      const subscriptions = SubscriptionsSqlSchema(result);

      if (subscriptions instanceof type.errors) {
        console.error(subscriptions.summary);
        return { ok: false, error: "ErrorParsingSubscriptionsFromSql" };
      }

      return {
        ok: true,
        data: subscriptions.map((subscription) => ({
          chatId: subscription.chat_id,
          createdAt: subscription.created_at,
        })),
      };
    } catch (error) {
      console.error(error);
      return { ok: false, error: "UnknownErrorSelectingSubscriptions" };
    }
  }

  removeChatSubscription(
    chatId: number,
  ): Result<Subscription, SubscriptionRepositoryErrors> {
    try {
      const statement = this.db.query(`
        DELETE FROM chat_subscription
        WHERE chat_id = $chat_id
        RETURNING *
      `);

      const result = statement.get({ chat_id: chatId });

      if (!result) {
        return { ok: false, error: "ErrorInexistentSubscription" };
      }

      const subscription = SubscriptionSqlSchema(result);

      if (subscription instanceof type.errors) {
        console.error(subscription.summary);
        return { ok: false, error: "ErrorParsingSubscriptionFromSql" };
      }

      return {
        ok: true,
        data: {
          chatId: subscription.chat_id,
          createdAt: subscription.created_at,
        },
      };
    } catch (error) {
      console.error(error);
      return { ok: false, error: "ErrorSqlRemovingSubscription" };
    }
  }
}
