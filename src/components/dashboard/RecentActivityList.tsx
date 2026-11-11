import React from 'react';
import { Sparkles, MessageSquare, UserCheck, Clock } from 'lucide-react';
import { Lead } from '../../types';

interface RecentActivityListProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({ leads, onSelectLead }) => {
  const activities = [
    {
      id: 'act-1',
      leadId: 'lead-1',
      type: 'qualification',
      title: 'Elena Rostova evaluated by AI',
      detail: 'Assigned 94/100 AI Score · Series B expansion signal confirmed',
      time: '12m ago',
      icon: <Sparkles className="w-3.5 h-3.5 text-blue-500" />,
    },
    {
      id: 'act-2',
      leadId: 'lead-2',
      type: 'outreach',
      title: 'WhatsApp message drafted for Marcus Vance',
      detail: 'Tailored value hook on SDR research automation delivered',
      time: '45m ago',
      icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />,
    },
    {
      id: 'act-3',
      leadId: 'lead-3',
      type: 'conversion',
      title: 'Sophia Chen marked as Converted',
      detail: 'Contract executed: Growth Tier 12-month commitment',
      time: '2h ago',
      icon: <UserCheck className="w-3.5 h-3.5 text-indigo-500" />,
    },
    {
      id: 'act-4',
      leadId: 'lead-4',
      type: 'new',
      title: 'David Kalu discovered via Inbound Intent',
      detail: 'Enterprise Security vendor ($90M ARR) added to pipeline',
      time: '3h ago',
      icon: <Clock className="w-3.5 h-3.5 text-slate-500" />,
    },
  ];

  return (
    <div className="divide-y divide-slate-100">
      {activities.map((act) => {
        const lead = leads.find((l) => l.id === act.leadId);
        return (
          <div
            key={act.id}
            onClick={() => lead && onSelectLead(lead)}
            className="p-3.5 flex items-start gap-3 hover:bg-slate-50/80 transition-colors cursor-pointer rounded-lg"
          >
            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 shrink-0 mt-0.5">
              {act.icon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-semibold text-slate-800 truncate">{act.title}</h4>
                <span className="text-[10px] text-slate-400 shrink-0 font-mono">{act.time}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed truncate">{act.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
