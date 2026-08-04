import { CorsOptions } from "cors";
import { env } from "./env";

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, postman)
    if (!origin) {
      return callback(null, true);
    }

    // Allow exact FRONTEND_URL match
    if (origin === env.FRONTEND_URL) {
      return callback(null, true);
    }

    // Allow all Vercel preview/production deployments (*.vercel.app)
    if (origin.endsWith(".vercel.app")) {
      return callback(null, true);
    }

    // Allow localhost in development
    if (env.NODE_ENV === "development") {
      return callback(null, true);
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};
