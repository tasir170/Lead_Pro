import React, { useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  Mail,
  MessageCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge, TierBadge } from '../components/common/Badge';
import { Lead, NavigationItemKey } from '../types';

interface FollowUpsProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onNavigateToOutreach: (view: NavigationItemKey, lead: Lead) => void;
}

export const FollowUps: React.FC<FollowUpsProps> = ({
  leads,
  onSelectLead,
  onNavigateToOutreach,
}) => {
  const [filterCadence, setFilterCadence] = useState<'all' | 'due' | 'scheduled'>('all');
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());

  // Dynamically extract leads with scheduled follow-ups first, then backfill
  const scheduledLeads = leads.filter((l) => Boolean(l.nextFollowUpDate));
  const otherLeads = leads.filter((l) => !l.nextFollowUpDate);
  const prioritizedLeads = [...scheduledLeads, ...otherLeads];

  const nowTime = new Date().getTime();

  // Generate cadence tasks based on existing leads
  const cadenceTasks = prioritizedLeads.slice(0, 10).map((lead, index) => {
    let isDue = false;
    let dueLabel = 'Scheduled';

    if (lead.nextFollowUpDate) {
      const targetTime = new Date(lead.nextFollowUpDate).getTime();
      const diffDays = Math.ceil((targetTime - nowTime) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        isDue = true;
        dueLabel = `${Math.abs(diffDays)}d Overdue`;
      } else if (diffDays === 0) {
        isDue = true;
        dueLabel = 'Due Today';
      } else {
        dueLabel = `In ${diffDays}d (${new Date(lead.nextFollowUpDate).toLocaleDateString()})`;
      }
    } else {
      isDue = index < 2;
      const daysAgo = index * 2 + 1;
      dueLabel = isDue ? 'Due Today' : `In ${daysAgo} days`;
    }

    const stage = index === 0 ? 'Day 3: Social Proof Touch' : index === 1 ? 'Day 7: Value Add Insight' : 'Day 14: Executive Check-in';

    return {
      id: `task-${lead.id}`,
      lead,
      isDue,
      stage,
      recommendedChannel: lead.phone ? 'whatsapp' : 'email',
      suggestedHook: lead.remarks || (index === 0
        ? 'Share benchmark on outbound AI qualification'
        : 'Inquire if they evaluated custom automation for sales pipeline'),
      dueLabel,
    };
  });

  const filteredTasks = cadenceTasks.filter((task) => {
    if (filterCadence === 'due') return task.isDue;
    if (filterCadence === 'scheduled') return !task.isDue;
    return true;
  });

  const handleToggleComplete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = new Set(completedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setCompletedIds(updated);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>Cadence Manager · Executive Follow-ups</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Follow-up Queue & Cadence Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Never let a high-priority deal slip. Follow up systematically across multiple channels based on automated cadence schedules.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setFilterCadence('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterCadence === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({cadenceTasks.length})
          </button>
          <button
            onClick={() => setFilterCadence('due')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterCadence === 'due' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Due Today ({cadenceTasks.filter((t) => t.isDue).length})
          </button>
          <button
            onClick={() => setFilterCadence('scheduled')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              filterCadence === 'scheduled' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upcoming
          </button>
        </div>
      </div>

      {/* Task Cards List */}
      <div className="space-y-3">
        {filteredTasks.map((task) => {
          const isDone = completedIds.has(task.id);
          return (
            <Card
              key={task.id}
              className={`transition-all hover:border-slate-300 ${isDone ? 'opacity-60 bg-slate-50' : 'bg-white'}`}
            >
              <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    onClick={(e) => handleToggleComplete(task.id, e)}
                    className="mt-0.5 text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                    title={isDone ? 'Mark as incomplete' : 'Mark completed'}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <div className="w-5 h-5 rounded-md border-2 border-slate-300 hover:border-blue-500" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-semibold ${isDone ? 'line-through text-slate-500' : 'text-slate-900'}`}>
                        {task.lead.name}
                      </span>
                      <span className="text-xs text-slate-500">({task.lead.title})</span>
                      <StatusBadge status={task.lead.status} />
                      <TierBadge tier={task.lead.qualityTier} score={task.lead.aiScore} />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-800">{task.lead.company}</span>
                      <span>·</span>
                      <span className="text-blue-600 font-medium">{task.stage}</span>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 italic">
                      "{task.suggestedHook}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-right">
                    <span
                      className={`text-xs font-mono font-medium px-2 py-0.5 rounded ${
                        task.isDue
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {task.dueLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => onSelectLead(task.lead)}
                    >
                      Dossier
                    </Button>
                    <Button
                      variant="primary"
                      size="xs"
                      onClick={() =>
                        onNavigateToOutreach(
                          task.recommendedChannel === 'whatsapp' ? 'whatsapp-outreach' : 'ai-assistant',
                          task.lead
                        )
                      }
                      leftIcon={
                        task.recommendedChannel === 'whatsapp' ? (
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Mail className="w-3.5 h-3.5" />
                        )
                      }
                    >
                      Execute {task.recommendedChannel === 'whatsapp' ? 'WA' : 'Email'}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
