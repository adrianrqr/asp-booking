import { type as arkType } from "arktype";
import { BookingSlotsSchema, type BookingSlots } from "./types";
import { ResultErrors, type Result } from "./utils";

type FetchAvailableBookingSlotsError =
  | typeof ResultErrors.MissingConfig
  | typeof ResultErrors.RequestFailed
  | typeof ResultErrors.InvalidResponse
  | typeof ResultErrors.Unknown;

export const fetchAvailableBookingSlots = async (): Promise<
  Result<BookingSlots, FetchAvailableBookingSlotsError>
> => {
  const url = process.env.ASP_URL;

  if (!url) {
    return {
      ok: false,
      error: ResultErrors.MissingConfig,
      message: "ASP_URL is not configured",
    };
  }

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return {
        ok: false,
        error: ResultErrors.RequestFailed,
        message: `ASP API request failed: ${response.status} ${response.statusText}`,
      };
    }

    const json = await response.json();
    const result = BookingSlotsSchema(json);

    if (result instanceof arkType.errors) {
      return {
        ok: false,
        error: ResultErrors.InvalidResponse,
        message: result.summary,
      };
    }

    return { ok: true, data: result };
  } catch (error) {
    return {
      ok: false,
      error: ResultErrors.Unknown,
      message: Error.isError(error) ? error.message : String(error),
    };
  }
};
