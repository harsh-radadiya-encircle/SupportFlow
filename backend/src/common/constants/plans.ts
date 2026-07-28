export const PLAN_LIMITS = {
  FREE: {
    maxAgents: 1,
    maxTicketsPerMonth: 25,
    realtimeChat: true,
    pushNotifications: true,
    advancedReports: false,
  },
  STANDARD: {
    maxAgents: 5,
    maxTicketsPerMonth: Infinity,
    realtimeChat: true,
    pushNotifications: true,
    advancedReports: false,
  },
  BUSINESS: {
    maxAgents: 20,
    maxTicketsPerMonth: Infinity,
    realtimeChat: true,
    pushNotifications: true,
    advancedReports: true,
  },
} as const;
