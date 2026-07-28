import rateLimit from 'express-rate-limit';

// Strict Rate Limiter for Authentication routes (Login, Register, Password Reset)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes window
  max: 10, // Limit each IP to 10 authentication attempts per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP address. Please try again after 15 minutes.',
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
    message: 'Rate limit exceeded. Please slow down your API requests.',
  },
});
