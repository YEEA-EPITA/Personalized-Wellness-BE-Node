import AppError from './AppError';

interface GeneralErrorsFactoryOptions {
  customMessage?: string;
  statusCode?: number;
  err?: any;
}

export default class GeneralErrorsFactory {
  static invalidTokenErr({ customMessage }: GeneralErrorsFactoryOptions = {}) {
    return new AppError({
      message: customMessage || 'invalid token',
      err: { type: 'INVALID_TOKEN' },
      statusCode: 400,
    });
  }

  static badRequestErr({ customMessage }: GeneralErrorsFactoryOptions = {}) {
    return new AppError({
      message: customMessage || 'bad request',
      statusCode: 400,
    });
  }

  static notFoundErr({ customMessage }: GeneralErrorsFactoryOptions = {}) {
    return new AppError({
      message: customMessage || 'not found',
      statusCode: 404,
    });
  }

  static internalErr({
    customMessage,
    statusCode,
    err,
  }: GeneralErrorsFactoryOptions = {}) {
    return new AppError({
      message: customMessage || 'Something went wrong',
      statusCode: statusCode || 500,
      err,
    });
  }

  static missingObjectId() {
    return new AppError({
      message: 'ID missing. Please provide an id',
      statusCode: 400,
    });
  }

  static invalidObjectId() {
    return new AppError({
      message: 'ID invalid. Please provide a valid ID',
      statusCode: 400,
    });
  }
}
