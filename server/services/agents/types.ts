export type AgentId =
  | 'lead_researcher'
  | 'lead_qualifier'
  | 'sales_strategist'
  | 'crm_manager';

export type AgentStatus = 'idle' | 'running' | 'paused' | 'error';

export interface AgentInfo {
  id: AgentId;
  name: string;
  role: string;
  description: string;
  status: AgentStatus;
  currentTask: string;
  progressPercent: number;
  processedLeads: number;
  successCount: number;
  failureCount: number;
  lastRunAt: string | null;
  capabilities: string[];
}

export type StepStatus =
  | 'pending'
  | 'running'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'skipped';

export interface WorkflowStep {
  id: string;
  stepIndex: number;
  title: string;
  agentId: AgentId;
  toolName: string;
  inputArgs: Record<string, any>;
  status: StepStatus;
  outputSummary?: string;
  outputData?: any;
  requiresApproval?: boolean;
  isApproved?: boolean;
  approvedBy?: string;
  approvedAt?: string;
  retryCount: number;
  maxRetries: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export type TaskStatus =
  | 'queued'
  | 'running'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface WorkflowTask {
  id: string;
  prompt: string;
  planSummary: string;
  selectedAgents: AgentId[];
  status: TaskStatus;
  steps: WorkflowStep[];
  currentStepIndex: number;
  finalReport?: string;
  deliverables?: {
    discoveredLeadCount?: number;
    qualifiedLeadCount?: number;
    strategiesGenerated?: number;
    duplicatesFound?: number;
    recordsUpdated?: number;
    data?: any;
  };
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface AgentAuditLog {
  id: string;
  timestamp: string;
  taskId?: string;
  stepId?: string;
  agentId: AgentId | 'orchestrator';
  toolName?: string;
  action: string;
  details: string;
  level: 'info' | 'warn' | 'error';
  requiresApproval?: boolean;
  wasApproved?: boolean;
}

export interface ApprovalRequest {
  id: string;
  taskId: string;
  stepId: string;
  agentId: AgentId;
  actionType: string;
  description: string;
  payload: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  decidedAt?: string;
  decidedBy?: string;
}
