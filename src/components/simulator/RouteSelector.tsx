'use client';

import React from 'react';
import { RouteWaypoint } from '@/types/arrhenius';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Ship, Truck, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface RouteSelectorProps {
  selectedWaypoint: RouteWaypoint;
  onSelectWaypoint: (waypoint: RouteWaypoint) => void;
  disabled?: boolean;
}

export interface WaypointInfo {
  id: RouteWaypoint;
  name: string;
  country: string;
  leg: string;
  day: string;
  mode: 'ferry' | 'rail' | 'road';
  isBottleneck?: boolean;
  contextDesc: string;
}

export const WAYPOINTS: WaypointInfo[] = [
  {
    id: 'kuryk',
    name: 'Port Kuryk',
    country: 'Kazakhstan (KZ)',
    leg: 'Caspian Ro-Pax Ferry Staging',
    day: 'Day 6 / 18',
    mode: 'ferry',
    isBottleneck: true,
    contextDesc: '80% of regional cold-chain failures occur on unshaded staging pads awaiting vessel berths.',
  },
  {
    id: 'baku',
    name: 'Port of Baku (Alat)',
    country: 'Azerbaijan (AZ)',
    leg: 'Caspian Disembarkation & Customs',
    day: 'Day 9 / 18',
    mode: 'rail',
    isBottleneck: false,
    contextDesc: 'Rail gauge transfer and bonded refrigerated holding warehouse Section B.',
  },
  {
    id: 'poti',
    name: 'Port of Poti',
    country: 'Georgia (GE)',
    leg: 'Black Sea Maritime Gateway',
    day: 'Day 13 / 18',
    mode: 'road',
    isBottleneck: false,
    contextDesc: 'Humid subtropical coastal zone (>90% RH). Condensation risk on packaging.',
  },
  {
    id: 'istanbul',
    name: 'Istanbul Hub',
    country: 'Turkey (TR)',
    leg: 'Terminal Distribution & Cross-Dock',
    day: 'Day 18 / 18',
    mode: 'road',
    isBottleneck: false,
    contextDesc: 'Final commercial wholesale delivery hub. Green fast-track customs clearance corridor.',
  },
];

export const RouteSelector: React.FC<RouteSelectorProps> = ({
  selectedWaypoint,
  onSelectWaypoint,
  disabled = false,
}) => {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-purple-400" />
          <span>{t('demo.map_title')}</span>
        </label>
        <span className="text-[11px] font-mono text-purple-400 dark:text-purple-400 light:text-purple-600">
          Trans-Caspian TITR Corridor
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {WAYPOINTS.map((wp) => {
          const isSelected = selectedWaypoint === wp.id;
          return (
            <button
              key={wp.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectWaypoint(wp.id)}
              className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'bg-purple-950/40 dark:bg-purple-950/40 light:bg-purple-50 border-purple-500 ring-1 ring-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                  : 'bg-slate-950/60 dark:bg-slate-950/60 light:bg-white/80 border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 hover:border-slate-700 hover:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 light:text-slate-500">
                  {wp.day}
                </span>
                {wp.isBottleneck && (
                  <Badge variant="danger" size="sm">
                    CHOKEPOINT
                  </Badge>
                )}
              </div>

              <div className="flex flex-col">
                <span className="text-xs font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-1">
                  {wp.name}
                </span>
                <span className="text-[10px] text-purple-300/80 dark:text-purple-300/80 light:text-purple-700 font-mono">
                  {wp.country}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Waypoint Context Detail Card */}
      {(() => {
        const current = WAYPOINTS.find((w) => w.id === selectedWaypoint) || WAYPOINTS[0];
        return (
          <div className="p-3 rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-slate-50 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 text-xs flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 flex items-center gap-1.5">
                {current.mode === 'ferry' ? (
                  <Ship className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>Transit Stage: {current.leg}</span>
              </span>
              <span className="font-mono text-[11px] text-slate-400 dark:text-slate-500">
                {current.day}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
              {current.contextDesc}
            </p>
          </div>
        );
      })()}
    </div>
  );
};

export default RouteSelector;
