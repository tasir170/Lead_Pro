import { agentRegistry } from './agentRegistry.js';
import { toolsRegistry, ToolExecutionResult } from './toolsRegistry.js';
import { AgentInfo } from './types.js';

export class CRMManagementAgent {
  public readonly id = 'crm_manager' as const;
  public readonly name = 'CRM Management Agent';

  public getInfo(): AgentInfo {
    return agentRegistry.getAgent(this.id)!;
  }

  /**
   * Scans for duplicate leads by domain and email
   */
  public async findDuplicates(params?: {
    taskId?: string;
    stepId?: string;
  }): Promise<ToolExecutionResult> {
    agentRegistry.updateAgentState(this.id, {
      status: 'running',
      currentTask: 'Scanning CRM database for duplicate domains and emails',
      progressPercent: 50,
    });

    agentRegistry.logAudit({
      agentId: this.id,
      taskId: params?.taskId,
      stepId: params?.stepId,
      toolName: 'crm_find_duplicates',
      action: 'Initiate Duplicate Record Scan',
      details: 'Comparing normalized company domains, corporate emails, and contact numbers across database',
      level: 'info',
    });

    try {
      const result = await toolsRegistry.crmFindDuplicates();
      agentRegistry.recordAgentSuccess(this.id, 1);
      agentRegistry.logAudit({
        agentId: this.id,
        taskId: params?.taskId,
        stepId: params?.stepId,
        toolName: 'crm_find_duplicates',
        action: 'Deduplication Audit Complete',
        details: result.summary,
        level: 'info',
      });
      return result;
    } catch (err: any) {
      agentRegistry.recordAgentFailure(this.id);
      return {
        success: false,
        toolName: 'crm_find_duplicates',
        summary: `Duplicate scan error: ${err.message}`,
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Scans for incomplete records
   */
  public async findIncomplete(params?: {
    taskId?: string;
    stepId?: string;
  }): Promise<ToolExecutionResult> {
    agentRegistry.updateAgentState(this.id, {
      status: 'running',
      currentTask: 'Scanning CRM records for missing contact information',
      progressPercent: 40,
    });

    try {
      const result = await toolsRegistry.crmFindIncomplete();
      agentRegistry.recordAgentSuccess(this.id, 1);
      return result;
    } catch (err: any) {
      agentRegistry.recordAgentFailure(this.id);
      return {
        success: false,
        toolName: 'crm_find_incomplete',
        summary: `Incomplete scan error: ${err.message}`,
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Generates daily CRM hygiene summary
   */
  public async generateDailySummary(params?: {
    taskId?: string;
    stepId?: string;
  }): Promise<ToolExecutionResult> {
    agentRegistry.updateAgentState(this.id, {
      status: 'running',
      currentTask: 'Compiling daily CRM hygiene and pipeline health report',
      progressPercent: 60,
    });

    try {
      const result = await toolsRegistry.crmDailySummary();
      agentRegistry.recordAgentSuccess(this.id, 1);
      return result;
    } catch (err: any) {
      agentRegistry.recordAgentFailure(this.id);
      return {
        success: false,
        toolName: 'crm_daily_summary',
        summary: `CRM summary error: ${err.message}`,
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Executes batch update on records (Requires Authorization!)
   */
  public async batchUpdate(params: {
    leadIds: string[];
    newStatus?: any;
    assignTo?: string;
    approvedBy?: string;
    taskId?: string;
    stepId?: string;
  }): Promise<ToolExecutionResult> {
    agentRegistry.updateAgentState(this.id, {
      status: 'running',
      currentTask: `Executing authorized update for ${params.leadIds.length} records`,
      progressPercent: 70,
    });

    try {
      const result = await toolsRegistry.crmBatchUpdate({
        leadIds: params.leadIds,
        newStatus: params.newStatus,
        assignTo: params.assignTo,
        approvedBy: params.approvedBy,
      });

      agentRegistry.recordAgentSuccess(this.id, params.leadIds.length);
      agentRegistry.logAudit({
        agentId: this.id,
        taskId: params.taskId,
        stepId: params.stepId,
        toolName: 'crm_batch_update',
        action: 'Database Records Updated with User Authorization',
        details: result.summary,
        level: 'info',
        requiresApproval: true,
        wasApproved: true,
      });

      return result;
    } catch (err: any) {
      agentRegistry.recordAgentFailure(this.id);
      return {
        success: false,
        toolName: 'crm_batch_update',
        summary: `Batch update error: ${err.message}`,
        data: null,
        error: err.message,
      };
    }
  }
}

export const crmManagementAgent = new CRMManagementAgent();
