import * as admin from "firebase-admin";
import { env } from "./env";

const rawKey = env.FIREBASE.PRIVATE_KEY || "";
const formattedKey = rawKey.replace(/\\n/g, "\n");
const hasValidKey =
  formattedKey &&
  formattedKey.includes("BEGIN PRIVATE KEY") &&
  !formattedKey.includes(
    "MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...",
  );

if (!env.FIREBASE.PROJECT_ID || !env.FIREBASE.CLIENT_EMAIL || !hasValidKey) {
  throw new Error(
    "FATAL: Firebase Admin configuration is missing or invalid. Check that PROJECT_ID, CLIENT_EMAIL, and a valid PRIVATE_KEY are configured in environment variables.",
  );
}

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE.PROJECT_ID,
      clientEmail: env.FIREBASE.CLIENT_EMAIL,
      privateKey: formattedKey,
    }),
  });
  console.log("[Firebase] Admin SDK initialized successfully.");
} catch (error: any) {
  throw new Error(
    `FATAL: Failed to initialize Firebase Admin SDK: ${error.message}`,
  );
}

const isFirebaseInitialized = true;

export { admin, isFirebaseInitialized };
