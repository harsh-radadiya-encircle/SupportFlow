import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from './Card';
import { ArrowRight, Loader2, TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg: string;
  isLoading?: boolean;
  trend?: { value: string; positive: boolean };
  link?: { label: string; to: string };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  sub,
  icon,
  iconBg,
  isLoading,
  trend,
  link,
  className = '',
}) => (
  <Card glass className={`p-5 border border-slate-200/80 shadow-sm space-y-3 ${className}`}>
    <div className="flex items-start justify-between">
      <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
            trend.positive
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-rose-50 text-rose-700'
          }`}
        >
          {trend.positive ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {trend.value}
        </div>
      )}
    </div>
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin text-indigo-500 mt-1.5" />
      ) : (
        <p className="text-2xl font-extrabold text-slate-900 mt-0.5 leading-tight">{value}</p>
      )}
      {sub && !isLoading && <p className="text-[11px] text-slate-400 font-medium mt-0.5">{sub}</p>}
    </div>
    {link && (
      <Link
        to={link.to}
        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 pt-1 border-t border-slate-100"
      >
        {link.label} <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    )}
  </Card>
);
