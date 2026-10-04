'use client';

import React, { useState, useRef, useMemo } from 'react';
import { AlertSeverity } from '@/types/arrhenius';
import { useI18n } from '@/lib/i18n/context';

interface DecayPoint {
  time_hours: number;
  quality_remaining: number;
  baseline_quality: number;
}

interface ArrheniusChartProps {
  decayCurve: DecayPoint[];
  kRate: number;
  healthIndex: number;
  alertSeverity: AlertSeverity;
  currentTransitHour?: number; // e.g. 144h (Day 6 of 18)
}

// SVG Dimension Constants
const WIDTH = 640;
const HEIGHT = 300;
const PAD_LEFT = 45;
const PAD_RIGHT = 25;
const PAD_TOP = 25;
const PAD_BOTTOM = 35;
const PLOT_W = WIDTH - PAD_LEFT - PAD_RIGHT;
const PLOT_H = HEIGHT - PAD_TOP - PAD_BOTTOM;
const MAX_HOURS = 480; // 20 days

// Coordinate projection functions
const getX = (hours: number) => PAD_LEFT + (Math.min(MAX_HOURS, Math.max(0, hours)) / MAX_HOURS) * PLOT_W;
const getY = (quality: number) => PAD_TOP + ((100 - Math.min(100, Math.max(0, quality))) / 100) * PLOT_H;

