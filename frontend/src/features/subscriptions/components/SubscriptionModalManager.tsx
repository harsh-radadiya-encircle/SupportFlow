import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionDetails } from '../hooks/useSubscriptions';
import { Card } from '../../../shared/components/ui/Card';
import { Button } from '../../../shared/components/ui/Button';
import { Dialog } from '../../../shared/components/ui/Dialog';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  X,
  CreditCard,
  Zap,
} from 'lucide-react';

export const SubscriptionModalManager: React.FC = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useSubscriptionDetails();
  const [isOpen, setIsOpen] = useState(false);
  const [modalType, setModalType] = useState<'UPGRADE' | 'RENEWAL' | 'EXPIRY' | null>(null);

  useEffect(() => {
    if (isLoading || !data) return;

    const { plan, subscriptionStatus, daysRemaining } = data;

    // 1. FREE PLAN PROMPT
    if (plan === 'FREE') {
      const isPrompted = sessionStorage.getItem('sf_free_prompt_shown');
      if (!isPrompted) {
        setModalType('UPGRADE');
        setIsOpen(true);
      }
      return;
    }

    // Paid Plan logic
    if (daysRemaining !== null && daysRemaining <= 5) {
      // 2. EXPIRY ALERT (Plan is Canceled / will downgrade to FREE)
      if (subscriptionStatus === 'CANCELED') {
        const isPrompted = sessionStorage.getItem('sf_expire_prompt_shown');
        if (!isPrompted) {
          setModalType('EXPIRY');
          setIsOpen(true);
        }
      }
      // 3. AUTO-RENEWAL PROMPT (Plan is Active / will charge card)
      else if (subscriptionStatus === 'ACTIVE') {
        const isPrompted = sessionStorage.getItem('sf_renew_prompt_shown');
        if (!isPrompted) {
          setModalType('RENEWAL');
          setIsOpen(true);
        }
      }
    }
  }, [data, isLoading]);

  const handleClose = () => {
    setIsOpen(false);
    if (modalType === 'UPGRADE') {
      sessionStorage.setItem('sf_free_prompt_shown', 'true');
    } else if (modalType === 'EXPIRY') {
      sessionStorage.setItem('sf_expire_prompt_shown', 'true');
    } else if (modalType === 'RENEWAL') {
      sessionStorage.setItem('sf_renew_prompt_shown', 'true');
    }
  };

  const handleNavigateToBilling = () => {
    handleClose();
    navigate('/business/billing');
  };

  if (!isOpen || !modalType || !data) {
    return null;
  }

  const { daysRemaining, currentPeriodEnd } = data;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} className="max-w-md">
      {/* Modal Content */}
      {modalType === 'UPGRADE' && (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Unlock Premium Power
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed max-w-sm mx-auto">
              You are currently on the <strong>Free Plan</strong>. Upgrade now to invite additional support agents, manage unlimited tickets, and provide lightning-fast resolution support.
            </p>
          </div>

          <div className="bg-slate-50/80 border border-slate-100 p-3 rounded-2xl text-left space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
              <Zap className="w-4 h-4 text-amber-500" /> Standard Plan: Up to 5 Agent Seats
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Business Plan: Up to 20 Agent Seats
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 font-bold text-slate-600 hover:bg-slate-50 rounded-xl"
            >
              Keep Free
            </Button>
            <Button
              variant="primary"
              onClick={handleNavigateToBilling}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md"
            >
              View Plans
            </Button>
          </div>
        </div>
      )}

      {modalType === 'RENEWAL' && (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-sm">
            <Clock className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">
              Auto-Renewal Reminder
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Your paid subscription is scheduled to auto-renew in{' '}
              <strong className="font-bold text-indigo-600">{daysRemaining} day(s)</strong> on{' '}
              <strong>{formatDate(currentPeriodEnd)}</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-indigo-50/50 border border-indigo-100/50 rounded-2xl text-xs font-semibold text-indigo-950 flex items-center gap-2 justify-center">
            <CreditCard className="w-4 h-4 text-indigo-600" /> Payment method will be automatically charged.
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 font-bold text-slate-600 hover:bg-slate-50 rounded-xl"
            >
              Close
            </Button>
            <Button
              variant="primary"
              onClick={handleNavigateToBilling}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md"
            >
              Manage Billing
            </Button>
          </div>
        </div>
      )}

      {modalType === 'EXPIRY' && (
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight text-rose-600">
              Action Required: Subscription Expiring
            </h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Your subscription was canceled and will expire in{' '}
              <strong className="font-bold text-rose-600">{daysRemaining} day(s)</strong> on{' '}
              <strong>{formatDate(currentPeriodEnd)}</strong>.
            </p>
          </div>

          <div className="p-3.5 bg-rose-50/60 border border-rose-100/50 rounded-2xl text-xs font-semibold text-rose-950 text-left space-y-1">
            <p>⚠️ Your workspaces will downgrade to the <strong>Free Plan</strong>.</p>
            <p>⚠️ Agent limit will revert to <strong>1 seat</strong> (extra agents will be suspended).</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1 font-bold text-slate-600 hover:bg-slate-50 rounded-xl"
            >
              Later
            </Button>
            <Button
              variant="primary"
              onClick={handleNavigateToBilling}
              className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md"
            >
              Reactivate Plan
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
};
