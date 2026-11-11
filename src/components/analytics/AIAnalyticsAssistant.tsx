import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Copy,
  Check,
  TrendingUp,
  BrainCircuit,
  MessageSquare,
} from 'lucide-react';
import { AIAnalyticsInsight, AnalyticsFilterOptions } from '../../types';
import { api } from '../../services/api';

interface AIAnalyticsAssistantProps {
  currentFilters: AnalyticsFilterOptions;
  dateRangeLabel: string;
}

const PRESET_QUESTIONS = [
  'Which industry generates the best leads?',
  'Which country has the most qualified companies?',
  'What percentage of leads are converting?',
  'Which leads need immediate attention?',
  'What improvements can increase conversion?',
];

export const AIAnalyticsAssistant: React.FC<AIAnalyticsAssistantProps> = ({
  currentFilters,
  dateRangeLabel,
}) => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [insight, setInsight] = useState<AIAnalyticsInsight | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleAsk = async (questionToAsk: string) => {
    if (!questionToAsk.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    setQuery(questionToAsk);

    try {
      const result = await api.getAiAnalyticsInsights(questionToAsk, currentFilters);
      setInsight(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI analytics insight.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!insight) return;
    const text = `LeadPulse AI Analytics Insight\nQuestion: ${insight.question}\n\nAnswer: ${insight.answer}\n\nKey Findings:\n${insight.keyFindings.map((f) => `- ${f}`).join('\n')}\n\nAction Items:\n${insight.actionItems.map((a) => `- ${a}`).join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md border border-slate-800 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-indigo-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-wide">
                Gemini Analytics Intelligence Assistant
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                gemini-3.8-flash
              </span>
            </div>
            <p className="text-xs text-indigo-200/70">
              Real-time strategic analysis grounded directly in your filtered database ({dateRangeLabel})
            </p>
          </div>
        </div>

        {insight && (
          <button
            onClick={handleCopy}
            className="self-start sm:self-auto flex items-center gap-1.5 text-xs text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900/80 border border-indigo-800/80 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Insight</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Suggested Prompt Chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-indigo-300/80 uppercase tracking-wider">
          Suggested Strategic Analyses:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleAsk(q)}
              disabled={isLoading}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/60 text-indigo-200 border border-indigo-800/50 transition-all hover:border-indigo-600 disabled:opacity-50 text-left cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Query Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(query);
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your pipeline, SDR performance, lead conversion, or regional yield..."
            className="w-full bg-slate-950/80 text-white placeholder-slate-500 text-xs rounded-xl px-3.5 py-2.5 border border-indigo-900/70 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </>
          )}
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Active Insight Panel */}
      {insight && (
        <div className="bg-slate-950/70 rounded-xl p-4 border border-indigo-900/40 space-y-3.5 animate-fade-in text-xs">
          <div className="flex items-center gap-2 text-indigo-300 font-semibold text-xs border-b border-slate-800/80 pb-2">
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span className="italic">"{insight.question}"</span>
          </div>

          {/* Answer Body */}
          <div className="text-slate-200 leading-relaxed whitespace-pre-line text-xs font-sans">
            {insight.answer}
          </div>

          {/* Key Findings */}
          {insight.keyFindings && insight.keyFindings.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Key Data Findings:
              </span>
              <ul className="space-y-1 text-slate-300 pl-1">
                {insight.keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items */}
          {insight.actionItems && insight.actionItems.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> Recommended Sales Team Actions:
              </span>
              <ul className="space-y-1 text-slate-300 pl-1">
                {insight.actionItems.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
