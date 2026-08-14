import { ILogger } from './ILogger';
import { ENV } from '../../config/env';

/**
 * Default ILogger implementation, backed by console.*. Behaviorally
 * equivalent to the ad-hoc console.log/console.error calls it replaces —
 * just centralized behind one interface and consistently formatted.
 */
export class ConsoleLogger implements ILogger {
  private format(level: string, message: string, meta?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.log(this.format('INFO', message, meta));
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(this.format('WARN', message, meta));
  }

  error(message: string, error?: unknown, meta?: Record<string, unknown>): void {
    console.error(this.format('ERROR', message, meta), error ?? '');
    if (error instanceof Error && ENV.NODE_ENV === 'development' && error.stack) {
      console.error(error.stack);
    }
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    if (ENV.NODE_ENV === 'development') {
      console.debug(this.format('DEBUG', message, meta));
    }
  }
}
