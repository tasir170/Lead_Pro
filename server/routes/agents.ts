import { Router, Request, Response } from 'express';
import { agentRegistry } from '../services/agents/agentRegistry.js';
import { orchestrator } from '../services/agents/orchestrator.js';
import { leadResearchAgent } from '../services/agents/leadResearchAgent.js';
import { leadQualificationAgent } from '../services/agents/leadQualificationAgent.js';
import { salesStrategyAgent } from '../services/agents/salesStrategyAgent.js';
import { crmManagementAgent } from '../services/agents/crmManagementAgent.js';
import { AgentId } from '../services/agents/types.js';

export const agentsRouter = Router();

/**
 * GET /api/agents
 * List all specialized agents with real-time status and operational metrics
 */
agentsRouter.get('/', (_req: Request, res: Response) => {
  try {
    const agents = agentRegistry.getAgents();
    res.json({
      success: true,
      agents,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/agents/orchestrate
 * Parse natural language prompt, synthesize multi-agent workflow plan, and begin execution
 */
agentsRouter.post('/orchestrate', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    const task = await orchestrator.orchestrateTask(prompt.trim());
    res.status(201).json({
      success: true,
      task,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/agents/tasks/:id
 * Retrieve live task execution status, steps progress, and deliverables
 */
agentsRouter.get('/tasks/:id', (req: Request, res: Response) => {
  try {
    const task = agentRegistry.getTask(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, task });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/agents/tasks/:id/approve
 * Resolve pending user authorization gate for sensitive operations
 */
agentsRouter.post('/tasks/:id/approve', async (req: Request, res: Response) => {
  try {
    const { stepId, approved, userName } = req.body;
    if (!stepId || typeof approved !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'stepId and approved boolean are required',
      });
    }

    const updatedTask = await orchestrator.resumeWorkflowAfterApproval(
      req.params.id,
      stepId,
      approved,
      userName || 'Sales Admin'
    );

    if (!updatedTask) {
      return res.status(404).json({ success: false, error: 'Task or step not found' });
    }

    res.json({
      success: true,
      task: updatedTask,
      message: approved ? 'Action authorized. Execution resumed.' : 'Action rejected. Step skipped.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/agents/run-agent
 * Directly trigger an individual agent action
 */
agentsRouter.post('/run-agent', async (req: Request, res: Response) => {
  try {
    const { agentId, action, params } = req.body;
    if (!agentId || !action) {
      return res.status(400).json({ success: false, error: 'agentId and action are required' });
    }

    let result;
    switch (agentId as AgentId) {
      case 'lead_researcher':
        if (action === 'discover') {
          result = await leadResearchAgent.discover(params || {});
        } else {
          result = await leadResearchAgent.research(params || {});
        }
        break;

      case 'lead_qualifier':
        if (action === 'batch_qualify') {
          result = await leadQualificationAgent.batchQualify(params || { leadIds: [] });
        } else {
          result = await leadQualificationAgent.qualify(params || { leadId: '' });
        }
        break;

      case 'sales_strategist':
        result = await salesStrategyAgent.craftStrategy(params || { leadId: 'lead-1' });
        break;

      case 'crm_manager':
        if (action === 'find_duplicates') {
          result = await crmManagementAgent.findDuplicates(params);
        } else if (action === 'find_incomplete') {
          result = await crmManagementAgent.findIncomplete(params);
        } else if (action === 'daily_summary') {
          result = await crmManagementAgent.generateDailySummary(params);
        } else {
          result = await crmManagementAgent.batchUpdate(params || { leadIds: [] });
        }
        break;

      default:
        return res.status(400).json({ success: false, error: `Invalid agentId: ${agentId}` });
    }

    res.json({
      success: result.success,
      result,
      agent: agentRegistry.getAgent(agentId),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/agents/history
 * List past workflow execution tasks
 */
agentsRouter.get('/history', (_req: Request, res: Response) => {
  try {
    const tasks = agentRegistry.getAllTasks();
    res.json({ success: true, tasks });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/agents/audit-logs
 * List persisted audit logs with optional filters
 */
agentsRouter.get('/audit-logs', (req: Request, res: Response) => {
  try {
    const { agentId, level, limit } = req.query;
    const logs = agentRegistry.getAuditLogs({
      agentId: agentId as string,
      level: level as string,
      limit: limit ? Number(limit) : 100,
    });
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/agents/pending-approvals
 * List all approval requests requiring user authorization
 */
agentsRouter.get('/pending-approvals', (_req: Request, res: Response) => {
  try {
    const pending = agentRegistry.getAllPendingApprovals();
    res.json({ success: true, approvals: pending });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});
