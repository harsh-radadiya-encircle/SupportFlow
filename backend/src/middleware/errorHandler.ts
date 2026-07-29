import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../common/exceptions/apiError';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof ApiError) {
    if (err.statusCode === 401) {
      console.warn(`[Auth Guard] ${req.method} ${req.path} - 401 Unauthorized`);
    } else {
      console.error(`[ApiError ${err.statusCode}] ${req.method} ${req.path}: ${err.message}`);
    }

    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && err.errors.length > 0 ? { errors: err.errors } : {}),
    });
    return;
  }

  // Fallback 500 internal server error
  console.error(`[Unhandled Error] ${req.method} ${req.url}:`, err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
};
