import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { logger } from '../utils/logger';
import { ENV } from '../config/env';

/**
 * Single place in the app that turns a thrown error into an HTTP response.
 * - AppError subclasses (thrown deliberately by services) map to their
 *   declared statusCode/message/code — this is expected, so it's logged at
 *   `warn` level, not `error`.
 * - Anything else is a genuine bug: logged at `error` level with the full
 *   stack, and the client gets a generic 500 (message not leaked) unless
 *   we're in development, matching the previous inline handler's behavior.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    logger.warn(`${req.method} ${req.originalUrl} -> ${err.statusCode} ${err.message}`);
    return res.status(err.statusCode).json({
      message: err.message,
      ...(err.code ? { code: err.code } : {}),
    });
  }

  const unexpected = err as any;
  logger.error(`Unhandled error on ${req.method} ${req.originalUrl}`, unexpected);
  return res.status(unexpected?.status || 500).json({
    message: unexpected?.message || 'An unexpected error occurred',
    error: ENV.NODE_ENV === 'development' ? unexpected : {},
  });
}
