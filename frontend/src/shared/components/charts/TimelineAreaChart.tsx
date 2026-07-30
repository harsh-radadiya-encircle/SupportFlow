import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import { Loader2, FileSpreadsheet } from 'lucide-react';

export interface TimelineDataPoint {
  date: string;
  Created: number;
  Resolved: number;
}

interface TimelineAreaChartProps {
  data: TimelineDataPoint[];
  isLoading?: boolean;
  emptyMessage?: string;
  height?: number;
}

export const TimelineAreaChart: React.FC<TimelineAreaChartProps> = ({
  data,
  isLoading = false,
  emptyMessage = 'No timeline data available',
  height = 256,
}) => {
  if (isLoading) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-xs text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" /> Loading timeline chart...
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div style={{ height }} className="flex flex-col items-center justify-center text-center p-6">
        <FileSpreadsheet className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-xs text-slate-400 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              fontWeight: '600',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
          <Area type="monotone" dataKey="Created" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCreated)" />
          <Area type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorResolved)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
