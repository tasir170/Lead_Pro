import React from 'react';
import { QualityBreakdown } from '../../types';

interface QualityDistributionChartProps {
  data: QualityBreakdown[];
}

export const QualityDistributionChart: React.FC<QualityDistributionChartProps> = ({ data }) => {
  const colorMap: Record<string, { bar: string; text: string; bg: string }> = {
    high: { bar: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    medium: { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
    low: { bar: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100' },
  };

  return (
    <div className="space-y-4">
      {/* Visual multi-segment bar */}
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
        {data.map((item) => (
          <div
            key={item.tier}
            style={{ width: `${item.percentage}%` }}
            className={`${colorMap[item.tier]?.bar || 'bg-slate-400'} transition-all duration-300`}
            title={`${item.label}: ${item.percentage}%`}
          />
        ))}
      </div>

      {/* Breakdown list */}
      <div className="space-y-3 pt-2">
        {data.map((item) => {
          const colors = colorMap[item.tier] || colorMap.low;
          return (
            <div key={item.tier} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${colors.bar}`} />
                <span className="font-medium text-slate-700">{item.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono tabular-nums text-slate-500">{item.count} leads</span>
                <span className={`font-mono tabular-nums font-semibold ${colors.text} px-2 py-0.5 rounded ${colors.bg}`}>
                  {item.percentage}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 leading-relaxed">
        AI Score combines executive title authority, company revenue scale, tech stack indicators, and hiring signals.
      </div>
    </div>
  );
};
