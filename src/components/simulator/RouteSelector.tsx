'use client';

import React from 'react';
import { RouteWaypoint } from '@/types/arrhenius';
import { Badge } from '@/components/ui/Badge';
import { MapPin, Ship, Truck, AlertTriangle, Train, Box, ShieldCheck } from 'lucide-react';
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
  mode: 'rail' | 'ferry' | 'road' | 'intermodal';
  isBottleneck?: boolean;
  contextDesc: string;
  gauge?: string;
  dcsaCode?: string;
}

export const WAYPOINTS: WaypointInfo[] = [
  {
    id: 'khorgos',
    name: 'Khorgos Dry Port',
    country: 'Kazakhstan / China',
    leg: 'Cross-Border Gauge Interchange',
    day: 'Day 1 / 18',
    mode: 'rail',
    isBottleneck: false,
    contextDesc: 'Container gantry crane transfer from 1435mm China rail to 1520mm Eurasian broad gauge.',
    gauge: '1435 ⇄ 1520mm',
    dcsaCode: 'KZKHO',
  },
  {
    id: 'almaty',
    name: 'Almaty Agro Hub',
    country: 'Kazakhstan (KZ)',
    leg: 'Zhetysu Cold-Storage Consolidation',
    day: 'Day 2 / 18',
    mode: 'rail',
    isBottleneck: false,
    contextDesc: 'Initial harvest pre-cooling, vacuum pulse, and nitrogen controlled atmosphere loading.',
    gauge: '1520mm Rail',
    dcsaCode: 'KZALA',
  },
  {
    id: 'shymkent',
    name: 'Shymkent Junction',
    country: 'Kazakhstan (KZ)',
    leg: 'Turksib Mainline Marshalling',
    day: 'Day 4 / 18',
    mode: 'rail',
    isBottleneck: false,
    contextDesc: 'High ambient summer temperatures (+36°C). Automated reefer compressor audit.',
    gauge: '1520mm Rail',
    dcsaCode: 'KZCIT',
  },
  {
    id: 'beyneu',
    name: 'Beyneu Junction',
    country: 'Kazakhstan (KZ)',
    leg: 'Mangystau Desert Rail Corridor',
    day: 'Day 5 / 18',
    mode: 'rail',
    isBottleneck: false,
    contextDesc: 'Ustyurt desert crossing. Tri-axial vibration logging and solar radiation shielding.',
    gauge: '1520mm Rail',
    dcsaCode: 'KZBEY',
  },
  {
    id: 'kuryk',
    name: 'Port Kuryk',
    country: 'Kazakhstan (KZ)',
    leg: 'Caspian Ro-Pax Ferry Staging',
    day: 'Day 6 / 18',
    mode: 'ferry',
    isBottleneck: true,
    contextDesc: '80% of regional cold-chain failures occur on unshaded staging pads awaiting vessel berths.',
    gauge: 'Ro-Pax Ramp',
    dcsaCode: 'KZKRK',
  },
  {
    id: 'baku',
    name: 'Port of Baku (Alat)',
    country: 'Azerbaijan (AZ)',
    leg: 'Caspian Disembarkation & Customs',
    day: 'Day 9 / 18',
    mode: 'intermodal',
    isBottleneck: false,
    contextDesc: 'Rail ferry roll-off to BTK mainline; bonded refrigerated holding warehouse Section B.',
    gauge: '1520mm Rail',
    dcsaCode: 'AZBAK',
  },
  {
    id: 'tbilisi',
    name: 'Tbilisi Central',
    country: 'Georgia (GE)',
    leg: 'Trans-Caucasus Transit Corridor',
    day: 'Day 11 / 18',
    mode: 'rail',
    isBottleneck: false,
    contextDesc: 'Surami pass transit, acoustic inspection of reefer frames, auxiliary battery recharge.',
    gauge: '1520mm Rail',
    dcsaCode: 'GETBS',
  },
  {
    id: 'poti',
    name: 'Port of Poti',
    country: 'Georgia (GE)',
    leg: 'Black Sea Maritime Feeder',
    day: 'Day 13 / 18',
    mode: 'ferry',
    isBottleneck: false,
    contextDesc: 'Humid subtropical coastal zone (>90% RH). Condensation mitigation protocol active.',
    gauge: 'Deepwater Berth',
    dcsaCode: 'GEPTI',
  },
  {
    id: 'istanbul',
    name: 'Istanbul Marmara Hub',
    country: 'Turkey (TR)',
    leg: 'Halkali European Gateway',
    day: 'Day 18 / 18',
    mode: 'road',
    isBottleneck: false,
    contextDesc: 'Final wholesale distribution and European retail handover via Marmaray subsea rail tunnel.',
    gauge: '1435mm Standard',
    dcsaCode: 'TRIST',
  },
];

const MODE_ICONS: Record<string, React.ElementType> = {
  rail: Train,
  ferry: Ship,
  road: Truck,
  intermodal: Box,
};

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
          <span>Multimodal Corridor Waypoints (Khorgos ⇄ Istanbul)</span>
        </label>
        <span className="text-[11px] font-mono text-purple-400 dark:text-purple-400 light:text-purple-600">
          TITR Silk Road • DCSA Track & Trace 3.0
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-2">
        {WAYPOINTS.map((wp) => {
          const isSelected = selectedWaypoint === wp.id;
          const Icon = MODE_ICONS[wp.mode] || Train;

          return (
            <button
              key={wp.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectWaypoint(wp.id)}
              className={`p-2.5 rounded-xl border text-left transition-all duration-200 cursor-pointer relative flex flex-col justify-between min-h-[92px] ${
                isSelected
                  ? 'bg-purple-950/40 dark:bg-purple-950/40 light:bg-purple-50 border-purple-500 ring-1 ring-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                  : 'bg-slate-950/60 dark:bg-slate-950/60 light:bg-white/80 border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 hover:border-slate-700 hover:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 light:text-slate-500">
                  {wp.day}
                </span>
                {wp.isBottleneck ? (
                  <Badge variant="danger" size="sm">
                    CHOKEPOINT
                  </Badge>
                ) : (
                  <span className="text-[9px] font-mono text-slate-500">
                    {wp.dcsaCode}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 my-1">
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-purple-400' : 'text-slate-400'}`} />
                <span className="text-xs font-bold text-white dark:text-white light:text-slate-900 truncate">
                  {wp.name}
                </span>
              </div>

              <div className="flex items-center justify-between mt-auto pt-1 border-t border-slate-800/50 text-[10px] text-slate-400 font-mono">
                <span className="truncate">{wp.country}</span>
                {wp.gauge && (
                  <span className="text-[9px] text-purple-300/80 hidden sm:inline">
                    {wp.gauge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Waypoint Detailed Intelligence Card */}
      {(() => {
        const current = WAYPOINTS.find((w) => w.id === selectedWaypoint) || WAYPOINTS[0];
        const ModeIcon = MODE_ICONS[current.mode] || Train;
        return (
          <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-start gap-2.5">
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 shrink-0 mt-0.5">
                <ModeIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{current.name}</span>
                  <span className="text-slate-400">• {current.leg}</span>
                  <Badge variant="purple" size="sm">{current.day}</Badge>
                </div>
                <p className="text-slate-300 mt-0.5 leading-relaxed">
                  {current.contextDesc}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center font-mono text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>DCSA: {current.dcsaCode}</span>
              <span className="text-slate-600">|</span>
              <span>{current.gauge}</span>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default RouteSelector;
