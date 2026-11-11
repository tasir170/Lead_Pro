import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageCircle,
  ExternalLink,
  CheckCircle2,
  Phone,
  Sparkles,
  Building2,
  Calendar,
  Clock,
  Filter,
  Search,
  Copy,
  Check,
  AlertTriangle,
  RotateCw,
  Send,
  ShieldCheck,
  Info,
  ChevronDown,
  Plus,
  User,
  ArrowRight,
  Flame,
  Globe,
  Settings,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusBadge } from '../components/common/Badge';
import { LeadScoreBadge } from '../components/leads/LeadScoreBadge';
import {
  Lead,
  LeadStatus,
  WhatsAppMessageStyle,
  GeneratedWhatsAppMessage,
  WhatsAppMetrics,
  WhatsAppCloudConfigStatus,
  NavigationItemKey,
} from '../types';
import { api } from '../services/api';
import { normalizePhoneNumber, buildWaMeUrl, PhoneNormalizationResult } from '../utils/phoneNormalizer';

interface WhatsAppOutreachProps {
  leads: Lead[];
  preselectedLead?: Lead | null;
  onUpdateStatus: (leadId: string, status: LeadStatus) => Promise<void>;
  onSelectLeadForDetail?: (lead: Lead) => void;
  onNavigateToAssistant?: () => void;
}

