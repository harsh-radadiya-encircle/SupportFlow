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
  Clock,
  Calendar,
  Check,
  Zap,
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
    currentPeriodEnd: null,
    daysRemaining: 30,
    razorpayCustomerId: null,
    usage: {
      agents: { used: 1, max: 1, percentage: 100 },
      tickets: { used: 12, max: 25, percentage: 48 },
    },
    billingHistory: [],
  };

  const { plan, subscriptionStatus, currentPeriodEnd, daysRemaining = 30, usage, billingHistory } = subscriptionData;

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
      const orderData = await orderMutation.mutateAsync({ plan: targetPlan, billingCycle });

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
          description: `${targetPlan} Plan (${billingCycle})`,
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
              billingCycle,
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
      // Handled in mutation onError toast
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-8 font-sans pb-12 max-w-6xl mx-auto">
      {/* Workspace Header Banner with Expiry Timeline */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing & Subscriptions</h1>
              <Badge
                variant={plan === 'BUSINESS' ? 'purple' : plan === 'STANDARD' ? 'info' : 'secondary'}
                className="text-xs font-bold uppercase tracking-wider"
              >
                {plan} PLAN
              </Badge>
              {subscriptionStatus === 'CANCELED' ? (
                <Badge variant="warning" className="text-xs font-bold">
                  CANCELED (Access Active)
                </Badge>
              ) : (
                <Badge variant="success" className="text-xs font-bold">
                  ACTIVE
                </Badge>
              )}
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
              {subscriptionStatus === 'CANCELED' ? 'Downgrade to Free' : 'Cancel Subscription'}
            </Button>
          )}
        </div>

        {/* Expiry Date & Days Remaining Timeline Alert Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 font-semibold">
            <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              {subscriptionStatus === 'CANCELED'
                ? `Current Plan Expires On: ${formatDate(currentPeriodEnd)}`
                : `Current Period Renews On: ${formatDate(currentPeriodEnd)}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {daysRemaining} day(s) remaining in cycle
            </div>
          </div>
        </div>
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
              Upgrade or change plans instantly via Razorpay Checkout Modal
            </p>
          </div>

          {/* Monthly / Yearly Billing Cycle Selector */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center shrink-0 self-start sm:self-auto border border-slate-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" /> Yearly (2 Months Free!)
            </button>
          </div>
        </div>

        {/* 3 Tier Pricing Cards Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* TIER 1: FREE PLAN */}
          <Card
            glass
            className={`p-6 space-y-6 flex flex-col justify-between border ${
              plan === 'FREE' ? 'border-slate-900 ring-2 ring-slate-900 shadow-md bg-white' : 'border-slate-200/80 bg-white/80'
            }`}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Free Tier</h3>
                  <p className="text-xs text-slate-500">For small teams getting started</p>
                </div>
                {plan === 'FREE' && <Badge variant="secondary">CURRENT PLAN</Badge>}
              </div>

              <div className="space-y-1">
                <span className="text-3xl font-extrabold text-slate-900">₹0</span>
                <span className="text-xs text-slate-500 font-medium"> / forever</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>1 Support Agent Seat</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Max 25 Tickets / Month</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Basic Email Support</span>
                </li>
                <li className="flex items-center gap-2 text-slate-400">
                  <Check className="w-4 h-4 text-slate-300 shrink-0" />
                  <span>Real-Time Socket Chat</span>
                </li>
              </ul>
            </div>

            <Button
              variant="outline"
              disabled={plan === 'FREE'}
              className="w-full font-bold mt-4 border-slate-200"
            >
              {plan === 'FREE' ? 'Active Plan' : 'Revert to Free'}
            </Button>
          </Card>

          {/* TIER 2: STANDARD PLAN */}
          <Card
            glass
            className={`p-6 space-y-6 flex flex-col justify-between border relative ${
              plan === 'STANDARD'
                ? 'border-indigo-600 ring-2 ring-indigo-600 shadow-lg bg-white'
                : 'border-indigo-200 bg-white'
            }`}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Standard Plan</h3>
                  <p className="text-xs text-slate-500">For growing customer support teams</p>
                </div>
                {plan === 'STANDARD' && <Badge variant="info">CURRENT PLAN</Badge>}
              </div>

              <div className="space-y-1">
                <span className="text-3xl font-extrabold text-indigo-600">
                  {billingCycle === 'yearly' ? '₹24,990' : '₹2,499'}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {billingCycle === 'yearly' ? ' / year (Save ₹4,998)' : ' / month'}
                </span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Up to 5 Support Agent Seats</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Unlimited Monthly Tickets</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Socket.IO Real-Time Chat</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Reports & Analytics Dashboard</span>
                </li>
              </ul>
            </div>

            <Button
              variant={plan === 'STANDARD' ? 'outline' : 'primary'}
              onClick={() => handleUpgradePlan('STANDARD')}
              disabled={orderMutation.isPending || verifyMutation.isPending || plan === 'STANDARD'}
              className="w-full font-bold mt-4 bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
            >
              {orderMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : plan === 'STANDARD' ? (
                'Current Plan'
              ) : (
                `Select Standard (${billingCycle})`
              )}
            </Button>
          </Card>

          {/* TIER 3: BUSINESS PLAN */}
          <Card
            glass
            className={`p-6 space-y-6 flex flex-col justify-between border relative ${
              plan === 'BUSINESS'
                ? 'border-purple-600 ring-2 ring-purple-600 shadow-xl bg-white'
                : 'border-purple-200 bg-white'
            }`}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Business Plan</h3>
                  <p className="text-xs text-slate-500">For enterprise scale operations</p>
                </div>
                {plan === 'BUSINESS' ? (
                  <Badge variant="purple">CURRENT PLAN</Badge>
                ) : (
                  <Badge variant="purple" className="text-[10px] uppercase font-bold">
                    MOST POPULAR
                  </Badge>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-3xl font-extrabold text-purple-700">
                  {billingCycle === 'yearly' ? '₹64,990' : '₹6,499'}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {billingCycle === 'yearly' ? ' / year (Save ₹12,998)' : ' / month'}
                </span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Up to 20 Support Agent Seats</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span><strong>Unlimited Tickets & Storage</strong></span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Priority SLA Support</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Full Analytics & Date Filtering</span>
                </li>
              </ul>
            </div>

            <Button
              variant={plan === 'BUSINESS' ? 'outline' : 'primary'}
              onClick={() => handleUpgradePlan('BUSINESS')}
              disabled={orderMutation.isPending || verifyMutation.isPending || plan === 'BUSINESS'}
              className="w-full font-bold mt-4 bg-purple-700 hover:bg-purple-800 text-white border-purple-700"
            >
              {orderMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : plan === 'BUSINESS' ? (
                'Current Plan'
              ) : (
                `Select Business (${billingCycle})`
              )}
            </Button>
          </Card>
        </div>
      </div>

      {/* Invoice & Billing Receipts History Table */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" /> Razorpay Payment & Invoice Receipts
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              Official payment logs and billing audit history
            </p>
          </div>
        </div>

        <Card glass className="overflow-hidden border border-slate-200/80 p-0">
          {billingHistory.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No billing invoices recorded yet. Active plan is on standard billing cycle.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Payment ID</th>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {billingHistory.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">{item.razorpayPaymentId}</td>
                      <td className="py-3 px-4 text-slate-500">{item.razorpayOrderId || 'N/A'}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        ₹{(item.amountPaid / 100).toLocaleString('en-IN')} {item.currency}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="success" className="text-[10px] uppercase">
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(item.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
