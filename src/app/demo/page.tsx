'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/lib/i18n/context';
import { INITIAL_SHIPMENTS } from '@/lib/shipments-data';
import { 
  TransportMode, 
  CargoConditionTelemetry, 
  CargoCommodity,
  COMMODITY_KINETIC_PROFILES,
  calculateBiologicalHealth,
  generateDCSA30Payload,
  generateKTZRailPayload,
  generateAISMaritimePayload
} from '@/types/telemetry';
import { 
  getModeConfig, 
  TRANSPORT_MODES_CONFIG,
  CORRIDOR_HUBS,
  CORRIDOR_EVENTS,
  interpolateTrackPosition,
  getTrackCoordinatesForMode
} from '@/lib/map-data';
import { 
  Radio, 
  ShieldCheck, 
  Flame, 
  AlertTriangle, 
  Thermometer, 
  Droplets, 
  Wind, 
  Activity, 
  Gauge, 
  Train, 
  Ship, 
  Truck, 
  Box, 
  Layers, 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight, 
  Send, 
  Copy, 
  Check, 
  X, 
  Code, 
  ArrowUpRight, 
  Sparkles,
  ExternalLink,
  Cpu,
  Zap,
  Info
} from 'lucide-react';

// Dynamic import of Leaflet Digital Twin Map (SSR disabled for window/navigator safety)
const DigitalTwinMap = dynamic(() => import('@/components/map/DigitalTwinMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[620px] sm:h-[680px] lg:h-[720px] rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-3 text-slate-400 font-mono text-xs">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80">
        <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
        <span className="text-white font-bold tracking-wider">LOADING LEAFLET GIS CANVAS</span>
      </div>
      <p className="text-slate-500 text-[11px]">
        Mounting 16 Middle Corridor Hubs, Rail Tracks & Caspian Ro-Pax Fairways...
      </p>
    </div>
  ),
});