export const ArrheniusChart: React.FC<ArrheniusChartProps> = ({
  decayCurve,
  kRate,
  healthIndex,
  alertSeverity,
  currentTransitHour = 144,
}) => {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);


  // Active status color
  const statusColor = useMemo(() => {
    if (alertSeverity === 'CRITICAL' || healthIndex < 40) return '#ef4444'; // Red
    if (alertSeverity === 'WARNING' || healthIndex < 65) return '#f97316';  // Orange
    if (healthIndex < 85) return '#f59e0b';                                // Amber
    return '#10b981';                                                      // Mint Green
  }, [alertSeverity, healthIndex]);

  // Critical failure intersection point (Q = 20%)
  const tCritical = useMemo(() => {
    if (kRate <= 0) return null;
    const tCrit = 1.6094 / kRate; // ln(100/20) / k
    return tCrit <= MAX_HOURS ? tCrit : null;
  }, [kRate]);

  // Construct SVG paths
  const baselinePath = useMemo(() => {
    if (!decayCurve || decayCurve.length === 0) return '';
    return decayCurve.reduce((path, pt, idx) => {
      const x = getX(pt.time_hours);
      const y = getY(pt.baseline_quality);
      return idx === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    }, '');
  }, [decayCurve]);

  const activePath = useMemo(() => {
    if (!decayCurve || decayCurve.length === 0) return '';
    return decayCurve.reduce((path, pt, idx) => {
      const x = getX(pt.time_hours);
      const y = getY(pt.quality_remaining);
      return idx === 0 ? `M ${x} ${y}` : `${path} L ${x} ${y}`;
    }, '');
  }, [decayCurve]);

  const activeAreaPath = useMemo(() => {
    if (!decayCurve || decayCurve.length === 0) return '';
    const baseLineY = getY(0);
    const startX = getX(decayCurve[0].time_hours);
    const endX = getX(decayCurve[decayCurve.length - 1].time_hours);
    return `${activePath} L ${endX} ${baseLineY} L ${startX} ${baseLineY} Z`;
  }, [activePath, decayCurve]);

  // Mouse hover event for interactive crosshair tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current || !decayCurve || decayCurve.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const normX = (mouseX / rect.width) * WIDTH;
    const hours = ((normX - PAD_LEFT) / PLOT_W) * MAX_HOURS;

    let closestIdx = 0;
    let minDiff = Infinity;
    decayCurve.forEach((pt, i) => {
      const diff = Math.abs(pt.time_hours - hours);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });
    setHoverIndex(closestIdx);
  };

  const handleMouseLeave = () => setHoverIndex(null);

  const hoveredPoint = hoverIndex !== null && decayCurve ? decayCurve[hoverIndex] : null;

  return (
    <div className="flex flex-col gap-3">
      {/* Header & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 uppercase tracking-wider">
          {t('demo.chart_title')}
        </span>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-cyan-400" />
            <span className="text-slate-400 dark:text-slate-400 light:text-slate-600">{t('demo.chart_baseline')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 rounded-full" style={{ backgroundColor: statusColor }} />
            <span className="text-white dark:text-white light:text-slate-900 font-bold">{t('demo.chart_predicted')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-red-500" />
            <span className="text-red-400">{t('demo.chart_threshold')}</span>
          </div>
        </div>
      </div>

      {/* Responsive SVG Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[2/1] sm:aspect-[16/9] min-h-[220px] rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 p-2 overflow-hidden shadow-inner"
      >
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-full select-none cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="activeAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={statusColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={statusColor} stopOpacity="0.0" />
            </linearGradient>
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={statusColor} floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Grid lines and tick labels */}
          {[0, 20, 40, 60, 80, 100].map((q) => {
            const y = getY(q);
            return (
              <g key={`y-${q}`}>
                <line
                  x1={PAD_LEFT}
                  y1={y}
                  x2={WIDTH - PAD_RIGHT}
                  y2={y}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray={q === 20 ? '4 4' : '2 4'}
                  strokeOpacity={q === 20 ? '0.9' : '0.4'}
                  className={q === 20 ? 'stroke-red-500' : ''}
                />
                <text
                  x={PAD_LEFT - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 light:fill-slate-600 text-[10px] font-mono"
                >
                  {q}%
                </text>
              </g>
            );
          })}

          {[0, 120, 240, 360, 480].map((h) => {
            const x = getX(h);
            const days = Math.round(h / 24);
            return (
              <g key={`x-${h}`}>
                <line
                  x1={x}
                  y1={PAD_TOP}
                  x2={x}
                  y2={HEIGHT - PAD_BOTTOM}
                  stroke="#334155"
                  strokeWidth="1"
                  strokeDasharray="2 4"
                  strokeOpacity="0.4"
                />
                <text
                  x={x}
                  y={HEIGHT - PAD_BOTTOM + 16}
                  textAnchor="middle"
                  className="fill-slate-400 dark:fill-slate-500 light:fill-slate-600 text-[10px] font-mono"
                >
                  Day {days} ({h}h)
                </text>
              </g>
            );
          })}

          {/* 20% Commercial Spoilage Threshold Label */}
          <text
            x={WIDTH - PAD_RIGHT - 5}
            y={getY(20) - 6}
            textAnchor="end"
            className="fill-red-400 text-[10px] font-mono font-bold"
          >
            {t('demo.chart_threshold')}
          </text>

          {/* Gradient area under active curve */}
          <path d={activeAreaPath} fill="url(#activeAreaGrad)" />

          {/* Baseline Reference Curve (Cyan dashed) */}
          <path
            d={baselinePath}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeOpacity="0.75"
          />

          {/* Active Accelerated Decay Curve */}
          <path
            d={activePath}
            fill="none"
            stroke={statusColor}
            strokeWidth="3"
            filter="url(#glowFilter)"
            className="transition-all duration-150"
          />

          {/* Current Corridor Transit Marker (Day 6 / 144h) */}
          {currentTransitHour && (
            <g>
              <line
                x1={getX(currentTransitHour)}
                y1={PAD_TOP}
                x2={getX(currentTransitHour)}
                y2={HEIGHT - PAD_BOTTOM}
                stroke="#a855f7"
                strokeWidth="1.5"
                strokeDasharray="3 3"
              />
              <circle
                cx={getX(currentTransitHour)}
                cy={getY(
                  decayCurve.find((p) => p.time_hours >= currentTransitHour)?.quality_remaining || 50
                )}
                r="4"
                fill="#a855f7"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <text
                x={getX(currentTransitHour)}
                y={PAD_TOP - 6}
                textAnchor="middle"
                className="fill-purple-400 text-[9px] font-mono font-bold"
              >
                Port Kuryk (Day 6)
              </text>
            </g>
          )}

          {/* Critical Point Marker (Intersection at Q = 20%) */}
          {tCritical !== null && (
            <g>
              <line
                x1={getX(tCritical)}
                y1={getY(20)}
                x2={getX(tCritical)}
                y2={HEIGHT - PAD_BOTTOM}
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle cx={getX(tCritical)} cy={getY(20)} r="5" fill="#ef4444" className="animate-ping opacity-75" />
              <circle cx={getX(tCritical)} cy={getY(20)} r="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
              <text
                x={getX(tCritical)}
                y={getY(20) - 10}
                textAnchor="middle"
                className="fill-red-400 text-[10px] font-mono font-bold"
              >
                Zero Margin: {tCritical.toFixed(0)}h ({(tCritical / 24).toFixed(1)}d)
              </text>
            </g>
          )}

          {/* Hover Crosshair & Dot */}
          {hoveredPoint && (
            <g>
              <line
                x1={getX(hoveredPoint.time_hours)}
                y1={PAD_TOP}
                x2={getX(hoveredPoint.time_hours)}
                y2={HEIGHT - PAD_BOTTOM}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoveredPoint.time_hours)}
                cy={getY(hoveredPoint.quality_remaining)}
                r="5"
                fill={statusColor}
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip Card */}
        {hoveredPoint && (
          <div
            className="absolute top-4 right-4 p-2.5 rounded-lg bg-slate-900/90 dark:bg-slate-900/90 light:bg-white/95 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-200 text-[11px] font-mono shadow-xl pointer-events-none flex flex-col gap-1 backdrop-blur-md z-10"
          >
            <div className="text-slate-300 dark:text-slate-300 light:text-slate-800 font-bold border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-1">
              Time: {hoveredPoint.time_hours}h (Day {(hoveredPoint.time_hours / 24).toFixed(1)})
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400 dark:text-slate-400 light:text-slate-500">Active Quality:</span>
              <span className="font-bold" style={{ color: statusColor }}>
                {hoveredPoint.quality_remaining}%
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400 dark:text-slate-400 light:text-slate-500">Baseline Target:</span>
              <span className="text-cyan-400 dark:text-cyan-400 light:text-cyan-600 font-bold">{hoveredPoint.baseline_quality}%</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t border-slate-800 dark:border-slate-800 light:border-slate-200">
              <span className="text-slate-400 dark:text-slate-400 light:text-slate-500">Degradation Delta:</span>
              <span className="text-red-400 font-bold">
                -{(hoveredPoint.baseline_quality - hoveredPoint.quality_remaining).toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArrheniusChart;
