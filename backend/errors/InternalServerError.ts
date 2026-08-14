import { AppError } from './AppError';

export class InternalServerError extends AppError {
  readonly statusCode = 500;

  constructor(message = 'An unexpected error occurred', code?: string) {
    super(message, code);
  }
}
