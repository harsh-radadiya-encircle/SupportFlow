import { apiClient } from '../../../shared/api/apiClient';

export interface SubscriptionDetailsResponse {
  businessId: string;
  name: string;
  plan: 'FREE' | 'STANDARD' | 'BUSINESS';
  subscriptionStatus: string;
  currentPeriodEnd: string | null;
  stripeCustomerId: string | null;
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
    stripeInvoiceId: string;
    amountPaid: number;
    currency: string;
    status: string;
    pdfUrl: string | null;
    createdAt: string;
  }>;
}

export const getSubscriptionDetails = async (): Promise<SubscriptionDetailsResponse> => {
  const response = await apiClient.get<{ success: boolean; data: SubscriptionDetailsResponse }>('/subscriptions/current');
  return response.data.data;
};

export const createCheckoutSession = async (plan: 'STANDARD' | 'BUSINESS'): Promise<{ checkoutUrl: string }> => {
  const response = await apiClient.post<{ success: boolean; data: { checkoutUrl: string } }>('/subscriptions/checkout', { plan });
  return response.data.data;
};

export const createBillingPortalSession = async (): Promise<{ portalUrl: string }> => {
  const response = await apiClient.post<{ success: boolean; data: { portalUrl: string } }>('/subscriptions/portal');
  return response.data.data;
};
