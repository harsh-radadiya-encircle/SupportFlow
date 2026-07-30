import { Request, Response, NextFunction } from 'express';
import { UsersService } from './users.service';
import { sendResponse } from '../../common/responses/apiResponse';
import { AuthenticatedRequest } from '../../common/types';
import { ApiError } from '../../common/exceptions/apiError';

export class UsersController {
  static async saveFcmToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) throw ApiError.unauthorized('User not authenticated');
      const { token, deviceType } = req.body;

      if (!token) throw ApiError.badRequest('FCM token is required');

      const savedToken = await UsersService.saveFcmToken(req.user.id, token, deviceType);

      sendResponse({
        res,
        statusCode: 200,
        message: 'FCM push notification token registered successfully',
        data: savedToken,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getActiveBusinesses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const businesses = await UsersService.getActiveBusinesses();
      sendResponse({
        res,
        statusCode: 200,
        message: 'Active businesses retrieved successfully',
        data: businesses,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await UsersService.getAllUsers();
      sendResponse({
        res,
        statusCode: 200,
        message: 'Registered platform users retrieved successfully',
        data: users,
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params;
      const deletedUser = await UsersService.deleteUser(userId);

      sendResponse({
        res,
        statusCode: 200,
        message: `User account '${deletedUser.email}' has been deleted successfully.`,
        data: deletedUser,
      });
    } catch (error) {
      next(error);
    }
  }
}
