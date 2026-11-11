import { agentRegistry } from './agentRegistry.js';
import { toolsRegistry, ToolExecutionResult } from './toolsRegistry.js';
import { AgentInfo } from './types.js';

export class SalesStrategyAgent {
  public readonly id = 'sales_strategist' as const;
  public readonly name = 'Sales Strategy Agent';

  public getInfo(): AgentInfo {
    return agentRegistry.getAgent(this.id)!;
  }

  /**
   * Generates tailored sales strategy, personalized emails, WhatsApp copy, and follow-up schedules
   */
  public async craftStrategy(params: {
    leadId: string;
    channel?: 'email' | 'whatsapp' | 'linkedin';
    goal?: string;
    taskId?: string;
    stepId?: string;
  }): Promise<ToolExecutionResult> {
    agentRegistry.updateAgentState(this.id, {
      status: 'running',
      currentTask: `Designing consultative sales strategy for lead ID ${params.leadId}`,
      progressPercent: 30,
    });

    agentRegistry.logAudit({
      agentId: this.id,
      taskId: params.taskId,
      stepId: params.stepId,
      toolName: 'generate_sales_strategy',
      action: 'Synthesize Consultative Sales Strategy',
      details: `Crafting personalized multi-channel outreach for ${params.leadId} (Channel: ${params.channel || 'multi-channel'})`,
      level: 'info',
    });

    try {
      const result = await toolsRegistry.generateSalesStrategy({
        leadId: params.leadId,
        channel: params.channel,
        goal: params.goal,
      });

      if (result.success) {
        agentRegistry.recordAgentSuccess(this.id, 1);
        agentRegistry.logAudit({
          agentId: this.id,
          taskId: params.taskId,
          stepId: params.stepId,
          toolName: 'generate_sales_strategy',
          action: 'Sales Pitch & Multi-Channel Copy Created',
          details: result.summary,
          level: 'info',
        });
      } else {
        agentRegistry.recordAgentFailure(this.id);
        agentRegistry.logAudit({
          agentId: this.id,
          taskId: params.taskId,
          stepId: params.stepId,
          toolName: 'generate_sales_strategy',
          action: 'Strategy Synthesis Failed',
          details: result.error || 'Unknown error',
          level: 'warn',
        });
      }

      return result;
    } catch (err: any) {
      agentRegistry.recordAgentFailure(this.id);
      return {
        success: false,
        toolName: 'generate_sales_strategy',
        summary: `Strategy generation error: ${err.message}`,
        data: null,
        error: err.message,
      };
    }
  }
}

export const salesStrategyAgent = new SalesStrategyAgent();
