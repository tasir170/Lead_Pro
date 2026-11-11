import {
  Lead,
  PipelineSummary,
  AcquisitionDataPoint,
  QualityBreakdown,
  CompanyResearchDossier,
  OutreachChannel,
  AnalyticsFilterOptions,
  DetailedAnalyticsResult,
  AIAnalyticsInsight,
} from '../types';

export interface AnalyticsResponse {
  summary: PipelineSummary;
  acquisition: AcquisitionDataPoint[];
  quality: QualityBreakdown[];
}

export const api = {
  async getLeads(params?: {
    search?: string;
    status?: string;
    qualityTier?: string;
    industry?: string;
  }): Promise<Lead[]> {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.qualityTier) searchParams.set('qualityTier', params.qualityTier);
    if (params?.industry) searchParams.set('industry', params.industry);

    const res = await fetch(`/api/leads?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch leads');
    const json = await res.json();
    return json.data;
  },

  async getLead(id: string): Promise<Lead> {
    const res = await fetch(`/api/leads/${id}`);
    if (!res.ok) throw new Error('Failed to fetch lead');
    const json = await res.json();
    return json.data;
  },

  async createLead(leadData: Partial<Lead>): Promise<Lead> {
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create lead');
    }
    const json = await res.json();
    return json.data;
  },

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead> {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update lead');
    const json = await res.json();
    return json.data;
  },

  async deleteLead(id: string): Promise<void> {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete lead');
  },

  async addLeadNote(id: string, author: string, content: string): Promise<import('../types').LeadNote> {
    const res = await fetch(`/api/leads/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ author, content }),
    });
    if (!res.ok) throw new Error('Failed to add note');
    const json = await res.json();
    return json.data;
  },

  async bulkUpdateLeadStatus(leadIds: string[], status: import('../types').LeadStatus): Promise<number> {
    const res = await fetch('/api/leads/bulk-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds, status }),
    });
    if (!res.ok) throw new Error('Failed to bulk update status');
    const json = await res.json();
    return json.updatedCount;
  },

  async bulkAssignSalesperson(leadIds: string[], salesperson: string): Promise<number> {
    const res = await fetch('/api/leads/bulk-assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds, salesperson }),
    });
    if (!res.ok) throw new Error('Failed to bulk assign salesperson');
    const json = await res.json();
    return json.updatedCount;
  },

  async bulkDeleteLeads(leadIds: string[]): Promise<number> {
    const res = await fetch('/api/leads/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds }),
    });
    if (!res.ok) throw new Error('Failed to bulk delete leads');
    const json = await res.json();
    return json.deletedCount;
  },

  async resetDemoData(): Promise<Lead[]> {
    const res = await fetch('/api/leads/actions/reset-demo', {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to reset demo data');
    const json = await res.json();
    return json.data;
  },

  async getAnalyticsSummary(): Promise<AnalyticsResponse> {
    const res = await fetch('/api/analytics/summary');
    if (!res.ok) throw new Error('Failed to fetch analytics summary');
    const json = await res.json();
    return json.data;
  },

  async getAIStatus(): Promise<{ engine: string; configured: boolean; mode: string; capabilities: string[] }> {
    const res = await fetch('/api/ai/status');
    if (!res.ok) throw new Error('Failed to fetch AI status');
    return await res.json();
  },

  async analyzeLead(leadId: string): Promise<Lead> {
    const res = await fetch(`/api/leads/${leadId}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to analyze lead with Gemini');
    }
    const json = await res.json();
    return json.data;
  },

  async bulkAnalyzeLeads(leadIds: string[]): Promise<Lead[]> {
    const res = await fetch('/api/leads/bulk-analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadIds }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to bulk analyze leads');
    }
    const json = await res.json();
    return json.data;
  },

  async runAIQualification(payload: { leadId?: string; leadData?: Partial<Lead> }) {
    const res = await fetch('/api/ai/qualify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to qualify lead with AI');
    const json = await res.json();
    return json.data;
  },

  async runCompanyResearch(payload: { companyName?: string; domain?: string }): Promise<CompanyResearchDossier> {
    const res = await fetch('/api/ai/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to research company');
    const json = await res.json();
    return json.data;
  },

  async generateOutreach(payload: {
    lead: Partial<Lead>;
    channel: OutreachChannel;
    goal?: string;
  }): Promise<{ subject?: string; message: string; callToAction: string }> {
    const res = await fetch('/api/ai/outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to generate outreach');
    const json = await res.json();
    return json.data;
  },

  async getDiscoveryProviders(): Promise<import('../types').DiscoveryProviderStatus[]> {
    const res = await fetch('/api/discovery/providers');
    if (!res.ok) throw new Error('Failed to fetch discovery search providers');
    const json = await res.json();
    return json.data;
  },

  async searchDiscoveryLeads(
    params: import('../types').DiscoverySearchParams,
    useDemoMode = false
  ): Promise<import('../types').DiscoverySearchResponse> {
    const res = await fetch('/api/discovery/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params, useDemoMode }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to search business leads');
    }
    return await res.json();
  },

  async saveDiscoveredLeadsToCrm(
    leads: import('../types').DiscoveredLead[]
  ): Promise<{ success: boolean; message: string; savedCount: number; savedIds: string[] }> {
    const res = await fetch('/api/discovery/save-to-crm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leads }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save leads to CRM');
    }
    return await res.json();
  },

  // AI Agent Subsystem API
  async getAgents(): Promise<import('../types').AgentInfo[]> {
    const res = await fetch('/api/agents');
    if (!res.ok) throw new Error('Failed to fetch AI agents status');
    const json = await res.json();
    return json.agents;
  },

  async orchestrateTask(prompt: string): Promise<import('../types').WorkflowTask> {
    const res = await fetch('/api/agents/orchestrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to orchestrate task');
    }
    const json = await res.json();
    return json.task;
  },

  async getTask(taskId: string): Promise<import('../types').WorkflowTask> {
    const res = await fetch(`/api/agents/tasks/${taskId}`);
    if (!res.ok) throw new Error('Failed to fetch task status');
    const json = await res.json();
    return json.task;
  },

  async approveTaskStep(
    taskId: string,
    stepId: string,
    approved: boolean,
    userName?: string
  ): Promise<{ task: import('../types').WorkflowTask; message: string }> {
    const res = await fetch(`/api/agents/tasks/${taskId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepId, approved, userName }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to resolve approval');
    }
    return await res.json();
  },

  async runAgentDirect(agentId: import('../types').AgentId, action: string, params?: any): Promise<any> {
    const res = await fetch('/api/agents/run-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ agentId, action, params }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to run agent action');
    }
    return await res.json();
  },

  async getTaskHistory(): Promise<import('../types').WorkflowTask[]> {
    const res = await fetch('/api/agents/history');
    if (!res.ok) throw new Error('Failed to fetch agent task history');
    const json = await res.json();
    return json.tasks;
  },

  async getAuditLogs(filter?: { agentId?: string; level?: string; limit?: number }): Promise<import('../types').AgentAuditLog[]> {
    const searchParams = new URLSearchParams();
    if (filter?.agentId) searchParams.set('agentId', filter.agentId);
    if (filter?.level) searchParams.set('level', filter.level);
    if (filter?.limit) searchParams.set('limit', String(filter.limit));

    const res = await fetch(`/api/agents/audit-logs?${searchParams.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    const json = await res.json();
    return json.logs;
  },

  async getPendingApprovals(): Promise<import('../types').ApprovalRequest[]> {
    const res = await fetch('/api/agents/pending-approvals');
    if (!res.ok) throw new Error('Failed to fetch pending approvals');
    const json = await res.json();
    return json.approvals;
  },

  // Conversational AI Sales Assistant Chatbot API
  async sendChatMessage(payload: {
    message: string;
    sessionId?: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    confirmedAction?: any;
  }): Promise<import('../types').ChatbotResponse> {
    const res = await fetch('/api/chatbot/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to send message to AI Sales Assistant');
    }
    return await res.json();
  },

  async getChatbotStats(): Promise<any> {
    const res = await fetch('/api/chatbot/stats');
    if (!res.ok) throw new Error('Failed to fetch chatbot stats');
    const json = await res.json();
    return json.stats;
  },

  // WhatsApp Outreach Module API
  async getWhatsAppMetrics(): Promise<import('../types').WhatsAppMetrics> {
    const res = await fetch('/api/whatsapp/metrics');
    if (!res.ok) throw new Error('Failed to fetch WhatsApp metrics');
    const json = await res.json();
    return json.metrics;
  },

  async getWhatsAppLeads(): Promise<Array<import('../types').Lead & { phoneNormalization: import('../types').PhoneNormalizationResult; waMeUrl: string }>> {
    const res = await fetch('/api/whatsapp/leads');
    if (!res.ok) throw new Error('Failed to fetch WhatsApp leads');
    const json = await res.json();
    return json.leads;
  },

  async generateWhatsAppMessage(
    leadId: string,
    style: import('../types').WhatsAppMessageStyle = 'intro'
  ): Promise<{
    generated: import('../types').GeneratedWhatsAppMessage;
    waMeUrl: string;
    phoneNormalization: import('../types').PhoneNormalizationResult;
  }> {
    const res = await fetch('/api/whatsapp/generate-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, style }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate WhatsApp message');
    }
    return await res.json();
  },

  async logWhatsAppOutreach(payload: {
    leadId: string;
    messageText?: string;
    newStatus?: import('../types').LeadStatus;
    author?: string;
  }): Promise<{ lead: import('../types').Lead; message: string }> {
    const res = await fetch('/api/whatsapp/log-outreach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to log WhatsApp outreach');
    }
    return await res.json();
  },

  async scheduleWhatsAppFollowUp(payload: {
    leadId: string;
    nextFollowUpDate: string;
    notes?: string;
    author?: string;
  }): Promise<{ lead: import('../types').Lead; message: string }> {
    const res = await fetch('/api/whatsapp/schedule-followup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to schedule follow-up');
    }
    return await res.json();
  },

  async getWhatsAppCloudConfigStatus(): Promise<import('../types').WhatsAppCloudConfigStatus> {
    const res = await fetch('/api/whatsapp/cloud-api/status');
    if (!res.ok) throw new Error('Failed to fetch WhatsApp Cloud API status');
    const json = await res.json();
    return json.status;
  },

  async updateWhatsAppCloudConfig(payload: {
    phoneNumberId?: string;
    accessToken?: string;
    wabaId?: string;
  }): Promise<{ success: boolean; status: import('../types').WhatsAppCloudConfigStatus; message: string }> {
    const res = await fetch('/api/whatsapp/cloud-api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': this.getActiveUserEmail(),
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update WhatsApp Cloud API settings');
    }
    return await res.json();
  },

  async sendWhatsAppCloudMessage(payload: {
    leadId: string;
    messageText: string;
    isUserApproved: boolean;
    approvedBy?: string;
  }): Promise<{ success: boolean; result: import('../types').CloudSendResult }> {
    const res = await fetch('/api/whatsapp/cloud-api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to send automated WhatsApp message');
    }
    return await res.json();
  },

  // Detailed Analytics & Reporting
  async getDetailedAnalytics(filters: AnalyticsFilterOptions = {}): Promise<DetailedAnalyticsResult> {
    const searchParams = new URLSearchParams();
    if (filters.timeframe) searchParams.set('timeframe', filters.timeframe);
    if (filters.startDate) searchParams.set('startDate', filters.startDate);
    if (filters.endDate) searchParams.set('endDate', filters.endDate);
    if (filters.industry && filters.industry !== 'all') searchParams.set('industry', filters.industry);
    if (filters.country && filters.country !== 'all') searchParams.set('country', filters.country);

    const qs = searchParams.toString();
    const url = `/api/analytics/detailed${qs ? `?${qs}` : ''}`;
    const res = await fetch(url);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to fetch detailed analytics');
    }
    const json = await res.json();
    return json.data;
  },

  async getAiAnalyticsInsights(
    query: string,
    filters: AnalyticsFilterOptions = {}
  ): Promise<AIAnalyticsInsight> {
    const res = await fetch('/api/analytics/ai-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        timeframe: filters.timeframe,
        startDate: filters.startDate,
        endDate: filters.endDate,
        industry: filters.industry,
        country: filters.country,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to generate AI analytics insights');
    }
    const json = await res.json();
    return json.data;
  },

  getAnalyticsCsvUrl(filters: AnalyticsFilterOptions = {}): string {
    const searchParams = new URLSearchParams();
    if (filters.timeframe) searchParams.set('timeframe', filters.timeframe);
    if (filters.startDate) searchParams.set('startDate', filters.startDate);
    if (filters.endDate) searchParams.set('endDate', filters.endDate);
    if (filters.industry && filters.industry !== 'all') searchParams.set('industry', filters.industry);
    if (filters.country && filters.country !== 'all') searchParams.set('country', filters.country);
    const qs = searchParams.toString();
    return `/api/analytics/export/csv${qs ? `?${qs}` : ''}`;
  },

  // Active session identity & audit logging
  currentActiveEmail: 'sarah.j@leadpulse.ai',
  setActiveUserEmail(email: string) {
    this.currentActiveEmail = email;
    if (typeof window !== 'undefined') {
      localStorage.setItem('leadpulse_user_email', email);
    }
  },
  getActiveUserEmail(): string {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('leadpulse_user_email') || this.currentActiveEmail;
    }
    return this.currentActiveEmail;
  },

  async getCurrentUser(): Promise<any> {
    const res = await fetch('/api/auth/me', {
      headers: { 'X-User-Email': this.getActiveUserEmail() },
    });
    if (!res.ok) throw new Error('Failed to fetch user session');
    const json = await res.json();
    return json.user;
  },

  async getTeamMembers(): Promise<any[]> {
    const res = await fetch('/api/auth/team');
    if (!res.ok) throw new Error('Failed to fetch team members');
    const json = await res.json();
    return json.team;
  },

  async getSecurityAuditLogs(limit = 50): Promise<any[]> {
    const res = await fetch(`/api/auth/audit-logs?limit=${limit}`, {
      headers: { 'X-User-Email': this.getActiveUserEmail() },
    });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    const json = await res.json();
    return json.logs;
  },

  async clearSecurityAuditLogs(): Promise<void> {
    const res = await fetch('/api/auth/audit-logs/clear', {
      method: 'POST',
      headers: { 'X-User-Email': this.getActiveUserEmail() },
    });
    if (!res.ok) throw new Error('Failed to clear audit logs');
  },
};



