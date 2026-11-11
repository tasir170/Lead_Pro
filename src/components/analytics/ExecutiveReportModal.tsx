import React from 'react';
import {
  X,
  Printer,
  Download,
  Calendar,
  Building2,
  Globe,
  TrendingUp,
  Percent,
  CheckCircle2,
  BarChart3,
  Flame,
} from 'lucide-react';
import { DetailedAnalyticsResult, Lead } from '../../types';

interface ExecutiveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analytics: DetailedAnalyticsResult;
  leads: Lead[];
  onExportCsv: () => void;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  isOpen,
  onClose,
  analytics,
  leads,
  onExportCsv,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const { metrics, charts, dateRangeLabel } = analytics;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Modal Top Bar (Hidden in print) */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Executive Performance Briefing</h2>
              <p className="text-xs text-slate-500">Board-ready PDF report view</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onExportCsv}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save as PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-900 print:overflow-visible print:p-0">
          {/* Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-blue-600">
                LeadPulse Sales Intelligence SaaS
              </div>
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Executive Sales & Conversion Intelligence Report
              </h1>
              <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Filtered Period: <strong>{dateRangeLabel}</strong>
                </span>
                <span>Generated: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="text-right sm:text-right font-mono text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 print:border-none">
              <div>Total Dataset: <strong>{analytics.totalDatabaseLeadsCount} Leads</strong></div>
              <div>Filtered Leads: <strong>{metrics.totalLeads} Leads</strong></div>
            </div>
          </div>

          {/* 10 Dashboard KPIs Matrix */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              1. Core Pipeline & Revenue Telemetry
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Total Sourced</div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{metrics.totalLeads}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">New This Month</div>
                <div className="text-xl font-bold font-mono text-blue-600 mt-0.5">{metrics.newLeadsThisMonth}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Hot Leads (80+)</div>
                <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">{metrics.hotLeads}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Warm Leads (60-79)</div>
                <div className="text-xl font-bold font-mono text-amber-600 mt-0.5">{metrics.warmLeads}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Qualified ICP</div>
                <div className="text-xl font-bold font-mono text-indigo-600 mt-0.5">{metrics.qualifiedLeads}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Contacted</div>
                <div className="text-xl font-bold font-mono text-cyan-600 mt-0.5">{metrics.contactedLeads}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Converted Won</div>
                <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">{metrics.convertedLeads}</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Conversion Rate</div>
                <div className="text-xl font-bold font-mono text-emerald-600 mt-0.5">{metrics.conversionRate}%</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Avg AI Score</div>
                <div className="text-xl font-bold font-mono text-slate-900 mt-0.5">{metrics.avgLeadScore}/100</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center">
                <div className="text-[10px] font-semibold text-slate-500 uppercase">Pending Follow-ups</div>
                <div className="text-xl font-bold font-mono text-amber-600 mt-0.5">{metrics.followUpsPending}</div>
              </div>
            </div>
          </div>

          {/* Sales Funnel Breakdown */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
              2. Multi-Stage Sales Funnel Throughput
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="p-2.5">Funnel Stage</th>
                    <th className="p-2.5 text-right">Lead Count</th>
                    <th className="p-2.5 text-right">% of Sourced</th>
                    <th className="p-2.5 text-right">Step Conversion</th>
                    <th className="p-2.5 text-right">Drop-off</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                  {charts.salesFunnel.map((stage) => (
                    <tr key={stage.stage}>
                      <td className="p-2.5 font-sans font-medium">{stage.label}</td>
                      <td className="p-2.5 text-right font-bold">{stage.count}</td>
                      <td className="p-2.5 text-right">{stage.percentageOfTotal}%</td>
                      <td className="p-2.5 text-right text-emerald-600 font-semibold">{stage.stepConversionRate}%</td>
                      <td className="p-2.5 text-right text-rose-600">-{stage.dropOffCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Side by side: Industry & Source */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                3. Top Industry Verticals
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <tr>
                      <th className="p-2">Industry</th>
                      <th className="p-2 text-right">Leads</th>
                      <th className="p-2 text-right">Avg Score</th>
                      <th className="p-2 text-right">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    {charts.byIndustry.slice(0, 5).map((ind) => (
                      <tr key={ind.industry}>
                        <td className="p-2 font-sans truncate max-w-[140px]">{ind.industry}</td>
                        <td className="p-2 text-right">{ind.count}</td>
                        <td className="p-2 text-right">{ind.avgScore}/100</td>
                        <td className="p-2 text-right text-emerald-600 font-semibold">{ind.conversionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                4. Acquisition Sources
              </h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                    <tr>
                      <th className="p-2">Source</th>
                      <th className="p-2 text-right">Leads</th>
                      <th className="p-2 text-right">Avg Score</th>
                      <th className="p-2 text-right">Win Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                    {charts.sourcePerformance.slice(0, 5).map((src) => (
                      <tr key={src.source}>
                        <td className="p-2 font-sans truncate max-w-[140px]">{src.source}</td>
                        <td className="p-2 text-right">{src.totalLeads}</td>
                        <td className="p-2 text-right">{src.avgScore}/100</td>
                        <td className="p-2 text-right text-emerald-600 font-semibold">{src.conversionRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Lead Audit Sample */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              5. Lead Registry Snapshot ({leads.length} Records)
            </h3>
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-600">
                  <tr>
                    <th className="p-2">Company Name</th>
                    <th className="p-2">Industry</th>
                    <th className="p-2">Country</th>
                    <th className="p-2 text-right">Score</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Assigned Rep</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                  {leads.slice(0, 8).map((lead) => (
                    <tr key={lead.id}>
                      <td className="p-2 font-sans font-medium text-slate-900 truncate max-w-[150px]">
                        {lead.companyName || lead.company}
                      </td>
                      <td className="p-2 font-sans text-slate-600 truncate max-w-[120px]">
                        {lead.industry}
                      </td>
                      <td className="p-2 font-sans text-slate-600">
                        {lead.country}
                      </td>
                      <td className="p-2 text-right font-bold text-slate-900">
                        {lead.leadScore ?? lead.aiScore ?? 0}
                      </td>
                      <td className="p-2 font-sans">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {lead.leadStatus || lead.status}
                        </span>
                      </td>
                      <td className="p-2 font-sans text-slate-600 truncate">
                        {lead.assignedSalesperson || 'Unassigned'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {leads.length > 8 && (
              <p className="text-[11px] text-slate-400 mt-1 italic">
                Showing top 8 of {leads.length} records. For full export, click "Export CSV".
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
