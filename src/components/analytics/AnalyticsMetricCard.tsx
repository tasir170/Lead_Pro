import React from 'react';
import { LucideIcon } from 'lucide-react';

interface AnalyticsMetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
  };
  highlight?: boolean;
}

export const AnalyticsMetricCard: React.FC<AnalyticsMetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600',
  iconBg = 'bg-blue-50',
  trend,
  highlight = false,
}) => {
  return (
    <div
      className={`p-4 rounded-xl border transition-all duration-200 bg-white ${
        highlight
          ? 'border-blue-300 ring-2 ring-blue-500/10 shadow-sm'
          : 'border-slate-200/80 shadow-xs hover:border-slate-300'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider line-clamp-1">
          {title}
        </span>
        <div className={`p-1.5 rounded-lg shrink-0 ${iconBg}`}>
          <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
          {value}
        </div>
        {trend && (
          <span
            className={`text-[11px] font-semibold px-1.5 py-0.5 rounded-md ${
              trend.isNeutral
                ? 'bg-slate-100 text-slate-600'
                : trend.isPositive
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
          {subtitle}
        </p>
      )}
    </div>
  );
};
