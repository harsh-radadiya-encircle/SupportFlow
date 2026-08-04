import { SubscriptionPlan } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Single Source of Truth for all plan limits and prices.
// Any change here automatically propagates to the service, middleware, and UI.
// ─────────────────────────────────────────────────────────────────────────────

export interface PlanConfig {
  /** Human-readable label */
  label: string;
  /** Max active support agents (seats) */
  agents: number;
  /** Max tickets per month. Infinity = unlimited */
  tickets: number;
  /** Price in INR paise for monthly billing (0 = free) */
  monthlyPaise: number;
  /** Price in INR paise for yearly billing (0 = free) */
  yearlyPaise: number;
}

export const PLAN_CONFIG: Record<SubscriptionPlan, PlanConfig> = {
  FREE: {
    label: "Free Tier",
    agents: 1,
    tickets: 25,
    monthlyPaise: 0,
    yearlyPaise: 0,
  },
  STANDARD: {
    label: "Standard Plan",
    agents: 5,
    tickets: Infinity,
    monthlyPaise: 249900, // ₹2,499
    yearlyPaise: 2499000, // ₹24,990
  },
  BUSINESS: {
    label: "Business Plan",
    agents: 20,
    tickets: Infinity,
    monthlyPaise: 649900, // ₹6,499
    yearlyPaise: 6499000, // ₹64,990
  },
};

/**
 * Returns the price in paise for a given plan + billing cycle.
 * Throws if called for FREE plan.
 */
export function getPlanPrice(
  plan: "STANDARD" | "BUSINESS",
  billingCycle: "monthly" | "yearly",
): number {
  return billingCycle === "yearly"
    ? PLAN_CONFIG[plan].yearlyPaise
    : PLAN_CONFIG[plan].monthlyPaise;
}

/**
 * Returns the max allowed support agent seats for a plan.
 */
export function getPlanAgentLimit(plan: SubscriptionPlan): number {
  return PLAN_CONFIG[plan].agents;
}

/**
 * Returns the max monthly ticket count for a plan.
 * Returns Infinity for paid plans (unlimited).
 */
export function getPlanTicketLimit(plan: SubscriptionPlan): number {
  return PLAN_CONFIG[plan].tickets;
}

/**
 * Returns duration in days for a billing cycle.
 */
export function getBillingCycleDays(
  billingCycle: "monthly" | "yearly",
): number {
  return billingCycle === "yearly" ? 365 : 30;
}

/**
 * Generates a human-readable invoice number: SF-YYYYMM-XXXX
 */
export function generateInvoiceNumber(sequenceNum: number): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const seq = String(sequenceNum).padStart(4, "0");
  return `SF-${year}${month}-${seq}`;
}
