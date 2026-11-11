import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { StatusBadge, TierBadge } from '../common/Badge';
import {
  Building2,
  Mail,
  Phone,
  Globe,
  MapPin,
  Sparkles,
  MessageCircle,
  Send,
  Trash2,
  CheckCircle2,
  Calendar,
  User,
  Plus,
  Edit,
  History,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { Lead, LeadStatus, NavigationItemKey } from '../../types';
import { LeadScoreBadge } from './LeadScoreBadge';
import { ScoreBreakdownCard } from './ScoreBreakdownCard';

interface LeadDetailModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (leadId: string, status: LeadStatus) => Promise<void>;
  onDeleteLead: (leadId: string) => Promise<void>;
  onNavigateToOutreach: (view: NavigationItemKey, lead: Lead) => void;
  onRequalify: (leadId: string) => Promise<void>;
  onAddNote: (leadId: string, author: string, content: string) => Promise<void>;
  onOpenEditModal: (lead: Lead) => void;
  onUpdateFollowUp?: (leadId: string, nextDate: string) => Promise<void>;
  onAssignSalesperson?: (leadId: string, rep: string) => Promise<void>;
}

const CRM_STATUSES: LeadStatus[] = [
  'New',
  'Not Contacted',
  'Contacted',
  'Interested',
  'Qualified',
  'Negotiation',
  'Converted',
  'Lost',
];

