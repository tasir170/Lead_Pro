import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  AgentId,
  AgentInfo,
  WorkflowTask,
  AgentAuditLog,
  ApprovalRequest,
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../../data');
const TASKS_FILE = path.resolve(DATA_DIR, 'agent_tasks.json');
const AUDIT_FILE = path.resolve(DATA_DIR, 'agent_audit_logs.json');

const INITIAL_AGENTS: AgentInfo[] = [
  {
    id: 'lead_researcher',
    name: 'Lead Research Agent',
    role: 'Market Intelligence & OSINT Discovery',
    description: 'Researches company digital footprint, finds official websites, extracts contact info, collects business services, and saves source URLs.',
    status: 'idle',
    currentTask: 'Waiting for search queries or lead enrichment jobs',
    progressPercent: 0,
    processedLeads: 42,
    successCount: 40,
    failureCount: 2,
    lastRunAt: '2026-11-06T15:30:00Z',
    capabilities: [
      'Multi-engine search retrieval',
      'Official domain & website verification',
      'Contact extraction (Email & Phone)',
      'OSINT business description synthesis',
      'Missing data identification & CRM enrichment',
    ],
  },
  {
    id: 'lead_qualifier',
    name: 'Lead Qualification Agent',
    role: 'Predictive Scoring & ICP Analysis',
    description: 'Evaluates leads against the 7-factor scoring model, analyzes commercial suitability, calculates 0-100 score, and maps customer needs.',
    status: 'idle',
    currentTask: 'Waiting for lead qualification triggers',
    progressPercent: 0,
    processedLeads: 38,
    successCount: 38,
    failureCount: 0,
    lastRunAt: '2026-11-06T15:45:00Z',
    capabilities: [
      '7-Factor predictive scoring (0-100)',
      'Lead classification (Hot/Warm/Potential/Cold)',
      'Commercial needs & pain points analysis',
      'Qualification reports & risk assessment',
      'Next sales action recommendation',
    ],
  },
  {
    id: 'sales_strategist',
    name: 'Sales Strategy Agent',
    role: 'Personalized Outreach & Cadence Architect',
    description: 'Reviews qualified leads to craft consultative sales angles, writes tailored email & WhatsApp drafts, and designs follow-up schedules.',
    status: 'idle',
    currentTask: 'Ready to draft outbound pitches and follow-ups',
    progressPercent: 0,
    processedLeads: 29,
    successCount: 29,
    failureCount: 0,
    lastRunAt: '2026-11-06T16:10:00Z',
    capabilities: [
      'Executive consultative pitch crafting',
      'Hyper-personalized cold email copy',
      'High-conversion WhatsApp outreach copy',
      'Follow-up cadence & schedule recommendation',
      'Executive conversation starters',
    ],
  },
  {
    id: 'crm_manager',
    name: 'CRM Management Agent',
    role: 'Database Hygiene & Integrity Guardian',
    description: 'Detects duplicate accounts, identifies incomplete records, organizes statuses, generates daily hygiene summaries, and executes gated updates.',
    status: 'idle',
    currentTask: 'Monitoring CRM database integrity and duplicates',
    progressPercent: 0,
    processedLeads: 54,
    successCount: 53,
    failureCount: 1,
    lastRunAt: '2026-11-06T14:20:00Z',
    capabilities: [
      'Normalized domain & email deduplication',
      'Incomplete field scanning & gap analysis',
      'Pipeline status organization',
      'Daily CRM hygiene score computation',
      'Authorized record updates with approval gate',
    ],
  },
];

export class AgentRegistry {
  private agents: Map<AgentId, AgentInfo> = new Map();
  private tasks: Map<string, WorkflowTask> = new Map();
  private auditLogs: AgentAuditLog[] = [];
  private pendingApprovals: Map<string, ApprovalRequest> = new Map();
  private isInitialized = false;

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (this.isInitialized) return;

    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      // Initialize agents map
      INITIAL_AGENTS.forEach((agent) => this.agents.set(agent.id, { ...agent }));

      // Load tasks
      if (fs.existsSync(TASKS_FILE)) {
        const raw = fs.readFileSync(TASKS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          parsed.forEach((t: WorkflowTask) => this.tasks.set(t.id, t));
        }
      }

      // Load audit logs
      if (fs.existsSync(AUDIT_FILE)) {
        const raw = fs.readFileSync(AUDIT_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.auditLogs = parsed;
        }
      }

