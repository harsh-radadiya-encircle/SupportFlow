import { Response, NextFunction } from 'express';
import { NotificationsService } from './notifications.service';
import { sendResponse } from '../../common/responses/apiResponse';
import { AuthenticatedRequest } from '../../common/types';

export class NotificationsController {
  static async getUserNotifications(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await NotificationsService.getUserNotifications(req.user!.id);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Notifications retrieved successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAsRead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const notificationId = req.params.id as string;
      const updated = await NotificationsService.markAsRead(notificationId, req.user!.id);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Notification marked as read',
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  static async markAllAsRead(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      await NotificationsService.markAllAsRead(req.user!.id);
      sendResponse({
        res,
        statusCode: 200,
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  }
}
