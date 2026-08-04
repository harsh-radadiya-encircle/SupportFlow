import express, { Express } from "express";
import cors from "cors";
import { corsOptions } from "./config/cors";
import { securityHeaders } from "./middleware/securityHeaders";
import { apiRateLimiter } from "./middleware/rateLimiter";
import { logger } from "./middleware/logger";
import { errorHandler } from "./middleware/errorHandler";
import { setupSwagger } from "./config/swagger";
import routes from "./routes";

const app: Express = express();

// Trust proxy for express-rate-limit behind Render reverse proxy
app.set("trust proxy", 1);

// Razorpay Webhook requires raw body parsing for HMAC signature verification
app.use(
  "/api/v1/subscriptions/webhook",
  express.raw({ type: "application/json" }),
);

// Global Security & Rate Limiting Middlewares
app.use(securityHeaders);
app.use("/api", apiRateLimiter);
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// Swagger API Documentation
setupSwagger(app);

// Base Route
app.get("/health", (req, res) => {
  res
    .status(200)
    .json({
      status: "UP",
      message: "SupportFlow Backend Service Operating Normally",
    });
});

// API V1 Routes
app.use("/api/v1", routes);

// Centralized Error Middleware
app.use(errorHandler);

export default app;
