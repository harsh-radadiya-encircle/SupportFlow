import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../shared/store/authStore';
import {
  getSubscriptionDetails,
  createRazorpayOrder,
  verifyRazorpayPayment,
  cancelSubscription,
} from '../api/subscriptions.api';

export const useSubscriptionDetails = () => {
  const { user, isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ['subscription'],
    queryFn: getSubscriptionDetails,
    enabled: isAuthenticated && Boolean(user),
    staleTime: 30000,
    retry: false,
  });
};

export const useCreateRazorpayOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ plan, billingCycle }: { plan: 'STANDARD' | 'BUSINESS'; billingCycle?: 'monthly' | 'yearly' }) =>
      createRazorpayOrder(plan, billingCycle),
    onSuccess: (data, variables) => {
      if (data?.isTestMode && data?.message) {
        toast.success(data.message);
        useAuthStore.getState().updateUserBusinessPlan(variables.plan);
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to create payment order.';
      toast.error(`Payment Error: ${msg}`);
    },
  });
};

export const useVerifyRazorpayPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      razorpay_order_id: string;
      razorpay_payment_id: string;
      razorpay_signature: string;
      plan: 'STANDARD' | 'BUSINESS';
      billingCycle?: 'monthly' | 'yearly';
    }) => verifyRazorpayPayment(payload),
    onSuccess: (data, variables) => {
      toast.success(data.message || 'Payment verified successfully!');
      if (data?.plan || variables.plan) {
        useAuthStore.getState().updateUserBusinessPlan(data.plan || variables.plan);
      }
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Payment verification failed.';
      toast.error(`Verification Error: ${msg}`);
    },
  });
};

export const useCancelSubscription = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => cancelSubscription(),
    onSuccess: (data) => {
      toast.success(data.message || 'Subscription canceled.');
      useAuthStore.getState().updateUserBusinessPlan('FREE');
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to cancel subscription.';
      toast.error(`Cancellation Error: ${msg}`);
    },
  });
};
