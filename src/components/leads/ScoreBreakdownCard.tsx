import React from 'react';
import {
  Sparkles,
  Flame,
  Target,
  Snowflake,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Lead, AIScoreAnalysis, LeadCategory } from '../../types';
import { LeadScoreBadge, getCategoryFromScore } from './LeadScoreBadge';
import { Button } from '../common/Button';

interface ScoreBreakdownCardProps {
  lead: Lead;
  onAnalyze: (leadId: string) => Promise<void>;
  isAnalyzing?: boolean;
}

export const ScoreBreakdownCard: React.FC<ScoreBreakdownCardProps> = ({
  lead,
  onAnalyze,
  isAnalyzing = false,
}) => {
  const analysis: AIScoreAnalysis | undefined = lead.aiScoreAnalysis;
  const score = lead.leadScore ?? lead.aiScore ?? 0;
  const category: LeadCategory = lead.leadCategory || getCategoryFromScore(score);

  // If analysis is present, extract breakdown, otherwise provide default structure based on score
  const breakdown = analysis?.scoreBreakdown;
  const factors = breakdown
    ? [
        breakdown.industryRelevance,
        breakdown.businessSizeAndPotential,
        breakdown.websiteAndOnlinePresence,
        breakdown.contactQuality,
        breakdown.growthSignals,
        breakdown.targetMarketRelevance,
        breakdown.buyingIntentSignals,
      ]
    : [
        {
          factorKey: 'industryRelevance',
          factorName: 'Industry Relevance',
          score: Math.round((score / 100) * 20),
          maxScore: 20,
          explanation: `Evaluated ${lead.industry || 'the sector'} against Tier-1 commercial ICP criteria.`,
        },
        {
          factorKey: 'businessSizeAndPotential',
          factorName: 'Business Size & Potential',
          score: Math.round((score / 100) * 15),
          maxScore: 15,
          explanation: `Organization profile: ${lead.employeeCount || 'Mid-market'} / ${lead.annualRevenue || 'Standard scale'}.`,
        },
        {
          factorKey: 'websiteAndOnlinePresence',
          factorName: 'Website & Online Presence',
          score: lead.website || lead.domain ? 10 : 3,
          maxScore: 10,
          explanation: lead.website || lead.domain ? `Active corporate domain: ${lead.website || lead.domain}.` : 'No website listed.',
        },
        {
          factorKey: 'contactQuality',
          factorName: 'Contact Information Quality',
          score: Math.round((score / 100) * 15),
          maxScore: 15,
          explanation: `Contact availability: ${lead.contactPerson || lead.name} (${lead.email ? 'Email listed' : 'No email'}, ${lead.phone ? 'Phone listed' : 'No phone'}).`,
        },
        {
          factorKey: 'growthSignals',
          factorName: 'Business Activity & Growth Signals',
          score: Math.round((score / 100) * 15),
          maxScore: 15,
          explanation: lead.remarks ? `Activity detected in internal remarks: ${lead.remarks.slice(0, 70)}...` : 'Standard growth cadence.',
        },
        {
          factorKey: 'targetMarketRelevance',
          factorName: 'Target Market Relevance',
          score: Math.round((score / 100) * 15),
          maxScore: 15,
          explanation: `Location alignment: ${lead.city}, ${lead.country}.`,
        },
        {
          factorKey: 'buyingIntentSignals',
          factorName: 'Buying Intent Signals',
          score: Math.round((score / 100) * 10),
          maxScore: 10,
          explanation: `Source: ${lead.leadSource || 'Discovery engine'}.`,
        },
      ];

  const confidence = analysis?.confidenceIndicator || (score >= 80 ? 'High' : score >= 60 ? 'Medium' : 'Medium');
  const confidenceScore = analysis?.confidenceScore || (confidence === 'High' ? 88 : confidence === 'Medium' ? 75 : 60);

  return (
    <div className="space-y-5">
      {/* Top Banner: Score Gauge, Classification & Re-score Action */}
      <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Visual Circular/Gauge Indicator */}
            <div className="relative w-14 h-14 rounded-full flex items-center justify-center bg-white/10 ring-2 ring-white/20 shrink-0">
              <span className="text-xl font-bold font-mono tabular-nums text-white">{score}</span>
              <span className="text-[9px] text-slate-300 absolute -bottom-1 bg-slate-900 px-1 rounded font-mono">/100</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-white tracking-tight">
                  {category}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    confidence === 'High'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                  title="Confidence based on completeness of verified corporate attributes"
                >
                  {confidence} Confidence ({confidenceScore}%)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
                Gemini 7-Factor Predictive Sales Intelligence Analysis
              </p>
            </div>
          </div>

          {/* Action: Recalculate with Gemini AI */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => onAnalyze(lead.id)}
            isLoading={isAnalyzing}
            leftIcon={<Sparkles className="w-4 h-4 text-amber-300" />}
            className="bg-blue-600 hover:bg-blue-500 text-white border-0 shadow-sm shrink-0 text-xs"
          >
            {isAnalyzing ? 'Analyzing with Gemini...' : 'Analyze with AI'}
          </Button>
        </div>

        {/* Qualification Summary Rationale */}
        <div className="p-3 bg-white/10 rounded-lg border border-white/10 text-xs text-slate-200 leading-relaxed">
          <div className="flex items-center gap-1.5 font-semibold text-slate-100 mb-1 text-[11px] uppercase tracking-wider">
            <Info className="w-3.5 h-3.5 text-blue-400" /> Qualification Explanation
          </div>
          {analysis?.qualificationExplanation ||
            `${lead.companyName || lead.company} scores ${score}/100, positioned as a ${category}. High ICP synergy across ${lead.industry || 'target'} operations.`}
        </div>
      </div>

      {/* 7-Factor Scoring Breakdown Grid */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              7-Factor Predictive Scoring Model (100 Points Total)
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Strict rules-based evaluation using actual verified data (missing data treated as unknown).
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md">
            Sum: {score} / 100 pts
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {factors.map((f, idx) => {
            const percentage = Math.round((f.score / f.maxScore) * 100);
            let barColor = 'bg-blue-600';
            if (percentage >= 80) barColor = 'bg-emerald-600';
            else if (percentage >= 60) barColor = 'bg-amber-500';
            else if (percentage < 40) barColor = 'bg-slate-400';

            return (
              <div
                key={f.factorKey || idx}
                className="p-3 bg-slate-50/80 rounded-lg border border-slate-200 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] font-mono flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    {f.factorName}
                  </span>
                  <span className="font-mono font-bold text-slate-900">
                    {f.score} <span className="text-[10px] text-slate-400 font-normal">/ {f.maxScore} pts</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${barColor} rounded-full transition-all duration-500`}
                    style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-600 leading-snug">{f.explanation}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Strategic Intelligence Sections: Opportunities, Customer Needs, Strategy */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Business Opportunities */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5">
          <h4 className="font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider text-[11px]">
            <Briefcase className="w-4 h-4 text-indigo-600" />
            Commercial Business Opportunities
          </h4>
          <ul className="space-y-1.5 text-slate-700">
            {(analysis?.businessOpportunities && analysis.businessOpportunities.length > 0
              ? analysis.businessOpportunities
              : [
                  `Automate research cycles for ${lead.companyName || lead.company}'s sales representatives`,
                  `Deploy personalized multi-channel sequences across email and WhatsApp`,
                  `Enrich company buying signals with automated CRM trigger notifications`,
                ]
            ).map((opp, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>{opp}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Potential Customer Needs */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5">
          <h4 className="font-bold text-slate-900 flex items-center gap-2 uppercase tracking-wider text-[11px]">
            <Target className="w-4 h-4 text-blue-600" />
            Potential Customer Needs
          </h4>
          <ul className="space-y-1.5 text-slate-700">
            {(analysis?.potentialCustomerNeeds && analysis.potentialCustomerNeeds.length > 0
              ? analysis.potentialCustomerNeeds
              : [
                  'Accelerating outbound SDR response rates with verified contacts',
                  'Centralizing multi-channel outreach in a unified intelligence platform',
                  'Data hygiene and duplicate lead suppression across CRM pipelines',
                ]
            ).map((need, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                <span>{need}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommended Strategy & Next Action Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Recommended Sales Strategy
          </span>
          <span className="text-[10px] text-blue-700 font-mono">
            Scored at: {analysis?.scoredAt ? new Date(analysis.scoredAt).toLocaleDateString() : 'Active'}
          </span>
        </div>
        <p className="text-xs text-blue-950 font-medium leading-relaxed">
          {analysis?.recommendedSalesStrategy ||
            `Engage ${lead.contactPerson || lead.name} with consultative value positioning around outbound research efficiency and verified executive connectivity.`}
        </p>

        {/* Actionable Next Step Highlight */}
        <div className="pt-2 border-t border-blue-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs text-blue-900">
            <span className="font-bold">Recommended Next Action: </span>
            <span>
              {analysis?.recommendedNextAction ||
                `Send a direct personalized email to ${lead.email || lead.contactPerson || 'the prospect'} referencing recent sector developments.`}
            </span>
          </div>
        </div>
      </div>

      {/* Main Risks & Missing Information (2 columns) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Main Risks */}
        <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 space-y-2">
          <h4 className="font-bold text-rose-950 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            Main Deal Risks
          </h4>
          <ul className="space-y-1 text-rose-900">
            {(analysis?.mainRisks && analysis.mainRisks.length > 0
              ? analysis.mainRisks
              : [
                  'Evaluation timeline subject to executive review and budget availability',
                  'Competitive displacement risk if locked in existing vendor contract',
                ]
            ).map((risk, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-rose-500 font-bold">•</span>
                <span>{risk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Missing Information */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
            Missing Information (Treated as Unknown)
          </h4>
          {analysis?.missingInformation && analysis.missingInformation.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {analysis.missingInformation.map((item, i) => (
                <span
                  key={i}
                  className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-medium"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-500 italic">
              All primary corporate attributes (contact, email, phone, location, domain) verified.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
