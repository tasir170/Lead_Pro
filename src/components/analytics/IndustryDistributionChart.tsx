import React from 'react';
import { IndustryStat } from '../../types';
import { Building2 } from 'lucide-react';

interface IndustryDistributionChartProps {
  data: IndustryStat[];
  onSelectIndustry?: (industry: string) => void;
  selectedIndustry?: string;
}

export const IndustryDistributionChart: React.FC<IndustryDistributionChartProps> = ({
  data,
  onSelectIndustry,
  selectedIndustry,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
        No industry distribution data available.
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-3">
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {data.map((item) => {
          const isSelected = selectedIndustry?.toLowerCase() === item.industry.toLowerCase();
          const barWidth = Math.max(8, Math.round((item.count / maxCount) * 100));

          return (
            <div
              key={item.industry}
              onClick={() => onSelectIndustry?.(item.industry)}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                  : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100/70 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0 pr-2">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-medium text-slate-800 truncate" title={item.industry}>
                    {item.industry}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] tabular-nums">
                  <span className="font-semibold text-slate-900">{item.count} leads</span>
                  <span className="text-slate-400">({item.percentage}%)</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              {/* Metrics footer */}
              <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500 font-mono">
                <span>Avg AI Score: <strong className="text-slate-700">{item.avgScore}/100</strong></span>
                <span>Win Rate: <strong className="text-emerald-600">{item.conversionRate}%</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
