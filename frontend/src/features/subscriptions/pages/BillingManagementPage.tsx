import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  useSubscriptionDetails,
  useCreateCheckoutSession,
  useCreateBillingPortal,
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
} from 'lucide-react';

export const BillingManagementPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isSuccess = searchParams.get('success') === 'true';
  const isCanceled = searchParams.get('canceled') === 'true';
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const { data } = useSubscriptionDetails();
  const checkoutMutation = useCreateCheckoutSession();
  const portalMutation = useCreateBillingPortal();

  // Robust Fallback Data so the Page & Pricing Cards ALWAYS render seamlessly!
  const subscriptionData = data || {
    plan: 'FREE',
    subscriptionStatus: 'ACTIVE',
    stripeCustomerId: null,
    usage: {
      agents: { used: 1, max: 1, percentage: 100 },
      tickets: { used: 12, max: 25, percentage: 48 },
    },
    billingHistory: [],
  };

  const { plan, usage, billingHistory, stripeCustomerId } = subscriptionData;

  return (
    <div className="space-y-8 font-sans">
      {/* Stripe Payment Success / Cancel Notifications */}
      {isSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">Subscription Upgraded Successfully! 🎉</p>
              <p className="text-xs text-emerald-700 font-medium">
                Your new subscription limits are now active. Enjoy expanded agent seat limits and unlimited tickets!
              </p>
            </div>
          </div>
        </div>
      )}

      {isCanceled && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-xs font-semibold text-amber-900">
            Payment checkout session was canceled. Your current subscription plan remains unchanged.
          </p>
        </div>
      )}

      {/* Workspace Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Billing & Subscription</h1>
            <Badge
              variant={plan === 'BUSINESS' ? 'purple' : plan === 'STANDARD' ? 'info' : 'secondary'}
              className="text-xs font-bold uppercase tracking-wider"
            >
              {plan} PLAN
            </Badge>
          </div>
          <p className="text-sm text-slate-500 font-normal">
            Manage your subscription plan, seat allocations, and Stripe invoices
          </p>
        </div>

        {stripeCustomerId && (
          <Button
            variant="outline"
            onClick={() => portalMutation.mutate()}
            disabled={portalMutation.isPending}
            className="font-semibold border-slate-300 text-slate-700 hover:bg-slate-50 shrink-0 shadow-sm"
          >
            {portalMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4 mr-2 text-slate-500" />
            )}
            Manage Billing & Payment Methods
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
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Available Subscription Plans</h2>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Choose the right plan to scale your customer support team
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
                <p className="text-xs text-slate-500 font-normal">Ideal for small businesses starting out</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-slate-900">$0</span>
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
                  <span>Real-Time Socket Live Chat</span>
                </li>
                <li className="flex items-center gap-2.5 pt-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>FCM Browser Push Notifications</span>
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
                  ${billingCycle === 'monthly' ? '29' : '23'}
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
              disabled={plan === 'STANDARD' || checkoutMutation.isPending}
              onClick={() => checkoutMutation.mutate('STANDARD')}
              variant="primary"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md py-2.5"
            >
              {checkoutMutation.isPending && checkoutMutation.variables === 'STANDARD' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : plan === 'STANDARD' ? (
                'Active Plan'
              ) : (
                'Upgrade to Standard ($29/mo)'
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
                  ${billingCycle === 'monthly' ? '79' : '63'}
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
              disabled={plan === 'BUSINESS' || checkoutMutation.isPending}
              onClick={() => checkoutMutation.mutate('BUSINESS')}
              variant="primary"
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md py-2.5"
            >
              {checkoutMutation.isPending && checkoutMutation.variables === 'BUSINESS' ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : plan === 'BUSINESS' ? (
                'Active Plan'
              ) : (
                'Upgrade to Business ($79/mo)'
              )}
            </Button>
          </Card>
        </div>
      </div>

      {/* Billing Invoice History */}
      <Card glass className="p-6 space-y-4 border border-slate-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-slate-700" />
            <h3 className="text-base font-bold text-slate-900">Invoice Billing History</h3>
          </div>
        </div>

        {billingHistory.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 font-normal">
            No invoice payments recorded yet.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase font-semibold border-b border-slate-100 text-[10px]">
                  <th className="pb-3">Invoice ID</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {billingHistory.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 font-mono font-medium text-slate-700">{invoice.stripeInvoiceId}</td>
                    <td className="py-3 font-bold text-slate-900">
                      ${(invoice.amountPaid / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                    </td>
                    <td className="py-3">
                      <Badge variant="success" className="text-[10px]">
                        {invoice.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-slate-500 font-normal">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      {invoice.pdfUrl ? (
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 font-semibold hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" /> PDF Receipt
                        </a>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
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
