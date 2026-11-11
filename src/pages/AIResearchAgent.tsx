import React, { useState } from 'react';
import {
  Sparkles,
  Building2,
  Globe,
  Search,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Plus,
  Check,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { CompanyResearchDossier, Lead } from '../types';

interface AIResearchAgentProps {
  onRunResearch: (companyName: string, domain: string) => Promise<CompanyResearchDossier>;
  onImportFromResearch: (leadData: Partial<Lead>) => Promise<Lead>;
}

export const AIResearchAgent: React.FC<AIResearchAgentProps> = ({
  onRunResearch,
  onImportFromResearch,
}) => {
  const [companyName, setCompanyName] = useState('FinApex Systems');
  const [domain, setDomain] = useState('finapex.io');
  const [isLoading, setIsLoading] = useState(false);
  const [dossier, setDossier] = useState<CompanyResearchDossier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isImported, setIsImported] = useState(false);

  const handleResearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!companyName.trim() && !domain.trim()) {
      setError('Please provide a company name or domain.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsImported(false);

    try {
      const result = await onRunResearch(companyName.trim(), domain.trim());
      setDossier(result);
    } catch (err: any) {
      setError(err.message || 'Failed to research company');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToPipeline = async () => {
    if (!dossier) return;
    try {
      await onImportFromResearch({
        company: dossier.companyName,
        domain: dossier.domain,
        name: `VP of Growth at ${dossier.companyName}`,
        title: 'VP of Commercial Strategy',
        email: `growth@${dossier.domain}`,
        industry: dossier.industry,
        annualRevenue: dossier.estimatedRevenue || '$25M',
        location: dossier.headquarters || 'United States',
        aiScore: dossier.icpFitRating === 'Exceptional' ? 95 : 88,
        qualityTier: dossier.icpFitRating === 'Exceptional' || dossier.icpFitRating === 'Strong' ? 'high' : 'medium',
        aiSummary: dossier.summary,
        aiTalkingPoints: [dossier.recommendedPitchAngle, ...(dossier.hiringSignals || [])],
        keyChallenges: dossier.painPoints,
      });
      setIsImported(true);
    } catch (err: any) {
      setError(err.message || 'Failed to save to pipeline');
    }
  };

  const presetExamples = [
    { name: 'CloudScale Logistics', domain: 'cloudscalelogistics.com' },
    { name: 'FinApex Systems', domain: 'finapex.io' },
    { name: 'HealthVibe Telehealth', domain: 'healthvibe.health' },
    { name: 'DataForge Security', domain: 'dataforge.security' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Deep Account Research · Gemini 2.5 Flash</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          AI Company Research Agent
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Enter any corporate domain to synthesize a comprehensive B2B dossier: tech stack, active hiring signals, executive pain points, and strategic pitch angles.
        </p>
      </div>

      {/* Research Query Input */}
      <Card>
        <CardContent className="p-5 space-y-4">
          <form onSubmit={handleResearch} className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Company Name (e.g. Acme Corp)"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex-1 relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Website / Domain (e.g. acme.com)"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              leftIcon={<Search className="w-4 h-4" />}
            >
              Analyze Company
            </Button>
          </form>

          {/* Quick presets */}
          <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 pt-1">
            <span className="font-medium text-slate-600">Quick Test Accounts:</span>
            {presetExamples.map((ex) => (
              <button
                key={ex.domain}
                type="button"
                onClick={() => {
                  setCompanyName(ex.name);
                  setDomain(ex.domain);
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
              >
                {ex.name}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Research Results Dossier */}
      {dossier ? (
        <div className="space-y-6">
          {/* Top Dossier Banner */}
          <Card className="border-blue-200 bg-gradient-to-r from-white via-white to-blue-50/40">
            <CardHeader
              action={
                <Button
                  variant={isImported ? 'outline' : 'primary'}
                  size="sm"
                  onClick={handleSaveToPipeline}
                  disabled={isImported}
                  leftIcon={isImported ? <Check className="w-4 h-4 text-emerald-600" /> : <Plus className="w-4 h-4" />}
                >
                  {isImported ? 'Added to Pipeline' : 'Add Account to Leads'}
                </Button>
              }
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {dossier.companyName.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{dossier.companyName}</CardTitle>
                    <span className="text-xs bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded">
                      ICP Fit: {dossier.icpFitRating}
                    </span>
                  </div>
                  <CardDescription className="font-mono text-slate-500">
                    {dossier.domain} · {dossier.industry} · {dossier.headquarters}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700 leading-relaxed max-w-3xl">
                {dossier.summary}
              </p>
            </CardContent>
          </Card>

          {/* Detailed Intelligence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tech Stack Detected */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  Detected Software & Tech Stack
                </CardTitle>
                <CardDescription>Verified tools, platforms, and CRM infrastructure</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {dossier.techStack.map((tool, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 text-xs rounded-md font-medium"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pain Points & Vulnerabilities */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Identified Operational Pain Points
                </CardTitle>
                <CardDescription>High-probability friction points in their current sales motion</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs text-slate-700">
                  {dossier.painPoints.map((pain, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                      <span>{pain}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Hiring Signals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-500" />
                  Commercial Hiring & Expansion Signals
                </CardTitle>
                <CardDescription>Recent headcount growth in sales and revenue roles</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs text-slate-700">
                  {dossier.hiringSignals.map((signal, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{signal}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Recommended Sales Pitch Angle */}
            <Card className="border-indigo-200 bg-indigo-50/20">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2 text-indigo-950">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  Recommended Cold Pitch Angle
                </CardTitle>
                <CardDescription>Tailored executive value proposition generated by Gemini</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="p-3 bg-white rounded-lg border border-indigo-100 text-xs text-slate-800 leading-relaxed italic">
                  "{dossier.recommendedPitchAngle}"
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center text-slate-500 space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-slate-800">
              Ready to generate intelligence dossier
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
              Submit a company name above or pick one of the quick test accounts to see Gemini 2.5 Flash synthesize deep account intelligence in real time.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
