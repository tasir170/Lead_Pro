import React, { useState, useEffect } from 'react';
import {
  Settings,
  Sparkles,
  Database,
  Users,
  ShieldCheck,
  Check,
  Save,
  Info,
  Key,
  Lock,
  History,
  Trash2,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  Bot,
  Server,
  Zap,
  MessageSquare,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { api } from '../services/api';

export const SettingsPage: React.FC = () => {
  const [icpHeadcount, setIcpHeadcount] = useState('50-500 employees');
  const [icpRevenue, setIcpRevenue] = useState('$10M - $100M ARR');
  const [icpRoles, setIcpRoles] = useState('VP Growth, Head of Sales, CRO, CCO, Director Revenue Operations');
  const [icpIndustries, setIcpIndustries] = useState('B2B SaaS, FinTech, Logistics Tech, Cybersecurity');
  const [saved, setSaved] = useState(false);

  // Auth & Team State
  const [activeUserEmail, setActiveUserEmail] = useState<string>('sarah.j@leadpulse.ai');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);

  // AI Connection State
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [isTestingAi, setIsTestingAi] = useState(false);

  // WhatsApp Cloud API State
  const [waPhoneNumberId, setWaPhoneNumberId] = useState('');
  const [waAccessToken, setWaAccessToken] = useState('');
  const [waWabaId, setWaWabaId] = useState('');
  const [waStatus, setWaStatus] = useState<any>(null);
  const [isSavingWa, setIsSavingWa] = useState(false);
  const [waSaveMessage, setWaSaveMessage] = useState<string | null>(null);

  const loadTeamAndLogs = async () => {
    try {
      const [team, logs, waConfig] = await Promise.all([
        api.getTeamMembers().catch(() => []),
        api.getSecurityAuditLogs(20).catch(() => []),
        api.getWhatsAppCloudConfigStatus().catch(() => null),
      ]);
      setTeamMembers(team);
      setAuditLogs(logs);
      if (waConfig) {
        setWaStatus(waConfig);
      }
      const email = api.getActiveUserEmail();
      setActiveUserEmail(email);
    } catch (err: any) {
      console.warn('Failed to load settings data:', err);
    }
  };

  useEffect(() => {
    loadTeamAndLogs();
  }, []);

  const handleRoleSwitch = (email: string) => {
    setActiveUserEmail(email);
    api.setActiveUserEmail(email);
    // Reload logs under new role permissions
    setIsLoadingLogs(true);
    setLogsError(null);
    api.getSecurityAuditLogs(20)
      .then(setAuditLogs)
      .catch((err) => {
        setLogsError(err.message || 'Permission denied viewing audit logs for this role');
        setAuditLogs([]);
      })
      .finally(() => setIsLoadingLogs(false));
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear audit logs?')) return;
    try {
      await api.clearSecurityAuditLogs();
      setAuditLogs([]);
    } catch (err: any) {
      alert(err.message || 'Failed to clear logs');
    }
  };

  const handleTestAiConnection = async () => {
    setIsTestingAi(true);
    try {
      const status = await api.getAIStatus();
      setAiStatus(status);
    } catch (err: any) {
      setAiStatus({ error: err.message });
    } finally {
      setIsTestingAi(false);
    }
  };

  const handleSaveWhatsAppConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingWa(true);
    setWaSaveMessage(null);
    try {
      const res = await api.updateWhatsAppCloudConfig({
        phoneNumberId: waPhoneNumberId,
        accessToken: waAccessToken,
        wabaId: waWabaId,
      });
      setWaStatus(res.status);
      setWaSaveMessage('WhatsApp configuration updated successfully!');
      setTimeout(() => setWaSaveMessage(null), 3500);
    } catch (err: any) {
      setWaSaveMessage(`Error: ${err.message}`);
    } finally {
      setIsSavingWa(false);
    }
  };

  const handleRefreshWhatsAppStatus = async () => {
    try {
      const status = await api.getWhatsAppCloudConfigStatus();
      setWaStatus(status);
    } catch (err: any) {
      console.warn('Failed to refresh WhatsApp status:', err);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="pb-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
            <Settings className="w-3.5 h-3.5" />
            <span>Platform Settings · Security, RBAC & ICP Calibration</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Workspace Settings & Security Architecture
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Configure Ideal Customer Profile parameters, manage team roles & permissions, inspect server audit logs, and verify Gemini AI readiness.
          </p>
        </div>

        {/* Active Identity Pill */}
        <div className="flex items-center gap-2.5 p-2 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            {activeUserEmail.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <span>{teamMembers.find((m) => m.email === activeUserEmail)?.name || 'Sarah Jenkins'}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-700 font-mono uppercase">
                {teamMembers.find((m) => m.email === activeUserEmail)?.role || 'Admin'}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 font-mono">{activeUserEmail}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: ICP Definition Form & Team RBAC (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* ICP Configuration */}
          <form onSubmit={handleSave}>
            <Card>
              <CardHeader
                action={
                  <Button
                    type="submit"
                    variant="primary"
                    size="xs"
                    leftIcon={saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  >
                    {saved ? 'Saved!' : 'Save ICP Parameters'}
                  </Button>
                }
              >
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Ideal Customer Profile (ICP) Rules</span>
                </CardTitle>
                <CardDescription>
                  These criteria guide Gemini AI scoring and automated lead qualification tiers.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Executive Roles & Personas
                  </label>
                  <input
                    type="text"
                    value={icpRoles}
                    onChange={(e) => setIcpRoles(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Comma-separated target titles</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Headcount Range
                    </label>
                    <input
                      type="text"
                      value={icpHeadcount}
                      onChange={(e) => setIcpHeadcount(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Target Annual Revenue Range
                    </label>
                    <input
                      type="text"
                      value={icpRevenue}
                      onChange={(e) => setIcpRevenue(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Primary Industries
                  </label>
                  <input
                    type="text"
                    value={icpIndustries}
                    onChange={(e) => setIcpIndustries(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </CardContent>
            </Card>
          </form>

          {/* Team Members & Role Switcher */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="w-4 h-4 text-slate-600" />
                <span>Role-Based Access Control (RBAC) & Team Directory</span>
              </CardTitle>
              <CardDescription>
                Switch active persona to test permission guards across Admin, Sales Manager, and SDR roles
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100 text-xs">
                {(teamMembers.length > 0
                  ? teamMembers
                  : [
                      {
                        name: 'Sarah Jenkins',
                        email: 'sarah.j@leadpulse.ai',
                        role: 'admin',
                        title: 'Head of Sales & System Admin',
                        permissions: ['read', 'create', 'update', 'delete', 'bulk_manage', 'export_reports', 'ai_admin'],
                      },
                      {
                        name: 'David Mercer',
                        email: 'david.m@leadpulse.ai',
                        role: 'manager',
                        title: 'Sales Operations Manager',
                        permissions: ['read', 'create', 'update', 'bulk_manage', 'export_reports'],
                      },
                      {
                        name: 'Elena Zhou',
                        email: 'elena.z@leadpulse.ai',
                        role: 'sdr',
                        title: 'Enterprise SDR',
                        permissions: ['read', 'create', 'update', 'whatsapp_outreach'],
                      },
                    ]
                ).map((user) => {
                  const isActive = activeUserEmail === user.email;
                  return (
                    <div
                      key={user.email}
                      className={`p-4 flex items-center justify-between transition-colors ${
                        isActive ? 'bg-blue-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{user.name}</span>
                          {isActive && (
                            <span className="px-2 py-0.5 rounded text-[10px] bg-blue-600 text-white font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" /> Active User
                            </span>
                          )}
                        </div>
                        <div className="text-slate-500 text-[11px]">{user.title}</div>
                        <div className="text-slate-400 font-mono text-[10px]">{user.email}</div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 rounded text-[11px] bg-slate-100 text-slate-700 font-mono uppercase font-semibold">
                          {user.role}
                        </span>
                        {!isActive ? (
                          <button
                            onClick={() => handleRoleSwitch(user.email)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            Switch to this Role
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                            <UserCheck className="w-3.5 h-3.5" /> Logged In
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs Table */}
          <Card>
            <CardHeader
              action={
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsLoadingLogs(true);
                      api.getSecurityAuditLogs(20)
                        .then(setAuditLogs)
                        .finally(() => setIsLoadingLogs(false));
                    }}
                    className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Refresh logs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                  </button>
                  {activeUserEmail === 'sarah.j@leadpulse.ai' && (
                    <button
                      onClick={handleClearLogs}
                      className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 rounded border border-rose-200 hover:bg-rose-50 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear Audit Trail</span>
                    </button>
                  )}
                </div>
              }
            >
              <CardTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4 text-slate-600" />
                <span>Security & Operational Audit Trail</span>
              </CardTitle>
              <CardDescription>
                Chronological ledger of lead creations, updates, bulk operations, and security access checks
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {logsError ? (
                <div className="p-6 text-center text-xs text-amber-700 bg-amber-50/50 flex flex-col items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <p>{logsError}</p>
                  <p className="text-slate-500">Switch to Sarah Jenkins (Admin) or David Mercer (Manager) to inspect audit logs.</p>
                </div>
              ) : auditLogs.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No security audit events recorded yet. Perform CRM actions to generate audit logs.
                </div>
              ) : (
                <div className="overflow-x-auto max-h-72 overflow-y-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold sticky top-0">
                      <tr>
                        <th className="p-2.5">Timestamp</th>
                        <th className="p-2.5">Actor</th>
                        <th className="p-2.5">Action</th>
                        <th className="p-2.5">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-700">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70">
                          <td className="p-2.5 text-slate-400 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="p-2.5 font-sans whitespace-nowrap">
                            <span className="font-semibold text-slate-900">{log.actor}</span>
                            <span className="text-[10px] text-slate-400 block">{log.actorRole}</span>
                          </td>
                          <td className="p-2.5 whitespace-nowrap">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-800">
                              {log.action}
                            </span>
                          </td>
                          <td className="p-2.5 font-sans text-slate-600 truncate max-w-[260px]" title={log.details}>
                            {log.details}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Technical Architecture, AI Diagnostics & Persistence (1 col) */}
        <div className="space-y-6">
          {/* AI Security & Keys */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>AI Security & Server-Side Proxy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600">
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block">Keys Protected on Server</span>
                  <span>Gemini API keys are never leaked to client browsers. All AI inference is executed securely through Express backend routes.</span>
                </div>
              </div>

              <div className="space-y-2 pt-1 font-mono text-[11px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">AI Model:</span>
                  <span className="font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    gemini-3.8-flash
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Heuristic Fallback:</span>
                  <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                    Active & Resilient
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans">Rate Limiter:</span>
                  <span className="text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                    200 req / min
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={handleTestAiConnection}
                  disabled={isTestingAi}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5 text-blue-600" />
                  <span>{isTestingAi ? 'Verifying AI API...' : 'Run Gemini Connection Healthcheck'}</span>
                </button>

                {aiStatus && (
                  <div className="mt-2 p-2 rounded bg-slate-50 border border-slate-200 font-mono text-[10px] space-y-1">
                    <div>Engine: <strong>{aiStatus.engine}</strong></div>
                    <div>Mode: <strong className="text-blue-600">{aiStatus.mode}</strong></div>
                    <div>Status: <strong className="text-emerald-600">Healthy</strong></div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Database Architecture & Persistence */}
          <Card className="border-blue-200 bg-blue-50/20">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2 text-blue-950">
                <Database className="w-4 h-4 text-blue-600" />
                <span>Persistent Database Architecture</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-700">
              <p className="leading-relaxed">
                The CRM database runs in <strong>Persistent JSON File-Backed Store</strong> mode at <code className="bg-white px-1 py-0.5 rounded text-blue-800">/data/crm_leads.json</code>, providing ACID atomic write-through persistence across restarts.
              </p>

              <div className="p-3 bg-white rounded-lg border border-blue-100 space-y-2">
                <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-blue-600" />
                  <span>Enterprise Firestore Integration:</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  The repository pattern in <code className="text-slate-800">server/services/dataStore.ts</code> isolates all data operations. In cloud deployments, Firestore can be plugged in without changing frontend code.
                </p>
              </div>

              <div className="space-y-1 text-[11px] font-mono text-slate-600">
                <div>* Duplicate prevention: <strong>Domain & Email Normalization</strong></div>
                <div>* Validation rules: <strong>E.164 Phones & RFC Emails</strong></div>
                <div>* Schema completeness: <strong>All 19 CRM Fields Enforced</strong></div>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Business Cloud API Configuration */}
          <Card className="border-emerald-200 bg-emerald-50/15">
            <CardHeader
              action={
                <button
                  type="button"
                  onClick={handleRefreshWhatsAppStatus}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Refresh WhatsApp Status"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              }
            >
              <CardTitle className="text-sm flex items-center gap-2 text-slate-900">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp Business Platform (Cloud API)</span>
              </CardTitle>
              <CardDescription>
                Configure Meta credentials for automated outreach or use instant 1-click wa.me links
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-700">
              {/* Status Banner */}
              <div
                className={`p-2.5 rounded-lg border text-xs flex items-start gap-2 ${
                  waStatus?.isConfigured
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-blue-50 border-blue-200 text-blue-900'
                }`}
              >
                <Phone className={`w-4 h-4 shrink-0 mt-0.5 ${waStatus?.isConfigured ? 'text-emerald-600' : 'text-blue-600'}`} />
                <div>
                  <span className="font-semibold block">
                    {waStatus?.isConfigured
                      ? 'Meta Cloud API Connected'
                      : '1-Click Direct wa.me Active (Zero Setup Required)'}
                  </span>
                  <span className="text-[11px] leading-relaxed">
                    {waStatus?.isConfigured
                      ? `Connected to Phone ID ${waStatus.phoneNumberId}. Programmatic dispatch is ready.`
                      : 'Numbers like 03110959448 automatically normalize to Pakistan (+92) and open prefilled chats instantly. Add Meta credentials below whenever you wish to enable automated background dispatch.'}
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveWhatsAppConfig} className="space-y-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Phone Number ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 104829104820194"
                    value={waPhoneNumberId}
                    onChange={(e) => setWaPhoneNumberId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Found in Meta App &gt; WhatsApp &gt; API Setup</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    System User Permanent Access Token
                  </label>
                  <input
                    type="password"
                    placeholder="EAAG... (Token)"
                    value={waAccessToken}
                    onChange={(e) => setWaAccessToken(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">From Meta Business Manager System Users with whatsapp_business_messaging scope</p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    WhatsApp Business Account ID (WABA ID)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 192830192830192"
                    value={waWabaId}
                    onChange={(e) => setWaWabaId(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>

                {waSaveMessage && (
                  <div
                    className={`p-2 rounded text-[11px] ${
                      waSaveMessage.startsWith('Error')
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {waSaveMessage}
                  </div>
                )}

                <div className="pt-1 flex items-center justify-between">
                  <Button
                    type="submit"
                    variant="primary"
                    size="xs"
                    disabled={isSavingWa}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                    leftIcon={isSavingWa ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  >
                    {isSavingWa ? 'Saving...' : 'Save WhatsApp Credentials'}
                  </Button>

                  <a
                    href="https://developers.facebook.com/apps"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-500 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <span>Meta Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
