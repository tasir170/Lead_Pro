import React from 'react';
import { QualityTierStat } from '../../types';
import { Flame, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';

interface QualityDistributionChartProps {
  data: QualityTierStat[];
}

export const QualityDistributionChart: React.FC<QualityDistributionChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
        No quality tier records available.
      </div>
    );
  }

  const getTierIcon = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'hot':
        return <Flame className="w-3.5 h-3.5 text-emerald-600" />;
      case 'warm':
        return <Sparkles className="w-3.5 h-3.5 text-blue-600" />;
      case 'potential':
        return <TrendingUp className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <HelpCircle className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Visual Stacked Bar */}
      <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-100">
        {data.map((item) => (
          <div
            key={item.tier}
            style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
            className="h-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
            title={`${item.label}: ${item.count} (${item.percentage}%)`}
          />
        ))}
      </div>

      {/* Grid of Tiers */}
      <div className="grid grid-cols-2 gap-2.5">
        {data.map((item) => (
          <div
            key={item.tier}
            className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-100/60 transition-colors"
          >
            <div className="flex items-center justify-between text-xs mb-1">
              <div className="flex items-center gap-1.5 font-medium text-slate-800">
                {getTierIcon(item.tier)}
                <span>{item.label}</span>
              </div>
              <span className="font-mono font-semibold text-slate-900 text-sm tabular-nums">
                {item.count}
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
              <span>Score: {item.scoreRange}</span>
              <span className="font-semibold" style={{ color: item.color }}>
                {item.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
