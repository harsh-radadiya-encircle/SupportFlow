import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export const env = {
  PORT: process.env.PORT || "5000",
  NODE_ENV: process.env.NODE_ENV || "development",
  DATABASE_URL: process.env.DATABASE_URL || "",
  DIRECT_URL: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  JWT_SECRET: (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret && process.env.NODE_ENV === "production") {
      throw new Error(
        "FATAL: JWT_SECRET environment variable is required in production.",
      );
    }
    return secret || "fallback-jwt-secret-supportflow-dev-only";
  })(),
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",
  FIREBASE: {
    PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "supportflow-demo",
    CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || "",
    PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  },
  RAZORPAY: {
    KEY_ID: process.env.RAZORPAY_KEY_ID || "rzp_test_mock",
    KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || "mock_secret",
    WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || "whsec_mock",
    PLANS: {
      FREE: "plan_free",
      STANDARD: process.env.RAZORPAY_STANDARD_PLAN_ID || "plan_standard",
      BUSINESS: process.env.RAZORPAY_BUSINESS_PLAN_ID || "plan_business",
    },
  },
  SMTP: {
    HOST: process.env.SMTP_HOST || "smtp.gmail.com",
    PORT: parseInt(process.env.SMTP_PORT || "587", 10),
    USER: process.env.SMTP_USER || "",
    PASS: process.env.SMTP_PASS || "",
    FROM_EMAIL:
      process.env.SMTP_FROM_EMAIL ||
      process.env.SMTP_USER ||
      "noreply@supportflow.com",
    FROM_NAME: process.env.SMTP_FROM_NAME || "SupportFlow Team",
  },
};
