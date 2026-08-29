export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): { message: string; statusCode: number } {
  if (error instanceof ApiError) {
    return { message: error.message, statusCode: error.statusCode };
  }

  if (error instanceof Error) {
    console.error('Error:', error.message);
    return { message: 'An error occurred', statusCode: 500 };
  }

  console.error('Unknown error:', error);
  return { message: 'An unexpected error occurred', statusCode: 500 };
}

export const errorMessages = {
  INVALID_EMAIL: 'Invalid email format',
  INVALID_PHONE: 'Invalid phone format',
  USER_EXISTS: 'User already exists',
  INVALID_OTP: 'Invalid or expired OTP',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  NOT_FOUND: 'Resource not found',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  INTERNAL_ERROR: 'An internal server error occurred',
};
