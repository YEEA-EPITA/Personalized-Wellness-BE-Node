import { NextFunction, Request, Response } from 'express';
import { AppError } from '../factories';

export default function errorHandler(
  data: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!(data instanceof AppError)) {
    return next(data);
  }

  data.statusCode = data.statusCode || 500;
  data.status = data.status ?? 'error';

  data.message =
    data.statusCode === 500 ? 'Something went wrong' : data.message;

  const errData = {
    statusCode: data.statusCode,
    message: data.message,
    err: data.internalErr?.type ? data.internalErr : undefined,
  };

  next(errData);
}
