import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../common/types';
import { ApiError } from '../common/exceptions/apiError';

export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw ApiError.unauthorized('User not authenticated');
      }

      if (!allowedRoles.includes(req.user.role)) {
        throw ApiError.forbidden(
          `Role '${req.user.role}' is not authorized to access this resource`
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
