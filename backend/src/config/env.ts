import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-jwt-secret-supportflow',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  FIREBASE: {
    PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'supportflow-demo',
    CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
    PRIVATE_KEY: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  },
  STRIPE: {
    SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_mock',
    WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_mock',
    PLANS: {
      FREE: process.env.STRIPE_FREE_PLAN_PRICE_ID || 'price_free',
      STANDARD: process.env.STRIPE_STANDARD_PLAN_PRICE_ID || 'price_standard',
      BUSINESS: process.env.STRIPE_BUSINESS_PLAN_PRICE_ID || 'price_business',
    },
  },
  SMTP: {
    HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
    PORT: parseInt(process.env.SMTP_PORT || '587', 10),
    USER: process.env.SMTP_USER || '',
    PASS: process.env.SMTP_PASS || '',
    FROM_EMAIL: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || 'noreply@supportflow.com',
    FROM_NAME: process.env.SMTP_FROM_NAME || 'SupportFlow Team',
  },
};
