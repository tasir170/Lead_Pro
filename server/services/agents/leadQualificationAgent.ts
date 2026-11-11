import { agentRegistry } from './agentRegistry.js';
import { toolsRegistry, ToolExecutionResult } from './toolsRegistry.js';
import { AgentInfo } from './types.js';

export class LeadQualificationAgent {
  public readonly id = 'lead_qualifier' as const;
  public readonly name = 'Lead Qualification Agent';

  public getInfo(): AgentInfo {
    return agentRegistry.getAgent(this.id)!;
  }

  /**
   * Qualifies an individual lead using the 7-factor predictive model
   */
  public async qualify(params: {
    leadId: string;
    taskId?: string;
    stepId?: string;
  }): Promise<ToolExecutionResult> {
    agentRegistry.updateAgentState(this.id, {
      status: 'running',
      currentTask: `Qualifying lead ID ${params.leadId} across 7 predictive factors`,
      progressPercent: 40,
    });

    agentRegistry.logAudit({
      agentId: this.id,
      taskId: params.taskId,
      stepId: params.stepId,
      toolName: 'qualify_lead',
      action: 'Initiate 7-Factor Qualification Analysis',
      details: `Analyzing suitability, market jurisdiction, buying signals, and scoring lead ${params.leadId}`,
      level: 'info',
    });

    try {
      const result = await toolsRegistry.qualifyLead({ leadId: params.leadId });

      if (result.success) {
        agentRegistry.recordAgentSuccess(this.id, 1);
        agentRegistry.logAudit({
          agentId: this.id,
          taskId: params.taskId,
          stepId: params.stepId,
          toolName: 'qualify_lead',
          action: 'Lead Scored & Classification Saved',
          details: result.summary,
          level: 'info',
        });
      } else {
        agentRegistry.recordAgentFailure(this.id);
        agentRegistry.logAudit({
          agentId: this.id,
          taskId: params.taskId,
          stepId: params.stepId,
          toolName: 'qualify_lead',
          action: 'Qualification Calculation Failed',
          details: result.error || 'Unknown error',
          level: 'warn',
        });
      }

      return result;
    } catch (err: any) {
      agentRegistry.recordAgentFailure(this.id);
      return {
        success: false,
        toolName: 'qualify_lead',
        summary: `Qualification error: ${err.message}`,
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Batch qualifies multiple leads
   */
  public async batchQualify(params: {
    leadIds: string[];
    taskId?: string;
    stepId?: string;
  }): Promise<ToolExecutionResult> {
    agentRegistry.updateAgentState(this.id, {
      status: 'running',
      currentTask: `Batch qualifying ${params.leadIds.length} accounts`,
      progressPercent: 10,
    });

    const results: any[] = [];
    let successCount = 0;

    for (let i = 0; i < params.leadIds.length; i++) {
      const id = params.leadIds[i];
      const res = await toolsRegistry.qualifyLead({ leadId: id });
      if (res.success) {
        successCount++;
        results.push(res.data);
      }
      agentRegistry.updateAgentState(this.id, {
        progressPercent: Math.round(((i + 1) / params.leadIds.length) * 100),
      });
    }

    if (successCount > 0) {
      agentRegistry.recordAgentSuccess(this.id, successCount);
    } else {
      agentRegistry.recordAgentFailure(this.id);
    }

    return {
      success: successCount > 0,
      toolName: 'qualify_lead',
      summary: `Batch evaluated and qualified ${successCount}/${params.leadIds.length} accounts with Gemini predictive scoring model.`,
      data: {
        totalEvaluated: params.leadIds.length,
        qualifiedCount: successCount,
        qualifications: results,
      },
    };
  }
}

export const leadQualificationAgent = new LeadQualificationAgent();
