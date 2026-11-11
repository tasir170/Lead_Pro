import React from 'react';
import { StatusStat } from '../../types';

interface StatusDistributionChartProps {
  data: StatusStat[];
}

export const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
        No status distribution data available.
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
        {data.map((item) => {
          const barWidth = Math.max(5, Math.round((item.count / maxCount) * 100));

          return (
            <div
              key={item.status}
              className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-slate-100/50 transition-colors"
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>{item.label}</span>
                </div>
                <div className="font-mono text-[11px] tabular-nums">
                  <span className="font-semibold text-slate-900">{item.count}</span>
                  <span className="text-slate-400 ml-1">({item.percentage}%)</span>
                </div>
              </div>

              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${barWidth}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
