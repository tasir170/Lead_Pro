import React from 'react';
import { Flame, Sparkles, Target, Snowflake } from 'lucide-react';
import { LeadCategory } from '../../types';

interface LeadScoreBadgeProps {
  score: number;
  category?: LeadCategory;
  showCategoryLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const getCategoryFromScore = (score: number): LeadCategory => {
  if (score >= 80) return 'Hot Lead';
  if (score >= 60) return 'Warm Lead';
  if (score >= 40) return 'Potential Lead';
  return 'Cold Lead';
};

export const LeadScoreBadge: React.FC<LeadScoreBadgeProps> = ({
  score,
  category,
  showCategoryLabel = true,
  size = 'md',
  className = '',
}) => {
  const finalCategory = category || getCategoryFromScore(score);

  // Define styling per category
  let badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
  let pillColor = 'bg-slate-500';
  let IconComponent = Snowflake;

  if (finalCategory === 'Hot Lead') {
    badgeStyles = 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-1 ring-emerald-500/20';
    pillColor = 'bg-emerald-500';
    IconComponent = Flame;
  } else if (finalCategory === 'Warm Lead') {
    badgeStyles = 'bg-amber-50 text-amber-800 border-amber-200 ring-1 ring-amber-500/20';
    pillColor = 'bg-amber-500';
    IconComponent = Sparkles;
  } else if (finalCategory === 'Potential Lead') {
    badgeStyles = 'bg-blue-50 text-blue-800 border-blue-200 ring-1 ring-blue-500/20';
    pillColor = 'bg-blue-500';
    IconComponent = Target;
  } else {
    // Cold Lead
    badgeStyles = 'bg-slate-100 text-slate-700 border-slate-200';
    pillColor = 'bg-slate-400';
    IconComponent = Snowflake;
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5 font-semibold',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <div
      className={`inline-flex items-center rounded-lg border font-medium transition-all shadow-2xs ${badgeStyles} ${sizeClasses[size]} ${className}`}
      title={`${finalCategory} · Score: ${score}/100`}
    >
      <IconComponent className={`${iconSizes[size]} shrink-0`} />
      <span className="font-mono font-bold tabular-nums">{score}</span>
      {showCategoryLabel && (
        <>
          <span className="text-slate-300 font-light">/</span>
          <span className="truncate">{finalCategory}</span>
        </>
      )}
    </div>
  );
};
