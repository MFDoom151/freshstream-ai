'use client';

import React from 'react';
import { TelemetryInput, TransportMode } from '@/types/arrhenius';
import { COMMODITY_PROFILES } from '@/lib/arrhenius';
import { Badge } from '@/components/ui/Badge';
import { 
  Thermometer, 
  Wind, 
  Droplets, 
  Activity, 
  AlertTriangle, 
  Train, 
  Ship, 
  Truck, 
  Box,
  Layers,
  Gauge
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface TelemetrySlidersProps {
  telemetry: TelemetryInput;
  onChange: (updated: Partial<TelemetryInput>) => void;
  onSelectPreset: (preset: Partial<TelemetryInput>) => void;
  disabled?: boolean;
}

const TRANSPORT_MODES: Array<{
  id: TransportMode;
  name: string;
  sub: string;
  icon: React.ElementType;
}> = [
  {
    id: 'RAIL_REEFER',
    name: 'Heavy Rail Block Train',
    sub: 'KTZ / BTK (1520mm / 1435mm)',
    icon: Train,
  },
  {
    id: 'RO_PAX_FERRY',
    name: 'Ro-Pax Rail Ferry',
    sub: 'Caspian Kuryk ⇄ Alat',
    icon: Ship,
  },
  {
    id: 'TIR_TRUCK',
    name: 'TIR Reefer Highway',
    sub: 'WE-WC Trans-Eurasia',
    icon: Truck,
  },
  {
    id: 'SMART_REEFER_CONTAINER',
    name: 'Smart 40ft ISO Container',
    sub: 'DCSA IoT CA Atmosphere',
    icon: Box,
  },
];

export const TelemetrySliders: React.FC<TelemetrySlidersProps> = ({
  telemetry,
  onChange,
  onSelectPreset,
  disabled = false,
}) => {
  const { t } = useI18n();
  const profile = COMMODITY_PROFILES[telemetry.cargo] || COMMODITY_PROFILES.fruits;
  const isEthanolCritical = telemetry.ethanol > 35;
  const currentMode = telemetry.transport_mode || 'RAIL_REEFER';

  return (
    <div className="flex flex-col gap-5">
      {/* 0. Multimodal Transport Mode Selector */}
      <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Active Transport Modality</span>
          </span>
          <Badge variant="purple" size="sm">
            Multimodal Route
          </Badge>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          {TRANSPORT_MODES.map((mode) => {
            const isSelected = currentMode === mode.id;
            const Icon = mode.icon;

            return (
              <button
                key={mode.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange({ transport_mode: mode.id })}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/50 shadow-sm text-white'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold truncate">{mode.name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500 truncate">
                  {mode.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1. Temperature Slider */}
      <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
            {t('demo.slider_temp')}
          </span>
          <div className="flex items-center gap-2">
            {telemetry.temperature >= profile.tOptMin && telemetry.temperature <= profile.tOptMax && (
              <Badge variant="mint" size="sm">Optimal Safe</Badge>
            )}
            {telemetry.temperature < profile.tFreeze && (
              <Badge variant="amber" size="sm">Freeze Injury</Badge>
            )}
            {telemetry.temperature > profile.tOptMax + 5 && (
              <Badge variant="danger" size="sm">Thermal Breach</Badge>
            )}
            <span className="font-mono text-sm font-bold text-cyan-400">
              {telemetry.temperature > 0 ? `+${telemetry.temperature.toFixed(1)}` : telemetry.temperature.toFixed(1)}°C
            </span>
          </div>
        </div>

        <input
          type="range"
          min="-5.0"
          max="35.0"
          step="0.5"
          value={telemetry.temperature}
          disabled={disabled}
          onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
          className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-2"
          aria-label="Temperature slider"
        />

        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>-5.0°C (Deep Chill)</span>
          <span className="text-emerald-400 font-medium">
            Opt: {profile.tOptMin > 0 ? `+${profile.tOptMin}` : profile.tOptMin}°C to +{profile.tOptMax}°C
          </span>
          <span>+35.0°C (Extreme Heat)</span>
        </div>
      </div>

      {/* 2. Volatile Ethanol Gas (VOC / Microbial Decay) Slider */}
      <div
        className={`flex flex-col gap-2 p-3.5 rounded-xl border transition-colors ${
          isEthanolCritical
            ? 'bg-red-950/30 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
            : 'bg-slate-950/70 border-slate-800/80'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Wind className={`w-3.5 h-3.5 ${isEthanolCritical ? 'text-red-400' : 'text-emerald-400'}`} />
            {t('demo.slider_ethanol')}
          </span>
          <div className="flex items-center gap-2">
            {isEthanolCritical ? (
              <Badge variant="danger" size="sm" dot>
                &gt;35 ppm CRITICAL
              </Badge>
            ) : telemetry.ethanol > 15 ? (
              <Badge variant="amber" size="sm">Elevated</Badge>
            ) : (
              <Badge variant="mint" size="sm">Baseline</Badge>
            )}
            <span
              className={`font-mono text-sm font-bold ${
                isEthanolCritical ? 'text-red-400' : 'text-emerald-400'
              }`}
            >
              {telemetry.ethanol.toFixed(1)} ppm
            </span>
          </div>
        </div>

        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={telemetry.ethanol}
          disabled={disabled}
          onChange={(e) => onChange({ ethanol: parseFloat(e.target.value) })}
          className={`w-full bg-slate-800 rounded-lg cursor-pointer h-2 ${
            isEthanolCritical ? 'accent-red-500' : 'accent-emerald-400'
          }`}
          aria-label="Volatile ethanol slider"
        />

        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0 ppm (Pristine)</span>
          <span className="text-red-400 font-bold flex items-center gap-0.5">
            <AlertTriangle className="w-2.5 h-2.5" /> 35 ppm Spoilage Threshold
          </span>
          <span>100 ppm (Putrefaction)</span>
        </div>
      </div>

      {/* 3. Relative Humidity Slider */}
      <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-purple-400" />
            {t('demo.slider_rh')}
          </span>
          <div className="flex items-center gap-2">
            {telemetry.humidity >= profile.rhOptMin && telemetry.humidity <= profile.rhOptMax ? (
              <Badge variant="mint" size="sm">Optimal RH</Badge>
            ) : telemetry.humidity > profile.rhOptMax ? (
              <Badge variant="amber" size="sm">Condensation Risk</Badge>
            ) : (
              <Badge variant="slate" size="sm">Desiccation Risk</Badge>
            )}
            <span className="font-mono text-sm font-bold text-purple-400">
              {Math.round(telemetry.humidity)}%
            </span>
          </div>
        </div>

        <input
          type="range"
          min="20"
          max="100"
          step="1"
          value={telemetry.humidity}
          disabled={disabled}
          onChange={(e) => onChange({ humidity: parseFloat(e.target.value) })}
          className="w-full accent-purple-400 bg-slate-800 rounded-lg cursor-pointer h-2"
          aria-label="Relative humidity slider"
        />

        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>20% (Dry Air)</span>
          <span className="text-purple-400 font-medium">
            Opt: {profile.rhOptMin}%–{profile.rhOptMax}%
          </span>
          <span>100% (Condensing Fog)</span>
        </div>
      </div>

      {/* 4. Transit Shock & Vibration Slider */}
      <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            {t('demo.slider_vib')}
          </span>
          <div className="flex items-center gap-2">
            {telemetry.vibration <= 0.4 ? (
              <Badge variant="mint" size="sm">Smooth Rail Transit</Badge>
            ) : telemetry.vibration > 1.8 ? (
              <Badge variant="danger" size="sm">Severe Shunting Shock</Badge>
            ) : (
              <Badge variant="amber" size="sm">Track Roughness</Badge>
            )}
            <span className="font-mono text-sm font-bold text-amber-400">
              {telemetry.vibration.toFixed(1)} G
            </span>
          </div>
        </div>

        <input
          type="range"
          min="0.1"
          max="3.0"
          step="0.1"
          value={telemetry.vibration}
          disabled={disabled}
          onChange={(e) => onChange({ vibration: parseFloat(e.target.value) })}
          className="w-full accent-amber-400 bg-slate-800 rounded-lg cursor-pointer h-2"
          aria-label="Vibration mechanical shock slider"
        />

        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>0.1 G (Calm Sea Transit)</span>
          <span className="text-amber-400 font-medium">0.4 G Baseline Rail</span>
          <span>3.0 G (Hump Yard Shunting)</span>
        </div>
      </div>

      {/* 5. Controlled Atmosphere (CA) Regulators */}
      <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
        {/* CO2 % */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-cyan-400" />
              <span>CO₂ Atmosphere</span>
            </span>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {(telemetry.co2_pct ?? 4.5).toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="15"
            step="0.5"
            value={telemetry.co2_pct ?? 4.5}
            disabled={disabled}
            onChange={(e) => onChange({ co2_pct: parseFloat(e.target.value) })}
            className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
          />
          <span className="text-[9px] font-mono text-slate-500">Optimum CA: 3.0% – 5.0%</span>
        </div>

        {/* O2 % */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
              <Gauge className="w-3 h-3 text-emerald-400" />
              <span>O₂ Respiration</span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {(telemetry.o2_pct ?? 3.0).toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="21"
            step="0.5"
            value={telemetry.o2_pct ?? 3.0}
            disabled={disabled}
            onChange={(e) => onChange({ o2_pct: parseFloat(e.target.value) })}
            className="w-full accent-emerald-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
          />
          <span className="text-[9px] font-mono text-slate-500">Low-O₂ Quench: 2.0% – 4.0%</span>
        </div>
      </div>

      {/* One-Click Crisis Presets */}
      <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t('demo.presets_title')}
          </span>
          <span className="text-[10px] font-mono text-slate-500">Industry Scenarios</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Preset 1: Optimal Cold Chain */}
          <button
            type="button"
            onClick={() =>
              onSelectPreset({
                temperature: 1.0,
                ethanol: 2.0,
                humidity: 92,
                vibration: 0.2,
                co2_pct: 4.5,
                o2_pct: 3.0,
                waypoint: 'almaty',
                transport_mode: 'RAIL_REEFER',
              })
            }
            className="p-2.5 rounded-lg bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-xs font-medium text-left transition-colors cursor-pointer"
          >
            <div className="font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              1. Optimal Cold Chain
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              +1.0°C • 2 ppm • CA Active
            </div>
          </button>

          {/* Preset 2: Port Kuryk Reefer Cut */}
          <button
            type="button"
            onClick={() =>
              onSelectPreset({
                temperature: 14.5,
                ethanol: 42.0,
                humidity: 91,
                vibration: 0.8,
                co2_pct: 0.4,
                o2_pct: 18.5,
                waypoint: 'kuryk',
                transport_mode: 'RO_PAX_FERRY',
              })
            }
            className="p-2.5 rounded-lg bg-red-950/20 hover:bg-red-950/40 text-red-300 border border-red-500/30 text-xs font-medium text-left transition-colors cursor-pointer"
          >
            <div className="font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              2. Port Kuryk Shore Cut
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              +14.5°C • 42 ppm (Rescue: 14h)
            </div>
          </button>

          {/* Preset 3: Caspian Ro-Pax Voltage Drift */}
          <button
            type="button"
            onClick={() =>
              onSelectPreset({
                temperature: 6.2,
                ethanol: 18.0,
                humidity: 78,
                vibration: 0.6,
                co2_pct: 2.0,
                o2_pct: 12.0,
                waypoint: 'baku',
                transport_mode: 'RO_PAX_FERRY',
              })
            }
            className="p-2.5 rounded-lg bg-amber-950/20 hover:bg-amber-950/40 text-amber-300 border border-amber-500/30 text-xs font-medium text-left transition-colors cursor-pointer"
          >
            <div className="font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              3. Caspian Ferry Gen-Drift
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              +6.2°C • 18 ppm • Mid-Caspian
            </div>
          </button>

          {/* Preset 4: Akhalkalaki Gauge Shunting Shock */}
          <button
            type="button"
            onClick={() =>
              onSelectPreset({
                temperature: 2.8,
                ethanol: 8.0,
                humidity: 84,
                vibration: 2.4,
                waypoint: 'tbilisi',
                transport_mode: 'RAIL_REEFER',
              })
            }
            className="p-2.5 rounded-lg bg-purple-950/20 hover:bg-purple-950/40 text-purple-300 border border-purple-500/30 text-xs font-medium text-left transition-colors cursor-pointer"
          >
            <div className="font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              4. Bogie Exchange Shunt
            </div>
            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
              2.4G Shock • 1520/1435mm Break
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TelemetrySliders;