      // Seed initial audit log if empty
      if (this.auditLogs.length === 0) {
        this.logAudit({
          agentId: 'orchestrator',
          action: 'Multi-Agent Subsystem Initialized',
          details: 'Registered Lead Research, Lead Qualification, Sales Strategy, and CRM Management agents with full backend tool authorization.',
          level: 'info',
        });
      }

      this.isInitialized = true;
    } catch (err) {
      console.warn('AgentRegistry initialization warning:', err);
      INITIAL_AGENTS.forEach((agent) => this.agents.set(agent.id, { ...agent }));
      this.isInitialized = true;
    }
  }

  private persistTasks() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const list = Array.from(this.tasks.values());
      fs.writeFileSync(TASKS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist agent tasks:', err);
    }
  }

  private persistAuditLogs() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(AUDIT_FILE, JSON.stringify(this.auditLogs.slice(-500), null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist agent audit logs:', err);
    }
  }

  public getAgents(): AgentInfo[] {
    this.ensureInitialized();
    return Array.from(this.agents.values());
  }

  public getAgent(id: AgentId): AgentInfo | undefined {
    this.ensureInitialized();
    return this.agents.get(id);
  }

  public updateAgentState(
    id: AgentId,
    updates: Partial<AgentInfo>
  ): AgentInfo | undefined {
    this.ensureInitialized();
    const existing = this.agents.get(id);
    if (!existing) return undefined;

    const updated = {
      ...existing,
      ...updates,
      lastRunAt: updates.status === 'running' ? new Date().toISOString() : existing.lastRunAt,
    };
    this.agents.set(id, updated);
    return updated;
  }

  public recordAgentSuccess(id: AgentId, processedLeadsCount = 1) {
    const existing = this.agents.get(id);
    if (!existing) return;
    existing.successCount += 1;
    existing.processedLeads += processedLeadsCount;
    existing.status = 'idle';
    existing.progressPercent = 100;
    existing.lastRunAt = new Date().toISOString();
  }

  public recordAgentFailure(id: AgentId) {
    const existing = this.agents.get(id);
    if (!existing) return;
    existing.failureCount += 1;
    existing.status = 'error';
    existing.lastRunAt = new Date().toISOString();
  }

  public saveTask(task: WorkflowTask) {
    this.ensureInitialized();
    this.tasks.set(task.id, task);
    this.persistTasks();
  }

  public getTask(id: string): WorkflowTask | undefined {
    this.ensureInitialized();
    return this.tasks.get(id);
  }

  public getAllTasks(): WorkflowTask[] {
    this.ensureInitialized();
    return Array.from(this.tasks.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public logAudit(log: Omit<AgentAuditLog, 'id' | 'timestamp'>): AgentAuditLog {
    this.ensureInitialized();
    const fullLog: AgentAuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ...log,
    };
    this.auditLogs.unshift(fullLog);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
    this.persistAuditLogs();
    return fullLog;
  }

  public getAuditLogs(filter?: {
    agentId?: string;
    level?: string;
    limit?: number;
  }): AgentAuditLog[] {
    this.ensureInitialized();
    let res = [...this.auditLogs];
    if (filter?.agentId && filter.agentId !== 'all') {
      res = res.filter((l) => l.agentId === filter.agentId);
    }
    if (filter?.level && filter.level !== 'all') {
      res = res.filter((l) => l.level === filter.level);
    }
    const limit = filter?.limit || 100;
    return res.slice(0, limit);
  }

  public registerApprovalRequest(request: Omit<ApprovalRequest, 'id' | 'requestedAt' | 'status'>): ApprovalRequest {
    const req: ApprovalRequest = {
      id: `appr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      requestedAt: new Date().toISOString(),
      status: 'pending',
      ...request,
    };
    this.pendingApprovals.set(req.id, req);
    return req;
  }

  public getPendingApproval(id: string): ApprovalRequest | undefined {
    return this.pendingApprovals.get(id);
  }

  public getAllPendingApprovals(): ApprovalRequest[] {
    return Array.from(this.pendingApprovals.values()).filter((r) => r.status === 'pending');
  }

  public resolveApproval(id: string, approved: boolean, decidedBy = 'User Admin'): ApprovalRequest | undefined {
    const req = this.pendingApprovals.get(id);
    if (!req) return undefined;
    req.status = approved ? 'approved' : 'rejected';
    req.decidedAt = new Date().toISOString();
    req.decidedBy = decidedBy;
    return req;
  }
}

export const agentRegistry = new AgentRegistry();
