import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticate } from "../../middleware/authenticate";
import { authRateLimiter } from "../../middleware/rateLimiter";

const router = Router();

// Rate-limited Auth Endpoints
router.post("/check-provider", authRateLimiter, AuthController.checkProvider);
router.post("/sync", authRateLimiter, AuthController.syncUser);
// Session & Profile
router.get("/me", authenticate, AuthController.getProfile);
router.post("/logout", authenticate, AuthController.logout);
router.post("/link-provider", authenticate, AuthController.linkProvider);
router.get("/providers", authenticate, AuthController.getProviders);

export default router;
