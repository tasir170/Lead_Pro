import React, { useState } from 'react';
import { TimelineDataPoint } from '../../types';

interface LeadsOverTimeChartProps {
  data: TimelineDataPoint[];
}

export const LeadsOverTimeChart: React.FC<LeadsOverTimeChartProps> = ({ data }) => {
  const [hoveredPoint, setHoveredPoint] = useState<TimelineDataPoint | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-xs">
        <p>No historical lead discovery records for this filter range.</p>
      </div>
    );
  }

  const maxAdded = Math.max(...data.map((d) => d.leadsAdded), 5);
  const chartHeight = 180;
  const chartWidth = 600;
  const paddingX = 40;
  const paddingY = 25;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  const points = data.map((d, index) => {
    const x =
      data.length === 1
        ? chartWidth / 2
        : paddingX + (index / (data.length - 1)) * innerWidth;
    const y = chartHeight - paddingY - (d.leadsAdded / maxAdded) * innerHeight;
    return { ...d, x, y };
  });

  // Build SVG path
  const linePath = points.reduce((acc, curr, index) => {
    return `${acc} ${index === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`;
  }, '');

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
      : '';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>New Leads Discovered</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span>Qualified Pipeline</span>
          </div>
        </div>

        {hoveredPoint && (
          <div className="text-right font-mono text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
            <span className="font-semibold text-blue-600">{hoveredPoint.period}</span>: {hoveredPoint.leadsAdded} added ({hoveredPoint.cumulativeLeads} total)
          </div>
        )}
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-52 overflow-visible"
        >
          <defs>
            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = chartHeight - paddingY - ratio * innerHeight;
            const val = Math.round(ratio * maxAdded);
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="#94a3b8"
                  fontFamily="monospace"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Shaded Area */}
          {areaPath && <path d={areaPath} fill="url(#blueGradient)" />}

          {/* Line */}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Data Points */}
          {points.map((p, idx) => (
            <g
              key={idx}
              className="cursor-pointer group"
              onMouseEnter={() => setHoveredPoint(p)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill="#ffffff"
                stroke="#2563eb"
                strokeWidth="2.5"
                className="transition-transform group-hover:scale-150"
              />
              <text
                x={p.x}
                y={chartHeight - 8}
                textAnchor="middle"
                fontSize="9"
                fill="#64748b"
                fontFamily="sans-serif"
              >
                {p.period}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};
