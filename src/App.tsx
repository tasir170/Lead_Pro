/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { OverviewDashboard } from './pages/OverviewDashboard';
import { FindLeads } from './pages/FindLeads';
import { AllLeads } from './pages/AllLeads';
import { AIAgentsManagement } from './pages/AIAgentsManagement';
import { AIResearchAgent } from './pages/AIResearchAgent';
import { AISalesAssistant } from './pages/AISalesAssistant';
import { WhatsAppOutreach } from './pages/WhatsAppOutreach';
import { FollowUps } from './pages/FollowUps';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AddLeadModal } from './components/leads/AddLeadModal';
import { LeadDetailModal } from './components/leads/LeadDetailModal';
import { EditLeadModal } from './components/leads/EditLeadModal';
import { api, AnalyticsResponse } from './services/api';
import {
  Lead,
  LeadStatus,
  NavigationItemKey,
  PipelineSummary,
  AcquisitionDataPoint,
  QualityBreakdown,
  CompanyResearchDossier,
  OutreachChannel,
} from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<NavigationItemKey>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Data states
  const [leads, setLeads] = useState<Lead[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isResettingDemo, setIsResettingDemo] = useState(false);

  // Modals and Context
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);
  const [selectedLeadForDetail, setSelectedLeadForDetail] = useState<Lead | null>(null);
  const [preselectedOutreachLead, setPreselectedOutreachLead] = useState<Lead | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [leadsData, analyticsData] = await Promise.all([
        api.getLeads(),
        api.getAnalyticsSummary(),
      ]);
      setLeads(leadsData);
      setAnalytics(analyticsData);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to LeadPulse backend service.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Lead CRUD handlers
  const handleCreateLead = async (leadData: Partial<Lead>): Promise<Lead> => {
    const created = await api.createLead(leadData);
    setLeads((prev) => [created, ...prev]);
    showToast(`Added ${created.companyName || created.company} to CRM pipeline!`);
    api.getAnalyticsSummary().then(setAnalytics).catch(console.warn);
    return created;
  };

  const handleOpenEditLead = (lead: Lead) => {
    setSelectedLeadForEdit(lead);
    setIsEditLeadOpen(true);
  };

  const handleSaveEditLead = async (leadId: string, updates: Partial<Lead>) => {
    const updated = await api.updateLead(leadId, updates);
    setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
    if (selectedLeadForDetail?.id === leadId) {
      setSelectedLeadForDetail(updated);
    }
    showToast(`Saved changes for ${updated.companyName || updated.company}!`);
    api.getAnalyticsSummary().then(setAnalytics).catch(console.warn);
  };

  const handleUpdateLeadStatus = async (leadId: string, status: LeadStatus) => {
    const updated = await api.updateLead(leadId, { leadStatus: status, status });
    setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
    if (selectedLeadForDetail?.id === leadId) {
      setSelectedLeadForDetail(updated);
    }
    showToast(`Updated status to ${status}!`);
    api.getAnalyticsSummary().then(setAnalytics).catch(console.warn);
  };

  const handleDeleteLead = async (leadId: string) => {
    await api.deleteLead(leadId);
    setLeads((prev) => prev.filter((l) => l.id !== leadId));
    if (selectedLeadForDetail?.id === leadId) {
      setSelectedLeadForDetail(null);
    }
    showToast('Lead deleted.');
    api.getAnalyticsSummary().then(setAnalytics).catch(console.warn);
  };

  const handleBulkUpdateStatus = async (leadIds: string[], status: LeadStatus) => {
    await api.bulkUpdateLeadStatus(leadIds, status);
    await loadData();
    showToast(`Updated ${leadIds.length} leads to ${status}!`);
  };

  const handleBulkAssignSalesperson = async (leadIds: string[], rep: string) => {
    await api.bulkAssignSalesperson(leadIds, rep);
    await loadData();
    showToast(`Assigned ${leadIds.length} leads to ${rep}!`);
  };

  const handleBulkDeleteLeads = async (leadIds: string[]) => {
    await api.bulkDeleteLeads(leadIds);
    await loadData();
    showToast(`Deleted ${leadIds.length} leads from database.`);
  };

  const handleAddLeadNote = async (leadId: string, author: string, content: string) => {
    const note = await api.addLeadNote(leadId, content, author);
    // Refresh current lead in view
    setLeads((prev) =>
      prev.map((l) => {
        if (l.id === leadId) {
          const notes = [note, ...(l.notes || [])];
          return { ...l, notes, remarks: content };
        }
        return l;
      })
    );
    if (selectedLeadForDetail?.id === leadId) {
      setSelectedLeadForDetail((prev) =>
        prev
          ? {
              ...prev,
              notes: [note, ...(prev.notes || [])],
              remarks: content,
            }
          : null
      );
    }
    showToast('Internal note saved.');
  };

  const handleUpdateFollowUp = async (leadId: string, nextDate: string) => {
    const updated = await api.updateLead(leadId, { nextFollowUpDate: nextDate });
    setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
    if (selectedLeadForDetail?.id === leadId) {
      setSelectedLeadForDetail(updated);
    }
    showToast(`Follow-up scheduled for ${new Date(nextDate).toLocaleDateString()}!`);
  };

  const handleAssignSalesperson = async (leadId: string, rep: string) => {
    const updated = await api.updateLead(leadId, { assignedSalesperson: rep });
    setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
    if (selectedLeadForDetail?.id === leadId) {
      setSelectedLeadForDetail(updated);
    }
    showToast(`Assigned to ${rep}!`);
  };

  const [isAnalyzingLeads, setIsAnalyzingLeads] = useState(false);

  const handleAnalyzeLead = async (leadId: string) => {
    try {
      const updated = await api.analyzeLead(leadId);
      setLeads((prev) => prev.map((l) => (l.id === leadId ? updated : l)));
      if (selectedLeadForDetail?.id === leadId) {
        setSelectedLeadForDetail(updated);
      }
      showToast(`Gemini analyzed ${updated.companyName || updated.company}: ${updated.leadScore}/100 (${updated.leadCategory || 'Qualified'})!`);
      api.getAnalyticsSummary().then(setAnalytics).catch(console.warn);
    } catch (err: any) {
      showToast(err.message || 'AI lead scoring failed');
    }
  };

  const handleBulkAnalyzeLeads = async (leadIds: string[]) => {
    setIsAnalyzingLeads(true);
    try {
      const updatedLeads = await api.bulkAnalyzeLeads(leadIds);
      await loadData();
      showToast(`Analyzed and scored ${updatedLeads.length} leads with Gemini 7-factor model!`);
    } catch (err: any) {
      showToast(err.message || 'Bulk AI scoring failed');
    } finally {
      setIsAnalyzingLeads(false);
    }
  };

  const handleRequalifyLead = async (leadId: string) => {
    await handleAnalyzeLead(leadId);
  };

  const handleResetDemoData = async () => {
    setIsResettingDemo(true);
    try {
      const resetLeads = await api.resetDemoData();
      setLeads(resetLeads);
      const analyticsData = await api.getAnalyticsSummary();
      setAnalytics(analyticsData);
      showToast('Restored 10 demonstration B2B accounts.');
    } catch (err: any) {
      showToast('Failed to reset demo data.');
    } finally {
      setIsResettingDemo(false);
    }
  };

  const handleNavigateToOutreach = (view: NavigationItemKey, lead: Lead) => {
    setPreselectedOutreachLead(lead);
    setCurrentView(view);
  };

  // Safe fallback values
  const summary: PipelineSummary = analytics?.summary ?? {
    totalLeads: leads.length,
    newLeads: leads.filter((l) => l.status === 'new').length,
    qualifiedLeads: leads.filter((l) => l.status === 'qualified').length,
    highQualityLeads: leads.filter((l) => l.qualityTier === 'high').length,
    contactedLeads: leads.filter((l) => l.status === 'contacted').length,
    convertedLeads: leads.filter((l) => l.status === 'converted').length,
    unresponsiveLeads: leads.filter((l) => l.status === 'unresponsive').length,
    conversionRate: 18.2,
    qualifiedRate: 64.5,
    avgAiScore: 84,
  };

  const acquisition: AcquisitionDataPoint[] = analytics?.acquisition ?? [];
  const quality: QualityBreakdown[] = analytics?.quality ?? [];

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-900 overflow-hidden">
      {/* Dark Navy Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        leadCounts={{
          total: leads.length,
          new: summary.newLeads,
          qualified: summary.qualifiedLeads,
        }}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          currentView={currentView}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onAddLeadClick={() => setIsAddLeadOpen(true)}
          onResetDemoData={handleResetDemoData}
          isResetting={isResettingDemo}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto">
          {currentView === 'overview' && (
            <OverviewDashboard
              summary={summary}
              acquisition={acquisition}
              quality={quality}
              leads={leads}
              isLoading={isLoading}
              error={error}
              onRetry={loadData}
              onSelectLead={setSelectedLeadForDetail}
              onNavigate={setCurrentView}
              onOpenAddLead={() => setIsAddLeadOpen(true)}
              onAnalyzeAllUnscored={() => handleBulkAnalyzeLeads(leads.map((l) => l.id))}
              isAnalyzing={isAnalyzingLeads}
            />
          )}

          {currentView === 'find-leads' && (
            <FindLeads
              onImportLead={handleCreateLead}
              existingLeads={leads}
              onOpenAddLeadModal={() => setIsAddLeadOpen(true)}
              onLeadAddedToCrm={loadData}
            />
          )}

          {currentView === 'all-leads' && (
            <AllLeads
              leads={leads}
              isLoading={isLoading}
              onSelectLead={setSelectedLeadForDetail}
              onOpenAddLeadModal={() => setIsAddLeadOpen(true)}
              onOpenEditLeadModal={handleOpenEditLead}
              onDeleteLead={handleDeleteLead}
              onBulkUpdateStatus={handleBulkUpdateStatus}
              onBulkAssignSalesperson={handleBulkAssignSalesperson}
              onBulkDeleteLeads={handleBulkDeleteLeads}
              onAnalyzeLead={handleAnalyzeLead}
              onBulkAnalyzeLeads={handleBulkAnalyzeLeads}
              onNavigateToOutreach={handleNavigateToOutreach}
            />
          )}

          {currentView === 'ai-agents' && (
            <AIAgentsManagement
              onNavigateToLeads={() => setCurrentView('all-leads')}
              onSelectLeadForDetail={(id) => {
                const found = leads.find((l) => l.id === id);
                if (found) setSelectedLeadForDetail(found);
              }}
            />
          )}

          {currentView === 'ai-research' && (
            <AIResearchAgent
              onRunResearch={(companyName, domain): Promise<CompanyResearchDossier> =>
                api.runCompanyResearch({ companyName, domain })
              }
              onImportFromResearch={handleCreateLead}
            />
          )}

          {currentView === 'ai-assistant' && (
            <AISalesAssistant
              leads={leads}
              preselectedLead={preselectedOutreachLead}
              onGenerateOutreach={(lead, channel, goal) =>
                api.generateOutreach({ lead, channel, goal })
              }
              onUpdateLeadStatus={handleUpdateLeadStatus}
              onSelectLead={(lead) => setSelectedLeadForDetail(lead)}
              onNavigateToOutreach={handleNavigateToOutreach}
            />
          )}

          {currentView === 'whatsapp-outreach' && (
            <WhatsAppOutreach
              leads={leads}
              preselectedLead={preselectedOutreachLead}
              onUpdateStatus={handleUpdateLeadStatus}
              onSelectLeadForDetail={setSelectedLeadForDetail}
              onNavigateToAssistant={() => setCurrentView('ai-assistant')}
            />
          )}

          {currentView === 'follow-ups' && (
            <FollowUps
              leads={leads}
              onSelectLead={setSelectedLeadForDetail}
              onNavigateToOutreach={handleNavigateToOutreach}
            />
          )}

          {currentView === 'analytics' && (
            <AnalyticsPage
              summary={summary}
              acquisition={acquisition}
              quality={quality}
              leads={leads}
              onSelectLeadForDetail={setSelectedLeadForDetail}
              onNavigateToLeads={() => setCurrentView('all-leads')}
            />
          )}

          {currentView === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Floating Notification Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-lg border border-slate-700 animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <AddLeadModal
        isOpen={isAddLeadOpen}
        onClose={() => setIsAddLeadOpen(false)}
        onLeadAdded={(newLead) => setSelectedLeadForDetail(newLead)}
        onCreateLead={handleCreateLead}
      />

      <LeadDetailModal
        lead={selectedLeadForDetail}
        isOpen={Boolean(selectedLeadForDetail)}
        onClose={() => setSelectedLeadForDetail(null)}
        onUpdateStatus={handleUpdateLeadStatus}
        onDeleteLead={handleDeleteLead}
        onNavigateToOutreach={handleNavigateToOutreach}
        onRequalify={handleRequalifyLead}
        onAddNote={handleAddLeadNote}
        onOpenEditModal={handleOpenEditLead}
        onUpdateFollowUp={handleUpdateFollowUp}
        onAssignSalesperson={handleAssignSalesperson}
      />

      <EditLeadModal
        lead={selectedLeadForEdit}
        isOpen={isEditLeadOpen}
        onClose={() => {
          setIsEditLeadOpen(false);
          setSelectedLeadForEdit(null);
        }}
        onSaveLead={handleSaveEditLead}
      />
    </div>
  );
}
