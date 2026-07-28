export const ROLES = {
  PLATFORM_ADMIN: 'PLATFORM_ADMIN',
  BUSINESS_ADMIN: 'BUSINESS_ADMIN',
  SUPPORT_AGENT: 'SUPPORT_AGENT',
  CUSTOMER: 'CUSTOMER',
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
