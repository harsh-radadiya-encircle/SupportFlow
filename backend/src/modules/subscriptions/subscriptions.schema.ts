import { z } from "zod";

export const createCheckoutSessionSchema = z.object({
  plan: z.enum(["STANDARD", "BUSINESS"]),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
});

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, "Order ID is required"),
  razorpay_payment_id: z.string().min(1, "Payment ID is required"),
  razorpay_signature: z.string().min(1, "Signature is required"),
  plan: z.enum(["STANDARD", "BUSINESS"]),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
});

export const scheduleDowngradeSchema = z.object({
  targetPlan: z.enum(["STANDARD", "FREE"]),
});
