import http from "http";
import app from "./app";
import { env } from "./config/env";
import { initSocketServer } from "./socket/socketServer";
import { prisma } from "./utils/prisma";
import { startSubscriptionExpiryJob } from "./jobs/subscriptionExpiry.job";

const server = http.createServer(app);

// Initialize Real-time Socket.IO Server
initSocketServer(server);

// Start background subscription expiry cron job
startSubscriptionExpiryJob();

const PORT = parseInt(env.PORT, 10) || 5000;

server.listen(PORT, async () => {
  console.log(`=================================================`);
  console.log(` SupportFlow Backend API Server running on port ${PORT}`);
  console.log(` Environment: ${env.NODE_ENV}`);
  console.log(` Swagger Docs: http://localhost:${PORT}/api-docs`);
  console.log(` Health Check: http://localhost:${PORT}/health`);
  console.log(`=================================================`);

  try {
    await prisma.$connect();
    console.log("[Database] PostgreSQL Prisma client connected successfully.");
  } catch (err) {
    console.warn(
      "[Database] Prisma connection warning (verify DATABASE_URL is accessible):",
      err,
    );
  }
});
