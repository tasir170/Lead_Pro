import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface MetricCardProps {
  title: string;
  value: number | string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  subtitle?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'positive',
  subtitle,
  icon,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-5 shadow-xs transition-all hover:border-slate-300 ${
        onClick ? 'cursor-pointer hover:shadow-sm' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {icon && <div className="p-2 rounded-lg bg-slate-50 text-slate-600 border border-slate-100">{icon}</div>}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">
          {value}
        </span>

        {change && (
          <span
            className={`inline-flex items-center text-xs font-medium ${
              changeType === 'positive'
                ? 'text-emerald-700'
                : changeType === 'negative'
                ? 'text-rose-700'
                : 'text-slate-500'
            }`}
          >
            {changeType === 'positive' && <TrendingUp className="w-3.5 h-3.5 mr-0.5 inline" />}
            {changeType === 'negative' && <TrendingDown className="w-3.5 h-3.5 mr-0.5 inline" />}
            {changeType === 'neutral' && <Minus className="w-3.5 h-3.5 mr-0.5 inline" />}
            {change}
          </span>
        )}
      </div>

      {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
    </div>
  );
};
