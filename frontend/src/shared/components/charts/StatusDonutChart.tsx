import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Loader2, FileSpreadsheet } from 'lucide-react';

export interface DonutChartItem {
  name: string;
  value: number;
  color: string;
}

interface StatusDonutChartProps {
  data: DonutChartItem[];
  isLoading?: boolean;
  emptyMessage?: string;
  height?: number;
}

export const StatusDonutChart: React.FC<StatusDonutChartProps> = ({
  data,
  isLoading = false,
  emptyMessage = 'No chart data available',
  height = 256,
}) => {
  const filteredData = data.filter((item) => item.value > 0);

  if (isLoading) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-xs text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-indigo-600" /> Loading chart data...
      </div>
    );
  }

  if (filteredData.length === 0) {
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
        <PieChart>
          <Pie
            data={filteredData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={4}
            dataKey="value"
          >
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              fontSize: '12px',
              fontWeight: '600',
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            formatter={(value) => <span className="text-slate-700 font-medium">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
