import { AppError } from './AppError';

export class AuthorizationError extends AppError {
  readonly statusCode = 403;

  constructor(message = 'Forbidden', code?: string) {
    super(message, code);
  }
}
