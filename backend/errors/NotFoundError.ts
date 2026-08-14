import { AppError } from './AppError';

export class NotFoundError extends AppError {
  readonly statusCode = 404;

  constructor(message = 'Resource not found', code?: string) {
    super(message, code);
  }
}
