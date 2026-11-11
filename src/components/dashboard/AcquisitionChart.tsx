import React, { useState } from 'react';
import { AcquisitionDataPoint } from '../../types';

interface AcquisitionChartProps {
  data: AcquisitionDataPoint[];
}

export const AcquisitionChart: React.FC<AcquisitionChartProps> = ({ data }) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400">
        No acquisition data available
      </div>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.leadsAdded), 140);
  const chartHeight = 200;
  const chartWidth = 560;
  const paddingX = 40;
  const paddingY = 25;

  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  // Calculate coordinates for points
  const getCoordinates = (val: number, index: number) => {
    const x = paddingX + (index / (data.length - 1)) * innerWidth;
    const y = chartHeight - paddingY - (val / maxValue) * innerHeight;
    return { x, y };
  };

  const addedPoints = data.map((d, i) => getCoordinates(d.leadsAdded, i));
  const qualifiedPoints = data.map((d, i) => getCoordinates(d.leadsQualified, i));
  const convertedPoints = data.map((d, i) => getCoordinates(d.leadsConverted, i));

  const createPath = (points: { x: number; y: number }[]) => {
    return points.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, '');
  };

  const createAreaPath = (points: { x: number; y: number }[]) => {
    const linePath = createPath(points);
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    const baselineY = chartHeight - paddingY;
    return `${linePath} L ${lastPoint.x} ${baselineY} L ${firstPoint.x} ${baselineY} Z`;
  };

  return (
    <div className="space-y-4">
      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-4 text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-600" />
            <span className="font-medium">Total Acquired</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-indigo-500" />
            <span className="font-medium">AI Qualified</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500" />
            <span className="font-medium">Converted</span>
          </div>
        </div>

        {hoveredIndex !== null && (
          <div className="text-slate-800 font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
            {data[hoveredIndex].period}: {data[hoveredIndex].leadsAdded} leads · {data[hoveredIndex].leadsQualified} qualified · {data[hoveredIndex].leadsConverted} closed
          </div>
        )}
      </div>

      {/* SVG Chart */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366F1" stopOpacity="0.20" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = chartHeight - paddingY - ratio * innerHeight;
            const val = Math.round(ratio * maxValue);
            return (
              <g key={ratio}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={chartWidth - paddingX}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray="3 3"
                />
                <text
                  x={paddingX - 8}
                  y={y + 3}
                  fontSize="9"
                  fill="#94A3B8"
                  textAnchor="end"
                  className="font-mono tabular-nums"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area Gradients */}
          <path d={createAreaPath(addedPoints)} fill="url(#blueGradient)" />
          <path d={createAreaPath(qualifiedPoints)} fill="url(#indigoGradient)" />

          {/* Lines */}
          <path
            d={createPath(addedPoints)}
            fill="none"
            stroke="#2563EB"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={createPath(qualifiedPoints)}
            fill="none"
            stroke="#6366F1"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <path
            d={createPath(convertedPoints)}
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Interactive Data Points & Labels */}
          {data.map((d, i) => {
            const pt = addedPoints[i];
            const isHovered = hoveredIndex === i;
            return (
              <g
                key={d.period}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingY}
                    x2={pt.x}
                    y2={chartHeight - paddingY}
                    stroke="#94A3B8"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Circles */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 5 : 3.5}
                  fill="#2563EB"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <circle
                  cx={qualifiedPoints[i].x}
                  cy={qualifiedPoints[i].y}
                  r={isHovered ? 4.5 : 3}
                  fill="#6366F1"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />
                <circle
                  cx={convertedPoints[i].x}
                  cy={convertedPoints[i].y}
                  r={isHovered ? 4.5 : 3}
                  fill="#10B981"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                />

                {/* X-axis label */}
                <text
                  x={pt.x}
                  y={chartHeight - 6}
                  fontSize="10"
                  fill="#64748B"
                  textAnchor="middle"
                  fontWeight={isHovered ? '600' : '400'}
                >
                  {d.period}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
