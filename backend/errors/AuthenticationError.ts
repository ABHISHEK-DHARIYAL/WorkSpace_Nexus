import { AppError } from './AppError';

export class AuthenticationError extends AppError {
  readonly statusCode = 401;

  constructor(message = 'Unauthorized', code?: string) {
    super(message, code);
  }
}
