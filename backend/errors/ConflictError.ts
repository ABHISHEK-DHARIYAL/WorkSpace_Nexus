import { AppError } from './AppError';

export class ConflictError extends AppError {
  readonly statusCode = 409;

  constructor(message = 'Resource conflict', code?: string) {
    super(message, code);
  }
}
