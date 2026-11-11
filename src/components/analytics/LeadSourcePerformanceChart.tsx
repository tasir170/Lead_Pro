import React from 'react';
import { LeadSourceStat } from '../../types';
import { Compass, CheckCircle2, MessageSquare, Award } from 'lucide-react';

interface LeadSourcePerformanceChartProps {
  data: LeadSourceStat[];
}

export const LeadSourcePerformanceChart: React.FC<LeadSourcePerformanceChartProps> = ({
  data,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-slate-400 text-xs">
        No lead source records available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
          <tr>
            <th className="py-2.5 px-3">Lead Source / Channel</th>
            <th className="py-2.5 px-3 text-right">Volume</th>
            <th className="py-2.5 px-3 text-right">Avg AI Score</th>
            <th className="py-2.5 px-3 text-right">Contacted</th>
            <th className="py-2.5 px-3 text-right">Won</th>
            <th className="py-2.5 px-3 text-right">Win Rate</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-700">
          {data.map((item) => (
            <tr key={item.source} className="hover:bg-slate-50/70 transition-colors">
              <td className="py-2.5 px-3 font-sans font-medium text-slate-900 flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate max-w-[180px]" title={item.source}>
                  {item.source}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right font-semibold text-slate-900">
                {item.totalLeads}
              </td>
              <td className="py-2.5 px-3 text-right">
                <span
                  className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                    item.avgScore >= 80
                      ? 'bg-emerald-50 text-emerald-700'
                      : item.avgScore >= 60
                      ? 'bg-blue-50 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {item.avgScore > 0 ? `${item.avgScore}/100` : '—'}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right text-slate-600">
                {item.contactedCount}
              </td>
              <td className="py-2.5 px-3 text-right font-semibold text-emerald-600">
                {item.convertedCount}
              </td>
              <td className="py-2.5 px-3 text-right font-bold text-blue-600">
                {item.conversionRate}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