export const WhatsAppOutreach: React.FC<WhatsAppOutreachProps> = ({
  leads,
  preselectedLead,
  onUpdateStatus,
  onSelectLeadForDetail,
  onNavigateToAssistant,
}) => {
  // Navigation & selection
  const [selectedLeadId, setSelectedLeadId] = useState<string>(
    preselectedLead?.id || leads.find((l) => l.phone)?.id || leads[0]?.id || ''
  );
  const [activeTab, setActiveTab] = useState<'all' | 'ready' | 'hot' | 'overdue' | 'uncontacted'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // AI Message Generation State
  const [selectedStyle, setSelectedStyle] = useState<WhatsAppMessageStyle>('intro');
  const [isGenerating, setIsGenerating] = useState(false);
  const [customMessage, setCustomMessage] = useState<string>('');
  const [activeGenerated, setActiveGenerated] = useState<GeneratedWhatsAppMessage | null>(null);
  const [copied, setCopied] = useState(false);

  // Modals & Panels
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isCloudApiModalOpen, setIsCloudApiModalOpen] = useState(false);
  const [followUpLead, setFollowUpLead] = useState<Lead | null>(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  // Cloud API Sending State
  const [isCloudSending, setIsCloudSending] = useState(false);
  const [cloudSendConfirmation, setCloudSendConfirmation] = useState(false);
  const [cloudApiStatus, setCloudApiStatus] = useState<WhatsAppCloudConfigStatus | null>(null);

  // Metrics & Notifications
  const [metrics, setMetrics] = useState<WhatsAppMetrics | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const currentLead = leads.find((l) => l.id === selectedLeadId) || leads[0];

  // Normalized phone info for current lead
  const currentLeadPhone = useMemo(() => {
    if (!currentLead) return null;
    return normalizePhoneNumber(currentLead.phone, currentLead.country);
  }, [currentLead]);

  // Load Metrics & Cloud API status
  const loadStats = async () => {
    try {
      const [m, cloud] = await Promise.all([
        api.getWhatsAppMetrics(),
        api.getWhatsAppCloudConfigStatus(),
      ]);
      setMetrics(m);
      setCloudApiStatus(cloud);
    } catch (err) {
      console.warn('Failed to fetch WhatsApp metrics:', err);
    }
  };

  useEffect(() => {
    loadStats();
  }, [leads]);

  // If preselectedLead changes, select it and open composer
  useEffect(() => {
    if (preselectedLead) {
      setSelectedLeadId(preselectedLead.id);
      setIsComposerOpen(true);
    }
  }, [preselectedLead]);

  // Generate initial message when composer opens or target lead / style changes
  useEffect(() => {
    if (currentLead && isComposerOpen) {
      handleGenerateMessage(selectedStyle);
    }
  }, [selectedLeadId, isComposerOpen]);

  const handleGenerateMessage = async (style: WhatsAppMessageStyle) => {
    if (!currentLead) return;
    setIsGenerating(true);
    setSelectedStyle(style);
    setCopied(false);

    try {
      const res = await api.generateWhatsAppMessage(currentLead.id, style);
      setActiveGenerated(res.generated);
      setCustomMessage(res.generated.messageText);
    } catch (err: any) {
      // Fallback local message
      const firstName = (currentLead.contactPerson || currentLead.name).split(' ')[0] || 'there';
      const fallback = `Hi ${firstName}, noticed ${currentLead.companyName}'s growth in ${currentLead.industry}. We help revenue teams cut prospect research by 80% with automated AI dossiers. Open to a 2-min overview?`;
      setCustomMessage(fallback);
    } finally {
      setIsGenerating(false);
    }
  };

  // Open official wa.me Link
  const handleOpenWaMe = async (leadToContact?: Lead) => {
    const target = leadToContact || currentLead;
    if (!target) return;

    const norm = normalizePhoneNumber(target.phone, target.country);
    if (!norm.isValid) {
      showToast(norm.validationError || 'Invalid phone number format.');
      return;
    }

    const messageText = target.id === currentLead?.id && customMessage ? customMessage : `Hi ${(target.contactPerson || target.name).split(' ')[0]}, noticed ${target.companyName}'s work in ${target.industry}. Would love to share how our AI sales engine is accelerating response rates. Open to a quick preview?`;
    const waUrl = buildWaMeUrl(norm.e164Digits, messageText);

    // Open WhatsApp Web in new window safely
    const win = window.open(waUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      // If popup blocked, create direct clickable link
      const anchor = document.createElement('a');
      anchor.href = waUrl;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      anchor.click();
    }

    // Automatically log outreach and update status to Contacted if currently New
    try {
      await api.logWhatsAppOutreach({
        leadId: target.id,
        messageText,
        newStatus: target.leadStatus === 'New' || target.leadStatus === 'Not Contacted' ? 'Contacted' : undefined,
        author: 'WhatsApp Outreach',
      });
      loadStats();
      showToast(`Logged WhatsApp chat for ${target.companyName}!`);
    } catch (err) {
      console.warn('Failed to log outreach activity:', err);
    }
  };

  // Automated Dispatch via Official Cloud API (Guarded with User Authorization)
  const handleDispatchCloudApi = async () => {
    if (!currentLead) return;
    if (!cloudSendConfirmation) {
      showToast('Safety Gate: Please verify and confirm before dispatching automated message.');
      return;
    }

    setIsCloudSending(true);
    try {
      const res = await api.sendWhatsAppCloudMessage({
        leadId: currentLead.id,
        messageText: customMessage,
        isUserApproved: true,
        approvedBy: 'Sales Representative',
      });

      if (res.success) {
        showToast(`Delivered via Official WhatsApp Business Cloud API! Message ID: ${res.result.messageId}`);
        setIsComposerOpen(false);
        setCloudSendConfirmation(false);
        loadStats();
      } else {
        showToast(res.result.details || 'Cloud API dispatch rejected.');
      }
    } catch (err: any) {
      showToast(err.message || 'Cloud API request failed.');
    } finally {
      setIsCloudSending(false);
    }
  };

  // Follow-up Scheduling
  const handleOpenFollowUp = (lead: Lead) => {
    setFollowUpLead(lead);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    setFollowUpDate(tomorrow.toISOString().split('T')[0]);
    setFollowUpNotes(`Follow-up on WhatsApp discussion regarding ${lead.companyName}'s outbound automation.`);
    setIsFollowUpModalOpen(true);
  };

  const handleSaveFollowUp = async () => {
    if (!followUpLead || !followUpDate) return;
    setIsScheduling(true);
    try {
      await api.scheduleWhatsAppFollowUp({
        leadId: followUpLead.id,
        nextFollowUpDate: followUpDate,
        notes: followUpNotes,
        author: 'Sales Rep',
      });
      showToast(`Follow-up scheduled for ${new Date(followUpDate).toLocaleDateString()}!`);
      setIsFollowUpModalOpen(false);
      loadStats();
    } catch (err: any) {
      showToast(err.message || 'Failed to schedule follow-up.');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCopyMessage = () => {
    if (!customMessage) return;
    navigator.clipboard.writeText(customMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filter leads based on active tab and search query
  const filteredLeads = useMemo(() => {
    const now = new Date();
    return leads.filter((lead) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          lead.companyName.toLowerCase().includes(q) ||
          lead.contactPerson.toLowerCase().includes(q) ||
          (lead.phone && lead.phone.toLowerCase().includes(q)) ||
          lead.city.toLowerCase().includes(q) ||
          lead.country.toLowerCase().includes(q);
        if (!matchesQuery) return false;
      }

      const norm = normalizePhoneNumber(lead.phone, lead.country);

      if (activeTab === 'ready') {
        return norm.isValid;
      }
      if (activeTab === 'hot') {
        return lead.leadScore >= 80;
      }
      if (activeTab === 'overdue') {
        if (!lead.nextFollowUpDate) return false;
        return new Date(lead.nextFollowUpDate) < now && lead.leadStatus !== 'Converted' && lead.leadStatus !== 'Lost';
      }
      if (activeTab === 'uncontacted') {
        return lead.leadStatus === 'New' || lead.leadStatus === 'Not Contacted' || !lead.lastContactedDate;
      }

      return true;
    });
  }, [leads, activeTab, searchQuery]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-emerald-500/50 text-white text-xs px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in">
          <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-600 mb-1">
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Executive Engagement · WhatsApp Outreach Pipeline</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            WhatsApp Outreach Engine
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              E.164 Compliant
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Contact qualified leads via 1-click wa.me links with Gemini-personalized messages or through the official WhatsApp Business Cloud API.
          </p>
        </div>

        {/* Integration Architecture Pill & Trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCloudApiModalOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-slate-500" />
            <span>Platform Cloud API</span>
            <span
              className={`w-2 h-2 rounded-full ${
                cloudApiStatus?.isConfigured ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Valid WhatsApp Contacts</span>
            <Phone className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.withValidPhoneCount ?? leads.filter((l) => l.phone).length}
            <span className="text-xs font-normal text-slate-400 ml-1.5">/ {leads.length} leads</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Contacted via WhatsApp</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-700">
            {metrics?.contactedCount ?? 2}
            <span className="text-xs font-normal text-slate-400 ml-1.5">engaged</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Overdue Follow-ups</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {metrics?.overdueCount ?? 0}
            <span className="text-xs font-normal text-slate-400 ml-1.5">require action</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-medium">Hot Leads Ready (80+)</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {metrics?.hotLeadsWithPhoneCount ?? 4}
            <span className="text-xs font-normal text-slate-400 ml-1.5">ready to chat</span>
          </div>
        </div>
      </div>

      {/* Main Outreach Table Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
        {/* Table Filter Toolbar */}
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Leads ({leads.length})
            </button>
            <button
              onClick={() => setActiveTab('ready')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'ready'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Valid Phone ({leads.filter((l) => normalizePhoneNumber(l.phone, l.country).isValid).length})
            </button>
            <button
              onClick={() => setActiveTab('hot')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'hot'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🔥 Hot Priority ({leads.filter((l) => l.leadScore >= 80).length})
            </button>
            <button
              onClick={() => setActiveTab('overdue')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'overdue'
                  ? 'bg-white text-amber-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⚠️ Overdue Follow-ups ({metrics?.overdueCount ?? 0})
            </button>
            <button
              onClick={() => setActiveTab('uncontacted')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'uncontacted'
                  ? 'bg-white text-emerald-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Not Contacted
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search company, contact, phone..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Leads Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Company & Contact</th>
                <th className="py-3 px-4">Phone (Normalized E.164)</th>
                <th className="py-3 px-4">Lead Score</th>
                <th className="py-3 px-4">Last Contacted</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Next Follow-up</th>
                <th className="py-3 px-4 text-right">WhatsApp Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-400">
                    No leads matching your current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => {
                  const norm = normalizePhoneNumber(lead.phone, lead.country);
                  const isOverdue =
                    lead.nextFollowUpDate &&
                    new Date(lead.nextFollowUpDate) < new Date() &&
                    lead.leadStatus !== 'Converted' &&
                    lead.leadStatus !== 'Lost';

                  return (
                    <tr
                      key={lead.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Company & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center justify-center font-bold text-xs shrink-0">
                            {lead.companyName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <span
                              onClick={() => onSelectLeadForDetail?.(lead)}
                              className="font-bold text-slate-900 hover:text-emerald-700 cursor-pointer block truncate"
                            >
                              {lead.companyName}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {lead.contactPerson} {lead.title ? `· ${lead.title}` : ''}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Phone Normalization */}
                      <td className="py-3.5 px-4 font-mono">
                        {norm.isValid ? (
                          <div className="space-y-0.5">
                            <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                              <Phone className="w-3 h-3 text-emerald-600" />
                              <span>{norm.formattedDisplay}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 block font-sans">
                              {norm.country}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block">
                            {norm.raw ? norm.raw : 'No phone'}
                            <span className="block text-[9px] text-amber-600 font-sans">
                              {norm.validationError || 'Unverified country code'}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Lead Score */}
                      <td className="py-3.5 px-4">
                        <LeadScoreBadge score={lead.leadScore} size="sm" />
                      </td>

                      {/* Last Contacted */}
                      <td className="py-3.5 px-4 text-slate-600">
                        {lead.lastContactedDate ? (
                          <div>
                            <span className="font-medium text-slate-800 block">
                              {new Date(lead.lastContactedDate).toLocaleDateString()}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(lead.lastContactedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Never</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <StatusBadge status={lead.leadStatus || lead.status} />
                      </td>

                      {/* Next Follow-up */}
                      <td className="py-3.5 px-4">
                        {lead.nextFollowUpDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className={`w-3.5 h-3.5 ${isOverdue ? 'text-amber-600' : 'text-slate-400'}`} />
                            <span
                              className={`font-medium ${
                                isOverdue ? 'text-amber-700 font-bold' : 'text-slate-700'
                              }`}
                            >
                              {new Date(lead.nextFollowUpDate).toLocaleDateString()}
                            </span>
                            {isOverdue && (
                              <span className="text-[9px] px-1 bg-amber-100 text-amber-800 rounded font-semibold">
                                Due
                              </span>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenFollowUp(lead)}
                            className="text-[11px] text-slate-400 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Set Date</span>
                          </button>
                        )}
                      </td>

                      {/* WhatsApp Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* 1-Click Open in WhatsApp Web / App */}
                          <button
                            onClick={() => handleOpenWaMe(lead)}
                            disabled={!norm.isValid}
                            className={`px-2.5 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                              norm.isValid
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                            title={norm.isValid ? 'Open WhatsApp with prefilled message' : norm.validationError}
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>Chat</span>
                          </button>

                          {/* AI Message Composer Modal Trigger */}
                          <button
                            onClick={() => {
                              setSelectedLeadId(lead.id);
                              setIsComposerOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer"
                            title="Personalize AI Message"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          </button>

                          {/* Follow-up scheduler */}
                          <button
                            onClick={() => handleOpenFollowUp(lead)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
                            title="Schedule Follow-up"
                          >
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI MESSAGE COMPOSER MODAL (5 Styles, Gemini Generation, wa.me + Cloud API) */}
      {isComposerOpen && currentLead && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold uppercase">
                  WhatsApp AI Message Architect
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
                  <span>Outreach to {currentLead.contactPerson}</span>
                  <span className="text-xs font-normal text-slate-500 font-sans">({currentLead.companyName})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Phone: <strong className="font-mono text-slate-700">{currentLeadPhone?.formattedDisplay || currentLead.phone}</strong> · {currentLeadPhone?.country || 'Unknown'}
                </p>
              </div>
              <button
                onClick={() => setIsComposerOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* 5 Message Style Switcher Tabs */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-2">
                Select Personalized Message Style:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { id: 'intro', label: 'Professional Intro' },
                  { id: 'pitch', label: 'Sales Pitch' },
                  { id: 'followup', label: 'Follow-up' },
                  { id: 'partnership', label: 'Partnership' },
                  { id: 'meeting', label: 'Meeting Request' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleGenerateMessage(s.id as WhatsAppMessageStyle)}
                    className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                      selectedStyle === s.id
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Message Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Message Copy (Live Editable):</span>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span>{customMessage.length} characters</span>
                  <button
                    onClick={() => handleGenerateMessage(selectedStyle)}
                    disabled={isGenerating}
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>Regenerate with Gemini</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={4}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3.5 text-xs sm:text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed font-sans"
              />
            </div>

            {/* Mobile WhatsApp Chat Simulation Box */}
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-emerald-900">
                <span className="flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  WhatsApp Mobile Preview (As {currentLead.contactPerson} sees it):
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  wa.me/{currentLeadPhone?.e164Digits || 'PHONE'}
                </span>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-emerald-100 text-xs sm:text-sm text-slate-800 shadow-xs leading-relaxed whitespace-pre-wrap font-sans relative">
                {customMessage}
                <div className="text-[10px] text-slate-400 text-right mt-1.5 flex items-center justify-end gap-1">
                  <span>10:42 AM</span>
                  <span className="text-blue-500">✓✓</span>
                </div>
              </div>
            </div>

            {/* Official Cloud API Confirmation Gate */}
            {cloudApiStatus?.isConfigured && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Automated Cloud API Dispatch:
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Ready
                  </span>
                </div>
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cloudSendConfirmation}
                    onChange={(e) => setCloudSendConfirmation(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    I confirm and authorize dispatching this message via Meta WhatsApp Business Cloud API.
                  </span>
                </label>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={handleCopyMessage}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
              </button>

              <div className="flex items-center gap-2">
                {/* Cloud API Button */}
                {cloudApiStatus?.isConfigured && (
                  <button
                    onClick={handleDispatchCloudApi}
                    disabled={isCloudSending || !cloudSendConfirmation}
                    className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer ${
                      cloudSendConfirmation && !isCloudSending
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    {isCloudSending ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Dispatch via Cloud API</span>
                  </button>
                )}

                {/* Primary: 1-Click Open in WhatsApp Web */}
                <button
                  onClick={() => handleOpenWaMe(currentLead)}
                  disabled={!currentLeadPhone?.isValid}
                  className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
                    currentLeadPhone?.isValid
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Send via WhatsApp Web</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOLLOW-UP MANAGEMENT MODAL */}
      {isFollowUpModalOpen && followUpLead && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Schedule Follow-up</h3>
                <p className="text-xs text-slate-500">
                  Target: {followUpLead.contactPerson} ({followUpLead.companyName})
                </p>
              </div>
              <button
                onClick={() => setIsFollowUpModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Next Follow-up Date:
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  Follow-up Notes & Reminders:
                </label>
                <textarea
                  rows={3}
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  placeholder="e.g. Inquire if technical team has reviewed pricing deck..."
                  className="w-full p-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsFollowUpModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFollowUp}
                disabled={isScheduling || !followUpDate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {isScheduling ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Calendar className="w-3.5 h-3.5" />}
                <span>Save Reminder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CLOUD API ARCHITECTURE INFORMATION MODAL */}
      {isCloudApiModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Official WhatsApp Business Cloud API
                  </h3>
                  <p className="text-xs text-slate-500">Meta Business Platform Integration Architecture</p>
                </div>
              </div>
              <button
                onClick={() => setIsCloudApiModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700 leading-relaxed">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">Connection Status:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      cloudApiStatus?.isConfigured
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {cloudApiStatus?.isConfigured ? 'Authorized & Active' : 'Not Configured (wa.me Fallback Active)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {cloudApiStatus?.notice}
                </p>
              </div>

              <div className="space-y-1.5 font-mono text-[11px]">
                <div className="text-slate-500 font-sans font-semibold">Configured Endpoints:</div>
                <div className="p-2 bg-slate-900 text-slate-200 rounded-lg overflow-x-auto">
                  POST {cloudApiStatus?.apiEndpoint || 'https://graph.facebook.com/v19.0/{PHONE_ID}/messages'}
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <span className="font-bold text-slate-900 block">Compliance & Integrity Principles:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  <li><strong>Human-in-the-Loop:</strong> Explicit user confirmation is strictly required prior to dispatching any automated message.</li>
                  <li><strong>Zero Unofficial Automation:</strong> Does not use banned scrapers or web automation. All direct messaging utilizes authorized Meta Cloud API or official <code className="bg-slate-100 px-1 py-0.5 rounded">wa.me</code> protocol.</li>
                  <li><strong>Full Audit Trail:</strong> Outgoing messages and delivery confirmations are recorded directly to the CRM activity log.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsCloudApiModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
