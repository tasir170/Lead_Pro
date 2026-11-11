import React from 'react';
import {
  Building2,
  Mail,
  Phone,
  ArrowRight,
  ExternalLink,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import { Lead } from '../../types';
import { LeadScoreBadge } from '../leads/LeadScoreBadge';
import { StatusBadge } from '../common/Badge';

interface ChatLeadCardProps {
  lead: Lead;
  onOpenDetail?: (lead: Lead) => void;
  onOutreach?: (channel: 'whatsapp' | 'email', lead: Lead) => void;
}

export const ChatLeadCard: React.FC<ChatLeadCardProps> = ({
  lead,
  onOpenDetail,
  onOutreach,
}) => {
  return (
    <div className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs transition-all flex flex-col justify-between text-left group">
      <div>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{lead.companyName || lead.company}</span>
            </h4>
            <p className="text-[11px] text-slate-500 truncate">
              {lead.contactPerson || lead.name} {lead.title ? `· ${lead.title}` : ''}
            </p>
          </div>
          <LeadScoreBadge score={lead.leadScore} size="sm" showCategoryLabel={false} />
        </div>

        {/* Location & Industry */}
        <div className="text-[11px] text-slate-500 mb-2 flex items-center gap-2 flex-wrap">
          <span>{lead.city}, {lead.country}</span>
          <span>•</span>
          <span className="truncate max-w-[140px]">{lead.industry}</span>
        </div>

        {/* Contact info pill */}
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mb-2">
          {lead.email ? (
            <span className="flex items-center gap-1 truncate max-w-[130px]" title={lead.email}>
              <Mail className="w-3 h-3 text-slate-400" />
              {lead.email}
            </span>
          ) : (
            <span className="text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded font-sans">
              Missing Email
            </span>
          )}
          {lead.phone && (
            <span className="flex items-center gap-1 truncate" title={lead.phone}>
              <Phone className="w-3 h-3 text-slate-400" />
              {lead.phone}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 text-xs">
        <StatusBadge status={lead.leadStatus || lead.status} />

        <div className="flex items-center gap-1">
          {onOutreach && lead.phone && (
            <button
              onClick={() => onOutreach('whatsapp', lead)}
              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
              title="WhatsApp Outreach"
            >
              <MessageCircle className="w-3.5 h-3.5" />
            </button>
          )}
          {onOutreach && lead.email && (
            <button
              onClick={() => onOutreach('email', lead)}
              className="p-1 rounded text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
              title="Draft Email"
            >
              <Mail className="w-3.5 h-3.5" />
            </button>
          )}
          {onOpenDetail && (
            <button
              onClick={() => onOpenDetail(lead)}
              className="px-2 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
            >
              <span>Profile</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
