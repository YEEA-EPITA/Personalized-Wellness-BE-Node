import { Request, Response, NextFunction } from 'express';
import { GeneralErrorsFactory } from '../factories';
import jwtUtils from '../utils/jwtUtils';

// Extend Express Request to include jwtToken
declare global {
  namespace Express {
    interface Request {
      jwtToken?: any;
    }
  }
}

const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const tokenPrefix = 'Bearer ';

  if (!authHeader || !authHeader.startsWith(tokenPrefix)) {
    return next(GeneralErrorsFactory.invalidTokenErr());
  }

  const token = authHeader.slice(tokenPrefix.length).trim();
  const decoded = jwtUtils.verifyToken({ token });

  if (decoded) {
    req.jwtToken = decoded;
    next();
  } else {
    next(GeneralErrorsFactory.invalidTokenErr());
  }
};

export default authMiddleware;
