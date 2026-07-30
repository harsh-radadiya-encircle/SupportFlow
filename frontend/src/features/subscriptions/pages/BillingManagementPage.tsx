import React, { useState } from 'react';
import {
  useSubscriptionDetails,
  useCreateRazorpayOrder,
  useVerifyRazorpayPayment,
  useCancelSubscription,
} from '../hooks/useSubscriptions';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import {
  CreditCard,
  CheckCircle2,
  Users,
  Ticket,
  ExternalLink,
  Loader2,
  AlertCircle,
  FileText,
  Sparkles,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const BillingManagementPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const { data, isLoading } = useSubscriptionDetails();
  const orderMutation = useCreateRazorpayOrder();
  const verifyMutation = useVerifyRazorpayPayment();
  const cancelMutation = useCancelSubscription();

  const subscriptionData = data || {
    plan: 'FREE',
    subscriptionStatus: 'ACTIVE',
    razorpayCustomerId: null,
    usage: {
      agents: { used: 1, max: 1, percentage: 100 },
      tickets: { used: 12, max: 25, percentage: 48 },
    },
    billingHistory: [],
  };

  const { plan, usage, billingHistory } = subscriptionData;

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleUpgradePlan = async (targetPlan: 'STANDARD' | 'BUSINESS') => {
    try {
      const orderData = await orderMutation.mutateAsync(targetPlan);

      if (orderData.isTestMode) {
        return;
      }

      if (orderData.orderId && orderData.keyId) {
        const isLoaded = await loadRazorpayScript();
        if (!isLoaded) {
          toast.error('Failed to load Razorpay payment SDK. Please check your network connection.');
          return;
        }

        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'SupportFlow',
          description: `Upgrade to ${targetPlan} Plan`,
          image: 'https://supportflow.com/logo.png',
          order_id: orderData.orderId,
          prefill: {
            name: orderData.businessName || 'Business Admin',
            email: orderData.userEmail || '',
          },
          theme: {
            color: '#4f46e5',
          },
          handler: async (response: any) => {
            await verifyMutation.mutateAsync({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: targetPlan,
            });
          },
          modal: {
            ondismiss: () => {
              toast('Razorpay checkout window closed.', { icon: 'ℹ️' });
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      // Error handles in onError toast
    }
  };

  return (
    <div className="space-y-8 font-sans pb-12 max-w-6xl mx-auto">
      {/* Workspace Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing & Subscriptions</h1>
            <Badge
              variant={plan === 'BUSINESS' ? 'purple' : plan === 'STANDARD' ? 'info' : 'secondary'}
              className="text-xs font-bold uppercase tracking-wider"
            >
              {plan} PLAN
            </Badge>
          </div>
          <p className="text-sm text-slate-500 font-normal">
            Manage your Razorpay subscription plans, agent seat allocations, and invoices
          </p>
        </div>

        {plan !== 'FREE' && (
          <Button
            variant="outline"
            onClick={() => cancelMutation.mutate()}
            disabled={cancelMutation.isPending}
            className="font-semibold border-rose-200 text-rose-600 hover:bg-rose-50 shrink-0 shadow-2xs"
          >
            {cancelMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <XCircle className="w-4 h-4 mr-2 text-rose-500" />
            )}
            Cancel Subscription
          </Button>
        )}
      </div>

      {/* Quota Usage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Support Agent Seats */}
        <Card glass className="p-6 space-y-4 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Support Agent Seats</h3>
                <p className="text-xs text-slate-500 font-normal">Active team member allocations</p>
              </div>
            </div>
            <span className="text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
              {usage.agents.used} / {usage.agents.max}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  usage.agents.percentage >= 100 ? 'bg-rose-500' : 'bg-indigo-600'
                }`}
                style={{ width: `${usage.agents.percentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>{usage.agents.percentage}% Capacity</span>
              <span>
                {usage.agents.used >= usage.agents.max
                  ? 'Limit Reached — Upgrade Required'
                  : `${usage.agents.max - usage.agents.used} seat(s) available`}
              </span>
            </div>
          </div>
        </Card>

        {/* Monthly Ticket Volume */}
        <Card glass className="p-6 space-y-4 border border-slate-200/80">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <Ticket className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-slate-900">Monthly Ticket Quota</h3>
                <p className="text-xs text-slate-500 font-normal">Support requests raised this month</p>
              </div>
            </div>
            <span className="text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
              {usage.tickets.used} / {usage.tickets.max}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: plan === 'FREE' ? `${usage.tickets.percentage}%` : '100%' }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>{plan === 'FREE' ? `${usage.tickets.percentage}% Used` : 'Unlimited Volume'}</span>
              <span>{plan === 'FREE' ? 'Resets on 1st of month' : 'No ticket limits'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Subscription Plans Header & Billing Toggle */}
      <div className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Razorpay Subscription Plans</h2>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Instant activation via Razorpay Checkout Modal
            </p>
          </div>

          {/* Billing Cycle Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center shrink-0 self-start sm:self-auto border border-slate-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                billingCycle === 'yearly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Yearly <span className="text-[10px] font-bold text-emerald-600 uppercase">Save 20%</span>
            </button>
          </div>
        </div>

        {/* 3-Tier Pricing Plan Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* FREE STARTER PLAN */}
          <Card
            glass
            className={`p-6 space-y-6 relative flex flex-col justify-between border transition-all duration-200 ${
              plan === 'FREE' ? 'border-slate-900 shadow-md ring-2 ring-slate-900/10' : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            {plan === 'FREE' && (
              <Badge variant="purple" className="absolute top-4 right-4 text-[10px] font-bold">
                CURRENT PLAN
              </Badge>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Free Starter</h3>
                <p className="text-xs text-slate-500 font-normal">Ideal for small teams starting out</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">₹0</span>
                <span className="text-xs text-slate-500 font-semibold">/ month</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-600 font-normal pt-2 divide-y divide-slate-100">
                <li className="flex items-center gap-2.5 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>1 Support Agent</strong> seat</span>
                </li>
                <li className="flex items-center gap-2.5 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Up to <strong>25 Tickets</strong> / month</span>
                </li>
                <li className="flex items-center gap-2.5 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Real-Time Live Chat</span>
                </li>
                <li className="flex items-center gap-2.5 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Push Notifications</span>
                </li>
              </ul>
            </div>

            <Button disabled variant="outline" className="w-full font-semibold text-xs bg-slate-50 border-slate-200 text-slate-500">
              {plan === 'FREE' ? 'Active Plan' : 'Free Included'}
            </Button>
          </Card>

          {/* STANDARD PLAN */}
          <Card
            glass
            className={`p-6 space-y-6 relative flex flex-col justify-between border transition-all duration-200 ${
              plan === 'STANDARD'
                ? 'border-indigo-600 shadow-xl ring-2 ring-indigo-600/20'
                : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            {plan === 'STANDARD' ? (
              <Badge variant="purple" className="absolute top-4 right-4 text-[10px] font-bold">
                CURRENT PLAN
              </Badge>
            ) : (
              <Badge variant="info" className="absolute top-4 right-4 text-[10px] font-bold uppercase">
                POPULAR
              </Badge>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Standard Plan</h3>
                <p className="text-xs text-slate-500 font-normal">For growing support operations</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">
                  ₹{billingCycle === 'monthly' ? '2,499' : '1,999'}
                </span>
                <span className="text-xs text-slate-500 font-semibold">/ month</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-600 font-normal pt-2 divide-y divide-slate-100">
                <li className="flex items-center gap-2.5 pt-2 font-semibold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Up to <strong>5 Support Agent</strong> seats</span>
                </li>
                <li className="flex items-center gap-2.5 pt-2 font-semibold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Unlimited</strong> Monthly Tickets</span>
                </li>
                <li className="flex items-center gap-2.5 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Real-Time Socket Chat & Typing</span>
                </li>
                <li className="flex items-center gap-2.5 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Private Agent Internal Notes</span>
                </li>
              </ul>
            </div>

            <Button
              disabled={plan === 'STANDARD' || orderMutation.isPending || verifyMutation.isPending}
              onClick={() => handleUpgradePlan('STANDARD')}
              variant="primary"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md py-2.5"
            >
              {orderMutation.isPending && orderMutation.variables === 'STANDARD' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : plan === 'STANDARD' ? (
                'Active Plan'
              ) : (
                'Upgrade via Razorpay (₹2,499/mo)'
              )}
            </Button>
          </Card>

          {/* BUSINESS PLAN */}
          <Card
            glass
            className={`p-6 space-y-6 relative flex flex-col justify-between border transition-all duration-200 ${
              plan === 'BUSINESS'
                ? 'border-purple-600 shadow-xl ring-2 ring-purple-600/20'
                : 'border-slate-200/80 hover:border-slate-300'
            }`}
          >
            {plan === 'BUSINESS' && (
              <Badge variant="purple" className="absolute top-4 right-4 text-[10px] font-bold">
                CURRENT PLAN
              </Badge>
            )}

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Business Plan</h3>
                <p className="text-xs text-slate-500 font-normal">For established enterprises</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">
                  ₹{billingCycle === 'monthly' ? '6,499' : '5,199'}
                </span>
                <span className="text-xs text-slate-500 font-semibold">/ month</span>
              </div>

              <ul className="space-y-3 text-xs text-slate-600 font-normal pt-2 divide-y divide-slate-100">
                <li className="flex items-center gap-2.5 pt-2 font-semibold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Up to <strong>20 Support Agent</strong> seats</span>
                </li>
                <li className="flex items-center gap-2.5 pt-2 font-semibold text-slate-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span><strong>Unlimited</strong> Monthly Tickets</span>
                </li>
                <li className="flex items-center gap-2.5 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Advanced Performance Reports</span>
                </li>
                <li className="flex items-center gap-2.5 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Priority 24/7 Dedicated Support</span>
                </li>
              </ul>
            </div>

            <Button
              disabled={plan === 'BUSINESS' || orderMutation.isPending || verifyMutation.isPending}
              onClick={() => handleUpgradePlan('BUSINESS')}
              variant="primary"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md py-2.5"
            >
              {orderMutation.isPending && orderMutation.variables === 'BUSINESS' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : plan === 'BUSINESS' ? (
                'Active Plan'
              ) : (
                'Upgrade via Razorpay (₹6,499/mo)'
              )}
            </Button>
          </Card>
        </div>
      </div>

      {/* Razorpay Billing Invoice History */}
      <Card glass className="p-6 space-y-4 border border-slate-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">Razorpay Payment Receipts</h3>
          </div>
        </div>

        {billingHistory.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-normal">
            No payment receipts recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase font-semibold border-b border-slate-100 text-[10px]">
                  <th className="pb-3">Razorpay Payment ID</th>
                  <th className="pb-3">Order ID</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billingHistory.map((invoice: any) => (
                  <tr key={invoice.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 font-mono font-semibold text-indigo-600">{invoice.razorpayPaymentId}</td>
                    <td className="py-3 font-mono text-slate-500">{invoice.razorpayOrderId || 'N/A'}</td>
                    <td className="py-3 font-bold text-slate-900">
                      ₹{(invoice.amountPaid / 100).toLocaleString('en-IN')} {invoice.currency.toUpperCase()}
                    </td>
                    <td className="py-3">
                      <Badge variant="success" className="text-[10px]">
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-500 font-normal">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
