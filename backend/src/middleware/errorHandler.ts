import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../common/exceptions/apiError';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error(`[Error Handler] ${req.method} ${req.url}:`, err);

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && err.errors.length > 0 ? { errors: err.errors } : {}),
    });
    return;
  }

  // Fallback 500 internal server error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};
