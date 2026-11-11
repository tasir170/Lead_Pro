import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Mail,
  MessageCircle,
  Linkedin,
  Copy,
  Check,
  Send,
  Building2,
  RefreshCw,
  Bot,
  User,
  ShieldCheck,
  RotateCcw,
  Zap,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Lead, OutreachChannel, ChatMessage, NavigationItemKey } from '../types';
import { api } from '../services/api';
import { ChatLeadCard } from '../components/chat/ChatLeadCard';
import { ChatMessageContent } from '../components/chat/ChatMessageContent';

interface AISalesAssistantProps {
  leads: Lead[];
  preselectedLead?: Lead | null;
  onGenerateOutreach: (
    lead: Partial<Lead>,
    channel: OutreachChannel,
    goal: string
  ) => Promise<{ subject?: string; message: string; callToAction: string }>;
  onUpdateLeadStatus?: (leadId: string, status: any) => Promise<void>;
  onSelectLead?: (lead: Lead) => void;
  onNavigateToOutreach?: (view: NavigationItemKey, lead: Lead) => void;
}

export const AISalesAssistant: React.FC<AISalesAssistantProps> = ({
  leads,
  preselectedLead,
  onGenerateOutreach,
  onSelectLead,
  onNavigateToOutreach,
}) => {
  const [activeMode, setActiveMode] = useState<'chatbot' | 'studio'>('chatbot');

  // Chatbot State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string>(() => `session-${Date.now()}`);
  const [crmStats, setCrmStats] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Studio State (for manual outreach template generator)
  const [selectedLeadId, setSelectedLeadId] = useState<string>(
    preselectedLead?.id || leads[0]?.id || ''
  );
  const [channel, setChannel] = useState<OutreachChannel>('email');
  const [goal, setGoal] = useState('Schedule 15-minute introductory demo');
  const [isLoading, setIsLoading] = useState(false);
  const [draft, setDraft] = useState<{ subject?: string; message: string; callToAction: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const currentLead = leads.find((l) => l.id === selectedLeadId) || leads[0];

  // Initialize Chatbot with Welcome Message
  useEffect(() => {
    // Fetch live stats
    api.getChatbotStats()
      .then((stats) => {
        setCrmStats(stats);
      })
      .catch(console.warn);

    // Initial greeting if messages is empty
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome-msg',
          role: 'assistant',
          timestamp: new Date().toISOString(),
          content: `### 👋 Welcome to your AI Sales Assistant Chatbot!

I am connected in real-time to your **LeadPulse CRM database**. You can ask me anything about your leads, request pipeline diagnostics, or direct me to draft sales messaging.

**Try asking me:**
- *"Show me all hot leads."*
- *"Which leads should I contact today?"*
- *"Find companies without email addresses."*
- *"Show me the top 10 leads in Dubai."*
- *"Find duplicate companies."*
- *"Summarize my latest lead discoveries."*`,
          suggestedQuestions: [
            'Show me all hot leads',
            'Which leads should I contact today?',
            'Find companies without email addresses',
            'Show me the top 10 leads in Dubai',
            'Find duplicate companies',
            'Summarize my latest lead discoveries',
          ],
        },
      ]);
    }
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle Send Message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await api.sendChatMessage({
        message: text,
        sessionId,
      });

      if (response.success && response.message) {
        setMessages((prev) => [...prev, response.message]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'assistant',
            content: `⚠️ Sorry, I encountered an issue processing your query: ${response.error || 'Unknown error'}. Please try again.`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ Communication error: ${err.message || 'Failed to reach AI service'}.`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Handle Confirm Action (for sensitive operations)
  const handleConfirmAction = async (msgId: string, pendingAction: any) => {
    setIsTyping(true);
    try {
      const response = await api.sendChatMessage({
        message: 'Action confirmed by user.',
        sessionId,
        confirmedAction: pendingAction,
      });

      if (response.success && response.message) {
        // Remove pending action flag from original message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === msgId && m.actionExecuted
              ? { ...m, actionExecuted: { ...m.actionExecuted, requiresConfirmation: false } }
              : m
          ).concat(response.message)
        );
      }
    } catch (err: any) {
      console.warn('Action confirmation failed:', err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        timestamp: new Date().toISOString(),
        content: `### 🔄 Conversation Reset

How can I help you manage your CRM pipeline today?`,
        suggestedQuestions: [
          'Show me all hot leads',
          'Which leads should I contact today?',
          'Find companies without email addresses',
          'Find duplicate companies',
        ],
      },
    ]);
    setSessionId(`session-${Date.now()}`);
  };

  // Studio handlers
  const handleGenerate = async () => {
    if (!currentLead) return;
    setIsLoading(true);
    setCopied(false);
    try {
      const result = await onGenerateOutreach(currentLead, channel, goal);
      setDraft(result);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!draft) return;
    const textToCopy =
      channel === 'email' && draft.subject
        ? `Subject: ${draft.subject}\n\n${draft.message}\n\n${draft.callToAction}`
        : `${draft.message}\n\n${draft.callToAction}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Conversational Intelligence · CRM Copilot</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            AI Sales Assistant
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              Live CRM Grounding
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Query your database, analyze accounts, identify priority deals, and craft personalized outreach in plain English.
          </p>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          <button
            onClick={() => setActiveMode('chatbot')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'chatbot'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            Conversational Chatbot
          </button>
          <button
            onClick={() => setActiveMode('studio')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              activeMode === 'studio'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Outreach Template Studio
          </button>
        </div>
      </div>

      {/* MODE 1: CONVERSATIONAL CHATBOT (Primary View) */}
      {activeMode === 'chatbot' && (
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Top Quick Status & Stats Ribbon */}
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Connected to CRM ({crmStats?.totalLeads ?? leads.length} accounts)
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">
                Hot Leads: <strong className="text-blue-700 font-mono">{crmStats?.hotLeads ?? 6}</strong>
              </span>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <span className="text-slate-500 hidden sm:inline">
                Uncontacted: <strong className="text-slate-700 font-mono">{crmStats?.uncontactedCount ?? 2}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleClearHistory}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                title="Reset conversation"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Chat</span>
              </button>
            </div>
          </div>

          {/* Chat Message Thread */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {messages.map((msg) => {
              const isAssistant = msg.role === 'assistant';

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${
                    isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs ${
                      isAssistant
                        ? 'bg-gradient-to-tr from-blue-600 to-indigo-600'
                        : 'bg-slate-800'
                    }`}
                  >
                    {isAssistant ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>

                  {/* Bubble & Payload */}
                  <div className={`space-y-3 ${isAssistant ? 'text-left' : 'text-right'}`}>
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                        isAssistant
                          ? 'bg-slate-50/90 border border-slate-200/80 text-slate-800 rounded-tl-sm shadow-xs'
                          : 'bg-blue-600 text-white rounded-tr-sm shadow-sm'
                      }`}
                    >
                      {isAssistant ? (
                        <ChatMessageContent content={msg.content} />
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>

                    {/* Sensitive Action Confirmation Box */}
                    {msg.actionExecuted?.requiresConfirmation && msg.actionExecuted.pendingAction && (
                      <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2 max-w-md">
                        <div className="flex items-center gap-2 font-bold text-amber-800">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>Requires User Authorization</span>
                        </div>
                        <p className="text-amber-800">
                          Please verify before committing this database modification.
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => handleConfirmAction(msg.id, msg.actionExecuted!.pendingAction)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Confirm & Commit
                          </button>
                          <button
                            onClick={() => {
                              setMessages((prev) =>
                                prev.map((m) =>
                                  m.id === msg.id && m.actionExecuted
                                    ? { ...m, actionExecuted: { ...m.actionExecuted, requiresConfirmation: false } }
                                    : m
                                )
                              );
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Embedded Interactive Lead Cards */}
                    {msg.referencedLeads && msg.referencedLeads.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                          CRM Accounts Mentioned ({msg.referencedLeads.length})
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {msg.referencedLeads.map((refLead) => (
                            <ChatLeadCard
                              key={refLead.id}
                              lead={refLead}
                              onOpenDetail={onSelectLead}
                              onOutreach={(channelType, targetLead) => {
                                if (channelType === 'whatsapp' && onNavigateToOutreach) {
                                  onNavigateToOutreach('whatsapp-outreach', targetLead);
                                } else if (channelType === 'email') {
                                  setSelectedLeadId(targetLead.id);
                                  setChannel('email');
                                  setActiveMode('studio');
                                }
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggested Questions Pills */}
                    {isAssistant && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestedQuestions.map((q, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(q)}
                            className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-full border border-slate-200 text-[11px] font-medium transition-all shadow-2xs cursor-pointer flex items-center gap-1"
                          >
                            <span>{q}</span>
                            <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                          </button>
                        ))}
                      </div>
                    )}

                    <span className="text-[10px] text-slate-400 block px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-3 max-w-xl mr-auto">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-slate-500 font-medium ml-2">Consulting CRM database...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input & Suggested Prompt Bar */}
          <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 shrink-0 space-y-2.5">
            {/* Quick Prompts Carousel */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
              <span className="text-slate-400 shrink-0 font-medium">Quick Prompts:</span>
              <button
                onClick={() => handleSendMessage('Show me all hot leads.')}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-md border border-slate-200 shrink-0 transition-colors cursor-pointer"
              >
                🔥 Hot Leads
              </button>
              <button
                onClick={() => handleSendMessage('Which leads should I contact today?')}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-md border border-slate-200 shrink-0 transition-colors cursor-pointer"
              >
                📅 Contact Today
              </button>
              <button
                onClick={() => handleSendMessage('Find companies without email addresses.')}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-md border border-slate-200 shrink-0 transition-colors cursor-pointer"
              >
                ⚠️ Missing Emails
              </button>
              <button
                onClick={() => handleSendMessage('Show me the top 10 leads in Dubai.')}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-md border border-slate-200 shrink-0 transition-colors cursor-pointer"
              >
                🏙️ Dubai Leads
              </button>
              <button
                onClick={() => handleSendMessage('Find duplicate companies.')}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-md border border-slate-200 shrink-0 transition-colors cursor-pointer"
              >
                🔍 Duplicate Scan
              </button>
              <button
                onClick={() => handleSendMessage('Summarize my latest lead discoveries.')}
                className="px-2.5 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-md border border-slate-200 shrink-0 transition-colors cursor-pointer"
              >
                🚀 Discovery Summary
              </button>
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about your leads, query stats, or request personalized sales copy..."
                className="flex-1 text-xs sm:text-sm px-4 py-3 bg-white rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={isTyping || !inputValue.trim()}
                className={`p-3 rounded-xl font-semibold transition-all shrink-0 cursor-pointer ${
                  isTyping || !inputValue.trim()
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20 active:scale-95'
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODE 2: OUTREACH TEMPLATE STUDIO (Manual Copy Generator) */}
      {activeMode === 'studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-y-auto">
          {/* Left Config Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">1. Target Prospect</CardTitle>
                <CardDescription>Select an account from your active pipeline</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <select
                  value={selectedLeadId}
                  onChange={(e) => {
                    setSelectedLeadId(e.target.value);
                    setDraft(null);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800"
                >
                  {leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.companyName || l.company} — {l.contactPerson || l.name} ({l.leadScore}/100)
                    </option>
                  ))}
                </select>

                {currentLead && (
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-1.5">
                    <div className="font-semibold text-slate-800">{currentLead.contactPerson || currentLead.name}</div>
                    <div className="text-slate-500">{currentLead.title || 'Executive'}</div>
                    <div className="flex items-center gap-1.5 text-slate-600 pt-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium">{currentLead.companyName || currentLead.company}</span>
                      <span>·</span>
                      <span className="font-mono">{currentLead.domain || currentLead.website}</span>
                    </div>
                    <div className="text-blue-700 font-semibold font-mono pt-1">
                      AI Fit Score: {currentLead.leadScore}/100 ({currentLead.leadCategory || 'Qualified'})
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">2. Outreach Channel & Goal</CardTitle>
                <CardDescription>Configure message format and objective</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Channel Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-2">Channel</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setChannel('email')}
                      className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        channel === 'email'
                          ? 'bg-blue-50 border-blue-600 text-blue-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Mail className="w-4 h-4" />
                      <span>Email</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setChannel('whatsapp')}
                      className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        channel === 'whatsapp'
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setChannel('linkedin')}
                      className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                        channel === 'linkedin'
                          ? 'bg-sky-50 border-sky-600 text-sky-700 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Linkedin className="w-4 h-4" />
                      <span>LinkedIn</span>
                    </button>
                  </div>
                </div>

                {/* Goal Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Primary Goal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
                  >
                    <option value="Schedule 15-minute introductory demo">Schedule 15-min demo</option>
                    <option value="Share 3.8x SDR efficiency case study">Share relevant case study</option>
                    <option value="Direct executive alignment question">Direct executive question</option>
                    <option value="Check if they handle sales research in-house">Probe current SDR research toolchain</option>
                  </select>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={handleGenerate}
                  isLoading={isLoading}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                  className="w-full"
                >
                  Generate Personalized Draft
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Output Draft Panel (2 cols) */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col justify-between">
              <CardHeader
                action={
                  draft && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={handleGenerate}
                        isLoading={isLoading}
                        leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                      >
                        Regenerate
                      </Button>
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={handleCopy}
                        leftIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      >
                        {copied ? 'Copied!' : 'Copy Copy'}
                      </Button>
                    </div>
                  )
                }
              >
                <CardTitle className="text-base flex items-center gap-2">
                  <span>Tailored Outreach Copy</span>
                  <span className="text-xs font-normal text-slate-400 capitalize">· {channel}</span>
                </CardTitle>
                <CardDescription>
                  Crafted using Gemini 3.8 Flash with zero fluff and high-conversion executive psychology.
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                {draft ? (
                  <div className="space-y-4">
                    {channel === 'email' && draft.subject && (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                          Subject Line
                        </div>
                        <div className="text-sm font-semibold text-slate-900 mt-0.5">
                          {draft.subject}
                        </div>
                      </div>
                    )}

                    <div className="p-4 bg-white rounded-lg border border-slate-200 space-y-3 font-sans text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {draft.message}
                    </div>

                    {draft.callToAction && (
                      <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-lg">
                        <div className="text-[10px] uppercase font-semibold text-blue-600 tracking-wider">
                          Low-Friction Call to Action
                        </div>
                        <div className="text-xs font-medium text-blue-950 mt-0.5">
                          {draft.callToAction}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400">
                      <Send className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700">No draft generated yet</h4>
                      <p className="text-xs text-slate-500 max-w-sm mt-0.5">
                        Select your target prospect and click "Generate Personalized Draft" to produce tailored copy instantly.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>

              {draft && (
                <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 rounded-b-xl flex items-center justify-between text-xs text-slate-500">
                  <span>Channel: <strong className="text-slate-800 capitalize">{channel}</strong></span>
                  <span>Target: <strong className="text-slate-800">{currentLead?.contactPerson || currentLead?.name}</strong> ({currentLead?.companyName || currentLead?.company})</span>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
