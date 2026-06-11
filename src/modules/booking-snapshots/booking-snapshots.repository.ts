import type { Database } from "bun:sqlite";
import { type } from "arktype";

import type { Result } from "../../utils/result";
import {
  SubscriptionSchema,
  SubscriptionSqlSchema,
  type Subscription,
  type Subscriptions,
} from "./subscription.types";

type BookingSnapshotsRepositoryErrors =
  | "SubscriptionAlreadyExists"
  | "ErrorParsingSubscriptionFromSql"
  | "ErrorSqlCreatingSubscription"
  | "ErrorInexistentSubscription"
  | "ErrorSqlRemovingSubscription";

export interface SubscriptionRepository {
  createChatSubscription(
    chatId: number,
  ): Result<Subscription, SubscriptionRepositoryErrors>;
  getChatSubscriptions(): Result<Subscriptions>;
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
        INSERT OR IGNORE INTO chat_subscriptions (chat_id) 
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

  getChatSubscriptions(): Result<Subscriptions> {
    throw new Error("Method not implemented.");
  }

  removeChatSubscription(
    chatId: number,
  ): Result<Subscription, SubscriptionRepositoryErrors> {
    try {
      const statement = this.db.query(`
        DELETE FROM chat_subscriptions
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
