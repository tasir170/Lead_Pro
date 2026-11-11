import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Play,
  RotateCw,
  Search,
  Check,
  X,
  Zap,
  TrendingUp,
  Database,
  Send,
  Building2,
  Mail,
  MessageSquare,
  HelpCircle,
  FileCheck,
} from 'lucide-react';
import {
  AgentInfo,
  WorkflowTask,
  AgentAuditLog,
  WorkflowStep,
  ApprovalRequest,
} from '../types';
import { api } from '../services/api';

interface AIAgentsManagementProps {
  onNavigateToLeads?: () => void;
  onSelectLeadForDetail?: (leadId: string) => void;
}

export const AIAgentsManagement: React.FC<AIAgentsManagementProps> = ({
  onNavigateToLeads,
}) => {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [activeTab, setActiveTab] = useState<'orchestrator' | 'agents' | 'history' | 'audit'>('orchestrator');
  const [prompt, setPrompt] = useState('');
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [currentTask, setCurrentTask] = useState<WorkflowTask | null>(null);
  const [taskHistory, setTaskHistory] = useState<WorkflowTask[]>([]);
  const [auditLogs, setAuditLogs] = useState<AgentAuditLog[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>([]);
  const [selectedAgentForModal, setSelectedAgentForModal] = useState<AgentInfo | null>(null);
  const [directRunAction, setDirectRunAction] = useState<string>('');
  const [directRunParam, setDirectRunParam] = useState<string>('');
  const [isDirectRunning, setIsDirectRunning] = useState(false);
  const [activeStepTab, setActiveStepTab] = useState<number>(0);
  const [auditFilterAgent, setAuditFilterAgent] = useState<string>('all');
  const [auditFilterLevel, setAuditFilterLevel] = useState<string>('all');
  const [notification, setNotification] = useState<string | null>(null);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadAgentsAndStatus = useCallback(async () => {
    try {
      const [agentList, history, approvals] = await Promise.all([
        api.getAgents(),
        api.getTaskHistory(),
        api.getPendingApprovals(),
      ]);
      setAgents(agentList);
      setTaskHistory(history);
      setPendingApprovals(approvals);

      if (history.length > 0 && !currentTask) {
        setCurrentTask(history[0]);
      }
    } catch (err: any) {
      console.warn('Failed to load agents metadata:', err);
    }
  }, [currentTask]);

  const loadAuditLogs = useCallback(async () => {
    try {
      const logs = await api.getAuditLogs({
        agentId: auditFilterAgent !== 'all' ? auditFilterAgent : undefined,
        level: auditFilterLevel !== 'all' ? auditFilterLevel : undefined,
        limit: 100,
      });
      setAuditLogs(logs);
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    }
  }, [auditFilterAgent, auditFilterLevel]);

  useEffect(() => {
    loadAgentsAndStatus();
    loadAuditLogs();
  }, [loadAgentsAndStatus, loadAuditLogs]);

  // Poll active task while running or waiting for approval
  useEffect(() => {
    if (currentTask && (currentTask.status === 'running' || currentTask.status === 'queued' || currentTask.status === 'waiting_approval')) {
      pollingRef.current = setInterval(async () => {
        try {
          const updated = await api.getTask(currentTask.id);
          setCurrentTask(updated);
          const [agentList, approvals] = await Promise.all([
            api.getAgents(),
            api.getPendingApprovals(),
          ]);
          setAgents(agentList);
          setPendingApprovals(approvals);

          if (updated.status === 'completed' || updated.status === 'failed') {
            clearInterval(pollingRef.current!);
            setIsOrchestrating(false);
            loadAuditLogs();
            api.getTaskHistory().then(setTaskHistory);
          }
        } catch {
          // silently handle polling hiccup
        }
      }, 1500);
    }

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [currentTask?.id, currentTask?.status, loadAuditLogs]);

  const handleRunPrompt = async (promptToRun?: string) => {
    const text = (promptToRun || prompt).trim();
    if (!text) return;

    setIsOrchestrating(true);
    try {
      const task = await api.orchestrateTask(text);
      setCurrentTask(task);
      setTaskHistory((prev) => [task, ...prev]);
      showNotification(`Mission started: "${task.planSummary.slice(0, 45)}..."`);
      loadAgentsAndStatus();
    } catch (err: any) {
      showNotification(err.message || 'Failed to start multi-agent task');
      setIsOrchestrating(false);
    }
  };

  const handleApproveStep = async (stepId: string, approved: boolean) => {
    if (!currentTask) return;
    try {
      const res = await api.approveTaskStep(currentTask.id, stepId, approved, 'Executive Admin');
      setCurrentTask(res.task);
      showNotification(res.message);
      loadAgentsAndStatus();
      loadAuditLogs();
    } catch (err: any) {
      showNotification(err.message || 'Approval action failed');
    }
  };

  const handleDirectRun = async () => {
    if (!selectedAgentForModal || !directRunAction) return;
    setIsDirectRunning(true);
    try {
      let params: any = {};
      if (selectedAgentForModal.id === 'lead_researcher') {
        if (directRunAction === 'discover') {
          params = { industry: directRunParam || 'Technology', location: 'United States', limit: 10 };
        } else {
          params = { companyName: directRunParam || 'SaaS Growth Corp' };
        }
      } else if (selectedAgentForModal.id === 'lead_qualifier') {
        params = { leadId: directRunParam || 'lead-1' };
      } else if (selectedAgentForModal.id === 'sales_strategist') {
        params = { leadId: directRunParam || 'lead-1', channel: 'email' };
      } else if (selectedAgentForModal.id === 'crm_manager') {
        params = {};
      }

      const res = await api.runAgentDirect(selectedAgentForModal.id, directRunAction, params);
      showNotification(res.result.summary || 'Direct action executed successfully');
      setSelectedAgentForModal(null);
      loadAgentsAndStatus();
      loadAuditLogs();
    } catch (err: any) {
      showNotification(err.message || 'Agent action failed');
    } finally {
      setIsDirectRunning(false);
    }
  };

  const sampleWorkflows = [
    {
      title: 'Dubai Real Estate Discovery & Qualification',
      description: 'Discover 20 real estate companies in Dubai, research digital footprint, calculate 7-factor predictive scores, and save qualified accounts.',
      prompt: 'Find 20 real estate companies in Dubai, research them, score them and save qualified leads',
      badge: 'Multi-Agent',
      color: 'border-blue-500/40 text-blue-400 bg-blue-500/10',
    },
    {
      title: 'Full CRM Deduplication & Health Audit',
      description: 'Scan all records for duplicate domains and emails, analyze completeness gaps, and compile a daily pipeline hygiene score.',
      prompt: 'Audit the CRM database for duplicate records, find incomplete leads, and generate a daily hygiene summary',
      badge: 'Database',
      color: 'border-purple-500/40 text-purple-400 bg-purple-500/10',
    },
    {
      title: 'Outbound Strategy & Copy for Top Hot Leads',
      description: 'Review high-priority accounts, craft consultative pitches, write tailored email drafts, and generate WhatsApp conversation openers.',
      prompt: 'Generate personalized sales strategy, email drafts, and WhatsApp copy for top qualified leads',
      badge: 'Sales Assist',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10',
    },
    {
      title: 'Research & Enrich Incomplete Inbound Accounts',
      description: 'Identify leads missing websites or contact persons, execute deep OSINT research dossiers, and update records with authorization.',
      prompt: 'Find incomplete leads in CRM, perform deep company research, and enrich their business descriptions and tech stack',
      badge: 'Enrichment',
      color: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-blue-500/50 text-white text-xs px-4 py-3 rounded-lg shadow-xl flex items-center gap-2 animate-fade-in">
          <Zap className="w-4 h-4 text-blue-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-md shadow-blue-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                AI Agent Management & Orchestrator
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                  Autonomous Subsystem
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Coordinated multi-agent architecture powered by Gemini 2.5 Flash and verified backend tools.
              </p>
            </div>
          </div>
        </div>

        {/* Global Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {[
            { key: 'orchestrator', label: 'Central Orchestrator' },
            { key: 'agents', label: `Specialized Agents (${agents.length})` },
            { key: 'history', label: `Task History (${taskHistory.length})` },
            { key: 'audit', label: 'Audit Logs' },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  if (tab.key === 'audit') loadAuditLogs();
                }}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isActive ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-agent-tab"
                    transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    className="absolute inset-0 bg-white rounded-lg shadow-xs -z-0"
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Pending Safety Approvals Banner */}
      {pendingApprovals.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 text-amber-700 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold flex items-center gap-2">
                Safety Approval Gate Active ({pendingApprovals.length} pending action)
              </h4>
              <p className="text-xs text-amber-800">
                Agents require explicit user authorization before mutating CRM records or dispatching outbound communications.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {pendingApprovals.slice(0, 1).map((appr) => (
              <div key={appr.id} className="flex items-center gap-2">
                <button
                  onClick={() => handleApproveStep(appr.stepId, true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Approve Execution
                </button>
                <button
                  onClick={() => handleApproveStep(appr.stepId, false)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-medium rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Skip Step
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Agent Status Cards (Always visible as a compact metrics row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {agents.map((agent) => {
          const isRunning = agent.status === 'running';
          const isError = agent.status === 'error';
          return (
            <div
              key={agent.id}
              className={`p-4 rounded-xl border bg-white shadow-xs transition-all flex flex-col justify-between ${
                isRunning
                  ? 'border-blue-400 ring-2 ring-blue-500/10'
                  : isError
                  ? 'border-rose-300'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                      isRunning
                        ? 'bg-blue-100 text-blue-700 animate-pulse'
                        : isError
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isRunning ? 'bg-blue-600' : isError ? 'bg-rose-600' : 'bg-emerald-500'
                      }`}
                    />
                    {agent.status}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {agent.lastRunAt ? new Date(agent.lastRunAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Ready'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-900 leading-snug">{agent.name}</h3>
                <p className="text-[11px] text-slate-500 line-clamp-1 mb-2.5">{agent.role}</p>

                {/* Progress bar */}
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isRunning ? 'bg-blue-600' : isError ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${agent.status === 'running' ? agent.progressPercent || 50 : 100}%` }}
                  />
                </div>

                <p className="text-[11px] text-slate-600 italic bg-slate-50 px-2 py-1 rounded border border-slate-100 line-clamp-2 min-h-[36px]">
                  {agent.currentTask}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Processed</span>
                  <span className="font-bold text-slate-800">{agent.processedLeads} leads</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">Success / Fail</span>
                  <span className="font-mono text-[11px] font-semibold text-emerald-600">
                    {agent.successCount}{' '}
                    <span className="text-rose-500 font-normal">/ {agent.failureCount}</span>
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSelectedAgentForModal(agent);
                    if (agent.id === 'lead_researcher') setDirectRunAction('discover');
                    else if (agent.id === 'lead_qualifier') setDirectRunAction('qualify');
                    else if (agent.id === 'sales_strategist') setDirectRunAction('craft_strategy');
                    else setDirectRunAction('find_duplicates');
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                  title="Direct Run"
                >
                  <Play className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* TAB 1: CENTRAL ORCHESTRATOR RUNNER & LIVE MONITOR */}
      {activeTab === 'orchestrator' && (
        <div className="space-y-6">
          {/* Natural Language Prompt Command Console */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Natural Language Multi-Agent Command Console
                </h2>
                <p className="text-xs text-slate-500">
                  Describe what your sales pipeline needs in plain language. The Orchestrator automatically selects specialized agents, decomposes the plan, and executes backend operations.
                </p>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Human-in-the-Loop Active
              </span>
            </div>

            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="Example: Find 20 real estate companies in Dubai, research them, score them and save qualified leads..."
                className="w-full text-sm p-3.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-slate-400">
                  Tip: Supports lead discovery, OSINT intelligence, 7-factor predictive scoring, and multi-channel outreach crafting.
                </span>
                <button
                  onClick={() => handleRunPrompt()}
                  disabled={isOrchestrating || !prompt.trim()}
                  className={`px-5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer ${
                    isOrchestrating || !prompt.trim()
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25 active:scale-95'
                  }`}
                >
                  {isOrchestrating ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      Orchestrating Agents...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      Execute Multi-Agent Mission
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Workflow Templates */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Verified Autonomous Workflows
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {sampleWorkflows.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPrompt(item.prompt);
                      handleRunPrompt(item.prompt);
                    }}
                    className="p-3 text-left rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-300 transition-all group cursor-pointer flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${item.color}`}>
                          {item.badge}
                        </span>
                        <Play className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800 group-hover:text-blue-700 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Active Mission Live Execution Viewer */}
          {currentTask && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${
                        currentTask.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : currentTask.status === 'failed'
                          ? 'bg-rose-100 text-rose-800'
                          : currentTask.status === 'waiting_approval'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                          : 'bg-blue-100 text-blue-800 animate-pulse'
                      }`}
                    >
                      {currentTask.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-mono text-slate-400">ID: {currentTask.id}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{currentTask.planSummary}</h3>
                  <p className="text-xs text-slate-500 italic mt-0.5">Prompt: "{currentTask.prompt}"</p>
                </div>

                {/* Selected Agents Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-400 font-medium mr-1">Agents Engaged:</span>
                  {currentTask.selectedAgents.map((agId) => (
                    <span
                      key={agId}
                      className="text-xs px-2 py-1 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200 capitalize"
                    >
                      {agId.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>

              {/* Progress Steps Feed */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Sequential Execution Pipeline ({currentTask.steps.filter((s) => s.status === 'completed').length}/{currentTask.steps.length} completed)
                </h4>

                <div className="space-y-2.5">
                  {currentTask.steps.map((step, idx) => {
                    const isCurrent = step.status === 'running';
                    const isDone = step.status === 'completed';
                    const isWaiting = step.status === 'waiting_approval';
                    const isFailed = step.status === 'failed';

                    return (
                      <div
                        key={step.id}
                        className={`p-3.5 rounded-xl border transition-all ${
                          isWaiting
                            ? 'bg-amber-50/80 border-amber-300'
                            : isCurrent
                            ? 'bg-blue-50/70 border-blue-400 shadow-xs'
                            : isDone
                            ? 'bg-slate-50 border-slate-200'
                            : isFailed
                            ? 'bg-rose-50 border-rose-300'
                            : 'bg-white border-slate-100 opacity-60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                                isDone
                                  ? 'bg-emerald-600 text-white'
                                  : isWaiting
                                  ? 'bg-amber-500 text-white animate-pulse'
                                  : isCurrent
                                  ? 'bg-blue-600 text-white animate-spin'
                                  : isFailed
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-slate-200 text-slate-600'
                              }`}
                            >
                              {isDone ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : isWaiting ? (
                                <Clock className="w-3.5 h-3.5" />
                              ) : (
                                step.stepIndex
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-900">{step.title}</span>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                                  {step.agentId.replace('_', ' ')}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  tool: {step.toolName}
                                </span>
                              </div>

                              {step.outputSummary && (
                                <p className="text-xs text-slate-700 mt-1 leading-relaxed bg-white/70 p-2 rounded border border-slate-200/60 font-sans">
                                  {step.outputSummary}
                                </p>
                              )}

                              {step.error && (
                                <p className="text-xs text-rose-600 mt-1 font-mono">
                                  Error: {step.error}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-2">
                            {isWaiting && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleApproveStep(step.id, true)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md flex items-center gap-1 shadow-xs cursor-pointer"
                                >
                                  <Check className="w-3 h-3" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleApproveStep(step.id, false)}
                                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium rounded-md cursor-pointer"
                                >
                                  Skip
                                </button>
                              </div>
                            )}

                            {step.outputData && (
                              <button
                                onClick={() => setActiveStepTab(activeStepTab === idx ? -1 : idx)}
                                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold underline cursor-pointer"
                              >
                                {activeStepTab === idx ? 'Hide Payload' : 'View Payload'}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Collapsible Tool Output Viewer */}
                        {activeStepTab === idx && step.outputData && (
                          <div className="mt-3 p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto max-h-56">
                            <pre>{JSON.stringify(step.outputData, null, 2)}</pre>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Task Deliverables & Final Report Summary */}
              {currentTask.status === 'completed' && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-slate-50 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      Mission Deliverables Summary
                    </h4>
                    {onNavigateToLeads && (
                      <button
                        onClick={onNavigateToLeads}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                      >
                        View in CRM Table →
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Discovered</span>
                      <span className="text-lg font-bold text-blue-600">
                        {currentTask.deliverables?.discoveredLeadCount || 0}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">AI Scored</span>
                      <span className="text-lg font-bold text-indigo-600">
                        {currentTask.deliverables?.qualifiedLeadCount || 0}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Strategies</span>
                      <span className="text-lg font-bold text-emerald-600">
                        {currentTask.deliverables?.strategiesGenerated || 0}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <span className="text-[11px] text-slate-500 block">Audited Duplicates</span>
                      <span className="text-lg font-bold text-purple-600">
                        {currentTask.deliverables?.duplicatesFound ?? 0}
                      </span>
                    </div>
                  </div>

                  {currentTask.finalReport && (
                    <div className="text-xs text-slate-700 bg-white/90 p-3 rounded-lg border border-slate-200 font-mono whitespace-pre-wrap leading-relaxed">
                      {currentTask.finalReport}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SPECIALIZED AGENTS DETAILED PROFILES */}
      {activeTab === 'agents' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {agents.map((agent) => (
              <div key={agent.id} className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-medium uppercase">
                      Specialized Agent
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{agent.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">{agent.role}</p>
                  </div>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                      agent.status === 'running'
                        ? 'bg-blue-100 text-blue-700'
                        : agent.status === 'error'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {agent.status}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{agent.description}</p>

                {/* Capabilities */}
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Authorized Capabilities
                  </span>
                  <div className="space-y-1">
                    {agent.capabilities.map((cap, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center text-xs">
                  <div className="p-2 rounded bg-slate-50">
                    <span className="text-[10px] text-slate-400 block">Processed</span>
                    <span className="font-bold text-slate-800">{agent.processedLeads}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50">
                    <span className="text-[10px] text-slate-400 block">Successes</span>
                    <span className="font-bold text-emerald-600">{agent.successCount}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-50">
                    <span className="text-[10px] text-slate-400 block">Failures</span>
                    <span className="font-bold text-rose-500">{agent.failureCount}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedAgentForModal(agent);
                    if (agent.id === 'lead_researcher') setDirectRunAction('discover');
                    else if (agent.id === 'lead_qualifier') setDirectRunAction('qualify');
                    else if (agent.id === 'sales_strategist') setDirectRunAction('craft_strategy');
                    else setDirectRunAction('find_duplicates');
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5" />
                  Trigger Direct Action
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: TASK HISTORY */}
      {activeTab === 'history' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Multi-Agent Task History</h3>
            <span className="text-xs text-slate-500">{taskHistory.length} missions recorded</span>
          </div>

          <div className="space-y-2.5">
            {taskHistory.map((task) => (
              <div
                key={task.id}
                onClick={() => {
                  setCurrentTask(task);
                  setActiveTab('orchestrator');
                }}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-slate-50 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        task.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : task.status === 'failed'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {task.status}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      {new Date(task.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{task.planSummary}</h4>
                  <p className="text-[11px] text-slate-500 italic mt-0.5">"{task.prompt}"</p>
                </div>

                <div className="flex items-center gap-4 text-xs shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-medium">Steps Passed</span>
                    <span className="font-bold text-slate-800">
                      {task.steps.filter((s) => s.status === 'completed').length} / {task.steps.length}
                    </span>
                  </div>
                  <button className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-semibold hover:bg-blue-100 transition-colors text-xs">
                    Inspect Mission →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PERSISTED AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Autonomous Execution Audit Trail</h3>
              <p className="text-xs text-slate-500">
                Tamper-evident logs persisted to disk covering all tool calls, scoring decisions, and approvals.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={auditFilterAgent}
                onChange={(e) => setAuditFilterAgent(e.target.value)}
                className="text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="all">All Agents</option>
                <option value="orchestrator">Orchestrator</option>
                <option value="lead_researcher">Lead Researcher</option>
                <option value="lead_qualifier">Lead Qualifier</option>
                <option value="sales_strategist">Sales Strategist</option>
                <option value="crm_manager">CRM Manager</option>
              </select>

              <select
                value={auditFilterLevel}
                onChange={(e) => setAuditFilterLevel(e.target.value)}
                className="text-xs p-1.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="all">All Levels</option>
                <option value="info">Info</option>
                <option value="warn">Warnings</option>
                <option value="error">Errors</option>
              </select>

              <button
                onClick={loadAuditLogs}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 text-xs cursor-pointer"
                title="Refresh"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto font-mono text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                        log.level === 'error'
                          ? 'bg-rose-100 text-rose-700'
                          : log.level === 'warn'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className="font-bold text-slate-800">{log.action}</span>
                    <span className="text-[10px] text-slate-400">by {log.agentId}</span>
                    {log.toolName && (
                      <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-600">
                        tool: {log.toolName}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 font-sans text-xs">{log.details}</p>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Direct Run Modal */}
      {selectedAgentForModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Direct Trigger: {selectedAgentForModal.name}</h3>
                <p className="text-xs text-slate-500">Run an autonomous tool call directly</p>
              </div>
              <button
                onClick={() => setSelectedAgentForModal(null)}
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Select Action</label>
                <select
                  value={directRunAction}
                  onChange={(e) => setDirectRunAction(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                >
                  {selectedAgentForModal.id === 'lead_researcher' && (
                    <>
                      <option value="discover">Discover New Leads (Industry / Location)</option>
                      <option value="research">Deep Company Intelligence Research</option>
                    </>
                  )}
                  {selectedAgentForModal.id === 'lead_qualifier' && (
                    <>
                      <option value="qualify">Qualify Single Account (7-Factor Scoring)</option>
                      <option value="batch_qualify">Batch Qualify All New Leads</option>
                    </>
                  )}
                  {selectedAgentForModal.id === 'sales_strategist' && (
                    <>
                      <option value="craft_strategy">Synthesize Consultative Pitch & Copy</option>
                    </>
                  )}
                  {selectedAgentForModal.id === 'crm_manager' && (
                    <>
                      <option value="find_duplicates">Scan for Duplicate Domains & Emails</option>
                      <option value="find_incomplete">Scan for Incomplete Records</option>
                      <option value="daily_summary">Generate Daily CRM Hygiene Score</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Target Parameter (Company, Lead ID, or Industry)
                </label>
                <input
                  type="text"
                  value={directRunParam}
                  onChange={(e) => setDirectRunParam(e.target.value)}
                  placeholder="e.g. Real Estate or lead-1"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-300"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedAgentForModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDirectRun}
                disabled={isDirectRunning}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                {isDirectRunning ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                Run Agent Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
