import { apiClient } from '../../../shared/api/apiClient';

export interface SubscriptionDetailsResponse {
  businessId: string;
  name: string;
  plan: 'FREE' | 'STANDARD' | 'BUSINESS';
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
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
    razorpayPaymentId: string;
    razorpayOrderId?: string | null;
    amountPaid: number;
    currency: string;
    status: string;
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
  businessName?: string;
  userEmail?: string;
}

export const getSubscriptionDetails = async (): Promise<SubscriptionDetailsResponse> => {
  const response = await apiClient.get<{ success: boolean; data: SubscriptionDetailsResponse }>('/subscriptions/current');
  return response.data.data;
};

export const createRazorpayOrder = async (plan: 'STANDARD' | 'BUSINESS'): Promise<RazorpayOrderResponse> => {
  const response = await apiClient.post<{ success: boolean; data: RazorpayOrderResponse }>('/subscriptions/razorpay-order', { plan });
  return response.data.data;
};

export const verifyRazorpayPayment = async (payload: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  plan: 'STANDARD' | 'BUSINESS';
}): Promise<{ success: boolean; message: string; plan: string }> => {
  const response = await apiClient.post<{ success: boolean; data: { success: boolean; message: string; plan: string } }>('/subscriptions/verify-payment', payload);
  return response.data.data;
};

export const cancelSubscription = async (): Promise<{ success: boolean; message: string; plan: string }> => {
  const response = await apiClient.post<{ success: boolean; data: { success: boolean; message: string; plan: string } }>('/subscriptions/cancel');
  return response.data.data;
};
