import { z } from 'zod';

export const inviteAgentSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['SUPPORT_AGENT', 'BUSINESS_ADMIN']).optional().default('SUPPORT_AGENT'),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, 'Invitation token is required'),
  firebaseUid: z.string().min(1, 'Firebase UID is required'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  authProvider: z.enum(['EMAIL_PASSWORD', 'GOOGLE']).optional().default('EMAIL_PASSWORD'),
});
