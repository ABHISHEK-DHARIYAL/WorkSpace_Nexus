import { ILogger } from './ILogger';
import { ConsoleLogger } from './ConsoleLogger';

export type { ILogger };

// Consumers import this pre-wired instance and depend only on ILogger's shape.
export const logger: ILogger = new ConsoleLogger();
