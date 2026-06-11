export type ResultError = string;

export type Result<T, E extends ResultError = ResultError> =
  | { ok: true; data: T }
  | { ok: false; error: E };
