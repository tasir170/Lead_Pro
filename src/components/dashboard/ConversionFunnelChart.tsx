import React from 'react';
import { PipelineSummary } from '../../types';

interface ConversionFunnelChartProps {
  summary: PipelineSummary;
}

export const ConversionFunnelChart: React.FC<ConversionFunnelChartProps> = ({ summary }) => {
  const total = Math.max(summary.totalLeads, 1);

  const stages = [
    {
      label: '1. Inbound & Sourced',
      count: summary.totalLeads,
      percentage: 100,
      color: 'bg-slate-700',
      description: 'Raw accounts identified & enriched',
    },
    {
      label: '2. Contacted & Engaged',
      count: summary.contactedLeads + summary.qualifiedLeads + summary.convertedLeads,
      percentage: Math.round(((summary.contactedLeads + summary.qualifiedLeads + summary.convertedLeads) / total) * 100),
      color: 'bg-blue-600',
      description: 'Outreach delivered via Email or WhatsApp',
    },
    {
      label: '3. AI Qualified',
      count: summary.qualifiedLeads + summary.convertedLeads,
      percentage: Math.round(((summary.qualifiedLeads + summary.convertedLeads) / total) * 100),
      color: 'bg-indigo-600',
      description: 'Fit score >= 70, verified budget & authority',
    },
    {
      label: '4. Converted (Won)',
      count: summary.convertedLeads,
      percentage: Math.round((summary.convertedLeads / total) * 100),
      color: 'bg-emerald-600',
      description: 'Customer acquired / contract executed',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.label} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-800">{stage.label}</span>
              <div className="flex items-center gap-2">
                <span className="font-mono tabular-nums text-slate-600 font-medium">{stage.count} leads</span>
                <span className="font-mono tabular-nums text-slate-400 font-normal">({stage.percentage}%)</span>
              </div>
            </div>

            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                style={{ width: `${Math.max(stage.percentage, 4)}%` }}
                className={`h-full ${stage.color} rounded-full transition-all duration-500`}
              />
            </div>
            <p className="text-[11px] text-slate-400">{stage.description}</p>
          </div>
        ))}
      </div>

      <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-lg flex items-center justify-between text-xs text-blue-900">
        <span className="font-medium">Overall Pipeline Conversion Rate</span>
        <span className="font-mono tabular-nums font-bold text-sm text-blue-700">
          {summary.conversionRate}%
        </span>
      </div>
    </div>
  );
};
