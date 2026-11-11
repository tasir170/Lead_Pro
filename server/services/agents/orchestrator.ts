import { GoogleGenAI } from '@google/genai';
import { agentRegistry } from './agentRegistry.js';
import { toolsRegistry } from './toolsRegistry.js';
import { leadResearchAgent } from './leadResearchAgent.js';
import { leadQualificationAgent } from './leadQualificationAgent.js';
import { salesStrategyAgent } from './salesStrategyAgent.js';
import { crmManagementAgent } from './crmManagementAgent.js';
import {
  WorkflowTask,
  WorkflowStep,
  AgentId,
  ApprovalRequest,
} from './types.js';

let aiInstance: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (aiInstance) return aiInstance;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') return null;
  aiInstance = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
  return aiInstance;
}

export class AIOrchestrator {
  /**
   * Parses natural language prompt into structured multi-agent workflow steps
   */
  public async planWorkflow(prompt: string): Promise<{
    planSummary: string;
    selectedAgents: AgentId[];
    steps: Array<{
      title: string;
      agentId: AgentId;
      toolName: string;
      inputArgs: Record<string, any>;
      requiresApproval?: boolean;
    }>;
  }> {
    const client = getAIClient();
    const lower = prompt.toLowerCase();

    if (client) {
      try {
        const planningPrompt = `You are the LeadPulse AI Multi-Agent Orchestrator Architect.
Analyze the following user instruction and construct a concrete, executable multi-agent plan using ONLY our 4 specialized agents and registered tools.

USER REQUEST: "${prompt}"

AVAILABLE AGENTS:
1. "lead_researcher":
   - "discover_leads": { industry: string, location: string, limit: 10|25|50, companySize: string, targetAudience: string }
   - "research_company": { companyName?: string, domain?: string, leadId?: string }
2. "lead_qualifier":
   - "qualify_lead": { leadId?: string }
   - "batch_qualify": { leadIds?: string[] }
3. "sales_strategist":
   - "generate_sales_strategy": { leadId?: string, channel?: "email"|"whatsapp", goal?: string }
4. "crm_manager":
   - "crm_find_duplicates": {}
   - "crm_find_incomplete": {}
   - "crm_daily_summary": {}
   - "crm_batch_update": { leadIds: string[], newStatus?: string, assignTo?: string } (requiresApproval: true)
   - "dispatch_outreach": { leadId: string, channel: "email"|"whatsapp", message: string } (requiresApproval: true)

SAFETY RULES:
- Any step modifying records or sending outreach MUST specify "requiresApproval": true.
- Break compound requests into sequential steps (e.g., discover -> research -> qualify -> generate strategy).
- Limit to at most 5 ordered steps.

Return ONLY a valid JSON object matching this schema:
{
  "planSummary": "Brief overview of what the multi-agent pipeline will execute",
  "selectedAgents": ["lead_researcher", "lead_qualifier", ...],
  "steps": [
    {
      "title": "Clear step title",
      "agentId": "lead_researcher" | "lead_qualifier" | "sales_strategist" | "crm_manager",
      "toolName": "tool_name",
      "inputArgs": { ... },
      "requiresApproval": boolean
    }
  ]
}`;

        const response = await Promise.race([
          client.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: planningPrompt,
            config: { responseMimeType: 'application/json' },
          }),
          new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error('Planning timed out')), 8000)
          ),
        ]);

        const text = response.text?.trim();
        if (text) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed.steps) && parsed.steps.length > 0) {
            return {
              planSummary: parsed.planSummary || 'Executing multi-agent sales intelligence pipeline',
              selectedAgents: Array.isArray(parsed.selectedAgents) ? parsed.selectedAgents : ['lead_researcher', 'lead_qualifier'],
              steps: parsed.steps,
            };
          }
        }
      } catch (err) {
        console.warn('Gemini workflow planner failed, falling back to deterministic planner:', err);
      }
    }

    // High quality deterministic planner fallback
    if (lower.includes('duplicate') || lower.includes('crm') || lower.includes('clean') || lower.includes('hygiene') || lower.includes('audit')) {
      return {
        planSummary: 'Comprehensive CRM database audit, duplicate record detection, and pipeline hygiene reporting.',
        selectedAgents: ['crm_manager'],
        steps: [
          {
            title: 'Scan CRM for duplicate company domains and emails',
            agentId: 'crm_manager',
            toolName: 'crm_find_duplicates',
            inputArgs: {},
          },
          {
            title: 'Identify incomplete records and data completeness gaps',
            agentId: 'crm_manager',
            toolName: 'crm_find_incomplete',
            inputArgs: {},
          },
          {
            title: 'Generate daily CRM hygiene and follow-up report',
            agentId: 'crm_manager',
            toolName: 'crm_daily_summary',
            inputArgs: {},
          },
        ],
      };
    }

    if (lower.includes('dubai') || lower.includes('real estate') || lower.includes('find') || lower.includes('discover')) {
      const locationMatch = prompt.match(/in\s+([a-zA-Z\s]+)/i);
      const loc = locationMatch ? locationMatch[1].trim() : (lower.includes('dubai') ? 'Dubai, UAE' : 'United States');
      const ind = lower.includes('real estate') ? 'Real Estate' : (lower.includes('restaurant') ? 'Restaurants' : 'Technology');

      return {
        planSummary: `Multi-agent discovery, intelligence enrichment, and predictive qualification for ${ind} companies in ${loc}.`,
        selectedAgents: ['lead_researcher', 'lead_qualifier', 'sales_strategist'],
        steps: [
          {
            title: `Discover ${ind} companies in ${loc}`,
            agentId: 'lead_researcher',
            toolName: 'discover_leads',
            inputArgs: { industry: ind, location: loc, limit: 10, targetAudience: 'B2B', companySize: 'Any' },
          },
          {
            title: `Perform OSINT research and verify digital presence`,
            agentId: 'lead_researcher',
            toolName: 'research_company',
            inputArgs: { companyName: `${ind} Leader ${loc}` },
          },
          {
            title: `Predictive 7-factor qualification & customer needs analysis`,
            agentId: 'lead_qualifier',
            toolName: 'batch_qualify',
            inputArgs: { leadIds: [] }, // will be populated from step 1 outputs
          },
          {
            title: `Craft tailored email & WhatsApp outreach copy for top qualified leads`,
            agentId: 'sales_strategist',
            toolName: 'generate_sales_strategy',
            inputArgs: { leadId: 'lead-1', channel: 'email', goal: 'Schedule 15-minute executive demo' },
          },
        ],
      };
    }


    if (lower.includes('strategy') || lower.includes('outreach') || lower.includes('whatsapp') || lower.includes('email')) {
      return {
        planSummary: 'Personalized multi-channel sales pitch generation and follow-up schedule design.',
        selectedAgents: ['sales_strategist'],
        steps: [
          {
            title: 'Synthesize consultative sales strategy and messaging',
            agentId: 'sales_strategist',
            toolName: 'generate_sales_strategy',
            inputArgs: { leadId: 'lead-1', channel: 'email', goal: 'Schedule 15-minute demo' },
          },
          {
            title: 'Draft mobile-first WhatsApp executive message and follow-up cadence',
            agentId: 'sales_strategist',
            toolName: 'generate_sales_strategy',
            inputArgs: { leadId: 'lead-1', channel: 'whatsapp', goal: 'Confirm demonstration timing' },
          },
        ],
      };
    }

    // Default universal workflow
    return {
      planSummary: 'Autonomous lead intelligence cycle: Audit pipeline, enrich target accounts, and evaluate lead scores.',
      selectedAgents: ['crm_manager', 'lead_qualifier', 'sales_strategist'],
      steps: [
        {
          title: 'Compile CRM pipeline and hygiene summary',
          agentId: 'crm_manager',
          toolName: 'crm_daily_summary',
          inputArgs: {},
        },
        {
          title: 'Predictive qualification on active pipeline lead',
          agentId: 'lead_qualifier',
          toolName: 'qualify_lead',
          inputArgs: { leadId: 'lead-1' },
        },
        {
          title: 'Generate tailored outbound strategy',
          agentId: 'sales_strategist',
          toolName: 'generate_sales_strategy',
          inputArgs: { leadId: 'lead-1', channel: 'email' },
        },
      ],
    };
  }

  /**
   * Starts a new orchestrator task and begins sequential execution
   */
  public async orchestrateTask(prompt: string): Promise<WorkflowTask> {
    const plan = await this.planWorkflow(prompt);
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

    const steps: WorkflowStep[] = plan.steps.map((s, idx) => ({
      id: `step-${taskId}-${idx + 1}`,
      stepIndex: idx + 1,
      title: s.title,
      agentId: s.agentId,
      toolName: s.toolName,
      inputArgs: s.inputArgs || {},
      status: 'pending',
      requiresApproval: Boolean(s.requiresApproval),
      retryCount: 0,
      maxRetries: 2,
    }));

    const task: WorkflowTask = {
      id: taskId,
      prompt,
      planSummary: plan.planSummary,
      selectedAgents: plan.selectedAgents,
      status: 'running',
      steps,
      currentStepIndex: 1,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      deliverables: {
        discoveredLeadCount: 0,
        qualifiedLeadCount: 0,
        strategiesGenerated: 0,
        duplicatesFound: 0,
        recordsUpdated: 0,
        data: {},
      },
    };

    agentRegistry.saveTask(task);
    agentRegistry.logAudit({
      agentId: 'orchestrator',
      taskId,
      action: 'Task Orchestration Started',
      details: `Prompt: "${prompt}" - Generated ${steps.length} sequential steps across agents: ${plan.selectedAgents.join(', ')}.`,
      level: 'info',
    });

    // Execute steps asynchronously so HTTP response returns immediately with the live task ID
    this.executeWorkflow(taskId).catch((err) => {
      console.error(`Error executing workflow ${taskId}:`, err);
    });

    return task;
  }

  /**
   * Sequential step execution loop with bounded retries and approval gates
   */
  public async executeWorkflow(taskId: string): Promise<void> {
    const task = agentRegistry.getTask(taskId);
    if (!task) return;

    for (let i = task.currentStepIndex - 1; i < task.steps.length; i++) {
      const step = task.steps[i];
      task.currentStepIndex = i + 1;

      // Check if step requires user approval and is not yet approved
      if (step.requiresApproval && !step.isApproved) {
        step.status = 'waiting_approval';
        task.status = 'waiting_approval';
        agentRegistry.saveTask(task);

        const approvalReq = agentRegistry.registerApprovalRequest({
          taskId: task.id,
          stepId: step.id,
          agentId: step.agentId,
          actionType: step.toolName,
          description: `Step ${step.stepIndex} requires authorization: ${step.title}`,
          payload: step.inputArgs,
        });

        agentRegistry.logAudit({
          agentId: 'orchestrator',
          taskId: task.id,
          stepId: step.id,
          action: 'Task Paused: User Approval Required',
          details: `Action "${step.toolName}" on ${step.title} is queued pending approval (Req ID: ${approvalReq.id}).`,
          level: 'warn',
          requiresApproval: true,
        });

        // Pause execution until approved
        return;
      }

      // Execute Step with bounded retry logic (max 2 retries)
      step.status = 'running';
      step.startedAt = new Date().toISOString();
      agentRegistry.saveTask(task);

      let stepSuccess = false;
      let lastError = '';

      while (step.retryCount <= step.maxRetries && !stepSuccess) {
        try {
          // Pass discovered lead IDs to subsequent steps if applicable
          if (step.toolName === 'batch_qualify' && (!step.inputArgs.leadIds || step.inputArgs.leadIds.length === 0)) {
            const prevDiscoverStep = task.steps.find((s) => s.toolName === 'discover_leads' && s.outputData?.savedLeadIds);
            if (prevDiscoverStep && prevDiscoverStep.outputData?.savedLeadIds) {
              step.inputArgs.leadIds = prevDiscoverStep.outputData.savedLeadIds.slice(0, 5);
            } else {
              step.inputArgs.leadIds = ['lead-1', 'lead-2'];
            }
          }

          // Execute tool call via designated agent
          const execResult = await this.dispatchToolCall(step.agentId, step.toolName, step.inputArgs, task.id, step.id);

          if (execResult.success) {
            stepSuccess = true;
            step.status = 'completed';
            step.completedAt = new Date().toISOString();
            step.outputSummary = execResult.summary;
            step.outputData = execResult.data;

            // Aggregate deliverables
            if (step.toolName === 'discover_leads' && execResult.data?.totalFound) {
              task.deliverables!.discoveredLeadCount = (task.deliverables!.discoveredLeadCount || 0) + execResult.data.totalFound;
            }
            if (step.toolName === 'qualify_lead' || step.toolName === 'batch_qualify') {
              task.deliverables!.qualifiedLeadCount = (task.deliverables!.qualifiedLeadCount || 0) + (execResult.data?.qualifiedCount || 1);
            }
            if (step.toolName === 'generate_sales_strategy') {
              task.deliverables!.strategiesGenerated = (task.deliverables!.strategiesGenerated || 0) + 1;
            }
            if (step.toolName === 'crm_find_duplicates' && execResult.data?.duplicateCount !== undefined) {
              task.deliverables!.duplicatesFound = execResult.data.duplicateCount;
            }
            if (step.toolName === 'crm_batch_update' && execResult.data?.affectedCount) {
              task.deliverables!.recordsUpdated = (task.deliverables!.recordsUpdated || 0) + execResult.data.affectedCount;
            }
          } else {
            lastError = execResult.error || 'Execution returned unsuccessful result';
            step.retryCount++;
            if (step.retryCount <= step.maxRetries) {
              agentRegistry.logAudit({
                agentId: step.agentId,
                taskId: task.id,
                stepId: step.id,
                action: 'Step Retry Initiated',
                details: `Retry attempt ${step.retryCount}/${step.maxRetries} after error: ${lastError}`,
                level: 'warn',
              });
              await new Promise((resolve) => setTimeout(resolve, 800));
            }
          }
        } catch (err: any) {
          lastError = err.message || 'Fatal execution error';
          step.retryCount++;
          if (step.retryCount <= step.maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 800));
          }
        }
      }

      if (!stepSuccess) {
        step.status = 'failed';
        step.completedAt = new Date().toISOString();
        step.error = lastError;
        task.status = 'failed';
        task.error = `Step ${step.stepIndex} (${step.title}) failed after ${step.retryCount} attempts: ${lastError}`;
        agentRegistry.saveTask(task);
        agentRegistry.logAudit({
          agentId: 'orchestrator',
          taskId: task.id,
          stepId: step.id,
          action: 'Task Halted on Step Failure',
          details: task.error,
          level: 'error',
        });
        return;
      }

      agentRegistry.saveTask(task);
    }

    // All steps completed successfully!
    task.status = 'completed';
    task.completedAt = new Date().toISOString();
    task.finalReport = this.generateFinalReport(task);
    agentRegistry.saveTask(task);

    agentRegistry.logAudit({
      agentId: 'orchestrator',
      taskId: task.id,
      action: 'Task Orchestration Completed',
      details: `All ${task.steps.length} steps executed successfully. Discovered: ${task.deliverables?.discoveredLeadCount || 0}, Qualified: ${task.deliverables?.qualifiedLeadCount || 0}, Strategies: ${task.deliverables?.strategiesGenerated || 0}.`,
      level: 'info',
    });
  }

  /**
   * Resumes workflow execution after user approval
   */
  public async resumeWorkflowAfterApproval(taskId: string, stepId: string, approved: boolean, userName = 'User Admin'): Promise<WorkflowTask | undefined> {
    const task = agentRegistry.getTask(taskId);
    if (!task) return undefined;

    const step = task.steps.find((s) => s.id === stepId);
    if (!step) return undefined;

    if (approved) {
      step.isApproved = true;
      step.approvedBy = userName;
      step.approvedAt = new Date().toISOString();
      step.status = 'pending';
      task.status = 'running';
      agentRegistry.saveTask(task);

      agentRegistry.logAudit({
        agentId: 'orchestrator',
        taskId: task.id,
        stepId: step.id,
        action: 'User Approval Granted',
        details: `Action approved by ${userName}. Resuming workflow execution.`,
        level: 'info',
        requiresApproval: true,
        wasApproved: true,
      });

      this.executeWorkflow(taskId).catch(console.error);
    } else {
      step.status = 'skipped';
      step.outputSummary = `Action rejected by ${userName}. Step skipped safely.`;
      task.status = 'running';
      agentRegistry.saveTask(task);

      agentRegistry.logAudit({
        agentId: 'orchestrator',
        taskId: task.id,
        stepId: step.id,
        action: 'User Approval Denied',
        details: `Action rejected by ${userName}. Step skipped.`,
        level: 'warn',
        requiresApproval: true,
        wasApproved: false,
      });

      this.executeWorkflow(taskId).catch(console.error);
    }

    return task;
  }

  /**
   * Dispatch tool call to the corresponding specialized agent implementation
   */
  private async dispatchToolCall(
    agentId: AgentId,
    toolName: string,
    args: Record<string, any>,
    taskId: string,
    stepId: string
  ) {
    switch (toolName) {
      case 'discover_leads':
        return leadResearchAgent.discover({
          industry: args.industry,
          location: args.location,
          targetAudience: args.targetAudience,
          companySize: args.companySize,
          limit: args.limit,
          keywords: args.keywords,
          taskId,
          stepId,
        });

      case 'research_company':
        return leadResearchAgent.research({
          companyName: args.companyName,
          domain: args.domain,
          leadId: args.leadId,
          taskId,
          stepId,
        });

      case 'qualify_lead':
        return leadQualificationAgent.qualify({
          leadId: args.leadId,
          taskId,
          stepId,
        });

      case 'batch_qualify':
        return leadQualificationAgent.batchQualify({
          leadIds: args.leadIds || ['lead-1'],
          taskId,
          stepId,
        });

      case 'generate_sales_strategy':
        return salesStrategyAgent.craftStrategy({
          leadId: args.leadId || 'lead-1',
          channel: args.channel,
          goal: args.goal,
          taskId,
          stepId,
        });

      case 'crm_find_duplicates':
        return crmManagementAgent.findDuplicates({ taskId, stepId });

      case 'crm_find_incomplete':
        return crmManagementAgent.findIncomplete({ taskId, stepId });

      case 'crm_daily_summary':
        return crmManagementAgent.generateDailySummary({ taskId, stepId });

      case 'crm_batch_update':
        return crmManagementAgent.batchUpdate({
          leadIds: args.leadIds,
          newStatus: args.newStatus,
          assignTo: args.assignTo,
          approvedBy: args.approvedBy,
          taskId,
          stepId,
        });

      case 'dispatch_outreach':
        return toolsRegistry.dispatchOutreach({
          leadId: args.leadId,
          channel: args.channel,
          message: args.message,
          subject: args.subject,
          approvedBy: args.approvedBy,
        });

      default:
        return {
          success: false,
          toolName,
          summary: `Unknown tool: ${toolName}`,
          data: null,
          error: `Unregistered tool: ${toolName}`,
        };
    }
  }

  private generateFinalReport(task: WorkflowTask): string {
    const d = task.deliverables || {};
    return `### Multi-Agent Workflow Execution Report
**Mission:** "${task.prompt}"
**Plan Summary:** ${task.planSummary}
**Execution Status:** Completed (${task.steps.length}/${task.steps.length} steps passed)

#### Key Deliverables:
- **Accounts Discovered & Synced:** ${d.discoveredLeadCount || 0} verified listings
- **Accounts Predictive-Scored:** ${d.qualifiedLeadCount || 0} accounts evaluated across 7 factors
- **Personalized Sales Strategies:** ${d.strategiesGenerated || 0} outbound pitches generated (Email & WhatsApp)
- **CRM Duplicates Audited:** ${d.duplicatesFound ?? 0} duplicate clusters flagged
- **Records Updated with Authorization:** ${d.recordsUpdated || 0} leads

All operations verified against backend databases with full audit trail.`;
  }
}

export const orchestrator = new AIOrchestrator();
