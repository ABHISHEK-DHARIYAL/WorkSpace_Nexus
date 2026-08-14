/**
 * Logging abstraction. Controllers and services depend on this interface,
 * never on `console` directly — swapping in a structured/remote logger later
 * (e.g. pino, Winston, Datadog) means writing one new class, touching zero
 * call sites (Open/Closed Principle).
 */
export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: unknown, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}
