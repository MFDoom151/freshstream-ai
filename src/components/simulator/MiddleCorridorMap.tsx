'use client';

import React from 'react';
import { RouteWaypoint } from '@/types/arrhenius';
import { Ship, Truck, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface MiddleCorridorMapProps {
  activeWaypoint: RouteWaypoint;
  onSelectWaypoint?: (wp: RouteWaypoint) => void;
  isAlertCritical?: boolean;
}

interface MapNode {
  id: RouteWaypoint;
  name: string;
  shortName: string;
  country: string;
  x: number;
  y: number;
  stage: string;
  isSeaLeg?: boolean;
  isBottleneck?: boolean;
}

const MAP_NODES: MapNode[] = [
  {
    id: 'kuryk',
    name: 'Port Kuryk',
    shortName: 'Kuryk',
    country: 'Kazakhstan',
    x: 490,
    y: 110,
    stage: 'Day 6 / 18',
    isSeaLeg: true,
    isBottleneck: true,
  },
  {
    id: 'baku',
    name: 'Port of Baku (Alat)',
    shortName: 'Baku',
    country: 'Azerbaijan',
    x: 350,
    y: 130,
    stage: 'Day 9 / 18',
    isSeaLeg: true,
  },
  {
    id: 'poti',
    name: 'Port of Poti',
    shortName: 'Poti',
    country: 'Georgia',
    x: 210,
    y: 105,
    stage: 'Day 13 / 18',
  },
  {
    id: 'istanbul',
    name: 'Istanbul Hub',
    shortName: 'Istanbul',
    country: 'Turkey',
    x: 75,
    y: 115,
    stage: 'Day 18 / 18',
  },
];

export const MiddleCorridorMap: React.FC<MiddleCorridorMapProps> = ({
  activeWaypoint,
  onSelectWaypoint,
  isAlertCritical = false,
}) => {
  const { t } = useI18n();

  const activeNode = MAP_NODES.find((n) => n.id === activeWaypoint) || MAP_NODES[0];

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <span>{t('demo.map_title')}</span>
        </span>
        <span className="text-[11px] font-mono text-emerald-400 dark:text-emerald-400 light:text-emerald-600">
          TITR Multimodal Rail & Sea
        </span>
      </div>

      {/* SVG Container */}
      <div className="relative w-full aspect-[21/9] sm:aspect-[24/9] min-h-[170px] rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-50 border border-slate-800 dark:border-slate-800 light:border-slate-200 overflow-hidden shadow-inner p-1">
        <svg
          viewBox="0 0 580 190"
          className="w-full h-full select-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="corridorGrad" x1="1" y1="0" x2="0" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="35%" stopColor="#06b6d4" />
              <stop offset="70%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>

            <linearGradient id="caspianSeaGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.08" />
            </linearGradient>

            <linearGradient id="blackSeaGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#1e3a8a" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#1e40af" stopOpacity="0.04" />
            </linearGradient>
          </defs>

          {/* Sea water regions (Decorative geographic backdrops) */}
          {/* Black Sea water polygon */}
          <path
            d="M 100 85 C 130 75, 170 80, 205 95 C 190 135, 130 145, 90 120 Z"
            fill="url(#blackSeaGrad)"
          />
          <text x="145" y="115" className="fill-blue-400/40 text-[9px] font-mono select-none" textAnchor="middle">
            Black Sea
          </text>

          {/* Caspian Sea water polygon */}
          <path
            d="M 370 70 C 420 60, 480 75, 470 140 C 430 155, 360 150, 360 100 Z"
            fill="url(#caspianSeaGrad)"
          />
          <text x="420" y="115" className="fill-cyan-400/40 text-[9px] font-mono select-none" textAnchor="middle">
            Caspian Sea
          </text>

          {/* Route Path (Multimodal Rail/Sea corridor line) */}
          {/* Kuryk to Baku (Caspian Sea Ro-Pax Ferry - dashed) */}
          <line
            x1="490"
            y1="110"
            x2="350"
            y2="130"
            stroke="#06b6d4"
            strokeWidth="2.5"
            strokeDasharray="5 4"
            className="animate-pulse"
          />

          {/* Baku to Poti (Caucasus Rail Corridor - solid) */}
          <line
            x1="350"
            y1="130"
            x2="210"
            y2="105"
            stroke="#8b5cf6"
            strokeWidth="3"
            strokeDasharray="none"
          />

          {/* Poti to Istanbul (Black Sea / Road - solid/dashed) */}
          <line
            x1="210"
            y1="105"
            x2="75"
            y2="115"
            stroke="#10b981"
            strokeWidth="3"
            strokeDasharray="none"
          />

          {/* Waypoint Nodes */}
          {MAP_NODES.map((node) => {
            const isActive = activeWaypoint === node.id;
            return (
              <g
                key={node.id}
                className="cursor-pointer transition-transform"
                onClick={() => onSelectWaypoint && onSelectWaypoint(node.id)}
              >
                {/* Node Outer Ring */}
                {isActive && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="14"
                    fill="none"
                    stroke={isAlertCritical ? '#ef4444' : '#10b981'}
                    strokeWidth="2"
                    strokeDasharray="3 3"
                    className="animate-spin"
                    style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                  />
                )}

                {/* Chokepoint Alert Ping */}
                {node.isBottleneck && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="16"
                    fill="#ef4444"
                    opacity="0.25"
                    className="animate-ping"
                  />
                )}

                {/* Base Node Circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="7"
                  fill={
                    isActive
                      ? isAlertCritical
                        ? '#ef4444'
                        : '#10b981'
                      : '#334155'
                  }
                  stroke="#ffffff"
                  strokeWidth="2"
                />

                {/* Node Label Text */}
                <text
                  x={node.x}
                  y={node.y - 12}
                  textAnchor="middle"
                  className={`text-[10px] font-mono font-bold ${
                    isActive
                      ? 'fill-white dark:fill-white light:fill-slate-900'
                      : 'fill-slate-400 dark:fill-slate-400 light:fill-slate-600'
                  }`}
                >
                  {node.shortName}
                </text>

                {/* Stage Tag */}
                <text
                  x={node.x}
                  y={node.y + 19}
                  textAnchor="middle"
                  className="fill-slate-400 dark:fill-slate-400 light:fill-slate-500 text-[8px] font-mono"
                >
                  {node.stage.split(' ')[0]} {node.stage.split(' ')[1]}
                </text>
              </g>
            );
          })}

          {/* Animated Vessel/Truck Position Marker at Active Waypoint */}
          <g
            transform={`translate(${activeNode.x - 12}, ${activeNode.y - 12})`}
            className="transition-all duration-500 pointer-events-none"
          >
            <rect
              width="24"
              height="24"
              rx="6"
              fill={isAlertCritical ? '#ef4444' : '#10b981'}
              opacity="0.9"
            />
            {activeNode.isSeaLeg ? (
              <path
                d="M 5 15 L 19 15 L 17 19 L 7 19 Z M 8 13 L 8 9 L 16 9 L 16 13 Z M 12 6 L 12 9 Z"
                fill="#ffffff"
              />
            ) : (
              <path
                d="M 4 10 L 14 10 L 14 16 L 4 16 Z M 14 12 L 18 12 L 20 15 L 20 16 L 14 16 Z M 7 18 A 2 2 0 1 0 7 14 A 2 2 0 1 0 7 18 Z M 17 18 A 2 2 0 1 0 17 14 A 2 2 0 1 0 17 18 Z"
                fill="#ffffff"
              />
            )}
          </g>
        </svg>

        {/* Floating Active Stage Badge */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900/90 dark:bg-slate-900/90 light:bg-white/95 border border-slate-800 dark:border-slate-800 light:border-slate-200 text-[10px] font-mono text-slate-300 dark:text-slate-300 light:text-slate-700 shadow backdrop-blur-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Active: {activeNode.name}</span>
          <span className="text-slate-500">({activeNode.country})</span>
        </div>
      </div>
    </div>
  );
};

export default MiddleCorridorMap;
