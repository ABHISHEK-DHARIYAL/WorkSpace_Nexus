import { AppError } from './AppError';

export class ValidationError extends AppError {
  readonly statusCode = 400;

  constructor(message = 'Invalid request data', code?: string) {
    super(message, code);
  }
}