const SALES_REPS = [
  'Sarah Jenkins',
  'David Mercer',
  'Elena Zhou',
  'Marcus Vance',
  'Unassigned',
];

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  lead,
  isOpen,
  onClose,
  onUpdateStatus,
  onDeleteLead,
  onNavigateToOutreach,
  onRequalify,
  onAddNote,
  onOpenEditModal,
  onUpdateFollowUp,
  onAssignSalesperson,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'score' | 'timeline' | 'remarks'>('profile');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRequalifying, setIsRequalifying] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [nextFollowUpInput, setNextFollowUpInput] = useState('');

  if (!lead) return null;

  const currentStatus = lead.leadStatus || (lead.status as any) || 'New';
  const currentRep = lead.assignedSalesperson || 'Unassigned';
  const cleanPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : '';

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as LeadStatus;
    setIsUpdatingStatus(true);
    try {
      await onUpdateStatus(lead.id, newStatus);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRepChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rep = e.target.value;
    if (onAssignSalesperson) {
      await onAssignSalesperson(lead.id, rep);
    }
  };

  const handleFollowUpSave = async () => {
    if (!nextFollowUpInput) return;
    if (onUpdateFollowUp) {
      await onUpdateFollowUp(lead.id, new Date(nextFollowUpInput).toISOString());
      setNextFollowUpInput('');
    }
  };

  const handleDelete = async () => {
    const company = lead.companyName || lead.company;
    if (confirm(`Are you sure you want to permanently delete "${company}" from your CRM database?`)) {
      setIsDeleting(true);
      try {
        await onDeleteLead(lead.id);
        onClose();
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleRequalify = async () => {
    setIsRequalifying(true);
    try {
      await onRequalify(lead.id);
    } finally {
      setIsRequalifying(false);
    }
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    setIsAddingNote(true);
    try {
      await onAddNote(lead.id, 'Sales Team', newNoteContent.trim());
      setNewNoteContent('');
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!cleanPhone) {
      alert('No valid phone number listed for this lead. Please edit the lead to add a phone number.');
      return;
    }
    const message = encodeURIComponent(`Hi ${lead.contactPerson || lead.name || ''}, following up regarding ${lead.companyName || lead.company}.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleOpenEmail = () => {
    if (!lead.email) {
      alert('No email address listed for this lead.');
      return;
    }
    window.open(`mailto:${lead.email}?subject=Idea%20for%20${encodeURIComponent(lead.companyName || lead.company)}`, '_blank');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={lead.companyName || lead.company}
      description={`${lead.contactPerson || lead.name} (${lead.title || 'Executive'}) · ${lead.city}, ${lead.country}`}
      maxWidth="2xl"
      footer={
        <div className="flex items-center justify-between w-full flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            isLoading={isDeleting}
            leftIcon={<Trash2 className="w-4 h-4 text-rose-500" />}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs"
          >
            Delete Lead
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequalify}
              isLoading={isRequalifying}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-blue-600" />}
              className="text-xs"
            >
              Analyze with AI
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenEditModal(lead)}
              leftIcon={<Edit className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Edit Lead
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenWhatsApp}
              leftIcon={<MessageCircle className="w-3.5 h-3.5 text-emerald-600" />}
              className="text-xs"
            >
              WhatsApp Contact
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenEmail}
              leftIcon={<Mail className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Email Contact
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Top Control Bar: Status, Rep, Lead Score & Tier */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={currentStatus} />
              <TierBadge tier={lead.leadQuality || lead.qualityTier || 'Medium'} />
              {lead.isDemo && (
                <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">
                  Demo Record
                </span>
              )}
            </div>

            {/* Quick Status and Salesperson Controls */}
            <div className="flex items-center gap-3 flex-wrap text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Status:</span>
                <select
                  value={currentStatus}
                  onChange={handleStatusChange}
                  disabled={isUpdatingStatus}
                  className="bg-white border border-slate-300 text-slate-900 rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {CRM_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-slate-500">Assigned:</span>
                <select
                  value={currentRep}
                  onChange={handleRepChange}
                  className="bg-white border border-slate-300 text-slate-900 rounded px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  {SALES_REPS.map((rep) => (
                    <option key={rep} value={rep}>
                      {rep}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lead Score Indicator & Analyze with AI */}
          <div className="flex items-center gap-2.5 bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shrink-0">
            <LeadScoreBadge score={lead.leadScore ?? lead.aiScore ?? 0} category={lead.leadCategory} size="md" />
            <Button
              variant="primary"
              size="xs"
              onClick={handleRequalify}
              isLoading={isRequalifying}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-300" />}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs"
            >
              Analyze with AI
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-1 text-xs font-medium overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2 px-2 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'profile'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Company & Contact Details
          </button>
          <button
            onClick={() => setActiveTab('score')}
            className={`pb-2 px-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'score'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Score Breakdown (0–100)</span>
          </button>
          <button
            onClick={() => setActiveTab('remarks')}
            className={`pb-2 px-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              activeTab === 'remarks'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Internal Remarks & Notes</span>
            <span className="bg-slate-100 text-slate-600 font-mono text-[10px] px-1.5 py-0.2 rounded-full">
              {lead.notes?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`pb-2 px-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1 whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Activity Timeline</span>
            <span className="bg-slate-100 text-slate-600 font-mono text-[10px] px-1.5 py-0.2 rounded-full">
              {lead.activities?.length || 0}
            </span>
          </button>
        </div>

        {/* TAB: AI Score Breakdown */}
        {activeTab === 'score' && (
          <ScoreBreakdownCard lead={lead} onAnalyze={handleRequalify} isAnalyzing={isRequalifying} />
        )}

        {/* TAB 1: Profile & Company Information */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* AI Research Summary */}
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  AI Intelligence & Company Summary
                </h4>
                <span className="text-[10px] text-blue-700 font-medium">Source: {lead.leadSource || 'Discovery'}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {lead.aiResearchSummary || lead.aiSummary || 'Lead registered in CRM pipeline with standard parameters.'}
              </p>
            </div>

            {/* Core 19 Database Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Contact Person */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                  <User className="w-3 h-3 text-indigo-600" /> Contact Person
                </span>
                <span className="text-slate-900 font-semibold block">{lead.contactPerson || lead.name}</span>
                {lead.title && <span className="text-slate-500 text-[11px] block">{lead.title}</span>}
              </div>

              {/* Email Address */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                  <Mail className="w-3 h-3 text-blue-600" /> Email Address
                </span>
                {lead.email ? (
                  <a href={`mailto:${lead.email}`} className="text-blue-600 font-mono font-medium hover:underline truncate block">
                    {lead.email}
                  </a>
                ) : (
                  <span className="text-slate-400 italic">Not listed</span>
                )}
              </div>

              {/* Phone */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" /> Phone Number
                </span>
                <span className="text-slate-800 font-mono font-medium block">
                  {lead.phone || 'Not listed'}
                </span>
              </div>

              {/* Website */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                  <Globe className="w-3 h-3 text-sky-600" /> Website
                </span>
                {lead.website || lead.domain ? (
                  <a
                    href={lead.website || `https://${lead.domain}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-blue-600 font-mono font-medium hover:underline truncate block"
                  >
                    {lead.website || lead.domain}
                  </a>
                ) : (
                  <span className="text-slate-400 italic">No website</span>
                )}
              </div>

              {/* Location: City & Country */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-600" /> City & Country
                </span>
                <span className="text-slate-800 font-medium block">
                  {lead.city}, {lead.country}
                </span>
              </div>

              {/* Industry */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-600" /> Industry
                </span>
                <span className="text-slate-800 font-medium block">
                  {lead.industry}
                </span>
              </div>

              {/* Created & Last Contacted Dates */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" /> Discovery & Contact Cadence
                </span>
                <div className="text-[11px] text-slate-600 space-y-0.5">
                  <div>Created: <span className="font-mono text-slate-800">{new Date(lead.createdDate || lead.createdAt).toLocaleDateString()}</span></div>
                  <div>Last Touch: <span className="font-mono text-slate-800">{lead.lastContactedDate || lead.lastContactedAt ? new Date(lead.lastContactedDate || lead.lastContactedAt!).toLocaleDateString() : 'Never'}</span></div>
                </div>
              </div>

              {/* Next Follow-up Date */}
              <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" /> Next Follow-up Date
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-900 font-mono font-bold text-xs">
                    {lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString() : 'Not scheduled'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="date"
                    value={nextFollowUpInput}
                    onChange={(e) => setNextFollowUpInput(e.target.value)}
                    className="text-[11px] bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5"
                  />
                  <Button variant="outline" size="xs" onClick={handleFollowUpSave}>
                    Set
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Remarks & Internal Notes */}
        {activeTab === 'remarks' && (
          <div className="space-y-4">
            {/* Add New Note Box */}
            <form onSubmit={handleCreateNote} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-700">Add Internal Note / Deal Remark</label>
              <textarea
                rows={2}
                required
                placeholder="Log call outcome, deal updates, customer objections, or executive requirements..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="xs"
                  isLoading={isAddingNote}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Save Remark
                </Button>
              </div>
            </form>

            {/* Notes List */}
            <div className="space-y-2.5">
              {(!lead.notes || lead.notes.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  No internal remarks logged yet. Add your first note above.
                </div>
              ) : (
                lead.notes.map((note) => (
                  <div key={note.id} className="p-3.5 bg-white rounded-lg border border-slate-200 shadow-2xs space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{note.author}</span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(note.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{note.content}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Activity Timeline & Interaction History */}
        {activeTab === 'timeline' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Chronological Audit Trail & Follow-up History
            </div>

            {(!lead.activities || lead.activities.length === 0) ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No activity events recorded yet.
              </div>
            ) : (
              <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {lead.activities.map((act) => (
                  <div key={act.id} className="relative text-xs space-y-0.5">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-white" />
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{act.title}</span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {new Date(act.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-600">{act.description}</p>
                    <div className="text-[10px] text-slate-400 italic">By {act.actor}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
