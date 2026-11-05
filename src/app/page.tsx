'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Box,
  CheckCircle2,
  Compass,
  Cpu,
  Flame,
  Gauge,
  Layers,
  MapPin,
  Radio,
  RotateCcw,
  ShieldCheck,
  Ship,
  Sliders,
  Thermometer,
  Train,
  Truck,
  Wifi,
  Zap,
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useI18n } from '@/lib/i18n/context';
import {
  TITR_WAYPOINTS,
  LIVE_CONTAINER_PINS,
  REEFER_SENSOR_CALLOUTS,
  CARGO_CLASSES_MATRIX,
  LANDING_COPY,
} from '@/lib/landing-showcase-data';

type CorridorFilterMode = 'ALL' | 'RAIL' | 'FERRY' | 'HIGHWAY';
type InspectorMode = 'HUB' | 'CONTAINER';
type HardwareViewMode = 'BLUEPRINT' | 'MATRIX';

const GAS_CONSTANT_R = 8.314;

export default function HomePage() {
  const { locale } = useI18n();
  const copy = LANDING_COPY[locale] || LANDING_COPY.en;

  // --- PILLAR 1 STATE: Interactive Corridor Map ---
  const [corridorFilter, setCorridorFilter] = useState<CorridorFilterMode>('ALL');
  const [selectedHubId, setSelectedHubId] = useState<string>('kuryk-aktau');
  const [selectedContainerId, setSelectedContainerId] = useState<string>('FS-9042');
  const [inspectorMode, setInspectorMode] = useState<InspectorMode>('CONTAINER');

  const selectedHub = useMemo(
    () => TITR_WAYPOINTS.find((h) => h.id === selectedHubId) || TITR_WAYPOINTS[2],
    [selectedHubId]
  );

  const selectedContainer = useMemo(
    () => LIVE_CONTAINER_PINS.find((c) => c.id === selectedContainerId) || LIVE_CONTAINER_PINS[1],
    [selectedContainerId]
  );

  // --- PILLAR 2 STATE: Annotated Reefer & IoT Sensor Blueprint ---
  const [selectedSensorId, setSelectedSensorId] = useState<string>('sensor-mq303a');
  const [hardwareView, setHardwareView] = useState<HardwareViewMode>('BLUEPRINT');

  const selectedSensor = useMemo(
    () => REEFER_SENSOR_CALLOUTS.find((s) => s.id === selectedSensorId) || REEFER_SENSOR_CALLOUTS[0],
    [selectedSensorId]
  );

  // --- PILLAR 3 STATE: Biological Cargo & Arrhenius Simulator ---
  const [selectedCargoId, setSelectedCargoId] = useState<'beef' | 'apples-pears' | 'cherries' | 'dairy'>('beef');
  const [simTempC, setSimTempC] = useState<number>(6.5);
  const [simEthanolPpm, setSimEthanolPpm] = useState<number>(18.0);
  const [simDwellHours, setSimDwellHours] = useState<number>(24);

  const selectedCargo = useMemo(
    () => CARGO_CLASSES_MATRIX.find((c) => c.id === selectedCargoId) || CARGO_CLASSES_MATRIX[0],
    [selectedCargoId]
  );

  const handleSelectCargo = (cargoId: 'beef' | 'apples-pears' | 'cherries' | 'dairy') => {
    setSelectedCargoId(cargoId);
    const target = CARGO_CLASSES_MATRIX.find((c) => c.id === cargoId);
    if (target) {
      setSimTempC(Number((target.tRefC + 4.5).toFixed(1)));
      setSimEthanolPpm(target.vocWarningPpm);
      setSimDwellHours(18);
    }
  };

  const applyPreset = (preset: 'NOMINAL' | 'KURYK_STORM' | 'POWER_SAG') => {
    if (preset === 'NOMINAL') {
      setSimTempC(selectedCargo.tRefC);
      setSimEthanolPpm(selectedCargo.vocBaselinePpm);
      setSimDwellHours(4);
    } else if (preset === 'KURYK_STORM') {
      setSimTempC(Number((selectedCargo.tRefC + 5.8).toFixed(1)));
      setSimEthanolPpm(Number((selectedCargo.vocCriticalPpm + 4.5).toFixed(1)));
      setSimDwellHours(42);
    } else {
      setSimTempC(9.5);
      setSimEthanolPpm(selectedCargo.vocWarningPpm + 6);
      setSimDwellHours(22);
    }
  };

  // Live Arrhenius Kinetics Computation
  const kineticsResult = useMemo(() => {
    const tKelvin = simTempC + 273.15;
    const tRefKelvin = selectedCargo.tRefC + 273.15;

    // 1. Arrhenius thermal acceleration factor alpha_T
    const alphaT = Math.exp((selectedCargo.eaJoules / GAS_CONSTANT_R) * (1 / tRefKelvin - 1 / tKelvin));

    // 2. Sub-freezing crystal penalty
    const alphaFreeze =
      simTempC < selectedCargo.tFreezeC ? 1.0 + 0.55 * (selectedCargo.tFreezeC - simTempC) : 1.0;

    // 3. Volatile ethanol coupling factor phi_eth
    const phiEth =
      simEthanolPpm > 5.0
        ? 1.0 + selectedCargo.gammaEth * Math.pow((simEthanolPpm - 5.0) / 30.0, 1.25)
        : 1.0;

    // 4. Port bottleneck dwell stress multiplier
    const phiDwell = 1.0 + (simDwellHours / 96.0) * (alphaT > 1.3 ? 0.45 : 0.12);

    const alphaTotal = Math.max(0.65, alphaT * alphaFreeze * phiEth * phiDwell);

    // Adjusted Remaining Shelf Life (RUL)
    const effectiveLostHours = simDwellHours * alphaTotal;
    const rawRulHours = Math.max(
      6,
      (selectedCargo.baselineShelfLifeHours - effectiveLostHours * 0.35) / alphaTotal
    );
    const rulHours = Math.round(rawRulHours * 10) / 10;
    const rulDays = Math.round((rulHours / 24) * 10) / 10;

    // Biological Health Index (BHI %)
    const tempPenalty =
      simTempC > selectedCargo.tOptMaxC
        ? Math.min(55, (simTempC - selectedCargo.tOptMaxC) * 4.2)
        : simTempC < selectedCargo.tFreezeC
        ? Math.min(45, (selectedCargo.tFreezeC - simTempC) * 18)
        : 0;
    const ethPenalty =
      simEthanolPpm > selectedCargo.vocBaselinePpm
        ? Math.min(42, (simEthanolPpm - selectedCargo.vocBaselinePpm) * 1.05)
        : 0;
    const dwellPenalty = Math.min(18, simDwellHours * 0.22);

    const bhi = Math.max(8, Math.min(99.8, Math.round((100 - tempPenalty - ethPenalty - dwellPenalty) * 10) / 10));

    // Financial Salvage Preserved ($)
    const atRiskRatio = Math.max(0, (100 - bhi) / 100);
    const preservedUsd = Math.round(selectedCargo.defaultCargoValueUsd * Math.max(0.22, atRiskRatio * 0.82));

    // Generate 480h SVG curve points (0..480h every 24h)
    const kRef = 1.6 / selectedCargo.baselineShelfLifeHours;
    const kEff = kRef * alphaTotal;
    const curvePoints: Array<{ hour: number; baselineY: number; excursionY: number }> = [];
    for (let h = 0; h <= 480; h += 24) {
      const qBase = Math.max(2, Math.min(100, 100 * Math.exp(-kRef * h)));
      const qExcursion = Math.max(2, Math.min(100, 100 * Math.exp(-kEff * h)));
      curvePoints.push({
        hour: h,
        baselineY: qBase,
        excursionY: qExcursion,
      });
    }

    const severity: 'OPTIMAL' | 'WARNING' | 'CRITICAL' =
      simEthanolPpm >= selectedCargo.vocCriticalPpm || simTempC >= selectedCargo.tOptMaxC + 6 || bhi < 55
        ? 'CRITICAL'
        : simEthanolPpm >= selectedCargo.vocWarningPpm || simTempC > selectedCargo.tOptMaxC + 1.5 || bhi < 80
        ? 'WARNING'
        : 'OPTIMAL';

    return {
      alphaT: alphaT.toFixed(2),
      phiEth: phiEth.toFixed(2),
      alphaTotal: alphaTotal.toFixed(2),
      rulHours,
      rulDays,
      bhi,
      preservedUsd,
      curvePoints,
      severity,
    };
  }, [selectedCargo, simTempC, simEthanolPpm, simDwellHours]);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080B11] text-slate-900 dark:text-slate-100 selection:bg-emerald-500/30">
      {/* Subtle Industrial Blueprint Grid Overlay */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none opacity-[0.035] dark:opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* =====================================================================
          HERO COMMAND BAR & INDUSTRIAL TELEMETRY OVERVIEW
         ===================================================================== */}
      <section className="relative pt-8 pb-14 sm:pt-12 sm:pb-18 border-b border-slate-200/90 dark:border-slate-800/80 overflow-hidden">
        <Container size="lg">
          {/* Top Live Corridor Ticker Strip */}
          <div className="mb-7 p-2.5 sm:px-4 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                TITR LIVE MESH
              </span>
              <span className="text-slate-600 dark:text-slate-300 font-semibold">
                DOSTYK (1520mm) ➔ ALMATY ➔ PORT KURYK ➔ CASPIAN RO-PAX ➔ BAKU ➔ TBILISI ➔ ISTANBUL (1435mm)
              </span>
            </div>
            <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 tabular-nums">
              <span>LAT 43.1800°N • LNG 51.6500°E</span>
              <span className="hidden sm:inline text-emerald-600 dark:text-emerald-400 font-bold">
                LoRaWAN 868MHz + IRIDIUM LEO: ONLINE
              </span>
            </div>
          </div>

          {/* Hero Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left 7 Cols: Headline, Engineering Proposition & Quick-Jump Pillars */}
            <div className="lg:col-span-7 flex flex-col gap-5">
              <div className="inline-flex items-center gap-2 self-start">
                <Badge variant="mint" size="md" dot>
                  {copy.heroBadge}
                </Badge>
              </div>

              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]"
                style={{ textWrap: 'balance' }}
              >
                {copy.heroTitle}
              </h1>

              <p
                className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl"
                style={{ textWrap: 'pretty' }}
              >
                {copy.heroSubtitle}
              </p>

              {/* Primary Platform Actions (NO /demo links) */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  href="/dashboard"
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  {copy.ctaPrimary}
                </Button>
                <Button
                  href="/dashboard/analytics"
                  variant="secondary"
                  size="lg"
                  rightIcon={<ArrowUpRight className="w-4 h-4" />}
                >
                  {copy.ctaSecondaryAnalytics}
                </Button>
              </div>

              {/* 3 Interactive Anchor Jump Pills for Maps / Sensors / Cargoes */}
              <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80">
                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5">
                  {locale === 'ru'
                    ? 'НАВИГАЦИЯ ПО ИНЖЕНЕРНЫМ МОДУЛЯМ ПЛАТФОРМЫ:'
                    : locale === 'kz'
                    ? 'ПЛАТФОРМАНЫҢ ИНЖЕНЕРЛІК МОДУЛЬДЕРІ:'
                    : 'INTERACTIVE ENGINEERING MODULES ON THIS PAGE:'}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => scrollToSection('corridor-map')}
                    className="group p-3 rounded-xl bg-white hover:bg-emerald-50/60 dark:bg-slate-900/90 dark:hover:bg-slate-800/90 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-500/60 dark:hover:border-emerald-500/50 text-left transition-all active:scale-[0.97] cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        GIS • TITR
                      </span>
                      <Compass className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {copy.jumpMap}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSection('iot-sensors')}
                    className="group p-3 rounded-xl bg-white hover:bg-sky-50/60 dark:bg-slate-900/90 dark:hover:bg-slate-800/90 border border-slate-200/90 dark:border-slate-800 hover:border-sky-500/60 dark:hover:border-sky-500/50 text-left transition-all active:scale-[0.97] cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-sky-600 dark:text-sky-400">
                        ISO 668 • 5 CHANNELS
                      </span>
                      <Cpu className="w-3.5 h-3.5 text-sky-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {copy.jumpSensors}
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => scrollToSection('cargo-matrix')}
                    className="group p-3 rounded-xl bg-white hover:bg-amber-50/60 dark:bg-slate-900/90 dark:hover:bg-slate-800/90 border border-slate-200/90 dark:border-slate-800 hover:border-amber-500/60 dark:hover:border-amber-500/50 text-left transition-all active:scale-[0.97] cursor-pointer shadow-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400">
                        Ea • Q10 • RUL
                      </span>
                      <Sliders className="w-3.5 h-3.5 text-amber-500 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {copy.jumpCargo}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: Live Corridor Telemetry Summary Card (Concentric Radii: Outer 16px, Inner 10px, Padding 6px) */}
            <div className="lg:col-span-5">
              <div className="p-1.5 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 border border-slate-300/80 dark:border-slate-700/80 shadow-xl">
                <div className="p-5 rounded-[10px] bg-white dark:bg-[#0B101B] border border-slate-200/80 dark:border-slate-800/90 flex flex-col gap-4">
                  {/* Card Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold block">
                        {locale === 'ru'
                          ? 'ОПЕРАТИВНАЯ СВОДКА КОРИДОРА'
                          : locale === 'kz'
                          ? 'ДӘЛІЗДІҢ ЖЕДЕЛ МӘЛІМЕТІ'
                          : 'CORRIDOR TELEMETRY SNAPSHOT'}
                      </span>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                        {locale === 'ru'
                          ? 'Контроль узлов, датчиков и биохимии в реальном времени'
                          : locale === 'kz'
                          ? 'Тораптар, датчиктер және биохимияны нақты уақытта бақылау'
                          : 'Real-Time Route, Sensor & Biochemical Snapshot'}
                      </h2>
                    </div>
                    <span className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 tabular-nums">
                      1 CRITICAL • KURYK
                    </span>
                  </div>

                  {/* 3 Mini Live Pillar Previews */}
                  <div className="flex flex-col gap-2.5 font-mono text-xs">
                    <div
                      onClick={() => scrollToSection('corridor-map')}
                      className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/90 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {locale === 'ru' ? 'Карта: Порт Курык ⇄ Баку' : locale === 'kz' ? 'Карта: Құрық порты ⇄ Баку' : 'Map: Port Kuryk ⇄ Baku'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            FS-8821 • FS-9042 • FS-7710 • FS-6104
                          </div>
                        </div>
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                        7 HUBS ➔
                      </span>
                    </div>

                    <div
                      onClick={() => scrollToSection('iot-sensors')}
                      className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/90 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Radio className="w-4 h-4 text-sky-500 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {locale === 'ru' ? 'Датчики: MQ-303A + PT1000 + NDIR' : locale === 'kz' ? 'Датчиктер: MQ-303A + PT1000 + NDIR' : 'Sensors: MQ-303A + PT1000 + NDIR'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            C₂H₅OH ±0.4 ppm • Core ±0.08°C • ±200g Shock
                          </div>
                        </div>
                      </div>
                      <span className="text-sky-600 dark:text-sky-400 font-bold tabular-nums">
                        5 PINS ➔
                      </span>
                    </div>

                    <div
                      onClick={() => scrollToSection('cargo-matrix')}
                      className="p-3 rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/90 dark:hover:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Box className="w-4 h-4 text-amber-500 shrink-0" />
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            {locale === 'ru' ? 'Грузы: Говядина, Яблоки, Черешня, Кефир' : locale === 'kz' ? 'Жүктер: Ет, Алма, Шие, Биокефир' : 'Cargoes: Beef, Apples, Cherries, Dairy'}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Ea: 68.5–92.0 kJ/mol • Q10: 2.58–3.78
                          </div>
                        </div>
                      </div>
                      <span className="text-amber-600 dark:text-amber-400 font-bold tabular-nums">
                        4 CLASSES ➔
                      </span>
                    </div>
                  </div>

                  {/* 2x2 Key Engineering Metrics */}
                  <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 font-mono tabular-nums">
                    <div className="p-2.5 rounded-lg bg-slate-100/80 dark:bg-slate-900/60">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {copy.kpiCorridorLength}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        1520mm ⇄ 1435mm
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-100/80 dark:bg-slate-900/60">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {copy.kpiEarlyDetection}
                      </span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        C₂H₅OH &gt; 12 ppm
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* =====================================================================
          PILLAR 01: INTERACTIVE TRANS-CASPIAN CORRIDOR MAP (#corridor-map)
         ===================================================================== */}
      <section
        id="corridor-map"
        className="py-16 sm:py-20 border-b border-slate-200/90 dark:border-slate-800/80 scroll-mt-20"
      >
        <Container size="lg">
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                <Compass className="w-4 h-4" />
                <span>{copy.p1Eyebrow}</span>
              </div>
              <h2
                className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white"
                style={{ textWrap: 'balance' }}
              >
                {copy.p1Title}
              </h2>
              <p
                className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 leading-relaxed"
                style={{ textWrap: 'pretty' }}
              >
                {copy.p1Sub}
              </p>
            </div>

            {/* Transport Mode Layer Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 self-start">
              {(
                [
                  { id: 'ALL', label: copy.p1FilterAll, icon: Layers },
                  { id: 'RAIL', label: copy.p1FilterRail, icon: Train },
                  { id: 'FERRY', label: copy.p1FilterFerry, icon: Ship },
                  { id: 'HIGHWAY', label: copy.p1FilterHighway, icon: Truck },
                ] as const
              ).map((item) => {
                const Icon = item.icon;
                const active = corridorFilter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCorridorFilter(item.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold flex items-center gap-1.5 transition-all active:scale-[0.96] cursor-pointer ${
                      active
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Corridor Map + Right Telemetry Inspector Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left 8 Cols: Interactive Vector GIS Schematic of the Middle Corridor */}
            <div className="lg:col-span-8 flex flex-col justify-between rounded-2xl bg-[#070B14] border border-slate-800 shadow-2xl overflow-hidden">
              {/* Top Map HUD Bar */}
              <div className="px-4 py-3 bg-slate-950/90 border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-bold text-white">
                    TITR GEOSPATIAL SCHEMATIC • 28°E — 84°E
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[10px]">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
                    {copy.p1LegendBroad}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-sky-400 inline-block" />
                    {copy.p1LegendFerry}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-indigo-400 inline-block" />
                    {copy.p1LegendStandard}
                  </span>
                </div>
              </div>

              {/* Interactive SVG Corridor Canvas */}
              <div className="relative w-full overflow-x-auto">
                <svg
                  viewBox="0 0 1080 460"
                  className="w-full h-auto min-w-[680px] select-none"
                  role="img"
                  aria-label="Trans-Caspian International Transport Route Interactive Map"
                >
                  <defs>
                    <pattern id="titr-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                      <path
                        d="M 60 0 L 0 0 0 60"
                        fill="none"
                        stroke="#1E293B"
                        strokeWidth="0.7"
                        strokeDasharray="2 2"
                      />
                    </pattern>
                    <radialGradient id="caspian-water" cx="50%" cy="50%" r="60%">
                      <stop offset="0%" stopColor="#0C4A6E" stopOpacity="0.55" />
                      <stop offset="100%" stopColor="#082F49" stopOpacity="0.25" />
                    </radialGradient>
                  </defs>

                  {/* Deep Slate Background & Coordinate Graticule */}
                  <rect width="1080" height="460" fill="#070B14" />
                  <rect width="1080" height="460" fill="url(#titr-grid)" />

                  {/* Coordinate Labels */}
                  <g className="font-mono text-[9px] fill-slate-600">
                    <text x="16" y="75">46°N</text>
                    <text x="16" y="195">43°N</text>
                    <text x="16" y="315">40°N</text>
                    <text x="16" y="435">38°N</text>
                    <text x="110" y="448">29°E (ISTANBUL)</text>
                    <text x="270" y="448">44°E (CAUCASUS)</text>
                    <text x="455" y="448">51°E (CASPIAN SEA)</text>
                    <text x="720" y="448">68°E (KAZAKH STEPPE)</text>
                    <text x="935" y="448">82°E (DOSTYK)</text>
                  </g>

                  {/* Black Sea Polygon (West) */}
                  <path
                    d="M 40,140 C 95,130 165,145 215,195 C 235,220 225,260 190,270 C 135,278 75,262 40,245 Z"
                    fill="url(#caspian-water)"
                    stroke="#0369A1"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />
                  <text
                    x="125"
                    y="210"
                    textAnchor="middle"
                    className="font-mono text-[10px] fill-sky-400/70 tracking-widest uppercase"
                  >
                    BLACK SEA
                  </text>

                  {/* Caspian Sea Polygon (Center Chokepoint) */}
                  <path
                    d="M 435,125 C 485,120 535,155 545,215 C 552,265 538,315 520,365 C 505,405 465,425 425,415 C 395,405 382,365 390,320 C 398,270 405,215 415,165 Z"
                    fill="url(#caspian-water)"
                    stroke="#0284C7"
                    strokeWidth="1.5"
                  />
                  <text
                    x="468"
                    y="240"
                    textAnchor="middle"
                    className="font-mono text-[10px] fill-sky-300/80 font-bold tracking-widest uppercase"
                  >
                    CASPIAN SEA
                  </text>
                  <text
                    x="468"
                    y="254"
                    textAnchor="middle"
                    className="font-mono text-[8px] fill-sky-400/70"
                  >
                    260 NM RO-PAX FAIRWAY
                  </text>

                  {/* Aral / Balkhash Reference Contours */}
                  <ellipse
                    cx="685"
                    cy="215"
                    rx="34"
                    ry="16"
                    fill="#082F49"
                    fillOpacity="0.35"
                    stroke="#1E293B"
                    strokeWidth="1"
                  />
                  <path
                    d="M 830,195 C 865,185 905,190 920,205 C 900,218 860,215 830,195 Z"
                    fill="#082F49"
                    fillOpacity="0.4"
                    stroke="#1E293B"
                    strokeWidth="1"
                  />

                  {/* --- ROUTE LAYER 1: WE-WC TIR Reefer Highway (Amber Dashed) --- */}
                  {(corridorFilter === 'ALL' || corridorFilter === 'HIGHWAY') && (
                    <path
                      d="M 980,165 C 910,215 880,245 855,275 C 740,240 640,225 545,280 M 385,355 C 325,335 295,315 270,295 C 195,285 150,270 110,250"
                      fill="none"
                      stroke="#F59E0B"
                      strokeWidth={corridorFilter === 'HIGHWAY' ? '4' : '2'}
                      strokeDasharray="5 5"
                      opacity={corridorFilter === 'HIGHWAY' ? '0.95' : '0.45'}
                    />
                  )}

                  {/* --- ROUTE LAYER 2: 1520mm CIS Broad Gauge Heavy Rail (Dostyk -> Almaty -> Kuryk & Baku -> Tbilisi) --- */}
                  {(corridorFilter === 'ALL' || corridorFilter === 'RAIL') && (
                    <>
                      <path
                        d="M 980,165 L 855,275 C 745,285 645,282 545,280"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth={corridorFilter === 'RAIL' ? '5' : '3.8'}
                        strokeLinecap="round"
                      />
                      <path
                        d="M 385,355 L 270,295"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth={corridorFilter === 'RAIL' ? '5' : '3.8'}
                        strokeLinecap="round"
                      />
                    </>
                  )}

                  {/* --- ROUTE LAYER 3: Caspian Sea Ro-Pax Ferry Fairway (Port Kuryk ⇄ Baku Alat) --- */}
                  {(corridorFilter === 'ALL' || corridorFilter === 'FERRY') && (
                    <path
                      d="M 545,280 Q 465,325 385,355"
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth={corridorFilter === 'FERRY' ? '5.5' : '4'}
                      strokeDasharray="10 6"
                    />
                  )}

                  {/* --- ROUTE LAYER 4: 1435mm UIC Standard Gauge (Akhalkalaki/Tbilisi -> Kars -> Istanbul) --- */}
                  {(corridorFilter === 'ALL' || corridorFilter === 'RAIL') && (
                    <path
                      d="M 270,295 C 205,275 160,262 110,250"
                      fill="none"
                      stroke="#818CF8"
                      strokeWidth={corridorFilter === 'RAIL' ? '5' : '3.8'}
                      strokeLinecap="round"
                    />
                  )}

                  {/* --- 7 INTERACTIVE CORRIDOR WAYPOINT HUBS --- */}
                  {TITR_WAYPOINTS.map((hub) => {
                    const isSelected = selectedHubId === hub.id && inspectorMode === 'HUB';
                    const hasCritical = hub.activeBottleneckAlert?.severity === 'CRITICAL';
                    const hasWarning = hub.activeBottleneckAlert?.severity === 'WARNING';
                    const strokeColor = hasCritical
                      ? '#F43F5E'
                      : hasWarning
                      ? '#FBBF24'
                      : hub.type === 'gauge-break'
                      ? '#38BDF8'
                      : '#10B981';

                    return (
                      <g
                        key={hub.id}
                        transform={`translate(${hub.svgX}, ${hub.svgY})`}
                        onClick={() => {
                          setSelectedHubId(hub.id);
                          setInspectorMode('HUB');
                        }}
                        className="cursor-pointer group"
                      >
                        {(hasCritical || isSelected) && (
                          <circle
                            r={isSelected ? '20' : '16'}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth="1.5"
                            opacity="0.5"
                            className="animate-ping"
                          />
                        )}
                        <circle
                          r={isSelected ? '11' : '8'}
                          fill="#090D16"
                          stroke={strokeColor}
                          strokeWidth={isSelected ? '3' : '2.2'}
                        />
                        <circle r="3.2" fill={strokeColor} />

                        {/* Hub Code Pill */}
                        <g transform="translate(0, -22)">
                          <rect
                            x="-36"
                            y="-10"
                            width="72"
                            height="16"
                            rx="4"
                            fill={isSelected ? '#065F46' : '#0F172A'}
                            stroke={isSelected ? '#34D399' : '#334155'}
                            strokeWidth="1"
                          />
                          <text
                            x="0"
                            y="1"
                            textAnchor="middle"
                            className="font-mono text-[9px] font-bold fill-slate-100"
                          >
                            {hub.code}
                          </text>
                        </g>

                        {/* Dwell Time Sub-Tag */}
                        <text
                          x="0"
                          y="22"
                          textAnchor="middle"
                          className="font-mono text-[9px] fill-slate-400"
                        >
                          {hub.averageDwellHours}h dwell
                        </text>
                      </g>
                    );
                  })}

                  {/* --- 4 LIVE INTERACTIVE CONTAINER TELEMETRY PINS --- */}
                  {LIVE_CONTAINER_PINS.map((pin) => {
                    const isSelected =
                      selectedContainerId === pin.id && inspectorMode === 'CONTAINER';
                    const pinColor =
                      pin.status === 'CRITICAL'
                        ? '#F43F5E'
                        : pin.status === 'WARNING'
                        ? '#FBBF24'
                        : '#34D399';

                    return (
                      <g
                        key={pin.id}
                        transform={`translate(${pin.svgX}, ${pin.svgY})`}
                        onClick={() => {
                          setSelectedContainerId(pin.id);
                          setInspectorMode('CONTAINER');
                        }}
                        className="cursor-pointer"
                      >
                        <circle
                          r={isSelected ? '16' : '12'}
                          fill={pinColor}
                          fillOpacity="0.2"
                          stroke={pinColor}
                          strokeWidth="1.2"
                        />
                        <rect
                          x="-42"
                          y="-13"
                          width="84"
                          height="24"
                          rx="6"
                          fill={isSelected ? '#0F172A' : '#090D16'}
                          stroke={pinColor}
                          strokeWidth={isSelected ? '2.2' : '1.4'}
                        />
                        <text
                          x="0"
                          y="-2"
                          textAnchor="middle"
                          className="font-mono text-[9px] font-bold fill-white"
                        >
                          {pin.id}
                        </text>
                        <text
                          x="0"
                          y="7"
                          textAnchor="middle"
                          fill={pinColor}
                          className="font-mono text-[8px] font-bold"
                        >
                          {pin.telemetry.tempC > 0
                            ? `+${pin.telemetry.tempC}°C`
                            : `${pin.telemetry.tempC}°C`}{' '}
                          • {pin.telemetry.ethanolPpm}ppm
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Bottom Map Quick-Selector Bar: 7 Hubs & 4 Containers */}
              <div className="p-4 bg-slate-950/95 border-t border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 7 Hubs Selector */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
                    {copy.p1SelectHubHeader}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {TITR_WAYPOINTS.map((hub) => {
                      const active = selectedHubId === hub.id && inspectorMode === 'HUB';
                      return (
                        <button
                          key={hub.id}
                          type="button"
                          onClick={() => {
                            setSelectedHubId(hub.id);
                            setInspectorMode('HUB');
                          }}
                          className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-all active:scale-[0.96] cursor-pointer border ${
                            active
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          {hub.code}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4 Live Containers Selector */}
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-2">
                    {copy.p1SelectContainerHeader}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {LIVE_CONTAINER_PINS.map((pin) => {
                      const active =
                        selectedContainerId === pin.id && inspectorMode === 'CONTAINER';
                      const dotColor =
                        pin.status === 'CRITICAL'
                          ? 'bg-rose-500'
                          : pin.status === 'WARNING'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400';
                      return (
                        <button
                          key={pin.id}
                          type="button"
                          onClick={() => {
                            setSelectedContainerId(pin.id);
                            setInspectorMode('CONTAINER');
                          }}
                          className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-[0.96] cursor-pointer border tabular-nums ${
                            active
                              ? 'bg-sky-500/20 text-white border-sky-400'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                          <span>{pin.id}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Synchronized Live Hub / Container Telemetry Inspector */}
            <div className="lg:col-span-4 flex flex-col rounded-2xl bg-white dark:bg-[#0B101B] border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-hidden">
              {/* Inspector Mode Switcher Tabs */}
              <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setInspectorMode('CONTAINER')}
                  className={`py-2 px-3 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                    inspectorMode === 'CONTAINER'
                      ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {copy.p1InspectorContainerTab}
                </button>
                <button
                  type="button"
                  onClick={() => setInspectorMode('HUB')}
                  className={`py-2 px-3 rounded-lg font-mono text-xs font-bold transition-all cursor-pointer ${
                    inspectorMode === 'HUB'
                      ? 'bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  }`}
                >
                  {copy.p1InspectorNodeTab}
                </button>
              </div>

              {inspectorMode === 'CONTAINER' ? (
                /* --- LIVE CONTAINER TELEMETRY INSPECTOR --- */
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                        {selectedContainer.id} • {selectedContainer.transportModeLabel[locale]}
                      </span>
                      <span
                        className={`font-mono text-[11px] font-bold px-2.5 py-0.5 rounded border ${
                          selectedContainer.status === 'CRITICAL'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/40'
                            : selectedContainer.status === 'WARNING'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/40'
                            : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                        }`}
                      >
                        {selectedContainer.status}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {selectedContainer.commodityName[locale]}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {selectedContainer.currentLocationLabel[locale]}
                      </p>
                    </div>

                    {/* 2x3 Sensor Readout Grid (Tabular Numerals) */}
                    <div className="grid grid-cols-2 gap-2.5 font-mono tabular-nums pt-1">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          CORE PULP TEMP
                        </span>
                        <span className="text-base font-bold text-sky-600 dark:text-sky-400">
                          {selectedContainer.telemetry.tempC > 0
                            ? `+${selectedContainer.telemetry.tempC}°C`
                            : `${selectedContainer.telemetry.tempC}°C`}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Setpoint: +{selectedContainer.telemetry.setpointC}°C
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          ETHANOL (C₂H₅OH)
                        </span>
                        <span
                          className={`text-base font-bold ${
                            selectedContainer.telemetry.ethanolPpm > 25
                              ? 'text-rose-600 dark:text-rose-400'
                              : selectedContainer.telemetry.ethanolPpm > 12
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {selectedContainer.telemetry.ethanolPpm} ppm
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          MQ-303A Return Air
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          BIO HEALTH (BHI)
                        </span>
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                          {selectedContainer.bhi}%
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          RUL: {selectedContainer.predictedRulHours}h
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          CO₂ / BOGIE SHOCK
                        </span>
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                          {selectedContainer.telemetry.co2Ppm} ppm
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Shock: {selectedContainer.telemetry.vibrationG}g RMS
                        </span>
                      </div>
                    </div>

                    {/* Autonomous Conductor Dispatch Protocol */}
                    <div
                      className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                        selectedContainer.status === 'CRITICAL'
                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-900 dark:text-rose-200'
                          : selectedContainer.status === 'WARNING'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                          : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                      }`}
                    >
                      <div className="font-mono text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" />
                        <span>CONDUCTOR AI PROTOCOL</span>
                      </div>
                      {selectedContainer.activeAction[locale]}
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/shipment/${selectedContainer.shipmentRouteId}`}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.97] shadow-sm"
                  >
                    <span>{copy.p1OpenShipmentBtn}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ) : (
                /* --- CORRIDOR HUB INFRASTRUCTURE INSPECTOR --- */
                <div className="p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                        {selectedHub.code} • {selectedHub.typeBadge[locale]}
                      </span>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                        {selectedHub.lat}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {selectedHub.name[locale]}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                        {selectedHub.country[locale]} • {selectedHub.gauge}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 font-mono tabular-nums">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          {copy.p1DwellLabel}
                        </span>
                        <span className="text-base font-bold text-amber-600 dark:text-amber-400">
                          {selectedHub.averageDwellHours} hours
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          {copy.p1ColdStorageLabel}
                        </span>
                        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                          {selectedHub.coldStorageCapacityM3}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          {copy.p1ShorePowerLabel}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {selectedHub.shorePowerPlugs}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                          {copy.p1ThroughputLabel}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {selectedHub.annualThroughputTeu}
                        </span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs">
                      <span className="font-mono text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                        {copy.p1RiskTitle}
                      </span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                        {selectedHub.primaryRiskFactor[locale]}
                      </p>
                    </div>

                    {selectedHub.activeBottleneckAlert && (
                      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-900 dark:text-rose-200">
                        <div className="font-mono text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{selectedHub.activeBottleneckAlert.title[locale]}</span>
                        </div>
                        <p className="leading-relaxed">
                          {selectedHub.activeBottleneckAlert.detail[locale]}
                        </p>
                      </div>
                    )}
                  </div>

                  <Link
                    href="/dashboard"
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.97]"
                  >
                    <span>{copy.ctaPrimary}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      {/* =====================================================================
          PILLAR 02: ANNOTATED REEFER & EDGE IoT SENSOR BLUEPRINT (#iot-sensors)
         ===================================================================== */}
      <section
        id="iot-sensors"
        className="py-16 sm:py-20 border-b border-slate-200/90 dark:border-slate-800/80 scroll-mt-20"
      >
        <Container size="lg">
          {/* Header Row */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400 mb-2">
                <Cpu className="w-4 h-4" />
                <span>{copy.p2Eyebrow}</span>
              </div>
              <h2
                className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white"
                style={{ textWrap: 'balance' }}
              >
                {copy.p2Title}
              </h2>
              <p
                className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 leading-relaxed"
                style={{ textWrap: 'pretty' }}
              >
                {copy.p2Sub}
              </p>
            </div>

            {/* View Toggle: Cutaway Blueprint vs Full Tolerance Matrix */}
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-900 border border-slate-300/80 dark:border-slate-800 self-start">
              <button
                type="button"
                onClick={() => setHardwareView('BLUEPRINT')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all active:scale-[0.96] cursor-pointer ${
                  hardwareView === 'BLUEPRINT'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {copy.p2ViewBlueprint}
              </button>
              <button
                type="button"
                onClick={() => setHardwareView('MATRIX')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all active:scale-[0.96] cursor-pointer ${
                  hardwareView === 'MATRIX'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {copy.p2ViewMatrix}
              </button>
            </div>
          </div>

          {hardwareView === 'BLUEPRINT' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left 8 Cols: ISO 668 Orthographic Cutaway Technical Drawing SVG */}
              <div className="lg:col-span-8 rounded-2xl bg-[#070B14] border border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden">
                {/* Engineering Drawing Title Header */}
                <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                  <span className="font-bold text-sky-400">{copy.p2BlueprintTitle}</span>
                  <span className="text-slate-400">{copy.p2BlueprintScale}</span>
                </div>

                {/* Orthographic Cutaway SVG */}
                <div className="w-full overflow-x-auto p-3 sm:p-5">
                  <svg
                    viewBox="0 0 1040 520"
                    className="w-full h-auto min-w-[660px] select-none"
                    role="img"
                    aria-label="40ft High-Cube Reefer Container & 5-Sensor IoT Technical Drawing"
                  >
                    <defs>
                      <pattern
                        id="iso-blueprint-grid"
                        width="32"
                        height="32"
                        patternUnits="userSpaceOnUse"
                      >
                        <path
                          d="M 32 0 L 0 0 0 32"
                          fill="none"
                          stroke="#1E293B"
                          strokeWidth="0.6"
                        />
                      </pattern>
                    </defs>

                    <rect width="1040" height="520" rx="12" fill="#070B14" />
                    <rect width="1040" height="520" fill="url(#iso-blueprint-grid)" />

                    {/* Top Dimension Line: 12,192 mm (40ft ISO 668 1AAA) */}
                    <g stroke="#64748B" strokeWidth="1" className="font-mono text-[10px] fill-slate-400">
                      <line x1="150" y1="36" x2="150" y2="62" />
                      <line x1="930" y1="36" x2="930" y2="62" />
                      <line x1="150" y1="46" x2="930" y2="46" />
                      <polygon points="150,46 160,42 160,50" fill="#64748B" />
                      <polygon points="930,46 920,42 920,50" fill="#64748B" />
                      <rect x="415" y="34" width="250" height="20" fill="#070B14" />
                      <text x="540" y="48" textAnchor="middle" stroke="none">
                        L = 12,192 mm (40&apos;0&quot; HIGH-CUBE ISO 1AAA)
                      </text>
                    </g>

                    {/* Right Height Dimension Line: 2,896 mm (9ft 6in) */}
                    <g stroke="#64748B" strokeWidth="1" className="font-mono text-[10px] fill-slate-400">
                      <line x1="940" y1="120" x2="972" y2="120" />
                      <line x1="940" y1="410" x2="972" y2="410" />
                      <line x1="960" y1="120" x2="960" y2="410" />
                      <text
                        x="982"
                        y="268"
                        textAnchor="middle"
                        transform="rotate(90, 982, 268)"
                        stroke="none"
                      >
                        H = 2,896 mm (9&apos;6&quot;)
                      </text>
                    </g>

                    {/* Outer Container Corten Steel & Polyurethane Sandwich Shell */}
                    <rect
                      x="150"
                      y="120"
                      width="780"
                      height="290"
                      rx="4"
                      fill="#0B1324"
                      stroke="#94A3B8"
                      strokeWidth="2.5"
                    />
                    {/* Inner 100mm Vacuum Polyurethane Insulation Wall */}
                    <rect
                      x="166"
                      y="134"
                      width="748"
                      height="262"
                      fill="#090F1D"
                      stroke="#475569"
                      strokeWidth="1.2"
                      strokeDasharray="4 2"
                    />

                    {/* Left Machinery Bulkhead: Carrier / Thermo King Refrigeration Unit */}
                    <rect
                      x="166"
                      y="134"
                      width="72"
                      height="262"
                      fill="#111C33"
                      stroke="#475569"
                      strokeWidth="1.5"
                    />
                    {/* Evaporator Coil & Dual Centrifugal Fans */}
                    <circle
                      cx="202"
                      cy="178"
                      r="20"
                      fill="#0F172A"
                      stroke="#38BDF8"
                      strokeWidth="1.5"
                    />
                    <line x1="186" y1="178" x2="218" y2="178" stroke="#38BDF8" strokeWidth="1.2" />
                    <line x1="202" y1="162" x2="202" y2="194" stroke="#38BDF8" strokeWidth="1.2" />
                    {/* Compressor & Inverter Housing (Lower Left Bulkhead) */}
                    <rect
                      x="176"
                      y="295"
                      width="52"
                      height="85"
                      rx="3"
                      fill="#0F172A"
                      stroke="#64748B"
                      strokeWidth="1.2"
                    />
                    <text
                      x="202"
                      y="335"
                      textAnchor="middle"
                      className="font-mono text-[8px] fill-slate-300"
                    >
                      REEFER
                    </text>
                    <text
                      x="202"
                      y="347"
                      textAnchor="middle"
                      className="font-mono text-[8px] fill-sky-400"
                    >
                      EVAP/COMP
                    </text>

                    {/* Extruded Aluminum T-Bar Floor Channel (Bottom) */}
                    <rect
                      x="238"
                      y="380"
                      width="676"
                      height="16"
                      fill="#1E293B"
                      stroke="#38BDF8"
                      strokeWidth="1"
                    />

                    {/* 8 Cutaway Euro-Pallet Cargo Bays Inside Reefer */}
                    {[0, 1, 2, 3, 4, 5, 6].map((idx) => {
                      const px = 265 + idx * 88;
                      const isCoreBay = idx === 3;
                      return (
                        <g key={idx}>
                          <rect
                            x={px}
                            y="212"
                            width="74"
                            height="164"
                            rx="2"
                            fill={isCoreBay ? '#0F2942' : '#0F172A'}
                            stroke={isCoreBay ? '#38BDF8' : '#334155'}
                            strokeWidth={isCoreBay ? '1.6' : '1'}
                          />
                          <line
                            x1={px}
                            y1="266"
                            x2={px + 74}
                            y2="266"
                            stroke="#1E293B"
                            strokeWidth="1"
                          />
                          <line
                            x1={px}
                            y1="320"
                            x2={px + 74}
                            y2="320"
                            stroke="#1E293B"
                            strokeWidth="1"
                          />
                          <text
                            x={px + 37}
                            y="235"
                            textAnchor="middle"
                            className="font-mono text-[8px] fill-slate-400"
                          >
                            BAY #{idx + 3}
                          </text>
                        </g>
                      );
                    })}

                    {/* Cold Supply Airflow Arrows Along T-Bar Floor (Cyan) */}
                    <path
                      d="M 225,388 L 890,388 C 908,388 908,350 908,265 C 908,175 895,156 865,156 L 250,156"
                      fill="none"
                      stroke="#38BDF8"
                      strokeWidth="1.8"
                      strokeDasharray="8 5"
                    />
                    <text
                      x="575"
                      y="406"
                      textAnchor="middle"
                      className="font-mono text-[9px] fill-sky-400 font-bold"
                    >
                      ➔ {copy.p2AirflowSupply} ➔
                    </text>
                    <text
                      x="575"
                      y="150"
                      textAnchor="middle"
                      className="font-mono text-[9px] fill-emerald-400 font-bold"
                    >
                      ⬅ {copy.p2AirflowReturn} ⬅
                    </text>

                    {/* Rail Flatcar Bogie Sill Under Container */}
                    <rect
                      x="140"
                      y="412"
                      width="800"
                      height="12"
                      fill="#1E293B"
                      stroke="#475569"
                      strokeWidth="1.2"
                    />
                    <circle cx="245" cy="434" r="12" fill="#0F172A" stroke="#64748B" strokeWidth="2" />
                    <circle cx="285" cy="434" r="12" fill="#0F172A" stroke="#64748B" strokeWidth="2" />
                    <circle cx="805" cy="434" r="12" fill="#0F172A" stroke="#64748B" strokeWidth="2" />
                    <circle cx="845" cy="434" r="12" fill="#0F172A" stroke="#64748B" strokeWidth="2" />

                    {/* --- 5 CLICKABLE SENSOR CALLOUT PINS & LEADER LINES --- */}
                    {REEFER_SENSOR_CALLOUTS.map((sensor) => {
                      const active = selectedSensorId === sensor.id;
                      return (
                        <g
                          key={sensor.id}
                          onClick={() => setSelectedSensorId(sensor.id)}
                          className="cursor-pointer"
                        >
                          {/* Leader Line from Sensor Mounting Point to Callout Badge */}
                          <polyline
                            points={`${sensor.svgX},${sensor.svgY} ${sensor.leaderEndX},${sensor.leaderEndY}`}
                            fill="none"
                            stroke={sensor.colorHex}
                            strokeWidth={active ? '2.2' : '1.4'}
                          />

                          {/* Mounting Point Pulse & Crosshair */}
                          {active && (
                            <circle
                              cx={sensor.svgX}
                              cy={sensor.svgY}
                              r="16"
                              fill="none"
                              stroke={sensor.colorHex}
                              strokeWidth="1.5"
                              className="animate-ping"
                            />
                          )}
                          <circle
                            cx={sensor.svgX}
                            cy={sensor.svgY}
                            r={active ? '7' : '5.5'}
                            fill={sensor.colorHex}
                            stroke="#070B14"
                            strokeWidth="2"
                          />

                          {/* Numbered Engineering Callout Box at Leader End */}
                          <g transform={`translate(${sensor.leaderEndX}, ${sensor.leaderEndY})`}>
                            <rect
                              x="-68"
                              y="-15"
                              width="136"
                              height="30"
                              rx="6"
                              fill={active ? '#0F172A' : '#090D16'}
                              stroke={sensor.colorHex}
                              strokeWidth={active ? '2.4' : '1.4'}
                            />
                            <text
                              x="0"
                              y="-2"
                              textAnchor="middle"
                              fill={sensor.colorHex}
                              className="font-mono text-[9px] font-bold"
                            >
                              [{sensor.number}] {sensor.code.split('•')[1]?.trim()}
                            </text>
                            <text
                              x="0"
                              y="9"
                              textAnchor="middle"
                              className="font-mono text-[8px] fill-slate-200"
                            >
                              {sensor.liveReadoutValue.split('(')[0]?.trim()}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Bottom Sensor Selector Strip */}
                <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-slate-400">
                    {copy.p2ClickPinHint}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {REEFER_SENSOR_CALLOUTS.map((s) => {
                      const active = selectedSensorId === s.id;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedSensorId(s.id)}
                          className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold transition-all active:scale-[0.96] cursor-pointer border ${
                            active
                              ? 'bg-sky-500/20 text-white border-sky-400'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          #{s.number} {s.code.split('•')[1]?.trim()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right 4 Cols: Selected Sensor Engineering Specification Inspector */}
              <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#0B101B] border border-slate-200/90 dark:border-slate-800 p-5 shadow-xl flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-3.5">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold border ${selectedSensor.badgeClass}`}
                    >
                      CALLOUT #{selectedSensor.number} • {selectedSensor.code}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      ONLINE
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {selectedSensor.title[locale]}
                    </h3>
                    <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-1">
                      IC / Probe: {selectedSensor.modelName}
                    </p>
                  </div>

                  {/* Live Telemetry Readout Pill */}
                  <div className="p-3 rounded-xl bg-slate-900 text-white border border-slate-800 flex items-center justify-between font-mono tabular-nums">
                    <span className="text-[10px] text-slate-400 uppercase">LIVE STREAM:</span>
                    <span className="text-xs font-bold text-emerald-400">
                      {selectedSensor.liveReadoutValue}
                    </span>
                  </div>

                  {/* Engineering Specifications Grid */}
                  <div className="grid grid-cols-2 gap-2.5 font-mono text-xs tabular-nums">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {copy.p2SpecRange}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedSensor.measurementRange}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {copy.p2SpecAccuracy}
                      </span>
                      <span className="font-bold text-sky-600 dark:text-sky-400">
                        {selectedSensor.accuracySpec}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {copy.p2SpecResponse}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedSensor.responseTimeT90}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        {copy.p2SpecSampling}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {selectedSensor.samplingInterval}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs">
                    <span className="font-mono text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                      {copy.p2SpecPlacement}: {selectedSensor.PlacementZone[locale]}
                    </span>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {selectedSensor.engineeringPrinciple[locale]}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs">
                    <span className="font-mono text-[10px] font-bold uppercase text-sky-600 dark:text-sky-400 block mb-1">
                      {copy.p2BioImpactHeader}
                    </span>
                    <p className="text-slate-800 dark:text-sky-100 leading-relaxed">
                      {selectedSensor.coldChainImpact[locale]}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* --- FULL 5-CHANNEL HARDWARE TOLERANCE MATRIX TABLE --- */
            <div className="rounded-2xl bg-white dark:bg-[#0B101B] border border-slate-200/90 dark:border-slate-800 shadow-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950 font-mono text-[11px] uppercase text-slate-500 dark:text-slate-400">
                    <th className="py-3.5 px-4"># / Code</th>
                    <th className="py-3.5 px-4">Sensor / IC Hardware</th>
                    <th className="py-3.5 px-4">{copy.p2SpecPlacement}</th>
                    <th className="py-3.5 px-4">{copy.p2SpecRange}</th>
                    <th className="py-3.5 px-4">{copy.p2SpecAccuracy}</th>
                    <th className="py-3.5 px-4">{copy.p2SpecResponse}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800/80 font-mono tabular-nums">
                  {REEFER_SENSOR_CALLOUTS.map((s) => (
                    <tr
                      key={s.id}
                      onClick={() => {
                        setSelectedSensorId(s.id);
                        setHardwareView('BLUEPRINT');
                      }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/70 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-sky-600 dark:text-sky-400">
                        [{s.number}] {s.code}
                      </td>
                      <td className="py-3.5 px-4 font-sans">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {s.title[locale]}
                        </div>
                        <div className="text-[11px] text-slate-500">{s.modelName}</div>
                      </td>
                      <td className="py-3.5 px-4 font-sans text-slate-600 dark:text-slate-300">
                        {s.PlacementZone[locale]}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 dark:text-slate-200">
                        {s.measurementRange}
                      </td>
                      <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-bold">
                        {s.accuracySpec}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                        {s.responseTimeT90}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Container>
      </section>

      {/* =====================================================================
          PILLAR 03: BIOLOGICAL CARGO & ARRHENIUS KINETICS MATRIX (#cargo-matrix)
         ===================================================================== */}
      <section
        id="cargo-matrix"
        className="py-16 sm:py-20 border-b border-slate-200/90 dark:border-slate-800/80 scroll-mt-20"
      >
        <Container size="lg">
          {/* Header */}
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
              <Sliders className="w-4 h-4" />
              <span>{copy.p3Eyebrow}</span>
            </div>
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white"
              style={{ textWrap: 'balance' }}
            >
              {copy.p3Title}
            </h2>
            <p
              className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-2 leading-relaxed"
              style={{ textWrap: 'pretty' }}
            >
              {copy.p3Sub}
            </p>
          </div>

          {/* 4 Perishable Cargo Class Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-8">
            {CARGO_CLASSES_MATRIX.map((cargo) => {
              const active = selectedCargoId === cargo.id;
              return (
                <button
                  key={cargo.id}
                  type="button"
                  onClick={() => handleSelectCargo(cargo.id)}
                  className={`p-4 rounded-2xl text-left transition-all active:scale-[0.98] cursor-pointer border flex flex-col justify-between gap-3 ${
                    active
                      ? 'bg-white dark:bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg'
                      : 'bg-white/80 dark:bg-[#0B101B] border-slate-200/90 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-slate-400 mb-1">
                      <span>{cargo.code}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {cargo.hsCode}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {cargo.name[locale]}
                    </h3>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 pt-2.5 border-t border-slate-200/80 dark:border-slate-800 font-mono text-[11px] tabular-nums">
                    <div>
                      <span className="text-[9px] text-slate-400 block">Ea</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {cargo.eaKj} kJ
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">Q₁₀</span>
                      <span className="font-bold text-sky-600 dark:text-sky-400">
                        {cargo.q10Coeff}×
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-400 block">T_opt</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {cargo.tOptMinC}..+{cargo.tOptMaxC}°C
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Main Interactive Simulator + Decay Curve Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Left 5 Cols: Interactive Thermal Excursion & Port Dwell Controls */}
            <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-[#0B101B] border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 shadow-xl flex flex-col justify-between gap-5">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold block">
                      {selectedCargo.code} • ${selectedCargo.defaultCargoValueUsd.toLocaleString()}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {copy.p3SimHeader}
                    </h3>
                  </div>
                  <Badge
                    variant={
                      kineticsResult.severity === 'CRITICAL'
                        ? 'amber'
                        : kineticsResult.severity === 'WARNING'
                        ? 'amber'
                        : 'mint'
                    }
                    size="sm"
                    dot
                  >
                    {kineticsResult.severity}
                  </Badge>
                </div>

                {/* Scenario Presets */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('NOMINAL')}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-emerald-500/15 dark:bg-slate-900 dark:hover:bg-emerald-500/20 border border-slate-200 dark:border-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300 transition-all active:scale-[0.96] cursor-pointer"
                  >
                    {copy.p3PresetNominal}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('KURYK_STORM')}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-rose-500/15 dark:bg-slate-900 dark:hover:bg-rose-500/20 border border-slate-200 dark:border-slate-800 text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 transition-all active:scale-[0.96] cursor-pointer"
                  >
                    {copy.p3PresetKurykStorm}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('POWER_SAG')}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-amber-500/15 dark:bg-slate-900 dark:hover:bg-amber-500/20 border border-slate-200 dark:border-slate-800 text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 transition-all active:scale-[0.96] cursor-pointer"
                  >
                    {copy.p3PresetPowerSag}
                  </button>
                </div>

                {/* Slider 1: Core Temperature */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-slate-600 dark:text-slate-300 font-semibold">
                      {copy.p3SliderTemp}
                    </span>
                    <span className="font-bold text-sky-600 dark:text-sky-400">
                      {simTempC > 0 ? `+${simTempC.toFixed(1)}°C` : `${simTempC.toFixed(1)}°C`}{' '}
                      <span className="text-[10px] text-slate-400">
                        (Opt: {selectedCargo.tOptMinC}..+{selectedCargo.tOptMaxC}°C)
                      </span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-2.5"
                    max="16.0"
                    step="0.5"
                    value={simTempC}
                    onChange={(e) => setSimTempC(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                  />
                </div>

                {/* Slider 2: Headspace Ethanol VOC */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-slate-600 dark:text-slate-300 font-semibold">
                      {copy.p3SliderEthanol}
                    </span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {simEthanolPpm.toFixed(1)} ppm{' '}
                      <span className="text-[10px] text-slate-400">
                        (Crit: {selectedCargo.vocCriticalPpm} ppm)
                      </span>
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="55.0"
                    step="1.0"
                    value={simEthanolPpm}
                    onChange={(e) => setSimEthanolPpm(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                  />
                </div>

                {/* Slider 3: Port Staging Dwell Delay */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs font-mono tabular-nums">
                    <span className="text-slate-600 dark:text-slate-300 font-semibold">
                      {copy.p3SliderDwell}
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {simDwellHours} h
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="72"
                    step="2"
                    value={simDwellHours}
                    onChange={(e) => setSimDwellHours(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>

              {/* Biochemical Spoilage Mechanism Box */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 text-xs">
                <span className="font-mono text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  {copy.p3SpoilageMechTitle} ({selectedCargo.regionalOrigin[locale]})
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedCargo.spoilageMechanism[locale]}
                </p>
              </div>
            </div>

            {/* Right 7 Cols: Live Arrhenius Output Gauges + SVG Decay Trajectory */}
            <div className="lg:col-span-7 rounded-2xl bg-[#070B14] border border-slate-800 p-5 sm:p-6 shadow-2xl flex flex-col justify-between gap-5 text-white">
              {/* 4 Live Computed Output Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono tabular-nums">
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">{copy.p3OutAccel}</span>
                  <span className="text-xl font-extrabold text-amber-400">
                    {kineticsResult.alphaTotal}×
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    α_T={kineticsResult.alphaT} • φ_eth={kineticsResult.phiEth}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">{copy.p3OutRul}</span>
                  <span className="text-xl font-extrabold text-sky-400">
                    {kineticsResult.rulHours}h
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {kineticsResult.rulDays}d / {selectedCargo.baselineShelfLifeDays}d base
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">{copy.p3OutBhi}</span>
                  <span
                    className={`text-xl font-extrabold ${
                      kineticsResult.bhi < 55
                        ? 'text-rose-400'
                        : kineticsResult.bhi < 80
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {kineticsResult.bhi}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Freeze limit: {selectedCargo.tFreezeC}°C
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-300/80 block">{copy.p3OutSaved}</span>
                  <span className="text-xl font-extrabold text-emerald-400">
                    ${kineticsResult.preservedUsd.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-400/70 block">
                    of ${selectedCargo.defaultCargoValueUsd.toLocaleString()} lot
                  </span>
                </div>
              </div>

              {/* Dual-Curve Exponential Quality Decay SVG Chart */}
              <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800/90">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3 font-mono text-[11px]">
                  <span className="font-bold text-slate-200">{copy.p3ChartTitle}</span>
                  <div className="flex items-center gap-4 text-[10px]">
                    <span className="inline-flex items-center gap-1.5 text-emerald-400">
                      <span className="w-3 h-0.5 bg-emerald-400 inline-block" />
                      {copy.p3ChartBaseline} (+{selectedCargo.tRefC}°C)
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-rose-400">
                      <span className="w-3 h-0.5 bg-rose-400 inline-block" />
                      {copy.p3ChartExcursion} ({simTempC > 0 ? `+${simTempC}` : simTempC}°C)
                    </span>
                  </div>
                </div>

                <svg viewBox="0 0 680 210" className="w-full h-auto select-none">
                  {/* Horizontal Grid Lines */}
                  {[25, 50, 75, 100].map((pct) => {
                    const y = 180 - (pct / 100) * 150;
                    return (
                      <g key={pct}>
                        <line
                          x1="45"
                          y1={y}
                          x2="655"
                          y2={y}
                          stroke="#1E293B"
                          strokeWidth="1"
                          strokeDasharray="3 3"
                        />
                        <text
                          x="36"
                          y={y + 3}
                          textAnchor="end"
                          className="font-mono text-[9px] fill-slate-500"
                        >
                          {pct}%
                        </text>
                      </g>
                    );
                  })}

                  {/* X-Axis Hour Labels */}
                  {[0, 96, 192, 288, 384, 480].map((hr) => {
                    const x = 45 + (hr / 480) * 610;
                    return (
                      <text
                        key={hr}
                        x={x}
                        y="198"
                        textAnchor="middle"
                        className="font-mono text-[9px] fill-slate-500"
                      >
                        {hr}h ({hr / 24}d)
                      </text>
                    );
                  })}

                  {/* Nominal Baseline Curve (Emerald Dashed) */}
                  <polyline
                    fill="none"
                    stroke="#34D399"
                    strokeWidth="2.2"
                    strokeDasharray="6 4"
                    points={kineticsResult.curvePoints
                      .map((pt) => {
                        const x = 45 + (pt.hour / 480) * 610;
                        const y = 180 - (pt.baselineY / 100) * 150;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ')}
                  />

                  {/* Simulated Excursion Curve (Crimson / Amber Solid) */}
                  <polyline
                    fill="none"
                    stroke={kineticsResult.severity === 'OPTIMAL' ? '#38BDF8' : '#F43F5E'}
                    strokeWidth="3"
                    points={kineticsResult.curvePoints
                      .map((pt) => {
                        const x = 45 + (pt.hour / 480) * 610;
                        const y = 180 - (pt.excursionY / 100) * 150;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ')}
                  />
                </svg>
              </div>

              {/* Bottom Thermodynamic Formula Strip */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">
                    {copy.p3FormulaTitle}
                  </span>
                  <span className="text-emerald-400 font-bold">
                    k(T) = A · exp(-Eₐ / R·T_K) × φ_eth(C₂H₅OH) × φ_vib(G)
                  </span>
                </div>
                <div className="text-right tabular-nums text-[11px] text-slate-300">
                  Eₐ = {selectedCargo.eaJoules.toLocaleString()} J/mol • R = 8.314 J/(mol·K)
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* =====================================================================
          BOTTOM COMMERCIAL DISPATCH CTA
         ===================================================================== */}
      <section className="py-16 sm:py-20">
        <Container size="lg">
          <div className="p-8 sm:p-10 rounded-3xl bg-slate-900 dark:bg-[#0B101B] border border-slate-800 text-white shadow-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-2xl flex flex-col gap-3">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                {copy.bottomCtaBadge}
              </span>
              <h2
                className="text-2xl sm:text-3xl font-extrabold tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                {copy.bottomCtaTitle}
              </h2>
              <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                {copy.bottomCtaDesc}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                href="/dashboard"
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {copy.bottomCtaBtnDashboard}
              </Button>
              <Button href="/dashboard/support" variant="secondary" size="lg">
                {copy.bottomCtaBtnSupport}
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
