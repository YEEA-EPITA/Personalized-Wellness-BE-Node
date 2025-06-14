import { Request, Response, NextFunction } from 'express';
import { GeneralErrorsFactory } from '../factories';

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export default function catchAsync(fn: AsyncHandler) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      next(GeneralErrorsFactory.internalErr({ err }));
    }
  };
}
