import { apiClient } from '../../../shared/api/apiClient';

export interface SubscriptionDetailsResponse {
  businessId: string;
  name: string;
  plan: 'FREE' | 'STANDARD' | 'BUSINESS';
  subscriptionStatus: string;
  billingCycle: string | null;
  cancelAtPeriodEnd: boolean;
  pendingDowngradePlan: 'FREE' | 'STANDARD' | 'BUSINESS' | null;
  currentPeriodEnd: string | null;
  nextBillingDate: string | null;
  lastPaymentAt: string | null;
  daysRemaining?: number | null;
  razorpayCustomerId: string | null;
  usage: {
    agents: {
      used: number;
      max: number;
      percentage: number;
    };
    tickets: {
      used: number;
      max: number | string;
      percentage: number;
    };
  };
  billingHistory: Array<{
    id: string;
    invoiceNumber?: string | null;
    razorpayPaymentId: string;
    razorpayOrderId?: string | null;
    amountPaid: number;
    currency: string;
    status: string;
    planAtPayment?: string | null;
    billingCycle?: string | null;
    paymentMethod?: string | null;
    pdfUrl: string | null;
    createdAt: string;
  }>;
}

export interface RazorpayOrderResponse {
  isTestMode?: boolean;
  message?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  plan?: 'STANDARD' | 'BUSINESS';
  billingCycle?: 'monthly' | 'yearly';
  businessName?: string;
  userEmail?: string;
}

export const getSubscriptionDetails = async (): Promise<SubscriptionDetailsResponse> => {
  const response = await apiClient.get<{ success: boolean; data: SubscriptionDetailsResponse }>(
    '/subscriptions/current'
  );
  return response.data.data;
};

export const createRazorpayOrder = async (
  plan: 'STANDARD' | 'BUSINESS',
  billingCycle: 'monthly' | 'yearly' = 'monthly'
): Promise<RazorpayOrderResponse> => {
  const response = await apiClient.post<{ success: boolean; data: RazorpayOrderResponse }>(
    '/subscriptions/razorpay-order',
    { plan, billingCycle }
  );
  return response.data.data;
};

export const verifyRazorpayPayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan: 'STANDARD' | 'BUSINESS';
  billingCycle?: 'monthly' | 'yearly';
}): Promise<{ success: boolean; message: string; plan: string; invoiceNumber?: string }> => {
  const response = await apiClient.post<{
    success: boolean;
    data: { success: boolean; message: string; plan: string; invoiceNumber?: string };
  }>('/subscriptions/verify-payment', payload);
  return response.data.data;
};

export const cancelSubscription = async (): Promise<{
  success: boolean;
  message: string;
  plan: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}> => {
  const response = await apiClient.post<{
    success: boolean;
    data: { success: boolean; message: string; plan: string; cancelAtPeriodEnd: boolean; currentPeriodEnd: string | null };
  }>('/subscriptions/cancel');
  return response.data.data;
};

export const scheduleDowngrade = async (targetPlan: 'STANDARD' | 'FREE'): Promise<{
  success: boolean;
  message: string;
  plan: string;
  pendingDowngradePlan: string;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
}> => {
  const response = await apiClient.post<{
    success: boolean;
    data: { success: boolean; message: string; plan: string; pendingDowngradePlan: string; cancelAtPeriodEnd: boolean; currentPeriodEnd: string | null };
  }>('/subscriptions/downgrade', { targetPlan });
  return response.data.data;
};
