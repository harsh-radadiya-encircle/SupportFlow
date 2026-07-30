import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendResponse } from '../../common/responses/apiResponse';
import { AuthenticatedRequest } from '../../common/types';

export class AuthController {
  static async checkProvider(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await AuthService.checkProvider(email);
      sendResponse({
        res,
        statusCode: 200,
        message: 'User provider checked successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async syncUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.syncOrRegisterUser(req.body);
      sendResponse({
        res,
        statusCode: 200,
        message: 'User synchronized successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await AuthService.login(email);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Logged in successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async syncPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await AuthService.syncPassword(email, password);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Password synced and authenticated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getCustomToken(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.getCustomToken(req.user!.email);
      sendResponse({
        res,
        statusCode: 200,
        message: 'Firebase custom token generated successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body;
      const result = await AuthService.forgotPassword(email);
      sendResponse({
        res,
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body;
      const result = await AuthService.resetPassword(token, password);
      sendResponse({
        res,
        statusCode: 200,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      sendResponse({
        res,
        statusCode: 200,
        message: 'User profile fetched successfully',
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      sendResponse({
        res,
        statusCode: 200,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
