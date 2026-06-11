import { type } from "arktype";

import type { Result } from "@utils/result";
import { BookingSlotsSchema, type BookingSlots } from "./api.types";

type FetchAvailableBookingSlotsError =
  | "ErrorMissingConfigApiUrl"
  | "ErrorRequestFailedAspUrl"
  | "ErrorInvalidResponseAspUrl"
  | "ErrorUnknownAspUrl";

export const fetchAvailableBookingSlots = async (): Promise<
  Result<BookingSlots, FetchAvailableBookingSlotsError>
> => {
  const url = process.env.ASP_URL;

  if (!url) {
    return {
      ok: false,
      error: "ErrorMissingConfigApiUrl",
    };
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return {
        ok: false,
        error: "ErrorRequestFailedAspUrl",
      };
    }

    const json = await response.json();
    const result = BookingSlotsSchema(json);

    if (result instanceof type.errors) {
      return {
        ok: false,
        error: "ErrorInvalidResponseAspUrl",
      };
    }

    return { ok: true, data: result };
  } catch (error) {
    return {
      ok: false,
      error: "ErrorUnknownAspUrl",
    };
  }
};
