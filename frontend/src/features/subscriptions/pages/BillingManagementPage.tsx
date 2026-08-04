import React, { useState } from 'react';
import {
  useSubscriptionDetails,
  useCreateRazorpayOrder,
  useVerifyRazorpayPayment,
  useCancelSubscription,
  useScheduleDowngrade,
} from '../hooks/useSubscriptions';
import { Card } from '../../../shared/components/ui/Card';
import { Badge } from '../../../shared/components/ui/Badge';
import { Button } from '../../../shared/components/ui/Button';
import { Dialog } from '../../../shared/components/ui/Dialog';
import {
  CreditCard,
  CheckCircle2,
  Users,
  Ticket,
  Loader2,
  AlertCircle,
  FileText,
  Sparkles,
  XCircle,
  Clock,
  Calendar,
  Check,
  Zap,
  ArrowDownCircle,
  RefreshCw,
  Hash,
} from 'lucide-react';
import toast from 'react-hot-toast';

export const BillingManagementPage: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDowngradeToStandardModalOpen, setIsDowngradeToStandardModalOpen] = useState(false);
  const [upgradingPlan, setUpgradingPlan] = useState<'STANDARD' | 'BUSINESS' | null>(null);

  const { data, isLoading } = useSubscriptionDetails();
  const orderMutation = useCreateRazorpayOrder();
  const verifyMutation = useVerifyRazorpayPayment();
  const cancelMutation = useCancelSubscription();
  const downgradeMutation = useScheduleDowngrade();

  const subscriptionData = data || {
    plan: 'FREE',
    subscriptionStatus: 'ACTIVE',
    billingCycle: null,
    cancelAtPeriodEnd: false,
    pendingDowngradePlan: null,
    currentPeriodEnd: null,
    nextBillingDate: null,
    lastPaymentAt: null,
    daysRemaining: null,
    razorpayCustomerId: null,
    usage: {
      agents: { used: 0, max: 1, percentage: 0 },
      tickets: { used: 0, max: 25, percentage: 0 },
    },
    billingHistory: [],
  };

  const {
    plan,
    subscriptionStatus,
    billingCycle: currentBillingCycle,
    cancelAtPeriodEnd,
    pendingDowngradePlan,
    currentPeriodEnd,
    daysRemaining,
    billingHistory = [],
  } = subscriptionData;

  const usage = subscriptionData.usage || {
    agents: { used: 0, max: 0, percentage: 0 },
    tickets: { used: 0, max: 0, percentage: 0 },
  };

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
    setUpgradingPlan(targetPlan);
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
          order_id: orderData.orderId,
          prefill: {
            name: orderData.businessName || 'Business Admin',
            email: orderData.userEmail || '',
          },
          theme: { color: '#4f46e5' },
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
      // Handled in mutation onError
    } finally {
      setUpgradingPlan(null);
    }
  };

  const handleScheduleDowngradeToStandard = async () => {
    await downgradeMutation.mutateAsync('STANDARD');
    setIsDowngradeToStandardModalOpen(false);
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (paise: number, currency: string) => {
    const amount = paise / 100;
    if (currency === 'INR') {
      return `₹${amount.toLocaleString('en-IN')}`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  };

  const isAnyMutationPending =
    upgradingPlan !== null ||
    verifyMutation.isPending ||
    cancelMutation.isPending ||
    downgradeMutation.isPending;

  // Plan button logic
  const getFreePlanButton = () => {
    if (plan === 'FREE') return <Button variant="outline" disabled className="w-full font-bold mt-4 border-slate-200">Current Plan</Button>;
    if (cancelAtPeriodEnd && pendingDowngradePlan === 'FREE') {
      return (
        <Button variant="outline" disabled className="w-full font-bold mt-4 border-amber-200 text-amber-700 bg-amber-50">
          <Calendar className="w-4 h-4 mr-1.5" />
          Reverts to Free on {formatDate(currentPeriodEnd)}
        </Button>
      );
    }
    return (
      <Button
        variant="outline"
        onClick={() => setIsCancelModalOpen(true)}
        disabled={isAnyMutationPending}
        className="w-full font-bold mt-4 border-slate-200 text-slate-600 hover:bg-slate-50"
      >
        Revert to Free
      </Button>
    );
  };

  const getStandardPlanButton = () => {
    if (plan === 'STANDARD' && !cancelAtPeriodEnd) {
      return (
        <Button variant="outline" disabled className="w-full font-bold mt-4 border-indigo-200 text-indigo-600">
          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Current Plan
        </Button>
      );
    }
    if (plan === 'BUSINESS') {
      if (cancelAtPeriodEnd && pendingDowngradePlan === 'STANDARD') {
        return (
          <Button variant="outline" disabled className="w-full font-bold mt-4 border-amber-200 text-amber-700 bg-amber-50">
            <Calendar className="w-4 h-4 mr-1.5" />
            Downgrades on {formatDate(currentPeriodEnd)}
          </Button>
        );
      }
      if (cancelAtPeriodEnd) {
        // Already cancelling to FREE, can't also schedule to STANDARD
        return (
          <Button variant="outline" disabled className="w-full font-bold mt-4 border-slate-200 text-slate-400">
            Cancellation Scheduled
          </Button>
        );
      }
      return (
        <Button
          variant="outline"
          onClick={() => setIsDowngradeToStandardModalOpen(true)}
          disabled={isAnyMutationPending}
          isLoading={downgradeMutation.isPending}
          className="w-full font-bold mt-4 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
        >
          <ArrowDownCircle className="w-4 h-4 mr-1.5" /> Schedule Downgrade to Standard
        </Button>
      );
    }
    // Upgrade from FREE
    return (
      <Button
        variant="primary"
        onClick={() => handleUpgradePlan('STANDARD')}
        disabled={isAnyMutationPending}
        isLoading={upgradingPlan === 'STANDARD'}
        className="w-full font-bold mt-4 bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600"
      >
        Upgrade to Standard ({billingCycle})
      </Button>
    );
  };

  const getBusinessPlanButton = () => {
    if (plan === 'BUSINESS' && !cancelAtPeriodEnd) {
      return (
        <Button variant="outline" disabled className="w-full font-bold mt-4 border-purple-200 text-purple-700">
          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Current Plan
        </Button>
      );
    }
    if (plan === 'BUSINESS' && cancelAtPeriodEnd) {
      return (
        <Button
          variant="primary"
          onClick={() => handleUpgradePlan('BUSINESS')}
          disabled={isAnyMutationPending}
          isLoading={upgradingPlan === 'BUSINESS'}
          className="w-full font-bold mt-4 bg-purple-700 hover:bg-purple-800 text-white"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" /> Renew Business Plan ({billingCycle})
        </Button>
      );
    }
    // Upgrade from FREE or STANDARD
    return (
      <Button
        variant="primary"
        onClick={() => handleUpgradePlan('BUSINESS')}
        disabled={isAnyMutationPending}
        isLoading={upgradingPlan === 'BUSINESS'}
        className="w-full font-bold mt-4 bg-purple-700 hover:bg-purple-800 text-white border-purple-700"
      >
        {plan === 'STANDARD' ? `Upgrade to Business (${billingCycle})` : `Select Business (${billingCycle})`}
      </Button>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans pb-12 max-w-6xl mx-auto">
      {/* ── Header Banner ───────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Billing &amp; Subscriptions
              </h1>
              <Badge
                variant={plan === 'BUSINESS' ? 'purple' : plan === 'STANDARD' ? 'info' : 'secondary'}
                className="text-xs font-bold uppercase tracking-wider"
              >
                {plan} PLAN
              </Badge>

              {/* Active / Scheduled Cancellation / Cancellation Pending */}
              {cancelAtPeriodEnd ? (
                <Badge variant="warning" className="text-xs font-bold">
                  {pendingDowngradePlan === 'STANDARD' ? '⬇ DOWNGRADE SCHEDULED' : '⚠ CANCELS AT PERIOD END'}
                </Badge>
              ) : subscriptionStatus === 'CANCELED' ? (
                <Badge variant="warning" className="text-xs font-bold">CANCELED</Badge>
              ) : subscriptionStatus === 'PAST_DUE' ? (
                <Badge variant="danger" className="text-xs font-bold">⚠ PAST DUE</Badge>
              ) : (
                <Badge variant="success" className="text-xs font-bold">ACTIVE</Badge>
              )}
            </div>
            <p className="text-sm text-slate-500 font-normal">
              Manage your subscription plans, agent seat allocations, and invoices
            </p>
          </div>

          {/* Cancel button — only shown when on paid plan and not already cancelling */}
          {plan !== 'FREE' && !cancelAtPeriodEnd && (
            <Button
              variant="outline"
              onClick={() => setIsCancelModalOpen(true)}
              disabled={isAnyMutationPending}
              className="font-semibold border-rose-200 text-rose-600 hover:bg-rose-50 shrink-0 shadow-xs"
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

        {/* Billing Period Timeline */}
        {plan !== 'FREE' && currentPeriodEnd && (
          <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2 text-slate-700 font-semibold">
                <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  {cancelAtPeriodEnd
                    ? `${pendingDowngradePlan === 'STANDARD' ? 'Downgrades to Standard' : 'Reverts to Free'}: ${formatDate(currentPeriodEnd)}`
                    : `Period Ends: ${formatDate(currentPeriodEnd)}`}
                </span>
              </div>
              {currentBillingCycle && (
                <span className="text-slate-400 font-medium capitalize">
                  Billing: {currentBillingCycle}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold">
              <Clock className="w-3.5 h-3.5" />
              {daysRemaining} day(s) remaining
            </div>
          </div>
        )}

        {/* Past Due Warning */}
        {subscriptionStatus === 'PAST_DUE' && (
          <div className="pt-3 border-t border-rose-100 bg-rose-50 -mx-6 px-6 py-3 rounded-b-2xl">
            <p className="text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              Your subscription has expired. Please renew your plan to restore premium features. Your data is safe.
            </p>
          </div>
        )}
      </div>

      {/* ── Quota Usage Cards ────────────────────────────────────────────────── */}
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
          <div className="space-y-2">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${usage.agents.percentage >= 100 ? 'bg-rose-500' : 'bg-indigo-600'}`}
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

        {/* Monthly Ticket Quota */}
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
          <div className="space-y-2">
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: plan === 'FREE' ? `${usage.tickets.percentage}%` : '0%' }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>{plan === 'FREE' ? `${usage.tickets.percentage}% Used` : 'Unlimited Volume'}</span>
              <span>{plan === 'FREE' ? 'Resets on 1st of month' : 'No ticket limits'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* ── Plan Selection ───────────────────────────────────────────────────── */}
      <div className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Subscription Plans</h2>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Upgrade, downgrade, or change plans — changes take effect at period end
            </p>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center shrink-0 self-start sm:self-auto border border-slate-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                billingCycle === 'yearly' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" /> Yearly (2 Months Free!)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* FREE PLAN */}
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
                {cancelAtPeriodEnd && pendingDowngradePlan === 'FREE' && (
                  <Badge variant="warning" className="text-[10px]">PENDING</Badge>
                )}
              </div>

              <div className="space-y-1">
                <span className="text-3xl font-extrabold text-slate-900">₹0</span>
                <span className="text-xs text-slate-500 font-medium"> / forever</span>
              </div>

              <ul className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /><strong>1 Support Agent Seat</strong></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" />Max 25 Tickets / Month</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" />Basic Email Support</li>
                <li className="flex items-center gap-2 text-slate-400"><Check className="w-4 h-4 text-slate-300 shrink-0" />Real-Time Socket Chat</li>
              </ul>
            </div>
            {getFreePlanButton()}
          </Card>

          {/* STANDARD PLAN */}
          <Card
            glass
            className={`p-6 space-y-6 flex flex-col justify-between border relative ${
              plan === 'STANDARD' ? 'border-indigo-600 ring-2 ring-indigo-600 shadow-lg bg-white' : 'border-indigo-200 bg-white'
            }`}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Standard Plan</h3>
                  <p className="text-xs text-slate-500">For growing customer support teams</p>
                </div>
                {plan === 'STANDARD' && !cancelAtPeriodEnd && <Badge variant="info">CURRENT PLAN</Badge>}
                {cancelAtPeriodEnd && pendingDowngradePlan === 'STANDARD' && (
                  <Badge variant="warning" className="text-[10px]">PENDING DOWNGRADE</Badge>
                )}
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
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /><strong>Up to 5 Support Agent Seats</strong></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /><strong>Unlimited Monthly Tickets</strong></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" />Socket.IO Real-Time Chat</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" />Reports &amp; Analytics Dashboard</li>
              </ul>
            </div>
            {getStandardPlanButton()}
          </Card>

          {/* BUSINESS PLAN */}
          <Card
            glass
            className={`p-6 space-y-6 flex flex-col justify-between border relative ${
              plan === 'BUSINESS' ? 'border-purple-600 ring-2 ring-purple-600 shadow-xl bg-white' : 'border-purple-200 bg-white'
            }`}
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Business Plan</h3>
                  <p className="text-xs text-slate-500">For enterprise scale operations</p>
                </div>
                {plan === 'BUSINESS' && !cancelAtPeriodEnd ? (
                  <Badge variant="purple">CURRENT PLAN</Badge>
                ) : plan === 'BUSINESS' && cancelAtPeriodEnd ? (
                  <Badge variant="warning" className="text-[10px]">
                    {pendingDowngradePlan === 'STANDARD' ? '⬇ TO STANDARD' : '⬇ TO FREE'}
                  </Badge>
                ) : (
                  <Badge variant="purple" className="text-[10px] uppercase font-bold">MOST POPULAR</Badge>
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
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /><strong>Up to 20 Support Agent Seats</strong></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" /><strong>Unlimited Tickets &amp; Storage</strong></li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" />Priority SLA Support</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500 shrink-0" />Full Analytics &amp; Date Filtering</li>
              </ul>
            </div>
            {getBusinessPlanButton()}
          </Card>
        </div>
      </div>

      {/* ── Billing History ──────────────────────────────────────────────────── */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" /> Payment &amp; Invoice History
            </h2>
            <p className="text-xs text-slate-500 font-normal">Official payment logs and billing audit trail</p>
          </div>
        </div>

        <Card glass className="overflow-hidden border border-slate-200/80 p-0">
          {billingHistory.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400 space-y-2">
              <CreditCard className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No billing invoices recorded yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Billing Cycle</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Payment ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {billingHistory.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-indigo-700 flex items-center gap-1.5">
                        <Hash className="w-3 h-3 text-indigo-400" />
                        {item.invoiceNumber || '—'}
                      </td>
                      <td className="py-3 px-4">
                        {item.planAtPayment ? (
                          <Badge
                            variant={item.planAtPayment === 'BUSINESS' ? 'purple' : item.planAtPayment === 'STANDARD' ? 'info' : 'secondary'}
                            className="text-[10px] uppercase"
                          >
                            {item.planAtPayment}
                          </Badge>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-500">{item.billingCycle || '—'}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{formatAmount(item.amountPaid, item.currency)}</td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={item.status === 'captured' || item.status === 'test_captured' ? 'success' : 'danger'}
                          className="text-[10px] uppercase"
                        >
                          {item.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{formatDate(item.createdAt)}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[10px]">{item.razorpayPaymentId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ── Cancel to FREE Modal ─────────────────────────────────────────────── */}
      <Dialog isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} className="max-w-md">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Schedule Cancellation?</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
              Your <strong>{plan} plan</strong> will remain fully active until{' '}
              <strong>{formatDate(currentPeriodEnd)}</strong>, then your workspace will automatically
              revert to the <strong>Free plan</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-rose-50/60 border border-rose-100/50 rounded-2xl text-xs font-semibold text-rose-950 text-left space-y-1">
            <p>⚠️ Support seats will revert to <strong>1 agent</strong> at period end.</p>
            <p>⚠️ Ticket quota will cap at <strong>25 tickets per month</strong>.</p>
            <p>✅ Access continues uninterrupted until <strong>{formatDate(currentPeriodEnd)}</strong>.</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsCancelModalOpen(false)}
              className="flex-1 font-bold text-slate-600 hover:bg-slate-50 rounded-xl"
            >
              No, Keep Plan
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                await cancelMutation.mutateAsync();
                setIsCancelModalOpen(false);
              }}
              disabled={cancelMutation.isPending}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md"
            >
              {cancelMutation.isPending ? 'Scheduling...' : 'Yes, Schedule Cancellation'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* ── Downgrade to Standard Modal ──────────────────────────────────────── */}
      <Dialog isOpen={isDowngradeToStandardModalOpen} onClose={() => setIsDowngradeToStandardModalOpen(false)} className="max-w-md">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
            <ArrowDownCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Downgrade to Standard Plan?</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
              Your <strong>Business plan</strong> will remain active until{' '}
              <strong>{formatDate(currentPeriodEnd)}</strong>. After that, your workspace will
              automatically switch to the <strong>Standard plan</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-indigo-50/60 border border-indigo-100/50 rounded-2xl text-xs font-semibold text-indigo-900 text-left space-y-1">
            <p>✅ You keep Business plan features until <strong>{formatDate(currentPeriodEnd)}</strong>.</p>
            <p>⬇️ Seats will reduce to <strong>5 agents</strong> on Standard plan.</p>
            <p>💡 You can upgrade back to Business anytime before expiry.</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDowngradeToStandardModalOpen(false)}
              className="flex-1 font-bold text-slate-600 hover:bg-slate-50 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleScheduleDowngradeToStandard}
              disabled={downgradeMutation.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
            >
              {downgradeMutation.isPending ? 'Scheduling...' : 'Schedule Downgrade'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
