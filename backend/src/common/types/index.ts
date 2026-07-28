import { Request } from 'express';
import { User, Business } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  firebaseUid: string;
  email: string;
  fullName: string;
  role: string;
  businessId?: string | null;
  business?: Business | null;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
