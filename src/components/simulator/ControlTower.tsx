'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { TelemetryInput, CargoType, RouteWaypoint } from '@/types/arrhenius';
import { calculateKinetics, COMMODITY_PROFILES } from '@/lib/arrhenius';
import { CargoSelector } from './CargoSelector';
import { TelemetrySliders } from './TelemetrySliders';
import { RouteSelector } from './RouteSelector';
import { ArrheniusChart } from './ArrheniusChart';
import { MiddleCorridorMap } from './MiddleCorridorMap';
import { AIConductorBox } from './AIConductorBox';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Activity, Radio, CheckCircle2, Wifi, WifiOff, Cpu } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

export interface ControlTowerProps {
  shipmentId?: string;
  initialTelemetry?: Partial<TelemetryInput>;
}

export const ControlTower: React.FC<ControlTowerProps> = ({ shipmentId, initialTelemetry }) => {
  const { t } = useI18n();

  // 1. Client Simulation State
  const [telemetry, setTelemetry] = useState<TelemetryInput>({
    cargo: initialTelemetry?.cargo || 'beef',
    temperature: initialTelemetry?.temperature ?? 2.0,
    ethanol: initialTelemetry?.ethanol ?? 4.2,
    humidity: initialTelemetry?.humidity ?? 85,
    vibration: initialTelemetry?.vibration ?? 0.3,
    cargo_value_usd: initialTelemetry?.cargo_value_usd ?? 68000,
    waypoint: initialTelemetry?.waypoint || 'kuryk',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [streamConnected, setStreamConnected] = useState<boolean>(false);
  const [lastStreamTime, setLastStreamTime] = useState<string | null>(null);
  const [mlRulHours, setMlRulHours] = useState<number | null>(null);

  // 2. Synchronous Instant Arrhenius Kinetics Engine (PIML)
  const kinetics = useMemo(() => calculateKinetics(telemetry), [telemetry]);

  // 3. Connect to Real-Time SSE Telemetry Stream
  useEffect(() => {
    if (!isStreaming || typeof window === 'undefined') {
      setStreamConnected(false);
      return;
    }

    const targetShipment = (shipmentId || 'FS-8821').toUpperCase();
    const eventSource = new EventSource(`/api/telemetry/stream?shipmentId=${targetShipment}`);

    eventSource.addEventListener('connected', () => {
      setStreamConnected(true);
    });

    eventSource.addEventListener('telemetry', (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload && payload.telemetry) {
          setStreamConnected(true);
          setLastStreamTime(new Date().toLocaleTimeString());

          setTelemetry((prev) => ({
            ...prev,
            temperature: typeof payload.telemetry.temperature === 'number' ? payload.telemetry.temperature : prev.temperature,
            humidity: typeof payload.telemetry.humidity === 'number' ? payload.telemetry.humidity : prev.humidity,
            ethanol: typeof payload.telemetry.ethanol === 'number' ? payload.telemetry.ethanol : prev.ethanol,
            vibration: typeof payload.telemetry.vibration === 'number' ? payload.telemetry.vibration : prev.vibration,
            waypoint: (payload.telemetry.location as RouteWaypoint) || prev.waypoint,
          }));

          if (payload.prediction?.rul_hours != null) {
            setMlRulHours(payload.prediction.rul_hours);
          }
        }
      } catch (err) {
        console.warn('Error parsing incoming SSE telemetry payload:', err);
      }
    });

    eventSource.onerror = () => {
      setStreamConnected(false);
    };

    return () => {
      eventSource.close();
      setStreamConnected(false);
    };
  }, [isStreaming, shipmentId]);

  // 4. State Update Handlers
  const handleCargoChange = (cargo: CargoType) => {
    const prof = COMMODITY_PROFILES[cargo];
    setTelemetry((prev) => ({
      ...prev,
      cargo,
      temperature: prof.tRef,
      cargo_value_usd: prof.defaultCargoValueUsd,
    }));
  };

  const handleTelemetryChange = (updated: Partial<TelemetryInput>) => {
    // When user manually moves a slider, pause automatic stream overwrite temporarily
    setTelemetry((prev) => ({ ...prev, ...updated }));
  };

  const handleSelectPreset = (preset: Partial<TelemetryInput>) => {
    setTelemetry((prev) => ({ ...prev, ...preset }));
  };

  const handleSelectWaypoint = (waypoint: RouteWaypoint) => {
    setTelemetry((prev) => ({ ...prev, ...{ waypoint } }));
  };

  const handleDispatchAutonomousCommand = () => {
    setToastMessage(t('demo.ai_toast_dispatched'));
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Status Color Logic for Gauges
  const statusColor = useMemo(() => {
    if (kinetics.alert_severity === 'CRITICAL' || kinetics.health_index < 40) return '#ef4444'; // Red
    if (kinetics.alert_severity === 'WARNING' || kinetics.health_index < 65) return '#f97316';  // Orange
    if (kinetics.health_index < 85) return '#f59e0b';                                          // Amber
    return '#10b981';                                                                          // Mint Green
  }, [kinetics.alert_severity, kinetics.health_index]);

  return (
    <div className="flex flex-col gap-8 py-6">
      {/* Top Header & Telemetry Status Bar */}
      <section>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800 dark:border-slate-800 light:border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="mint" size="sm" dot>
                Interactive Simulation & Monitoring
              </Badge>
              <span className="text-xs font-mono text-slate-400 dark:text-slate-400 light:text-slate-500">
                PIML Arrhenius + Real ONNX
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">
              {t('demo.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-400 light:text-slate-600 mt-1">
              {t('demo.subhead')}
            </p>
          </div>

          {/* Telematics Bar & SSE Stream Controls */}
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-slate-900/80 dark:bg-slate-900/80 light:bg-white/90 border border-slate-800 dark:border-slate-800 light:border-slate-200 text-xs font-mono shadow-sm">
            <span className="text-emerald-400 dark:text-emerald-400 light:text-emerald-600 font-bold">
              {shipmentId ? `ID: ${shipmentId}` : t('demo.container_id')}
            </span>
            <span className="text-slate-600 dark:text-slate-600 light:text-slate-300">|</span>
            <span className="text-slate-300 dark:text-slate-300 light:text-slate-700">
              {t('demo.transit_segment')}
            </span>
            <span className="text-slate-600 dark:text-slate-600 light:text-slate-300">|</span>

            {/* Real-Time Live Streaming Toggle & Indicator */}
            <button
              onClick={() => setIsStreaming(!isStreaming)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer border ${
                streamConnected
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
                  : isStreaming
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
              title={isStreaming ? 'Live SSE stream active. Click to pause.' : 'Live stream paused. Click to connect.'}
            >
              {streamConnected ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>LIVE SSE {lastStreamTime ? `(${lastStreamTime})` : ''}</span>
                </>
              ) : isStreaming ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>CONNECTING...</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-slate-500" />
                  <span>STREAM PAUSED</span>
                </>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Toast Alert Notification */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 dark:bg-emerald-950/80 light:bg-emerald-50 border border-emerald-500 text-emerald-200 dark:text-emerald-200 light:text-emerald-900 text-xs flex items-center justify-between shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white p-1 cursor-pointer"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Perishable Commodity Selector Grid */}
      <CargoSelector
        selectedCargo={telemetry.cargo}
        onSelectCargo={handleCargoChange}
      />

      {/* 3-Column Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Column 1: Telemetry Inputs */}
        <div className="flex flex-col gap-6">
          <GlassCard className="p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-3">
              <h3 className="font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" />
                <span>Active Telemetry Controls</span>
              </h3>
              <Badge variant={streamConnected ? 'mint' : 'slate'} size="sm" dot={streamConnected}>
                {streamConnected ? 'IoT Stream Live' : 'Manual Tuning'}
              </Badge>
            </div>

            <TelemetrySliders
              telemetry={telemetry}
              onChange={handleTelemetryChange}
              onSelectPreset={handleSelectPreset}
            />
          </GlassCard>
        </div>

        {/* Column 2: Digital Twin Outputs & Live Decay Graph */}
        <div className="flex flex-col gap-6">
          <GlassCard variant="glow-mint" className="p-6 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-3">
              <h3 className="font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4" style={{ color: statusColor }} />
                <span>{t('demo.bhi_title')}</span>
              </h3>
              <div className="flex items-center gap-2">
                {mlRulHours != null && (
                  <Badge variant="purple" size="sm">
                    <Cpu className="w-3 h-3 mr-1 inline" />
                    ONNX: {mlRulHours.toFixed(1)}h
                  </Badge>
                )}
                <Badge
                  variant={
                    kinetics.alert_severity === 'CRITICAL'
                      ? 'danger'
                      : kinetics.alert_severity === 'WARNING'
                      ? 'amber'
                      : 'mint'
                  }
                  size="sm"
                  dot
                >
                  {kinetics.alert_severity}
                </Badge>
              </div>
            </div>

            {/* BHI Radial Gauge & Shelf-Life Metric */}
            <div className="flex flex-col sm:flex-row items-center justify-around p-5 bg-slate-950/70 dark:bg-slate-950/70 light:bg-slate-50 rounded-xl border border-slate-800 dark:border-slate-800 light:border-slate-200 gap-4">
              <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#1e293b"
                    strokeWidth="8"
                    fill="transparent"
                    className="dark:stroke-slate-800 light:stroke-slate-200"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke={statusColor}
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - kinetics.health_index / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-300"
                  />
                </svg>
                <div className="absolute text-center">
                  <span className="text-3xl font-black text-white dark:text-white light:text-slate-900 font-mono">
                    {kinetics.health_index.toFixed(1)}%
                  </span>
                  <span className="block text-[9px] text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase font-mono tracking-wider">
                    BHI Score
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-1">
                <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-semibold uppercase tracking-wider">
                  {t('demo.rsl_title')}
                </span>
                <span className="text-2xl font-black text-white dark:text-white light:text-slate-900 font-mono">
                  {kinetics.shelf_life_days.toFixed(1)} {t('demo.rsl_days')}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono">
                  ({kinetics.shelf_life_hours.toFixed(1)} {t('demo.rsl_hours')} Total)
                </span>
                <div className="mt-1">
                  {kinetics.shelf_life_hours >= 432 ? (
                    <Badge variant="mint" size="sm">
                      +{( (kinetics.shelf_life_hours - 432) / 24 ).toFixed(1)}d Transit Buffer
                    </Badge>
                  ) : (
                    <Badge variant="danger" size="sm" dot>
                      DEFICIT: {( (432 - kinetics.shelf_life_hours) / 24 ).toFixed(1)}d Shortage!
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Live Arrhenius Exponential Decay Curve Chart */}
            <ArrheniusChart
              decayCurve={kinetics.decay_curve}
              kRate={kinetics.k_rate}
              healthIndex={kinetics.health_index}
              alertSeverity={kinetics.alert_severity}
              currentTransitHour={144}
            />
          </GlassCard>
        </div>

        {/* Column 3: Corridor Route & AI Conductor Decision Engine */}
        <div className="flex flex-col gap-6">
          {/* Middle Corridor Interactive Animated Map */}
          <GlassCard className="p-6 flex flex-col gap-4">
            <MiddleCorridorMap
              activeWaypoint={telemetry.waypoint || 'kuryk'}
              onSelectWaypoint={handleSelectWaypoint}
              isAlertCritical={kinetics.is_ethanol_critical}
            />
          </GlassCard>

          {/* Corridor Waypoint Selector */}
          <GlassCard className="p-6 flex flex-col gap-4">
            <RouteSelector
              selectedWaypoint={telemetry.waypoint || 'kuryk'}
              onSelectWaypoint={handleSelectWaypoint}
            />
          </GlassCard>

          {/* AI Conductor Decision Box */}
          <AIConductorBox
            kinetics={kinetics}
            onDispatchCommand={handleDispatchAutonomousCommand}
          />
        </div>
      </div>
    </div>
  );
};

export default ControlTower;
