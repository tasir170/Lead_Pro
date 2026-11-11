import React from 'react';
import { FunnelStage } from '../../types';
import { ArrowDown, AlertCircle, CheckCircle2 } from 'lucide-react';

interface SalesFunnelChartProps {
  stages: FunnelStage[];
}

export const SalesFunnelChart: React.FC<SalesFunnelChartProps> = ({ stages }) => {
  if (!stages || stages.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-slate-400 text-xs">
        No sales funnel stages logged in database.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {stages.map((stage, index) => {
          // Calculate tapered width representing funnel neck
          const stageWidthPercent = Math.max(20, stage.percentageOfTotal);

          return (
            <div key={stage.stage} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 font-medium text-slate-800">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: stage.color }}
                  />
                  <span>{stage.label}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px] tabular-nums">
                  <span className="font-bold text-slate-900">{stage.count} leads</span>
                  <span className="text-slate-400">({stage.percentageOfTotal}% of total)</span>
                </div>
              </div>

              {/* Stepped Funnel Bar */}
              <div className="w-full bg-slate-100 h-7 rounded-lg overflow-hidden relative flex items-center px-3 border border-slate-200/60 shadow-2xs">
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-500 rounded-lg opacity-85"
                  style={{
                    width: `${stageWidthPercent}%`,
                    backgroundColor: stage.color,
                  }}
                />
                <div className="relative z-10 flex items-center justify-between w-full text-[11px] font-mono text-white font-medium drop-shadow-xs">
                  <span>{stage.description}</span>
                  <span className="font-semibold text-slate-900 bg-white/90 px-1.5 py-0.5 rounded text-[10px] shadow-2xs">
                    {stage.stepConversionRate}% step rate
                  </span>
                </div>
              </div>

              {/* Transition arrow & drop-off indicator */}
              {index < stages.length - 1 && (
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono px-3 py-0.5">
                  <div className="flex items-center gap-1">
                    <ArrowDown className="w-3 h-3 text-slate-400" />
                    <span>Drop-off to next stage:</span>
                  </div>
                  <span className="text-rose-600 font-semibold flex items-center gap-0.5">
                    <AlertCircle className="w-2.5 h-2.5" /> -{stage.dropOffCount} leads
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
