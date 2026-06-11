export const ResultErrors = {
  MissingConfig: "missing_config",
  RequestFailed: "request_failed",
  InvalidResponse: "invalid_response",
  Unknown: "unknown",
} as const;

export type ResultError = (typeof ResultErrors)[keyof typeof ResultErrors];

export type Result<T, E extends ResultError = ResultError> =
  | { ok: true; data: T }
  | { ok: false; error: E; message?: string };
