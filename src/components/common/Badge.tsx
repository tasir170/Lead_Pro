import React from 'react';
import { LeadStatus, QualityTier } from '../../types';

export const StatusBadge: React.FC<{ status: LeadStatus | string; className?: string }> = ({
  status,
  className = '',
}) => {
  const normalized = (status || 'New').toString().toLowerCase();

  let config = {
    label: 'New Lead',
    textClass: 'text-blue-700',
    bgClass: 'bg-blue-50 border-blue-200',
  };

  if (normalized === 'not contacted' || normalized === 'not_contacted') {
    config = {
      label: 'Not Contacted',
      textClass: 'text-slate-700',
      bgClass: 'bg-slate-100 border-slate-300',
    };
  } else if (normalized === 'contacted') {
    config = {
      label: 'Contacted',
      textClass: 'text-sky-700',
      bgClass: 'bg-sky-50 border-sky-200',
    };
  } else if (normalized === 'interested') {
    config = {
      label: 'Interested',
      textClass: 'text-violet-700',
      bgClass: 'bg-violet-50 border-violet-200',
    };
  } else if (normalized === 'qualified') {
    config = {
      label: 'Qualified',
      textClass: 'text-emerald-700',
      bgClass: 'bg-emerald-50 border-emerald-200',
    };
  } else if (normalized === 'negotiation') {
    config = {
      label: 'Negotiation',
      textClass: 'text-amber-700',
      bgClass: 'bg-amber-50 border-amber-200',
    };
  } else if (normalized === 'converted' || normalized === 'won') {
    config = {
      label: 'Converted',
      textClass: 'text-indigo-700',
      bgClass: 'bg-indigo-50 border-indigo-200',
    };
  } else if (normalized === 'lost' || normalized === 'unresponsive') {
    config = {
      label: 'Lost',
      textClass: 'text-rose-700',
      bgClass: 'bg-rose-50 border-rose-200',
    };
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${config.bgClass} ${config.textClass} ${className}`}
    >
      {config.label}
    </span>
  );
};

export const TierBadge: React.FC<{ tier: QualityTier | string; score?: number; className?: string }> = ({
  tier,
  score,
  className = '',
}) => {
  const normalized = (tier || 'Medium').toString().toLowerCase();

  let config = {
    label: 'Medium Quality',
    textClass: 'text-amber-700',
    bgClass: 'bg-amber-50 border-amber-200',
  };

  if (normalized === 'high') {
    config = {
      label: 'High Quality',
      textClass: 'text-emerald-700',
      bgClass: 'bg-emerald-50 border-emerald-200',
    };
  } else if (normalized === 'low') {
    config = {
      label: 'Low Quality',
      textClass: 'text-slate-600',
      bgClass: 'bg-slate-100 border-slate-200',
    };
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${config.bgClass} ${config.textClass} ${className}`}
    >
      <span>{config.label}</span>
      {score !== undefined && <span className="font-mono tabular-nums font-semibold">({score})</span>}
    </span>
  );
};
