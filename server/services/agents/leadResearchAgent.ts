import { agentRegistry } from './agentRegistry.js';
import { toolsRegistry, ToolExecutionResult } from './toolsRegistry.js';
import { AgentInfo } from './types.js';

export class LeadResearchAgent {
  public readonly id = 'lead_researcher' as const;
  public readonly name = 'Lead Research Agent';

  public getInfo(): AgentInfo {
    return agentRegistry.getAgent(this.id)!;
  }

  /**
   * Researches publicly available company information, official website, contact info,
   * business description, and updates the CRM.
   */
  public async research(params: {
    companyName?: string;
    domain?: string;
    leadId?: string;
    taskId?: string;
    stepId?: string;
  }): Promise<ToolExecutionResult> {
    agentRegistry.updateAgentState(this.id, {
      status: 'running',
      currentTask: `Researching ${params.companyName || params.domain || params.leadId || 'target account'}`,
      progressPercent: 35,
    });

    agentRegistry.logAudit({
      agentId: this.id,
      taskId: params.taskId,
      stepId: params.stepId,
      toolName: 'research_company',
      action: 'Initiate Public Intelligence Research',
      details: `Deep OSINT analysis initiated for: ${params.companyName || params.domain || params.leadId}`,
      level: 'info',
    });

    try {
      const result = await toolsRegistry.researchCompanyOrLead({
        leadId: params.leadId,
        companyName: params.companyName,
        domain: params.domain,
      });

      if (result.success) {
        agentRegistry.recordAgentSuccess(this.id, 1);
        agentRegistry.logAudit({
          agentId: this.id,
          taskId: params.taskId,
          stepId: params.stepId,
          toolName: 'research_company',
          action: 'Research Dossier Generated & CRM Synced',
          details: result.summary,
          level: 'info',
        });
      } else {
        agentRegistry.recordAgentFailure(this.id);
        agentRegistry.logAudit({
          agentId: this.id,
          taskId: params.taskId,
          stepId: params.stepId,
          toolName: 'research_company',
          action: 'Research Failed',
          details: result.error || 'Unknown error',
          level: 'warn',
        });
      }

      return result;
    } catch (err: any) {
      agentRegistry.recordAgentFailure(this.id);
      agentRegistry.logAudit({
        agentId: this.id,
        taskId: params.taskId,
        stepId: params.stepId,
        toolName: 'research_company',
        action: 'Research Exception',
        details: err.message || 'Fatal research error',
        level: 'error',
      });
      return {
        success: false,
        toolName: 'research_company',
        summary: `Research error: ${err.message}`,
        data: null,
        error: err.message,
      };
    }
  }

  /**
   * Discovers and retrieves new business leads matching criteria
   */
  public async discover(params: {
    industry: string;
    location: string;
    targetAudience?: 'B2B' | 'B2C' | 'Any';
    companySize?: 'Small' | 'Medium' | 'Large' | 'Any';
    limit?: number;
    keywords?: string;
    taskId?: string;
    stepId?: string;
  }): Promise<ToolExecutionResult> {
    agentRegistry.updateAgentState(this.id, {
      status: 'running',
      currentTask: `Discovering ${params.limit || 10} leads in ${params.industry} (${params.location})`,
      progressPercent: 20,
    });

    agentRegistry.logAudit({
      agentId: this.id,
      taskId: params.taskId,
      stepId: params.stepId,
      toolName: 'discover_leads',
      action: 'Initiate Multi-Engine Lead Discovery',
      details: `Searching for ${params.industry} companies in ${params.location} (Target size: ${params.companySize || 'Any'})`,
      level: 'info',
    });

    try {
      const result = await toolsRegistry.discoverLeads({
        ...params,
        autoSaveToCrm: true,
      });

      if (result.success) {
        agentRegistry.recordAgentSuccess(this.id, result.data?.totalFound || 1);
        agentRegistry.logAudit({
          agentId: this.id,
          taskId: params.taskId,
          stepId: params.stepId,
          toolName: 'discover_leads',
          action: 'Lead Discovery & CRM Ingestion Succeeded',
          details: result.summary,
          level: 'info',
        });
      } else {
        agentRegistry.recordAgentFailure(this.id);
        agentRegistry.logAudit({
          agentId: this.id,
          taskId: params.taskId,
          stepId: params.stepId,
          toolName: 'discover_leads',
          action: 'Discovery Encountered Issue',
          details: result.error || 'No records returned',
          level: 'warn',
        });
      }

      return result;
    } catch (err: any) {
      agentRegistry.recordAgentFailure(this.id);
      return {
        success: false,
        toolName: 'discover_leads',
        summary: `Discovery error: ${err.message}`,
        data: null,
        error: err.message,
      };
    }
  }
}

export const leadResearchAgent = new LeadResearchAgent();
