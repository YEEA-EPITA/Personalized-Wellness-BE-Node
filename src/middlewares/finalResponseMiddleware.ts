import { Request, Response, NextFunction } from 'express';

interface AppResponse {
  statusCode?: number;
  message?: string;
  [key: string]: any;
}

export default function finalResponse(
  data: AppResponse,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!data) return next();

  const statusCode = data.statusCode || 500;
  res.status(statusCode).json({ ...data, statusCode });
}
