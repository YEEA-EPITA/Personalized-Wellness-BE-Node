import { Request, Response, NextFunction } from 'express';
import { AuthErrors } from '../factories';

type CustomFn = (req: Request) => boolean | Promise<boolean>;

interface AccessMiddlewareOptions {
  customFn?: CustomFn;
}

const accessMiddleware =
  ({ customFn }: AccessMiddlewareOptions) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const isAllowed = !customFn ? true : await customFn(req);
      if (!isAllowed) return next(AuthErrors.unauthorized());

      next();
    } catch (err) {
      next(err);
    }
  };

export default accessMiddleware;
