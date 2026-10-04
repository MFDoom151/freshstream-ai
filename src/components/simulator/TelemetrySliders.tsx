'use client';

import React from 'react';
import { TelemetryInput } from '@/types/arrhenius';
import { COMMODITY_PROFILES } from '@/lib/arrhenius';
import { Badge } from '@/components/ui/Badge';
import { Thermometer, Wind, Droplets, Activity, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface TelemetrySlidersProps {
  telemetry: TelemetryInput;
  onChange: (updated: Partial<TelemetryInput>) => void;
  onSelectPreset: (preset: Partial<TelemetryInput>) => void;
  disabled?: boolean;
}

export const TelemetrySliders: React.FC<TelemetrySlidersProps> = ({
  telemetry,
  onChange,
  onSelectPreset,
  disabled = false,
}) => {
  const { t } = useI18n();
  const profile = COMMODITY_PROFILES[telemetry.cargo] || COMMODITY_PROFILES.beef;
  const isEthanolCritical = telemetry.ethanol > 35;

  return (
    <div className="flex flex-col gap-5">
      {/* 1. Temperature Slider */}
      <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-950/70 dark:bg-slate-950/70 light:bg-white/80 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 flex items-center gap-1.5">
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
            <span className="font-mono text-sm font-bold text-cyan-400 dark:text-cyan-400 light:text-cyan-600">
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
          className="w-full accent-cyan-400 bg-slate-800 dark:bg-slate-800 light:bg-slate-200 rounded-lg cursor-pointer h-2"
          aria-label="Temperature slider"
        />

        <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 light:text-slate-500 font-mono">
          <span>-5.0°C (Deep Chill)</span>
          <span className="text-emerald-400 dark:text-emerald-400/90 light:text-emerald-600 font-medium">
            Opt: {profile.tOptMin > 0 ? `+${profile.tOptMin}` : profile.tOptMin}°C to +{profile.tOptMax}°C
          </span>
          <span>+35.0°C (Extreme Heat)</span>
        </div>
      </div>

      {/* 2. Volatile Ethanol Gas (C2H4) Slider */}
      <div
        className={`flex flex-col gap-2 p-3.5 rounded-xl border transition-colors ${
          isEthanolCritical
            ? 'bg-red-950/30 dark:bg-red-950/30 light:bg-red-50/80 border-red-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
            : 'bg-slate-950/70 dark:bg-slate-950/70 light:bg-white/80 border-slate-800/80 dark:border-slate-800/80 light:border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 flex items-center gap-1.5">
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
                isEthanolCritical
                  ? 'text-red-400 dark:text-red-400 light:text-red-600'
                  : 'text-emerald-400 dark:text-emerald-400 light:text-emerald-600'
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
          className={`w-full bg-slate-800 dark:bg-slate-800 light:bg-slate-200 rounded-lg cursor-pointer h-2 ${
            isEthanolCritical ? 'accent-red-500' : 'accent-emerald-400'
          }`}
          aria-label="Volatile ethanol slider"
        />

        <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 light:text-slate-500 font-mono">
          <span>0 ppm (Pristine)</span>
          <span className="text-red-400 dark:text-red-400 light:text-red-600 font-bold flex items-center gap-0.5">
            <AlertTriangle className="w-2.5 h-2.5" /> 35 ppm Spoilage Limit
          </span>
          <span>100 ppm (Putrefaction)</span>
        </div>
      </div>

      {/* 3. Relative Humidity Slider */}
      <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-950/70 dark:bg-slate-950/70 light:bg-white/80 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-purple-400" />
            {t('demo.slider_rh')}
          </span>
          <div className="flex items-center gap-2">
            {telemetry.humidity >= profile.rhOptMin && telemetry.humidity <= profile.rhOptMax ? (
              <Badge variant="mint" size="sm">Optimal RH</Badge>
            ) : telemetry.humidity > profile.rhOptMax ? (
              <Badge variant="amber" size="sm">Condensation</Badge>
            ) : (
              <Badge variant="slate" size="sm">Desiccation</Badge>
            )}
            <span className="font-mono text-sm font-bold text-purple-400 dark:text-purple-400 light:text-purple-600">
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
          className="w-full accent-purple-400 bg-slate-800 dark:bg-slate-800 light:bg-slate-200 rounded-lg cursor-pointer h-2"
          aria-label="Relative humidity slider"
        />

        <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 light:text-slate-500 font-mono">
          <span>20% (Dry Air)</span>
          <span className="text-purple-400 dark:text-purple-400/90 light:text-purple-600 font-medium">
            Opt: {profile.rhOptMin}%–{profile.rhOptMax}%
          </span>
          <span>100% (Saturated Fog)</span>
        </div>
      </div>

      {/* 4. Mechanical Transit Vibration Slider */}
      <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-slate-950/70 dark:bg-slate-950/70 light:bg-white/80 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200 dark:text-slate-200 light:text-slate-800 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            {t('demo.slider_vib')}
          </span>
          <div className="flex items-center gap-2">
            {telemetry.vibration <= 0.4 ? (
              <Badge variant="mint" size="sm">Smooth Rail</Badge>
            ) : telemetry.vibration > 1.8 ? (
              <Badge variant="danger" size="sm">Severe Impact</Badge>
            ) : (
              <Badge variant="amber" size="sm">Track Jolt</Badge>
            )}
            <span className="font-mono text-sm font-bold text-amber-400 dark:text-amber-400 light:text-amber-600">
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
          className="w-full accent-amber-400 bg-slate-800 dark:bg-slate-800 light:bg-slate-200 rounded-lg cursor-pointer h-2"
          aria-label="Vibration mechanical shock slider"
        />

        <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 light:text-slate-500 font-mono">
          <span>0.1 G (Calm Sea Hold)</span>
          <span className="text-amber-400 dark:text-amber-400/90 light:text-amber-600 font-medium">0.4 G Baseline</span>
          <span>3.0 G (Caucasus Shunting)</span>
        </div>
      </div>

      {/* One-Click Crisis Presets */}
      <div className="flex flex-col gap-2.5 pt-3 border-t border-slate-800 dark:border-slate-800 light:border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-400 light:text-slate-600 uppercase tracking-wider">
            {t('demo.presets_title')}
          </span>
          <span className="text-[10px] font-mono text-slate-500">Preset Injections</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Preset 1: Optimal Cold Chain */}
          <button
            type="button"
            onClick={() =>
              onSelectPreset({
                temperature: 1.5,
                ethanol: 2.0,
                humidity: 82,
                vibration: 0.2,
                waypoint: 'kuryk',
              })
            }
            className="p-2.5 rounded-lg bg-emerald-950/20 dark:bg-emerald-950/20 light:bg-emerald-50 hover:bg-emerald-950/40 text-emerald-300 dark:text-emerald-300 light:text-emerald-800 border border-emerald-500/30 text-xs font-medium text-left transition-colors cursor-pointer"
          >
            <div className="font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              1. Optimal Cold Chain
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono mt-0.5">
              +1.5°C • 2 ppm • 0.2G
            </div>
          </button>

          {/* Preset 2: Port Kuryk Reefer Cut (triggers 14.7h rescue window!) */}
          <button
            type="button"
            onClick={() =>
              onSelectPreset({
                temperature: 18.0,
                ethanol: 42.0,
                humidity: 92,
                vibration: 1.2,
                waypoint: 'kuryk',
              })
            }
            className="p-2.5 rounded-lg bg-red-950/40 dark:bg-red-950/40 light:bg-red-50 hover:bg-red-950/60 text-red-300 dark:text-red-300 light:text-red-800 border border-red-500/50 text-xs font-medium text-left transition-colors cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.2)]"
          >
            <div className="font-bold flex items-center gap-1.5 text-red-300 dark:text-red-200 light:text-red-800">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
              2. Port Kuryk Reefer Cut
            </div>
            <div className="text-[10px] text-red-300/80 dark:text-red-300/80 light:text-red-700 font-mono mt-0.5 font-bold">
              +18.0°C • 42 ppm (14h Rescue!)
            </div>
          </button>

          {/* Preset 3: Caucasus Rail Shunting */}
          <button
            type="button"
            onClick={() =>
              onSelectPreset({
                temperature: 5.5,
                ethanol: 6.0,
                humidity: 78,
                vibration: 2.4,
                waypoint: 'poti',
              })
            }
            className="p-2.5 rounded-lg bg-amber-950/20 dark:bg-amber-950/20 light:bg-amber-50 hover:bg-amber-950/40 text-amber-300 dark:text-amber-300 light:text-amber-800 border border-amber-500/30 text-xs font-medium text-left transition-colors cursor-pointer"
          >
            <div className="font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              3. Caucasus Rail Shunting
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono mt-0.5">
              +5.5°C • 2.4 G Shock • Poti
            </div>
          </button>

          {/* Preset 4: Caspian Ferry Heatwave */}
          <button
            type="button"
            onClick={() =>
              onSelectPreset({
                temperature: 31.0,
                ethanol: 68.0,
                humidity: 96,
                vibration: 0.8,
                waypoint: 'baku',
              })
            }
            className="p-2.5 rounded-lg bg-purple-950/20 dark:bg-purple-950/20 light:bg-purple-50 hover:bg-purple-950/40 text-purple-300 dark:text-purple-300 light:text-purple-800 border border-purple-500/30 text-xs font-medium text-left transition-colors cursor-pointer"
          >
            <div className="font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              4. Caspian Ferry Heatwave
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 font-mono mt-0.5">
              +31.0°C • 68 ppm • Baku Port
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TelemetrySliders;
