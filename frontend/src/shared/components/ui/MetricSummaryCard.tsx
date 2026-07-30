import React from 'react';
import { Card } from './Card';
import { LucideIcon } from 'lucide-react';

interface MetricSummaryCardProps {
  title: string;
  value: string | number;
  subtext?: React.ReactNode;
  icon: LucideIcon;
  iconBgColor?: string;
  iconTextColor?: string;
  borderColor?: string;
}

export const MetricSummaryCard: React.FC<MetricSummaryCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  iconBgColor = 'bg-indigo-50 border-indigo-100',
  iconTextColor = 'text-indigo-600',
  borderColor = 'border-slate-200/80',
}) => {
  return (
    <Card glass className={`p-6 space-y-3 border ${borderColor}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${iconBgColor} ${iconTextColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-slate-900 leading-none">{value}</p>
        {subtext && <div className="mt-2 text-xs font-bold">{subtext}</div>}
      </div>
    </Card>
  );
};
