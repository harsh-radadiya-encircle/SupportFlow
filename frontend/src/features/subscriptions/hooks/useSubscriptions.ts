import { useQuery, useMutation } from '@tanstack/react-query';
import {
  getSubscriptionDetails,
  createCheckoutSession,
  createBillingPortalSession,
} from '../api/subscriptions.api';

export const useSubscriptionDetails = () => {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscriptionDetails,
  });
};

export const useCreateCheckoutSession = () => {
  return useMutation({
    mutationFn: (plan: 'STANDARD' | 'BUSINESS') => createCheckoutSession(plan),
    onSuccess: (data) => {
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
  });
};

export const useCreateBillingPortal = () => {
  return useMutation({
    mutationFn: () => createBillingPortalSession(),
    onSuccess: (data) => {
      if (data?.portalUrl) {
        window.location.href = data.portalUrl;
      }
    },
  });
};
