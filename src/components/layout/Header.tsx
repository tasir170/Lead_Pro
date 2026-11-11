import React from 'react';
import { Menu, Plus, RotateCcw, Search, ShieldCheck } from 'lucide-react';
import { Button } from '../common/Button';
import { NavigationItemKey } from '../../types';

interface HeaderProps {
  currentView: NavigationItemKey;
  onOpenMobileSidebar: () => void;
  onAddLeadClick: () => void;
  onResetDemoData: () => void;
  isResetting?: boolean;
}

const VIEW_TITLES: Record<NavigationItemKey, { section: string; title: string }> = {
  overview: { section: 'Pipeline', title: 'Overview Dashboard' },
  'find-leads': { section: 'Prospecting', title: 'Find Leads & ICP Discovery' },
  'all-leads': { section: 'Database', title: 'All Leads Directory' },
  'ai-agents': { section: 'Autonomous', title: 'AI Agent Management & Orchestrator' },
  'ai-research': { section: 'Intelligence', title: 'AI Research Agent' },
  'ai-assistant': { section: 'Outreach', title: 'AI Sales Assistant' },
  'whatsapp-outreach': { section: 'Channels', title: 'WhatsApp Outreach Pipeline' },
  'follow-ups': { section: 'Engagement', title: 'Cadence & Follow-ups' },
  analytics: { section: 'Performance', title: 'Sales Analytics & Conversions' },
  settings: { section: 'Platform', title: 'Workspace Settings' },
};

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onOpenMobileSidebar,
  onAddLeadClick,
  onResetDemoData,
  isResetting = false,
}) => {
  const current = VIEW_TITLES[currentView] || { section: 'Pipeline', title: 'Overview Dashboard' };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left: Mobile Toggle & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center gap-1.5 text-xs text-slate-500">
            <li className="font-medium text-slate-400 hover:text-slate-600 transition-colors hidden sm:inline">
              {current.section}
            </li>
            <li aria-hidden="true" className="text-slate-300 hidden sm:inline">
              /
            </li>
            <li className="font-semibold text-slate-900 truncate">{current.title}</li>
          </ol>
        </nav>
      </div>

      {/* Right: Demo indicator, Reset demo, Add Lead CTA & Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Demo Data Tag */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200/80 rounded-md text-[11px] text-amber-800">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Demo Environment</span>
        </div>

        {/* Reset Demo Data button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onResetDemoData}
          isLoading={isResetting}
          leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          className="hidden md:inline-flex text-xs"
          title="Restore original 10 demo leads"
        >
          Reset Demo
        </Button>

        {/* Add Lead Primary CTA */}
        <Button
          variant="primary"
          size="sm"
          onClick={onAddLeadClick}
          leftIcon={<Plus className="w-4 h-4" />}
          className="text-xs"
        >
          Add Lead
        </Button>

        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-medium text-xs flex items-center justify-center border border-slate-700 shadow-xs shrink-0 select-none cursor-default" title="Logged in as Sales Admin">
          SA
        </div>
      </div>
    </header>
  );
};
