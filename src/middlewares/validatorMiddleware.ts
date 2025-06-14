import { Request, Response, NextFunction } from 'express';
import { GeneralErrorsFactory } from '../factories';

type ValidatorFunction = (data: any) => Promise<{ errors?: string | null }>;

export default function validatorMiddleware(
  validateFunction: ValidatorFunction,
  reqProperty: keyof Request
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const source = req[reqProperty];
      const { errors } = await validateFunction(source || req.body);

      if (errors) {
        return next(
          GeneralErrorsFactory.badRequestErr({ customMessage: errors })
        );
      }

      next();
    } catch (err) {
      next(GeneralErrorsFactory.internalErr({ err }));
    }
  };
}
