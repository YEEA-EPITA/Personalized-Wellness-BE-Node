import AppError from './AppError';

interface ErrorOptions {
  customMessage?: string;
}

export default class AuthErrorsFactory {
  static unauthorized({ customMessage }: ErrorOptions = {}) {
    return new AppError({
      message: customMessage || "You're not allowed for this action",
      statusCode: 403,
    });
  }

  static unauthenticated({ customMessage }: ErrorOptions = {}) {
    return new AppError({
      message:
        customMessage ||
        "You're not authenticated for this action. Please login again",
      statusCode: 401,
    });
  }
}
