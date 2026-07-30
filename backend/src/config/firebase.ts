import * as admin from 'firebase-admin';
import { env } from './env';

let isFirebaseInitialized = false;

try {
  const rawKey = env.FIREBASE.PRIVATE_KEY || '';
  const formattedKey = rawKey.replace(/\\n/g, '\n');
  const hasValidKey =
    formattedKey &&
    formattedKey.includes('BEGIN PRIVATE KEY') &&
    !formattedKey.includes('MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...');

  if (env.FIREBASE.PROJECT_ID && env.FIREBASE.CLIENT_EMAIL && hasValidKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE.PROJECT_ID,
        clientEmail: env.FIREBASE.CLIENT_EMAIL,
        privateKey: formattedKey,
      }),
    });
    isFirebaseInitialized = true;
    console.log('[Firebase] Admin SDK initialized successfully.');
  } else {
    console.log(
      '[Firebase] Development Mock Auth Mode Active (configure real keys in .env when ready).'
    );
  }
} catch (error) {
  console.warn('[Firebase] Admin initialization notice:', error);
}

export { admin, isFirebaseInitialized };
