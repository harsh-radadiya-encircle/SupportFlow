import React from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Loader2, FileSpreadsheet } from 'lucide-react';

export interface BarChartItem {
  label: string;
  count: number;
  fill: string;
}

interface PriorityBarChartProps {
  data: BarChartItem[];
  isLoading?: boolean;
  emptyMessage?: string;
  height?: number;
}

export const PriorityBarChart: React.FC<PriorityBarChartProps> = ({
  data,
  isLoading = false,
  emptyMessage = 'No chart data available',
  height = 256,
}) => {
  const hasData = data.some((item) => item.count > 0);

  if (isLoading) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-xs text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" /> Loading chart data...
      </div>
    );
  }

  if (!hasData) {
    return (
      <div style={{ height }} className="flex flex-col items-center justify-center text-center p-6">
        <FileSpreadsheet className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-xs text-slate-400 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
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
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`bar-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
