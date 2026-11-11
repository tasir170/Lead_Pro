import React from 'react';
import {
  Users,
  UserPlus,
  CheckCircle,
  Star,
  MessageSquare,
  Award,
  ArrowRight,
  Sparkles,
  Bot,
  BarChart3,
} from 'lucide-react';
import { MetricCard } from '../components/dashboard/MetricCard';
import { AcquisitionChart } from '../components/dashboard/AcquisitionChart';
import { QualityDistributionChart } from '../components/dashboard/QualityDistributionChart';
import { ConversionFunnelChart } from '../components/dashboard/ConversionFunnelChart';
import { RecentActivityList } from '../components/dashboard/RecentActivityList';
import { AIRecommendationPanel } from '../components/dashboard/AIRecommendationPanel';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge, TierBadge } from '../components/common/Badge';
import { CardSkeleton } from '../components/common/Skeleton';
import { ErrorBanner } from '../components/common/ErrorBanner';
import { Lead, PipelineSummary, AcquisitionDataPoint, QualityBreakdown, NavigationItemKey } from '../types';

interface OverviewDashboardProps {
  summary: PipelineSummary | null;
  acquisition: AcquisitionDataPoint[];
  quality: QualityBreakdown[];
  leads: Lead[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onSelectLead: (lead: Lead) => void;
  onNavigate: (view: NavigationItemKey) => void;
  onOpenAddLead: () => void;
  onAnalyzeAllUnscored?: () => void;
  isAnalyzing?: boolean;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  summary,
  acquisition,
  quality,
  leads,
  isLoading,
  error,
  onRetry,
  onSelectLead,
  onNavigate,
  onOpenAddLead,
  onAnalyzeAllUnscored,
  isAnalyzing = false,
}) => {
  if (error) {
    return (
      <div className="p-6">
        <ErrorBanner message={error} onRetry={onRetry} />
      </div>
    );
  }

  // Top 5 highest AI score leads for priority attention
  const topPriorityLeads = [...leads]
    .sort((a, b) => b.aiScore - a.aiScore)
    .slice(0, 5);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Banner / Overview Kicker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Sales Pipeline · Executive Summary</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Pipeline Intelligence & Conversions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time ICP scoring, automated qualification, and multi-channel outreach telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('ai-agents')}
            className="text-xs border-blue-200 text-blue-700 bg-blue-50/70 hover:bg-blue-100 flex items-center gap-1.5"
          >
            <Bot className="w-3.5 h-3.5 text-blue-600" />
            AI Orchestrator
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('analytics')}
            className="text-xs border-slate-200 text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            Analytics & Reports
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('find-leads')}
            className="text-xs"
          >
            Prospect New ICP
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenAddLead}
            className="text-xs"
          >
            + Add Target Lead
          </Button>
        </div>
      </div>

      {/* 6 Required Summary Cards */}
      <section aria-labelledby="kpi-heading">
        <h2 id="kpi-heading" className="sr-only">Key Pipeline Metrics</h2>
        {isLoading || !summary ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* 1. Total Leads */}
            <MetricCard
              title="Total Leads"
              value={summary.totalLeads}
              change="+14% MoM"
              changeType="positive"
              subtitle="All sourced accounts"
              icon={<Users className="w-4 h-4 text-slate-700" />}
              onClick={() => onNavigate('all-leads')}
            />

            {/* 2. New Leads */}
            <MetricCard
              title="New Leads"
              value={summary.newLeads}
              change="+4 this wk"
              changeType="positive"
              subtitle="Awaiting initial touch"
              icon={<UserPlus className="w-4 h-4 text-blue-600" />}
              onClick={() => onNavigate('all-leads')}
            />

            {/* 3. Qualified Leads */}
            <MetricCard
              title="Qualified Leads"
              value={summary.qualifiedLeads}
              change={`${summary.qualifiedRate}% rate`}
              changeType="positive"
              subtitle="Score >= 70 & ICP verified"
              icon={<CheckCircle className="w-4 h-4 text-emerald-600" />}
              onClick={() => onNavigate('all-leads')}
            />

            {/* 4. High-Quality Leads */}
            <MetricCard
              title="High-Quality"
              value={summary.highQualityLeads}
              change="Tier-1 ICP"
              changeType="positive"
              subtitle="Score 80-100 highest fit"
              icon={<Star className="w-4 h-4 text-amber-500" />}
              onClick={() => onNavigate('all-leads')}
            />

            {/* 5. Contacted Leads */}
            <MetricCard
              title="Contacted"
              value={summary.contactedLeads}
              change="Email / WA"
              changeType="neutral"
              subtitle="Active sequence in flight"
              icon={<MessageSquare className="w-4 h-4 text-indigo-600" />}
              onClick={() => onNavigate('all-leads')}
            />

            {/* 6. Converted Leads */}
            <MetricCard
              title="Converted"
              value={summary.convertedLeads}
              change={`${summary.conversionRate}% rate`}
              changeType="positive"
              subtitle="Closed contracts won"
              icon={<Award className="w-4 h-4 text-purple-600" />}
              onClick={() => onNavigate('all-leads')}
            />
          </div>
        )}
      </section>

      {/* AI Recommendation Panel */}
      <AIRecommendationPanel
        leads={leads}
        onSelectLead={onSelectLead}
        onNavigate={onNavigate}
        onAnalyzeAllUnscored={onAnalyzeAllUnscored}
        isAnalyzing={isAnalyzing}
      />

      {/* Charts Row: Lead Acquisition (Primary) + Lead Quality Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Acquisition Velocity Chart (2 cols) */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader
              action={
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onNavigate('analytics')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Full Report
                </Button>
              }
            >
              <CardTitle>Lead Acquisition & Qualification Velocity</CardTitle>
              <CardDescription>
                Monthly progression of newly sourced leads vs. AI qualified vs. converted accounts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AcquisitionChart data={acquisition} />
            </CardContent>
          </Card>
        </div>

        {/* Lead Quality Distribution (1 col) */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Lead Quality Distribution</CardTitle>
              <CardDescription>
                Categorized by Gemini AI fit score and ICP attribute alignment.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QualityDistributionChart data={quality} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Row: Conversion Funnel & Top Priority Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Conversion Funnel */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Pipeline Conversion Funnel</CardTitle>
              <CardDescription>
                Progression through discovery, outreach, qualification and close.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {summary && <ConversionFunnelChart summary={summary} />}
            </CardContent>
          </Card>
        </div>

        {/* Priority High-Fit Leads Table */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader
              action={
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => onNavigate('all-leads')}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  View All ({leads.length})
                </Button>
              }
            >
              <CardTitle>High-Priority Accounts Awaiting Action</CardTitle>
              <CardDescription>
                Ranked by AI Fit Score with decision-maker insights ready.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {topPriorityLeads.map((lead) => (
                  <div
                    key={lead.id}
                    onClick={() => onSelectLead(lead)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm truncate">
                          {lead.name}
                        </span>
                        <TierBadge tier={lead.qualityTier} />
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 truncate">
                        <span>{lead.title}</span> · <span className="font-medium text-slate-700">{lead.company}</span> · <span>{lead.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={lead.status} />
                      <div className="text-right">
                        <div className="text-sm font-bold font-mono tabular-nums text-blue-600">
                          {lead.aiScore}
                          <span className="text-[10px] text-slate-400 font-normal"> pts</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Pipeline Activity Section */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales Intelligence Activity</CardTitle>
          <CardDescription>
            Live feed of AI qualifications, outreach drafts, and status transitions.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-2 sm:p-4">
          <RecentActivityList leads={leads} onSelectLead={onSelectLead} />
        </CardContent>
      </Card>
    </div>
  );
};