export default function DemoPage() {
  const { t } = useI18n();

  // Active Transport Modality State
  const [activeMode, setActiveMode] = useState<TransportMode>('MULTIMODAL_COMBO');
  const activeModeConfig = useMemo(() => getModeConfig(activeMode), [activeMode]);

  // Route Animation State
  const [animationProgress, setAnimationProgress] = useState<number>(0.25);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playSpeed, setPlaySpeed] = useState<number>(1); // 1x, 2x, 5x

  // Cargo Condition Telemetry State
  const [conditionTelemetry, setConditionTelemetry] = useState<CargoConditionTelemetry>({
    commodity: 'pears',
    setPointCelsius: 1.0,
    actualCelsius: 2.4,
    relativeHumidity: 91,
    ethylenePpm: 1.2,
    volatileEthanolPpm: 4.8,
    co2Percent: 4.5,
    o2Percent: 3.0,
    vibrationG: 0.4,
    transportMode: 'MULTIMODAL_COMBO',
    assetValueUsd: 68000,
  });

  // Standards Modal State
  const [isStandardsModalOpen, setIsStandardsModalOpen] = useState<boolean>(false);
  const [activeStandardTab, setActiveStandardTab] = useState<'dcsa' | 'ktz' | 'ais'>('dcsa');
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [simulatedPingSuccess, setSimulatedPingSuccess] = useState<string | null>(null);
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);

  // Dynamic biological calculations
  const calculations = useMemo(() => {
    return calculateBiologicalHealth(conditionTelemetry);
  }, [conditionTelemetry]);

  // Current track coordinates and interpolated position
  const activeTrack = useMemo(() => {
    return getTrackCoordinatesForMode(activeMode);
  }, [activeMode]);

  const vehiclePosition = useMemo(() => {
    return interpolateTrackPosition(activeTrack, animationProgress);
  }, [activeTrack, animationProgress]);

  // Handle animation timer
  useEffect(() => {
    if (!isPlaying) return;

    const baseStep = 0.003 * playSpeed;
    const interval = setInterval(() => {
      setAnimationProgress((prev) => {
        const next = prev + baseStep;
        return next > 1.0 ? 0.0 : next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, playSpeed]);

  // Sync mode changes to telemetry
  const handleSelectMode = (mode: TransportMode) => {
    setActiveMode(mode);
    setConditionTelemetry((prev) => ({
      ...prev,
      transportMode: mode,
    }));
  };

  // Preset transit crisis scenarios
  const applyPresetScenario = (scenarioIndex: number) => {
    switch (scenarioIndex) {
      case 1: // Optimal Cold Chain
        setConditionTelemetry({
          commodity: 'pears',
          setPointCelsius: 1.0,
          actualCelsius: 1.2,
          relativeHumidity: 92,
          ethylenePpm: 0.4,
          volatileEthanolPpm: 2.1,
          co2Percent: 4.8,
          o2Percent: 3.0,
          vibrationG: 0.3,
          transportMode: 'RAIL_REEFER',
          assetValueUsd: 68000,
        });
        setActiveMode('RAIL_REEFER');
        setAnimationProgress(0.18);
        break;

      case 2: // Port Kuryk Staging Shore-Power Cut
        setConditionTelemetry({
          commodity: 'berries',
          setPointCelsius: 1.5,
          actualCelsius: 14.5,
          relativeHumidity: 91,
          ethylenePpm: 4.6,
          volatileEthanolPpm: 42.0, // >35 ppm critical threshold!
          co2Percent: 0.4,
          o2Percent: 18.5,
          vibrationG: 0.8,
          transportMode: 'RO_PAX_FERRY',
          assetValueUsd: 54000,
        });
        setActiveMode('RO_PAX_FERRY');
        setAnimationProgress(0.48);
        break;

      case 3: // Mid-Caspian Auxiliary Voltage Sag
        setConditionTelemetry({
          commodity: 'dairy',
          setPointCelsius: 3.0,
          actualCelsius: 6.4,
          relativeHumidity: 79,
          ethylenePpm: 0.2,
          volatileEthanolPpm: 18.4,
          co2Percent: 1.8,
          o2Percent: 14.0,
          vibrationG: 0.6,
          transportMode: 'RO_PAX_FERRY',
          assetValueUsd: 46000,
        });
        setActiveMode('RO_PAX_FERRY');
        setAnimationProgress(0.55);
        break;

      case 4: // Akhalkalaki Bogie Exchange Rail Shock
        setConditionTelemetry({
          commodity: 'beef',
          setPointCelsius: 0.5,
          actualCelsius: 2.8,
          relativeHumidity: 85,
          ethylenePpm: 0.0,
          volatileEthanolPpm: 8.2,
          co2Percent: 3.5,
          o2Percent: 4.5,
          vibrationG: 2.4, // severe shock during shunting!
          transportMode: 'RAIL_REEFER',
          assetValueUsd: 85000,
        });
        setActiveMode('RAIL_REEFER');
        setAnimationProgress(0.72);
        break;

      case 5: // Ethylene Cross-Contamination Surge
        setConditionTelemetry({
          commodity: 'pears',
          setPointCelsius: 1.0,
          actualCelsius: 3.2,
          relativeHumidity: 88,
          ethylenePpm: 7.8, // high ethylene spike!
          volatileEthanolPpm: 14.0,
          co2Percent: 2.5,
          o2Percent: 8.0,
          vibrationG: 0.4,
          transportMode: 'SMART_REEFER_CONTAINER',
          assetValueUsd: 68000,
        });
        setActiveMode('SMART_REEFER_CONTAINER');
        setAnimationProgress(0.35);
        break;
    }
  };

  // Standards JSON Payloads
  const getStandardsPayload = () => {
    switch (activeStandardTab) {
      case 'dcsa':
        return JSON.stringify(generateDCSA30Payload(conditionTelemetry, 'FS-8821', 'KZKRK'), null, 2);
      case 'ktz':
        return JSON.stringify(generateKTZRailPayload(conditionTelemetry, 'FS-8821'), null, 2);
      case 'ais':
        return JSON.stringify(generateAISMaritimePayload(conditionTelemetry, 'FS-8821'), null, 2);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(getStandardsPayload());
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleSimulateIngest = () => {
    setIsTransmitting(true);
    setSimulatedPingSuccess(null);
    setTimeout(() => {
      setIsTransmitting(false);
      setSimulatedPingSuccess('HTTP 200 OK • Ingested via FreshStream IoT Gateway (14ms latency)');
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* 1. TOP HEADER & BREADCRUMB */}
      <div className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <Container className="py-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Identity & Badges */}
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    Trans-Caspian Digital Twin & Control Tower
                  </h1>
                  <Badge variant="mint" size="sm" dot>
                    PRODUCTION SIMULATOR
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  Real-time IoT Telemetry, Arrhenius Biological Kinetics & Multimodal Route Optimization
                </p>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsStandardsModalOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-mono text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Code className="w-3.5 h-3.5 text-cyan-400" />
                <span>Logistics Standards Schemas</span>
              </button>

              <Link
                href="/dashboard"
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white flex items-center gap-1 transition-colors shadow-sm"
              >
                <span>Live Fleet</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </Container>
      </div>

      <Container className="pt-6 space-y-6">
        {/* 2. FOUR KEY CORRIDOR METRICS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Corridor Status */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>CORRIDOR SCOPE</span>
              </span>
              <span className="text-emerald-400 font-bold">TITR SYNC</span>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold text-white tracking-tight">
                4,500 km Route
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                16 Hubs • 2 Gauge-Breaks • 1 Ro-Pax Ferry
              </div>
            </div>
          </div>

          {/* Card 2: Biological Health Index (BHI) */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>BIOLOGICAL HEALTH (BHI)</span>
              </span>
              <span className={`font-bold ${
                calculations.bhi >= 80 ? 'text-emerald-400' : calculations.bhi >= 60 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {calculations.status}
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                  calculations.bhi >= 80 ? 'text-emerald-400' : calculations.bhi >= 60 ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {calculations.bhi}%
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {calculations.accelerationFactor}x decay rate
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    calculations.bhi >= 80 ? 'bg-emerald-400' : calculations.bhi >= 60 ? 'bg-amber-400' : 'bg-red-500'
                  }`}
                  style={{ width: `${calculations.bhi}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Predicted Shelf Life (RUL) */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>REMAINING SHELF LIFE</span>
              </span>
              <span className="text-slate-300 font-mono">ARRHENIUS</span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black font-mono text-cyan-300 tracking-tight">
                {calculations.predictedRulHours} Hours
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Approx. {calculations.predictedRulDays} Days remaining quality
              </div>
            </div>
          </div>

          {/* Card 4: Thermal Excursion Delta */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
              <span className="flex items-center gap-1.5">
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
                <span>THERMAL EXCURSION (ΔT)</span>
              </span>
              <Badge
                variant={
                  calculations.thermalStatus === 'OPTIMAL'
                    ? 'mint'
                    : calculations.thermalStatus === 'ACCEPTABLE'
                    ? 'slate'
                    : calculations.thermalStatus === 'WARNING'
                    ? 'warning'
                    : 'danger'
                }
                size="sm"
              >
                {calculations.thermalStatus}
              </Badge>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black font-mono tracking-tight text-white flex items-baseline gap-1.5">
                <span>{calculations.thermalDelta > 0 ? `+${calculations.thermalDelta}` : calculations.thermalDelta}°C</span>
                <span className="text-xs text-slate-400 font-normal">
                  (T_act {conditionTelemetry.actualCelsius}°C - T_set {conditionTelemetry.setPointCelsius}°C)
                </span>
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Target: {conditionTelemetry.setPointCelsius.toFixed(1)}°C Setpoint
              </div>
            </div>
          </div>
        </div>

        {/* 3. MAIN WORKSPACE: MAP DIGITAL TWIN + TELEMETRY CONTROLS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT 7 COLS: LARGE DIGITAL TWIN MAP CANVAS */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* 5-Mode Transport Header Selector */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Select Active Transport Modality (5 Modes)</span>
                </span>
                <span className="text-[11px] font-mono text-cyan-400 font-semibold">
                  Camera: Auto-Fit Corridor
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {(['RAIL_REEFER', 'RO_PAX_FERRY', 'TIR_TRUCK', 'SMART_REEFER_CONTAINER', 'MULTIMODAL_COMBO'] as TransportMode[]).map((modeKey) => {
                  const isSelected = activeMode === modeKey;
                  const cfg = TRANSPORT_MODES_CONFIG[modeKey];

                  let ModeIcon = Train;
                  if (cfg.vehicleType === 'SHIP') ModeIcon = Ship;
                  if (cfg.vehicleType === 'TRUCK') ModeIcon = Truck;
                  if (cfg.vehicleType === 'CONTAINER') ModeIcon = Box;
                  if (cfg.vehicleType === 'MULTIMODAL') ModeIcon = Layers;

                  return (
                    <button
                      key={modeKey}
                      type="button"
                      onClick={() => handleSelectMode(modeKey)}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-800 border-cyan-400 shadow-md ring-1 ring-cyan-400/40 text-white'
                          : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <ModeIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                        <span className="text-[11px] font-bold truncate">{cfg.shortName}</span>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 truncate">
                        {cfg.vehicleType}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Real Map Component */}
            <div className="relative">
              <DigitalTwinMap
                shipments={INITIAL_SHIPMENTS}
                activeMode={activeMode}
                onSelectMode={handleSelectMode}
                conditionTelemetry={conditionTelemetry}
                animationProgress={animationProgress}
                isPlayingAnimation={isPlaying}
                onTogglePlay={() => setIsPlaying(!isPlaying)}
                className="w-full shadow-2xl"
              />
            </div>

            {/* Animation Progress & Telemetry Readout Ribbon */}
            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`p-2 rounded-lg border text-white font-medium flex items-center gap-1 transition-colors cursor-pointer ${
                    isPlaying
                      ? 'bg-emerald-600 hover:bg-emerald-500 border-emerald-500'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlaying ? 'Pause' : 'Traverse Track'}</span>
                </button>

                {/* Speed Multiplier */}
                <div className="flex items-center p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                  {[1, 2, 5].map((spd) => (
                    <button
                      key={spd}
                      type="button"
                      onClick={() => setPlaySpeed(spd)}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        playSpeed === spd ? 'bg-cyan-500/20 text-cyan-300 font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Progress & Geodesic Telematics Readout */}
              <div className="flex items-center gap-3 text-slate-300 text-[11px]">
                <span>Progress: <strong className="text-cyan-400">{Math.round(animationProgress * 100)}%</strong></span>
                <span className="text-slate-600">•</span>
                <span>Distance: <strong className="text-white">{vehiclePosition.distanceCoveredKm} km</strong> / {vehiclePosition.totalDistanceKm} km</span>
                <span className="text-slate-600">•</span>
                <span>Bearing: <strong className="text-emerald-400">{vehiclePosition.bearingDegrees}°</strong></span>
              </div>
            </div>
          </div>

          {/* RIGHT 5 COLS: INTERACTIVE CARGO CONDITIONS & BIOLOGICAL ENGINE */}
          <div className="lg:col-span-5 flex flex-col gap-5">
            {/* Commodity Selector Card */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Perishable Commodity Profile</span>
                </span>
                <Badge variant="mint" size="sm">
                  {COMMODITY_KINETIC_PROFILES[conditionTelemetry.commodity].eaKjMol} kJ/mol Ea
                </Badge>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {(Object.keys(COMMODITY_KINETIC_PROFILES) as CargoCommodity[]).map((commKey) => {
                  const isSelected = conditionTelemetry.commodity === commKey;
                  const profile = COMMODITY_KINETIC_PROFILES[commKey];

                  return (
                    <button
                      key={commKey}
                      type="button"
                      onClick={() => {
                        setConditionTelemetry((prev) => ({
                          ...prev,
                          commodity: commKey,
                          setPointCelsius: profile.tSetDefault,
                          assetValueUsd: profile.nominalAssetValueUsd,
                        }));
                      }}
                      className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40 text-white'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold truncate">{profile.nameEn.split(' ')[0]}</span>
                      <span className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                        Opt: {profile.tOptMin}°C..{profile.tOptMax}°C
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dual Temperature Controls: T_set vs T_act */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Dual Temperature & Excursion</span>
                </span>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  ΔT = {calculations.thermalDelta > 0 ? `+${calculations.thermalDelta}` : calculations.thermalDelta}°C
                </span>
              </div>

              {/* Slider 1: Target Setpoint (T_set) */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Reefer Setpoint (T_set)</span>
                  <span className="font-mono font-bold text-cyan-300">
                    {conditionTelemetry.setPointCelsius > 0 ? `+${conditionTelemetry.setPointCelsius.toFixed(1)}` : conditionTelemetry.setPointCelsius.toFixed(1)}°C
                  </span>
                </div>
                <input
                  type="range"
                  min="-2.0"
                  max="8.0"
                  step="0.5"
                  value={conditionTelemetry.setPointCelsius}
                  onChange={(e) =>
                    setConditionTelemetry((prev) => ({
                      ...prev,
                      setPointCelsius: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-cyan-400 bg-slate-800 rounded-lg cursor-pointer h-2"
                  aria-label="Temperature setpoint"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>-2.0°C (Pre-chill)</span>
                  <span>+8.0°C (Tropical)</span>
                </div>
              </div>

              {/* Slider 2: Actual Measured Temperature (T_act) */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Actual Core Temperature (T_act)</span>
                  <span className={`font-mono font-bold ${
                    calculations.thermalStatus === 'CRITICAL' ? 'text-red-400' : calculations.thermalStatus === 'WARNING' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {conditionTelemetry.actualCelsius > 0 ? `+${conditionTelemetry.actualCelsius.toFixed(1)}` : conditionTelemetry.actualCelsius.toFixed(1)}°C
                  </span>
                </div>
                <input
                  type="range"
                  min="-5.0"
                  max="35.0"
                  step="0.5"
                  value={conditionTelemetry.actualCelsius}
                  onChange={(e) =>
                    setConditionTelemetry((prev) => ({
                      ...prev,
                      actualCelsius: parseFloat(e.target.value),
                    }))
                  }
                  className={`w-full bg-slate-800 rounded-lg cursor-pointer h-2 ${
                    calculations.thermalStatus === 'CRITICAL' ? 'accent-red-500' : 'accent-emerald-400'
                  }`}
                  aria-label="Actual temperature"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>-5.0°C (Deep Chill)</span>
                  <span>+35.0°C (Heatwave Breach)</span>
                </div>
              </div>
            </div>

            {/* Atmosphere & Physiological Gas Sliders */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-4">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Wind className="w-3.5 h-3.5 text-purple-400" />
                <span>Atmospheric Sensors & Phytohormones</span>
              </span>

              {/* Volatile Ethanol (Anaerobic Fermentation Marker) */}
              <div className={`flex flex-col gap-1.5 p-3 rounded-xl border transition-colors ${
                calculations.anaerobicDecayAlert
                  ? 'bg-red-950/30 border-red-500/60'
                  : 'bg-slate-950/70 border-slate-800/80'
              }`}>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Volatile Ethanol (Anaerobic Marker)</span>
                  <span className={`font-mono font-bold ${calculations.anaerobicDecayAlert ? 'text-red-400' : 'text-emerald-400'}`}>
                    {conditionTelemetry.volatileEthanolPpm.toFixed(1)} ppm
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={conditionTelemetry.volatileEthanolPpm}
                  onChange={(e) =>
                    setConditionTelemetry((prev) => ({
                      ...prev,
                      volatileEthanolPpm: parseFloat(e.target.value),
                    }))
                  }
                  className={`w-full bg-slate-800 rounded-lg cursor-pointer h-2 ${
                    calculations.anaerobicDecayAlert ? 'accent-red-500' : 'accent-emerald-400'
                  }`}
                  aria-label="Volatile ethanol"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0 ppm (Pristine)</span>
                  <span className="text-red-400 font-bold">&gt;35 ppm Decay Alert</span>
                  <span>100 ppm</span>
                </div>
              </div>

              {/* Ethylene Phytohormone (C2H4) */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">Ethylene Phytohormone (C₂H₄)</span>
                  <span className="font-mono font-bold text-amber-400">
                    {conditionTelemetry.ethylenePpm.toFixed(1)} ppm
                  </span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="10.0"
                  step="0.1"
                  value={conditionTelemetry.ethylenePpm}
                  onChange={(e) =>
                    setConditionTelemetry((prev) => ({
                      ...prev,
                      ethylenePpm: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-amber-400 bg-slate-800 rounded-lg cursor-pointer h-2"
                  aria-label="Ethylene phytohormone"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.0 ppm (Quenched)</span>
                  <span>10.0 ppm (Rapid Senescence)</span>
                </div>
              </div>

              {/* Relative Humidity & Tri-Axial Shock */}
              <div className="grid grid-cols-2 gap-3">
                {/* RH % */}
                <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Humidity (RH)</span>
                    <span className="font-mono font-bold text-purple-400">{Math.round(conditionTelemetry.relativeHumidity)}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    step="1"
                    value={conditionTelemetry.relativeHumidity}
                    onChange={(e) =>
                      setConditionTelemetry((prev) => ({
                        ...prev,
                        relativeHumidity: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-purple-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
                  />
                  <span className="text-[9px] text-slate-500 font-mono">20% to 100%</span>
                </div>

                {/* Vibration Shock */}
                <div className="flex flex-col gap-1 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Shock / Vibration</span>
                    <span className="font-mono font-bold text-amber-400">{conditionTelemetry.vibrationG.toFixed(1)} G</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="3.0"
                    step="0.1"
                    value={conditionTelemetry.vibrationG}
                    onChange={(e) =>
                      setConditionTelemetry((prev) => ({
                        ...prev,
                        vibrationG: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-amber-400 bg-slate-800 rounded-lg cursor-pointer h-1.5"
                  />
                  <span className="text-[9px] text-slate-500 font-mono">0.1G to 3.0G</span>
                </div>
              </div>
            </div>

            {/* AI Conductor Decision & Prescribed Intervention */}
            <div className={`p-4 rounded-2xl border flex flex-col gap-3 transition-colors ${
              calculations.status === 'CRITICAL'
                ? 'bg-red-950/30 border-red-500/50'
                : calculations.status === 'WARNING'
                ? 'bg-amber-950/20 border-amber-500/40'
                : 'bg-emerald-950/20 border-emerald-500/40'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 text-white">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AI Conductor Biological Prescription</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Saved: ${calculations.savedValueUsd.toLocaleString()}
                </span>
              </div>

              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {calculations.alertTitle}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {calculations.alertDescription}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                  Actionable Intervention Protocol:
                </span>
                <p className="text-slate-200 leading-relaxed font-sans">
                  {calculations.prescribedIntervention}
                </p>
              </div>
            </div>

            {/* One-Click Real Corridor Crisis Scenarios */}
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2.5">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Simulate Real Middle Corridor Scenarios</span>
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => applyPresetScenario(1)}
                  className="p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-emerald-400">1. Optimal KTZ Rail Cold-Chain</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">+1.2°C • 2 ppm • 92% RH</div>
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetScenario(2)}
                  className="p-2.5 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-500/30 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-red-400">2. Port Kuryk Shore Cut (Critical)</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">+14.5°C • 42 ppm Ethanol</div>
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetScenario(3)}
                  className="p-2.5 rounded-xl bg-amber-950/20 hover:bg-amber-950/40 border border-amber-500/30 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-amber-400">3. Caspian Sea Ro-Pax Gen Sag</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">+6.4°C • 18 ppm • Vessel Aux Bus</div>
                </button>

                <button
                  type="button"
                  onClick={() => applyPresetScenario(4)}
                  className="p-2.5 rounded-xl bg-purple-950/20 hover:bg-purple-950/40 border border-purple-500/30 text-left transition-colors cursor-pointer"
                >
                  <div className="font-bold text-purple-400">4. Akhalkalaki Shunting Shock</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">2.4G Shock • 1520/1435mm Break</div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* 4. LOGISTICS STANDARDS MODAL VIEWER */}
      {isStandardsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/70">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                  <Code className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Logistics & Rail Telemetry Standards Gateway
                  </h3>
                  <p className="text-xs text-slate-400">
                    Industry schemas: DCSA Track & Trace 3.0, KTZ Rail ASOU (SMGS), and AIS MarineTraffic
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsStandardsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Standard Category Tabs */}
            <div className="flex items-center gap-2 px-4 sm:px-5 pt-3 border-b border-slate-800 bg-slate-900/40 text-xs font-mono">
              <button
                type="button"
                onClick={() => setActiveStandardTab('dcsa')}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold transition-all cursor-pointer ${
                  activeStandardTab === 'dcsa'
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Box className="w-4 h-4" />
                <span>1. DCSA 3.0 (IoT Reefer)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStandardTab('ktz')}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold transition-all cursor-pointer ${
                  activeStandardTab === 'ktz'
                    ? 'border-purple-400 text-purple-400 bg-purple-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Train className="w-4 h-4" />
                <span>2. KTZ Rail ASOU (SMGS Waybill)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveStandardTab('ais')}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 font-bold transition-all cursor-pointer ${
                  activeStandardTab === 'ais'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Ship className="w-4 h-4" />
                <span>3. AIS Caspian Sea Ro-Pax Telemetry</span>
              </button>
            </div>

            {/* Code Content & Live Terminal */}
            <div className="flex-1 p-4 sm:p-5 overflow-y-auto bg-slate-950 font-mono text-xs">
              <div className="flex items-center justify-between mb-2 text-slate-400 text-[11px]">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  SCHEMA: application/json • Generated dynamically from current active conditions
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateIngest}
                    disabled={isTransmitting}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-sans font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3 h-3" />
                    <span>{isTransmitting ? 'Ingesting...' : 'Test Ingest'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                </div>
              </div>

              {simulatedPingSuccess && (
                <div className="mb-3 p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    {simulatedPingSuccess}
                  </span>
                  <span className="text-[10px] text-slate-400">Verified</span>
                </div>
              )}

              <pre className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-cyan-300 overflow-x-auto leading-relaxed shadow-inner">
                <code>{getStandardsPayload()}</code>
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-t border-slate-800 bg-slate-900/80 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Intermodal EDI / DCSA 3.0 / ASOU Ingestion Gateway</span>
              </div>

              <button
                type="button"
                onClick={() => setIsStandardsModalOpen(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition-colors cursor-pointer"
              >
                Close Gateway
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
