import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Zap,
  Bot,
  MessageCircle,
  Database,
  Search,
  Activity,
  Layers,
  CheckCircle2,
  RefreshCw,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface MotionFlowGraphicProps {
  totalLeads?: number;
  qualifiedCount?: number;
  convertedCount?: number;
  avgScore?: number;
  onExploreLeads?: () => void;
  onLaunchAgents?: () => void;
}

export const MotionFlowGraphic: React.FC<MotionFlowGraphicProps> = ({
  totalLeads = 24,
  qualifiedCount = 16,
  convertedCount = 4,
  avgScore = 84,
  onExploreLeads,
  onLaunchAgents,
}) => {
  const [activeTab, setActiveTab] = useState<'stream' | 'radar'>('stream');
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [pulseCount, setPulseCount] = useState(0);

  // Periodic heartbeat animation trigger
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCount((prev) => (prev + 1) % 1000);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const pipelineStages = [
    {
      id: 1,
      title: 'Discovery & Enrichment',
      subtitle: 'Multi-Source Crawler',
      icon: <Search className="w-4 h-4 text-blue-400" />,
      color: 'blue',
      metrics: `${totalLeads} Accounts Discovered`,
      badge: 'Active Scrapers',
      details: 'Discovers verified corporate websites, corporate registries, decision-maker names, and E.164 phone numbers with zero broken data.',
    },
    {
      id: 2,
      title: 'Gemini 7-Factor Engine',
      subtitle: 'Predictive Qualification',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      color: 'amber',
      metrics: `${avgScore}/100 Mean ICP Fit`,
      badge: 'Gemini 2.5 Flash',
      details: 'Analyzes industry relevance (0-20), company size (0-15), website (0-10), contact quality (0-15), growth signals (0-15), target market (0-15), and intent (0-10).',
    },
    {
      id: 3,
      title: 'Autonomous Outreach',
      subtitle: 'WhatsApp & CRM Sync',
      icon: <MessageCircle className="w-4 h-4 text-emerald-400" />,
      color: 'emerald',
      metrics: `${qualifiedCount} Leads Primed`,
      badge: '1-Click Direct wa.me',
      details: 'Instant prefilled WhatsApp conversations (+92 and international), personalized sales pitch generators, and ACID-persisted CRM timeline logs.',
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#070b16] via-[#0c1427] to-[#0f1d3a] border border-slate-800 text-white shadow-xl">
      {/* Dynamic Animated Ambient Glow Spots */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.12, 0.28, 0.12],
          x: [0, 20, 0],
          y: [0, -15, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-blue-600/30 blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.22, 0.1],
          x: [0, -25, 0],
          y: [0, 20, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-24 -right-24 w-88 h-88 rounded-full bg-indigo-600/25 blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [0.9, 1.15, 0.9],
          opacity: [0.08, 0.18, 0.08],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none"
      />

      {/* Header Bar with Mode Switcher & Telemetry Ticker */}
      <div className="relative z-10 px-5 py-4 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/40 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Activity className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-tight text-white uppercase tracking-wider">
                Autonomous Revenue Motion Engine
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Telemetry
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Visual real-time simulation of incoming discovery streams through AI qualification into multi-channel dispatch
            </p>
          </div>
        </div>

        {/* View Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-lg border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('stream')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'stream'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pipeline Stream</span>
          </button>
          <button
            onClick={() => setActiveTab('radar')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'radar'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>ICP Radar</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Motion Graphics Canvas */}
      <div className="relative z-10 p-5 sm:p-7">
        <AnimatePresence mode="wait">
          {activeTab === 'stream' ? (
            <motion.div
              key="stream-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Graphic Flow Conduit (SVG + Motion Particles) */}
              <div className="relative py-2">
                {/* SVG Conduit Paths */}
                <svg className="w-full h-24 hidden md:block" viewBox="0 0 900 100" fill="none">
                  <defs>
                    <linearGradient id="pipeGradient1" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                      <stop offset="50%" stopColor="#6366f1" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.6" />
                    </linearGradient>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Base Track */}
                  <path
                    d="M 150 50 C 275 50, 325 50, 450 50 C 575 50, 625 50, 750 50"
                    stroke="#1e293b"
                    strokeWidth="4"
                    strokeDasharray="6 6"
                  />

                  {/* Animated Glowing Energy Path */}
                  <path
                    d="M 150 50 C 275 50, 325 50, 450 50 C 575 50, 625 50, 750 50"
                    stroke="url(#pipeGradient1)"
                    strokeWidth="3"
                    filter="url(#glow)"
                  />

                  {/* Flow Particles Moving Left to Right */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.circle
                      key={`particle-${i}`}
                      r="4"
                      fill="#60a5fa"
                      filter="url(#glow)"
                      initial={{ cx: 150, cy: 50 }}
                      animate={{
                        cx: [150, 450, 750],
                        opacity: [0, 1, 0],
                        fill: ['#60a5fa', '#fbbf24', '#34d399'],
                      }}
                      transition={{
                        duration: 3.5,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: i * 0.7,
                      }}
                    />
                  ))}
                </svg>

                {/* 3 Interactive Pipeline Node Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {pipelineStages.map((stage) => {
                    const isSelected = selectedNode === stage.id;
                    return (
                      <motion.div
                        key={stage.id}
                        whileHover={{ y: -4, transition: { duration: 0.16 } }}
                        onClick={() => setSelectedNode(isSelected ? null : stage.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden backdrop-blur-md ${
                          isSelected
                            ? 'bg-slate-800/90 border-blue-400 ring-2 ring-blue-500/30 shadow-lg'
                            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {/* Status bar top */}
                        <div className="flex items-center justify-between mb-2.5">
                          <span className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/50">
                            Stage 0{stage.id}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-400">
                            {stage.badge}
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                            {stage.icon}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white tracking-tight">
                              {stage.title}
                            </h4>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {stage.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3.5 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                          <span className="font-mono text-slate-300 font-semibold tabular-nums">
                            {stage.metrics}
                          </span>
                          <span className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                            {isSelected ? 'Collapse' : 'Inspect'} <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>

                        {/* Expandable Info Drawer */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-300 leading-relaxed overflow-hidden"
                            >
                              <p>{stage.details}</p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Velocity Bar & Quick Navigation */}
              <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-4 text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Inference Velocity: <strong className="font-mono text-white">120 ms/lead</strong></span>
                  </div>
                  <div className="hidden sm:inline-block text-slate-600">·</div>
                  <div>
                    <span>Conversion Rate: <strong className="font-mono text-emerald-400">{Math.round((convertedCount / Math.max(totalLeads, 1)) * 100)}%</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onExploreLeads && (
                    <button
                      onClick={onExploreLeads}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Database className="w-3.5 h-3.5" />
                      <span>View Live CRM</span>
                    </button>
                  )}
                  {onLaunchAgents && (
                    <button
                      onClick={onLaunchAgents}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold transition-colors flex items-center gap-1 text-[11px] cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5 text-blue-400" />
                      <span>Agent Orchestrator</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="radar-view"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="py-4 flex flex-col md:flex-row items-center justify-between gap-6"
            >
              {/* Animated Circular Radar Display */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border border-slate-800 flex items-center justify-center bg-slate-950/60 shrink-0">
                {/* Concentric distance rings */}
                <div className="absolute inset-4 rounded-full border border-slate-800/80" />
                <div className="absolute inset-12 rounded-full border border-slate-800/60" />
                <div className="absolute inset-20 rounded-full border border-blue-500/20" />
                <div className="absolute inset-28 rounded-full border border-emerald-500/30" />

                {/* Crosshairs */}
                <div className="absolute inset-x-0 top-1/2 h-px bg-slate-800/80" />
                <div className="absolute inset-y-0 left-1/2 w-px bg-slate-800/80" />

                {/* Rotating Sweep Beam */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg at 50% 50%, rgba(59, 130, 246, 0.4) 0deg, transparent 60deg, transparent 360deg)',
                  }}
                />

                {/* Simulated Lead Blips on Radar */}
                {[
                  { x: 30, y: -45, label: 'Apex Tech (92 pts)', color: 'bg-emerald-400' },
                  { x: -50, y: 25, label: 'Horizon Health (88 pts)', color: 'bg-emerald-400' },
                  { x: 40, y: 55, label: 'Vortex Logistics (74 pts)', color: 'bg-amber-400' },
                  { x: -65, y: -40, label: 'CloudScale (65 pts)', color: 'bg-blue-400' },
                  { x: 10, y: -80, label: 'NextGen Retail (95 pts)', color: 'bg-emerald-400' },
                ].map((blip, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.4, 1],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.4,
                      ease: 'easeInOut',
                    }}
                    style={{ transform: `translate(${blip.x}px, ${blip.y}px)` }}
                    className={`absolute w-3 h-3 rounded-full ${blip.color} shadow-md shadow-emerald-400/50 cursor-pointer`}
                    title={blip.label}
                  />
                ))}

                {/* Central Anchor */}
                <div className="relative z-10 w-8 h-8 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center text-white shadow-lg">
                  <Zap className="w-4 h-4 fill-white" />
                </div>
              </div>

              {/* Radar Legend and Real-time ICP Distribution */}
              <div className="space-y-4 max-w-md text-xs">
                <div>
                  <h4 className="text-base font-bold text-white tracking-tight">
                    Real-Time ICP Target Proximity
                  </h4>
                  <p className="text-slate-400 mt-1 leading-relaxed">
                    Radar coordinates calculate proximity to your ideal customer profile using multi-dimensional vector matching across industry, headcount, revenue, and buying intent.
                  </p>
                </div>

                <div className="space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="flex items-center gap-2 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      <span>Inner Ring · Hot Leads (80–100)</span>
                    </span>
                    <strong className="text-emerald-400 tabular-nums">4 Priority Accounts</strong>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="flex items-center gap-2 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span>Mid Ring · Warm Leads (60–79)</span>
                    </span>
                    <strong className="text-amber-400 tabular-nums">12 Nurture Accounts</strong>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="flex items-center gap-2 text-slate-300">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                      <span>Outer Ring · Potential Leads (40–59)</span>
                    </span>
                    <strong className="text-blue-400 tabular-nums">8 Discovery Accounts</strong>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
