import rateLimit from "express-rate-limit";

const isProd = process.env.NODE_ENV === "production";

// Strict Rate Limiter for Authentication routes (Login, Register, Password Reset)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: isProd ? 30 : 1000, // Limit each IP to 30 attempts in prod, 1000 in dev
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message:
      "Too many authentication attempts from this IP address. Please try again after 15 minutes.",
  },
});

// General API Rate Limiter for standard endpoint protection
export const apiRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 100, // Limit each IP to 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Rate limit exceeded. Please slow down your API requests.",
  },
});
