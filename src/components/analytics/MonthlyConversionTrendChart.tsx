import React from 'react';
import { ConversionTrendPoint } from '../../types';
import { TrendingUp, CheckCircle2 } from 'lucide-react';

interface MonthlyConversionTrendChartProps {
  data: ConversionTrendPoint[];
}

export const MonthlyConversionTrendChart: React.FC<MonthlyConversionTrendChartProps> = ({
  data,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
        No monthly conversion cohorts recorded.
      </div>
    );
  }

  const maxTotal = Math.max(...data.map((d) => d.totalLeads), 1);

  return (
    <div className="space-y-3">
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {data.map((item) => {
          const totalBarWidth = Math.max(10, Math.round((item.totalLeads / maxTotal) * 100));
          const convertedBarWidth =
            item.totalLeads > 0 ? Math.round((item.convertedCount / item.totalLeads) * 100) : 0;

          return (
            <div
              key={item.period}
              className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                  <span>{item.period}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
                  <span className="text-slate-600">{item.totalLeads} total leads</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> {item.convertedCount} won ({item.conversionRate}%)
                  </span>
                </div>
              </div>

              {/* Stacked indicator bar */}
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full rounded-l-full transition-all duration-500"
                  style={{ width: `${convertedBarWidth}%` }}
                  title={`Converted: ${item.convertedCount}`}
                />
                <div
                  className="bg-blue-500 h-full opacity-60 rounded-r-full transition-all duration-500"
                  style={{ width: `${Math.max(0, 100 - convertedBarWidth)}%` }}
                  title={`In Pipeline: ${item.totalLeads - item.convertedCount}`}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                <span>Cohort Win Rate: <strong className="text-emerald-700">{item.conversionRate}%</strong></span>
                <span>Relative Volume: {totalBarWidth}% of peak</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
