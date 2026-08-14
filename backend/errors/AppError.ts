/**
 * Base class for all operational (expected, handled) errors in the app.
 * `isOperational: true` lets the global error handler distinguish "a known,
 * intentional failure" (bad input, missing resource, etc.) from a genuine
 * unhandled bug — the former is safe to show a specific message for, the
 * latter should be logged loudly and given a generic message.
 */
export abstract class AppError extends Error {
  abstract readonly statusCode: number;
  readonly code?: string;
  readonly isOperational = true;

  constructor(message: string, code?: string) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    Error.captureStackTrace?.(this, this.constructor);
  }
}
