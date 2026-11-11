import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Percent,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Calendar,
  Filter,
  Download,
  Printer,
  Sparkles,
  RotateCw,
  Building2,
  Globe,
  Flame,
  CheckCircle2,
  Users,
  AlertCircle,
  FileText,
  ChevronDown,
  X,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { AnalyticsMetricCard } from '../components/analytics/AnalyticsMetricCard';
import { LeadsOverTimeChart } from '../components/analytics/LeadsOverTimeChart';
import { IndustryDistributionChart } from '../components/analytics/IndustryDistributionChart';
import { CountryDistributionChart } from '../components/analytics/CountryDistributionChart';
import { QualityDistributionChart } from '../components/analytics/QualityDistributionChart';
import { StatusDistributionChart } from '../components/analytics/StatusDistributionChart';
import { MonthlyConversionTrendChart } from '../components/analytics/MonthlyConversionTrendChart';
import { LeadSourcePerformanceChart } from '../components/analytics/LeadSourcePerformanceChart';
import { SalesFunnelChart } from '../components/analytics/SalesFunnelChart';
import { AIAnalyticsAssistant } from '../components/analytics/AIAnalyticsAssistant';
import { ExecutiveReportModal } from '../components/analytics/ExecutiveReportModal';
import {
  PipelineSummary,
  AcquisitionDataPoint,
  QualityBreakdown,
  DetailedAnalyticsResult,
  AnalyticsFilterOptions,
  AnalyticsTimeframe,
  Lead,
} from '../types';
import { api } from '../services/api';

interface AnalyticsPageProps {
  summary?: PipelineSummary | null;
  acquisition?: AcquisitionDataPoint[];
  quality?: QualityBreakdown[];
  leads?: Lead[];
  onSelectLeadForDetail?: (lead: Lead) => void;
  onNavigateToLeads?: () => void;
}

