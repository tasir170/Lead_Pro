import React from 'react';
import { CountryStat } from '../../types';
import { Globe } from 'lucide-react';

interface CountryDistributionChartProps {
  data: CountryStat[];
  onSelectCountry?: (country: string) => void;
  selectedCountry?: string;
}

export const CountryDistributionChart: React.FC<CountryDistributionChartProps> = ({
  data,
  onSelectCountry,
  selectedCountry,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
        No country distribution records available.
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="space-y-3">
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {data.map((item) => {
          const isSelected = selectedCountry?.toLowerCase() === item.country.toLowerCase();
          const barWidth = Math.max(8, Math.round((item.count / maxCount) * 100));

          return (
            <div
              key={item.country}
              onClick={() => onSelectCountry?.(item.country)}
              className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-50/50 shadow-xs'
                  : 'border-slate-100 bg-slate-50/60 hover:bg-slate-100/70 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <div className="w-5 h-5 rounded-full bg-slate-200 text-[10px] flex items-center justify-center font-bold text-slate-600 shrink-0">
                    {item.country.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-800 truncate">
                    {item.country}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums shrink-0">
                  <span className="font-semibold text-slate-900">{item.count}</span>
                  <span className="text-slate-400">({item.percentage}%)</span>
                </div>
              </div>

              {/* Bar */}
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500 font-mono">
                <span>Qualified ICP: <strong className="text-indigo-600">{item.qualifiedCount}</strong></span>
                <span>Conversion Rate: <strong className="text-emerald-600">{item.conversionRate}%</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
