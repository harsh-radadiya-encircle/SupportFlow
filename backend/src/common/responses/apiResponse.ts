import { Response } from 'express';

export interface ApiResponseOptions<T> {
  res: Response;
  statusCode?: number;
  message: string;
  data?: T;
  meta?: Record<string, any>;
}

export const sendResponse = <T>({
  res,
  statusCode = 200,
  message,
  data,
  meta,
}: ApiResponseOptions<T>) => {
  return res.status(statusCode).json({
    success: statusCode >= 200 && statusCode < 300,
    message,
    data: data !== undefined ? data : null,
    ...(meta ? { meta } : {}),
  });
};