const TIMEFRAME_OPTIONS: { label: string; value: AnalyticsTimeframe }[] = [
  { label: 'All Time', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last 90 Days', value: '90d' },
  { label: 'Custom Range', value: 'custom' },
];

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  leads: initialLeads = [],
  onSelectLeadForDetail,
  onNavigateToLeads,
}) => {
  // Filter States
  const [timeframe, setTimeframe] = useState<AnalyticsTimeframe>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [isCustomDateOpen, setIsCustomDateOpen] = useState(false);

  // Data States
  const [analyticsData, setAnalyticsData] = useState<DetailedAnalyticsResult | null>(null);
  const [allLeads, setAllLeads] = useState<Lead[]>(initialLeads);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Export States
  const [isExecutiveReportOpen, setIsExecutiveReportOpen] = useState(false);

  // Current filter bundle
  const currentFilters: AnalyticsFilterOptions = useMemo(
    () => ({
      timeframe,
      startDate: timeframe === 'custom' ? customStartDate : undefined,
      endDate: timeframe === 'custom' ? customEndDate : undefined,
      industry: selectedIndustry !== 'all' ? selectedIndustry : undefined,
      country: selectedCountry !== 'all' ? selectedCountry : undefined,
    }),
    [timeframe, customStartDate, customEndDate, selectedIndustry, selectedCountry]
  );

  // Load analytics from real database
  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [detailed, leadsData] = await Promise.all([
        api.getDetailedAnalytics(currentFilters),
        initialLeads.length > 0 ? Promise.resolve(initialLeads) : api.getLeads(),
      ]);
      setAnalyticsData(detailed);
      if (initialLeads.length === 0) {
        setAllLeads(leadsData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dynamic database analytics.');
    } finally {
      setIsLoading(false);
    }
  }, [currentFilters, initialLeads]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  // Handle CSV direct export
  const handleExportCsv = () => {
    const csvUrl = api.getAnalyticsCsvUrl(currentFilters);
    const link = document.createElement('a');
    link.href = csvUrl;
    link.setAttribute('download', `leadpulse_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleResetFilters = () => {
    setTimeframe('all');
    setSelectedIndustry('all');
    setSelectedCountry('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setIsCustomDateOpen(false);
  };

  const hasActiveFilters =
    timeframe !== 'all' || selectedIndustry !== 'all' || selectedCountry !== 'all';

  // Compute filtered leads for table view
  const displayLeads = useMemo(() => {
    if (!analyticsData) return allLeads;
    return allLeads.filter((lead) => {
      if (selectedIndustry !== 'all') {
        const ind = (lead.industry || '').toLowerCase();
        if (!ind.includes(selectedIndustry.toLowerCase())) return false;
      }
      if (selectedCountry !== 'all') {
        const cnt = (lead.country || '').toLowerCase();
        if (cnt !== selectedCountry.toLowerCase()) return false;
      }
      return true;
    });
  }, [allLeads, analyticsData, selectedIndustry, selectedCountry]);

  const metrics = analyticsData?.metrics;
  const charts = analyticsData?.charts;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Page Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Real-Time Business Intelligence · Dynamic Sales Analytics</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Analytics & Sales Performance Reporting
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            100% dynamically calculated from actual database records. Track discovery volume, ICP qualification, and conversion velocity.
          </p>
        </div>

        {/* Action Buttons: Export CSV & Print PDF Report */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handleExportCsv}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 hover:border-slate-400 transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
            title="Download full database CSV report"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsExecutiveReportOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Open printable executive PDF report"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Executive PDF Report</span>
          </button>

          <button
            onClick={loadAnalytics}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh database analytics"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Timeframe Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1 shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date:
            </span>
            {TIMEFRAME_OPTIONS.map((opt) => {
              const active = timeframe === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTimeframe(opt.value);
                    if (opt.value === 'custom') {
                      setIsCustomDateOpen(true);
                    } else {
                      setIsCustomDateOpen(false);
                    }
                  }}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Industry & Country Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Industry Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Industries ({analyticsData?.availableIndustries.length || 0})</option>
                {analyticsData?.availableIndustries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {/* Country Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="all">All Countries ({analyticsData?.availableCountries.length || 0})</option>
                {analyticsData?.availableCountries.map((cnt) => (
                  <option key={cnt} value={cnt}>
                    {cnt}
                  </option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-slate-500 hover:text-rose-600 px-2 py-1.5 rounded-lg border border-slate-200 hover:border-rose-200 hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Range Popout / Expanded Bar */}
        {timeframe === 'custom' && (
          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/60 flex flex-wrap items-center gap-3 text-xs animate-fade-in">
            <span className="font-semibold text-blue-900">Specify Date Range:</span>
            <div className="flex items-center gap-2">
              <label className="text-slate-600">Start:</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-600">End:</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-slate-800 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              onClick={loadAnalytics}
              className="px-3 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-colors"
            >
              Apply Dates
            </button>
          </div>
        )}

        {/* Active Filter Summary Tag */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span>Filter Active: <strong>{analyticsData?.dateRangeLabel || 'All Time'}</strong></span>
            {selectedIndustry !== 'all' && (
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                Industry: {selectedIndustry}
              </span>
            )}
            {selectedCountry !== 'all' && (
              <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
                Country: {selectedCountry}
              </span>
            )}
          </div>
          <div className="font-mono text-slate-600">
            Showing <strong>{analyticsData?.filteredLeadsCount ?? 0}</strong> of {analyticsData?.totalDatabaseLeadsCount ?? 0} leads in database
          </div>
        </div>
      </div>

      {/* ERROR BANNER */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadAnalytics}
            className="font-semibold underline hover:text-rose-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* 10 DASHBOARD METRIC STRIPS */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>Core Performance & Conversion Metrics</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-400">
            Dynamic database aggregation
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {/* 1. Total Leads Discovered */}
          <AnalyticsMetricCard
            title="Total Discovered"
            value={metrics?.totalLeads ?? 0}
            subtitle="Leads in filtered dataset"
            icon={Users}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            highlight={true}
          />

          {/* 2. New Leads This Month */}
          <AnalyticsMetricCard
            title="New This Month"
            value={metrics?.newLeadsThisMonth ?? 0}
            subtitle="Ingested in current month"
            icon={Calendar}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
          />

          {/* 3. Hot Leads */}
          <AnalyticsMetricCard
            title="Hot Leads (80+)"
            value={metrics?.hotLeads ?? 0}
            subtitle="Tier-1 High ICP priority"
            icon={Flame}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            trend={{ value: `${Math.round(((metrics?.hotLeads ?? 0) / (metrics?.totalLeads || 1)) * 100)}% share`, isPositive: true }}
          />

          {/* 4. Warm Leads */}
          <AnalyticsMetricCard
            title="Warm Leads (60-79)"
            value={metrics?.warmLeads ?? 0}
            subtitle="High nurture potential"
            icon={Sparkles}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
          />

          {/* 5. Qualified Leads */}
          <AnalyticsMetricCard
            title="Qualified Leads"
            value={metrics?.qualifiedLeads ?? 0}
            subtitle="Passed ICP qualification"
            icon={CheckCircle2}
            iconColor="text-indigo-600"
            iconBg="bg-indigo-50"
          />

          {/* 6. Contacted Leads */}
          <AnalyticsMetricCard
            title="Contacted Leads"
            value={metrics?.contactedLeads ?? 0}
            subtitle="Outreach initiated"
            icon={Clock}
            iconColor="text-cyan-600"
            iconBg="bg-cyan-50"
          />

          {/* 7. Converted Leads */}
          <AnalyticsMetricCard
            title="Converted Leads"
            value={metrics?.convertedLeads ?? 0}
            subtitle="Closed-won customer contracts"
            icon={CheckCircle2}
            iconColor="text-emerald-700"
            iconBg="bg-emerald-100"
          />

          {/* 8. Conversion Rate */}
          <AnalyticsMetricCard
            title="Conversion Rate"
            value={`${metrics?.conversionRate ?? 0}%`}
            subtitle="End-to-end pipeline yield"
            icon={Percent}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            trend={{ value: 'Actual DB Win %', isPositive: (metrics?.conversionRate ?? 0) >= 10 }}
          />

          {/* 9. Average Lead Score */}
          <AnalyticsMetricCard
            title="Average Lead Score"
            value={`${metrics?.avgLeadScore ?? 0}/100`}
            subtitle="AI multi-factor health"
            icon={ArrowUpRight}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
          />

          {/* 10. Follow-ups Pending */}
          <AnalyticsMetricCard
            title="Follow-ups Pending"
            value={metrics?.followUpsPending ?? 0}
            subtitle={metrics?.overdueFollowUps ? `${metrics.overdueFollowUps} overdue attention` : 'Scheduled outreach'}
            icon={ShieldCheck}
            iconColor={metrics?.overdueFollowUps ? 'text-rose-600' : 'text-amber-600'}
            iconBg={metrics?.overdueFollowUps ? 'bg-rose-50' : 'bg-amber-50'}
            trend={metrics?.overdueFollowUps ? { value: `${metrics.overdueFollowUps} overdue`, isPositive: false } : undefined}
          />
        </div>
      </div>

      {/* GEMINI AI ANALYTICS ASSISTANT */}
      <AIAnalyticsAssistant
        currentFilters={currentFilters}
        dateRangeLabel={analyticsData?.dateRangeLabel || 'All Time'}
      />

      {/* 8 CHARTS GRID */}
      <div className="space-y-6">
        {/* ROW 1: Chart 1 (Leads Over Time) & Chart 8 (Sales Funnel) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Leads Discovered Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>1. Leads Discovered Over Time</span>
                <span className="text-[11px] font-mono text-slate-400 font-normal">
                  {charts?.leadsOverTime.length || 0} periods
                </span>
              </CardTitle>
              <CardDescription>
                Chronological volume of companies ingested into CRM and qualified pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LeadsOverTimeChart data={charts?.leadsOverTime || []} />
            </CardContent>
          </Card>

          {/* Chart 8: Sales Funnel Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>8. Multi-Stage Sales Funnel</span>
                <span className="text-[11px] font-mono text-emerald-600 font-semibold">
                  {metrics?.conversionRate ?? 0}% Win Rate
                </span>
              </CardTitle>
              <CardDescription>
                Drop-off telemetry from initial discovery to closed-won conversion
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SalesFunnelChart stages={charts?.salesFunnel || []} />
            </CardContent>
          </Card>
        </div>

        {/* ROW 2: Chart 2 (Industry Distribution) & Chart 3 (Country Distribution) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 2: Lead Distribution by Industry */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>2. Lead Distribution by Industry</span>
                <span className="text-[11px] font-mono text-slate-400 font-normal">
                  {charts?.byIndustry.length || 0} sectors
                </span>
              </CardTitle>
              <CardDescription>
                Industry sector breakdown with average AI quality scores and win rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <IndustryDistributionChart
                data={charts?.byIndustry || []}
                selectedIndustry={selectedIndustry}
                onSelectIndustry={(ind) => setSelectedIndustry(ind === selectedIndustry ? 'all' : ind)}
              />
            </CardContent>
          </Card>

          {/* Chart 3: Leads by Country */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>3. Geographic Lead Distribution by Country</span>
                <span className="text-[11px] font-mono text-slate-400 font-normal">
                  {charts?.byCountry.length || 0} territories
                </span>
              </CardTitle>
              <CardDescription>
                Cross-border lead sourcing volume and regional qualification yields
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CountryDistributionChart
                data={charts?.byCountry || []}
                selectedCountry={selectedCountry}
                onSelectCountry={(cnt) => setSelectedCountry(cnt === selectedCountry ? 'all' : cnt)}
              />
            </CardContent>
          </Card>
        </div>

        {/* ROW 3: Chart 4 (Quality Distribution) & Chart 5 (Status Distribution) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 4: Lead Quality Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>4. Lead Quality Tier Distribution</span>
                <span className="text-[11px] font-mono text-emerald-600 font-semibold">
                  {metrics?.hotLeads || 0} Hot Leads
                </span>
              </CardTitle>
              <CardDescription>
                Predictive AI qualification tiers (Hot 80+, Warm 60-79, Potential 40-59, Cold)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QualityDistributionChart data={charts?.qualityDistribution || []} />
            </CardContent>
          </Card>

          {/* Chart 5: Lead Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>5. Lead Pipeline Status Distribution</span>
                <span className="text-[11px] font-mono text-slate-400 font-normal">
                  8 Canonical CRM Stages
                </span>
              </CardTitle>
              <CardDescription>
                Active distribution across New, Contacted, Interested, Qualified, Negotiation, and Won
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatusDistributionChart data={charts?.statusDistribution || []} />
            </CardContent>
          </Card>
        </div>

        {/* ROW 4: Chart 6 (Monthly Conversion Trend) & Chart 7 (Lead Source Performance) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 6: Monthly Conversion Trend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>6. Chronological / Monthly Conversion Trend</span>
                <span className="text-[11px] font-mono text-blue-600 font-semibold">
                  Cohort Velocity
                </span>
              </CardTitle>
              <CardDescription>
                Won opportunities vs total sourced accounts per time cohort
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyConversionTrendChart data={charts?.monthlyConversionTrend || []} />
            </CardContent>
          </Card>

          {/* Chart 7: Lead Source Performance */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold flex items-center justify-between">
                <span>7. Lead Acquisition Source Performance</span>
                <span className="text-[11px] font-mono text-slate-400 font-normal">
                  Channel Attribution
                </span>
              </CardTitle>
              <CardDescription>
                Comparative efficiency, AI score benchmark, and win rates across lead discovery sources
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <LeadSourcePerformanceChart data={charts?.sourcePerformance || []} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* FILTERED LEADS PREVIEW TABLE */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm font-bold">
                Filtered Leads Audit Snapshot ({displayLeads.length} Accounts)
              </CardTitle>
              <CardDescription>
                Underlying database records corresponding to current analytics filters
              </CardDescription>
            </div>
            {onNavigateToLeads && (
              <button
                onClick={onNavigateToLeads}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <span>View in All Leads CRM</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="p-3">Company</th>
                  <th className="p-3">Industry</th>
                  <th className="p-3">Country</th>
                  <th className="p-3 text-right">AI Score</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Assigned Rep</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums text-slate-700">
                {displayLeads.slice(0, 10).map((lead) => {
                  const score = lead.leadScore ?? lead.aiScore ?? 0;
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => onSelectLeadForDetail?.(lead)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      <td className="p-3 font-sans font-medium text-slate-900">
                        {lead.companyName || lead.company}
                      </td>
                      <td className="p-3 font-sans text-slate-600 truncate max-w-[160px]">
                        {lead.industry}
                      </td>
                      <td className="p-3 font-sans text-slate-600">
                        {lead.country}
                      </td>
                      <td className="p-3 text-right font-bold">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[11px] ${
                            score >= 80
                              ? 'bg-emerald-50 text-emerald-700'
                              : score >= 60
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {score > 0 ? `${score}/100` : 'Unscored'}
                        </span>
                      </td>
                      <td className="p-3 font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {lead.leadStatus || lead.status}
                        </span>
                      </td>
                      <td className="p-3 font-sans text-slate-500 truncate max-w-[120px]">
                        {lead.leadSource}
                      </td>
                      <td className="p-3 font-sans text-slate-600">
                        {lead.assignedSalesperson || 'Unassigned'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {displayLeads.length > 10 && (
            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500">
              Showing 10 of {displayLeads.length} leads matching current filters. Click "Export CSV" to download the full dataset.
            </div>
          )}
        </CardContent>
      </Card>

      {/* EXECUTIVE REPORT PRINTABLE MODAL */}
      {analyticsData && (
        <ExecutiveReportModal
          isOpen={isExecutiveReportOpen}
          onClose={() => setIsExecutiveReportOpen(false)}
          analytics={analyticsData}
          leads={displayLeads}
          onExportCsv={handleExportCsv}
        />
      )}
    </div>
  );
};
