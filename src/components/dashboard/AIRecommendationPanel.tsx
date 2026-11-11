import React, { useMemo } from 'react';
import {
  Sparkles,
  Flame,
  Target,
  Snowflake,
  ArrowRight,
  TrendingUp,
  MessageSquare,
  Mail,
  CheckCircle2,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../common/Card';
import { Button } from '../common/Button';
import { Lead, NavigationItemKey } from '../../types';
import { LeadScoreBadge } from '../leads/LeadScoreBadge';

interface AIRecommendationPanelProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onNavigate: (view: NavigationItemKey) => void;
  onAnalyzeAllUnscored?: () => void;
  isAnalyzing?: boolean;
}

export const AIRecommendationPanel: React.FC<AIRecommendationPanelProps> = ({
  leads,
  onSelectLead,
  onNavigate,
  onAnalyzeAllUnscored,
  isAnalyzing = false,
}) => {
  // Categorize leads
  const categories = useMemo(() => {
    const hot: Lead[] = [];
    const warm: Lead[] = [];
    const potential: Lead[] = [];
    const cold: Lead[] = [];

    leads.forEach((l) => {
      const score = l.leadScore ?? l.aiScore ?? 0;
      if (score >= 80) hot.push(l);
      else if (score >= 60) warm.push(l);
      else if (score >= 40) potential.push(l);
      else cold.push(l);
    });

    return {
      hot: hot.sort((a, b) => (b.leadScore ?? b.aiScore ?? 0) - (a.leadScore ?? a.aiScore ?? 0)),
      warm: warm.sort((a, b) => (b.leadScore ?? b.aiScore ?? 0) - (a.leadScore ?? a.aiScore ?? 0)),
      potential,
      cold,
    };
  }, [leads]);

  // Top recommended leads awaiting outreach (hot and warm)
  const topRecommendations = useMemo(() => {
    return [...categories.hot, ...categories.warm].slice(0, 4);
  }, [categories]);

  // Average confidence score across analyzed accounts
  const avgConfidence = useMemo(() => {
    const analyzed = leads.filter((l) => l.aiScoreAnalysis);
    if (analyzed.length === 0) return 82;
    const sum = analyzed.reduce((acc, curr) => acc + (curr.aiScoreAnalysis?.confidenceScore || 80), 0);
    return Math.round(sum / analyzed.length);
  }, [leads]);

  return (
    <Card className="border-indigo-100 bg-gradient-to-b from-white via-white to-indigo-50/20 shadow-xs">
      <CardHeader
        action={
          <div className="flex items-center gap-2">
            {onAnalyzeAllUnscored && (
              <Button
                variant="outline"
                size="xs"
                onClick={onAnalyzeAllUnscored}
                isLoading={isAnalyzing}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-blue-600" />}
                className="text-xs hidden sm:inline-flex"
              >
                Analyze All Leads
              </Button>
            )}
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onNavigate('all-leads')}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              View Pipeline Table
            </Button>
          </div>
        }
      >
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-blue-600 text-white shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <CardTitle>AI Lead Scoring & Predictive Recommendations</CardTitle>
            <CardDescription>
              Gemini 7-factor predictive scoring engine · Evaluated across industry fit, size, growth signals, and buying intent.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Row 1: 4 Category Distribution Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Hot Leads */}
          <div
            onClick={() => onNavigate('all-leads')}
            className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 hover:border-emerald-300 transition-all cursor-pointer group space-y-1 shadow-2xs"
          >
            <div className="flex items-center justify-between text-emerald-900 font-semibold">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-emerald-600 fill-emerald-100" /> Hot Leads
              </span>
              <span className="text-[10px] text-emerald-700 font-mono font-medium">80 - 100</span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-950 tabular-nums">
              {categories.hot.length}
            </div>
            <p className="text-[11px] text-emerald-700 leading-tight">
              Ready for immediate executive consultation.
            </p>
          </div>

          {/* Warm Leads */}
          <div
            onClick={() => onNavigate('all-leads')}
            className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 hover:border-amber-300 transition-all cursor-pointer group space-y-1 shadow-2xs"
          >
            <div className="flex items-center justify-between text-amber-900 font-semibold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" /> Warm Leads
              </span>
              <span className="text-[10px] text-amber-700 font-mono font-medium">60 - 79</span>
            </div>
            <div className="text-2xl font-bold font-mono text-amber-950 tabular-nums">
              {categories.warm.length}
            </div>
            <p className="text-[11px] text-amber-700 leading-tight">
              High potential; nurture with targeted case studies.
            </p>
          </div>

          {/* Potential Leads */}
          <div
            onClick={() => onNavigate('all-leads')}
            className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 hover:border-blue-300 transition-all cursor-pointer group space-y-1 shadow-2xs"
          >
            <div className="flex items-center justify-between text-blue-900 font-semibold">
              <span className="flex items-center gap-1.5">
                <Target className="w-4 h-4 text-blue-600" /> Potential Leads
              </span>
              <span className="text-[10px] text-blue-700 font-mono font-medium">40 - 59</span>
            </div>
            <div className="text-2xl font-bold font-mono text-blue-950 tabular-nums">
              {categories.potential.length}
            </div>
            <p className="text-[11px] text-blue-700 leading-tight">
              Discovery outreach needed to qualify budget & scope.
            </p>
          </div>

          {/* Cold Leads */}
          <div
            onClick={() => onNavigate('all-leads')}
            className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group space-y-1 shadow-2xs"
          >
            <div className="flex items-center justify-between text-slate-800 font-semibold">
              <span className="flex items-center gap-1.5">
                <Snowflake className="w-4 h-4 text-slate-500" /> Cold Leads
              </span>
              <span className="text-[10px] text-slate-600 font-mono font-medium">&lt; 40</span>
            </div>
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {categories.cold.length}
            </div>
            <p className="text-[11px] text-slate-600 leading-tight">
              Low-touch automated monitoring sequence.
            </p>
          </div>
        </div>

        {/* Row 2: Priority Leads Awaiting Sales Action (4 Cards) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              Highest-Value Recommendations Awaiting Action
            </h4>
            <span className="text-[11px] text-slate-500 font-medium">
              Average Confidence: <span className="font-mono font-bold text-slate-800">{avgConfidence}%</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {topRecommendations.map((lead) => {
              const score = lead.leadScore ?? lead.aiScore ?? 0;
              const analysis = lead.aiScoreAnalysis;
              const nextAction =
                analysis?.recommendedNextAction ||
                `Initiate targeted outreach to ${lead.contactPerson || lead.name} regarding ${lead.industry || 'operations'}.`;

              return (
                <div
                  key={lead.id}
                  onClick={() => onSelectLead(lead)}
                  className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 text-sm block truncate hover:text-blue-600 transition-colors">
                          {lead.companyName || lead.company}
                        </span>
                        <span className="text-xs text-slate-500 block truncate">
                          {lead.contactPerson || lead.name} ({lead.title || 'Executive'}) · {lead.city}, {lead.country}
                        </span>
                      </div>
                      <LeadScoreBadge score={score} size="sm" />
                    </div>

                    {/* AI Qualification Rationale */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {analysis?.qualificationExplanation || lead.aiResearchSummary || lead.aiSummary}
                    </p>
                  </div>

                  {/* Recommended Action Box */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 text-slate-700">
                      <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                        Recommended Next Action:
                      </span>
                      <span className="text-[11px] font-medium truncate block text-slate-800">
                        {nextAction}
                      </span>
                    </div>

                    <Button
                      variant="outline"
                      size="xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectLead(lead);
                      }}
                      rightIcon={<ArrowRight className="w-3 h-3" />}
                      className="shrink-0 text-[11px]"
                    >
                      View
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
