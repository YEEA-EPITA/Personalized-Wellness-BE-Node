export default class AppError extends Error {
  public statusCode: number;
  public status: string;
  public isKnown: boolean;
  public internalErr: any;

  constructor({
    message = 'An error occurred',
    statusCode = 500,
    err = null,
  }: {
    message?: string;
    statusCode?: number;
    err?: any;
  } = {}) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isKnown = true;
    this.internalErr = err;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}
