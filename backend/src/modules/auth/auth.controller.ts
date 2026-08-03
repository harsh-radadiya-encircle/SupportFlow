import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { sendResponse } from "../../common/responses/apiResponse";
import { AuthenticatedRequest } from "../../common/types";
import { admin, isFirebaseInitialized } from "../../config/firebase";
import { ApiError } from "../../common/exceptions/apiError";

export class AuthController {
  static async checkProvider(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { email } = req.body;
      const result = await AuthService.checkProvider(email);
      sendResponse({
        res,
        statusCode: 200,
        message: "User provider checked successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async syncUser(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw ApiError.unauthorized("No authorization token provided");
      }
      const token = authHeader.split(" ")[1];

      if (!isFirebaseInitialized) {
        throw ApiError.internal(
          "Firebase Authentication is not initialized on the backend",
        );
      }

      const decodedToken = await admin.auth().verifyIdToken(token);

      let incomingProvider: "EMAIL_PASSWORD" | "GOOGLE" = "EMAIL_PASSWORD";
      const signInProvider = decodedToken.firebase?.sign_in_provider;
      if (signInProvider === "google.com") {
        incomingProvider = "GOOGLE";
      }

      const result = await AuthService.syncOrRegisterUser({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email || "",
        fullName: decodedToken.name || req.body.fullName,
        role: req.body.role,
        businessName: req.body.businessName,
        mode: req.body.mode,
        authProvider: incomingProvider,
      });

      sendResponse({
        res,
        statusCode: 200,
        message: "User synchronized successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getProfile(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      sendResponse({
        res,
        statusCode: 200,
        message: "User profile fetched successfully",
        data: req.user,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logout(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      sendResponse({
        res,
        statusCode: 200,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  static async linkProvider(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await AuthService.linkProvider(req.user!.id);
      sendResponse({
        res,
        statusCode: 200,
        message: "Provider linked successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
