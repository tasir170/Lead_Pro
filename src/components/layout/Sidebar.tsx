import React from 'react';
import {
  LayoutDashboard,
  Search,
  Users,
  Sparkles,
  BotMessageSquare,
  MessageCircle,
  CalendarClock,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  Bot,
} from 'lucide-react';
import { NavigationItemKey } from '../../types';

interface SidebarProps {
  currentView: NavigationItemKey;
  onNavigate: (view: NavigationItemKey) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  leadCounts?: {
    total: number;
    new: number;
    qualified: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
  leadCounts,
}) => {
  const navItems: { key: NavigationItemKey; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    {
      key: 'overview',
      label: 'Overview Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      key: 'find-leads',
      label: 'Find Leads',
      icon: <Search className="w-4 h-4 shrink-0" />,
      badge: 'Prospect',
    },
    {
      key: 'all-leads',
      label: 'All Leads',
      icon: <Users className="w-4 h-4 shrink-0" />,
      badge: leadCounts?.total ?? 10,
    },
    {
      key: 'ai-agents',
      label: 'AI Agent Orchestrator',
      icon: <Bot className="w-4 h-4 shrink-0 text-violet-400" />,
      badge: 'Auto',
    },
    {
      key: 'ai-research',
      label: 'AI Research Agent',
      icon: <Sparkles className="w-4 h-4 shrink-0 text-blue-400" />,
    },
    {
      key: 'ai-assistant',
      label: 'AI Sales Assistant',
      icon: <BotMessageSquare className="w-4 h-4 shrink-0 text-indigo-400" />,
      badge: 'Chat',
    },
    {
      key: 'whatsapp-outreach',
      label: 'WhatsApp Outreach',
      icon: <MessageCircle className="w-4 h-4 shrink-0 text-emerald-400" />,
      badge: 'Active',
    },
    {
      key: 'follow-ups',
      label: 'Follow-ups',
      icon: <CalendarClock className="w-4 h-4 shrink-0" />,
      badge: '4 due',
    },
    {
      key: 'analytics',
      label: 'Analytics',
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <Settings className="w-4 h-4 shrink-0" />,
    },
  ];

  const handleItemClick = (key: NavigationItemKey) => {
    onNavigate(key);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-950/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 bg-[#0A0F1D] text-slate-300 flex flex-col border-r border-slate-800/80 transition-all duration-200 ease-in-out lg:static
          ${isCollapsed ? 'w-20' : 'w-64'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <span className="text-base font-bold tracking-tight text-white whitespace-nowrap block">
                  LeadPulse<span className="text-blue-400">AI</span>
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-medium">
                  Sales Intelligence
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Main Menu
            </div>
          )}
          {navItems.map((item) => {
            const isActive = currentView === item.key;
            return (
              <button
                key={item.key}
                onClick={() => handleItemClick(item.key)}
                title={isCollapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative cursor-pointer
                  ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                  }
                  ${isCollapsed ? 'justify-center' : 'justify-between'}
                `}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>
                    {item.icon}
                  </span>
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </div>
                {!isCollapsed && item.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium shrink-0
                      ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                      }
                    `}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* AI Engine Status & Workspace */}
        <div className="p-3 border-t border-slate-800/80 shrink-0 bg-[#070b16]">
          {!isCollapsed ? (
            <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-300 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  Gemini 2.5 Flash
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Ready</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Sales intelligence & qualification ready on server.
              </p>
            </div>
          ) : (
            <div className="flex justify-center p-1" title="Gemini 2.5 Flash Connected">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
