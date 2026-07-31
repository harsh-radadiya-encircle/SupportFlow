import React from 'react';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';

type AlertVariant = 'error' | 'success' | 'info' | 'warning';

const VARIANTS: Record<AlertVariant, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
  error: {
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
    icon: <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />,
  },
  success: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    icon: <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />,
  },
  info: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-800',
    icon: <Info className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />,
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    icon: <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />,
  },
};

interface AuthAlertProps {
  variant: AlertVariant;
  message: React.ReactNode;
}

/**
 * Reusable inline alert for auth forms (error, success, info, warning).
 */
export const AuthAlert: React.FC<AuthAlertProps> = ({ variant, message }) => {
  const { bg, border, text, icon } = VARIANTS[variant];
  return (
    <div
      className={`p-3.5 rounded-xl ${bg} border ${border} ${text} text-xs font-medium flex items-start gap-2 animate-in fade-in`}
    >
      {icon}
      <span>{message}</span>
    </div>
  );
};
