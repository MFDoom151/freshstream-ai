'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Activity, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Box, 
  Zap, 
  Cpu, 
  Radio, 
  AlertTriangle,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useI18n } from '@/lib/i18n/context';
import { PearScrollytellingDynamic } from '@/components/3d/PearScrollytellingDynamic';

export default function HomePage() {
  const { t } = useI18n();
  const [scrollProgress, setScrollProgress] = useState<number>(0);

  // Synchronize window scroll progress (0.0 to 1.0)
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const current = Math.min(1.0, Math.max(0.0, window.scrollY / totalScroll));
        setScrollProgress(current);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth programmatic scroll when clicking story chapter markers or scrubber
  const handleScrollToProgress = (progress: number) => {
    const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({
      top: progress * totalScroll,
      behavior: 'smooth',
    });
  };

  // Determine active stage details for the HUD
  const getStageMeta = (p: number) => {
    if (p < 0.30) {
      return {
        step: '01 / 05',
        label: t('story.stage_1_label') || 'HARVEST & BASELINE',
        title: t('story.stage_1_title') || 'Fresh Agricultural Asset',
        bhi: '99.8%',
        temp: '+0.8°C [OPTIMAL]',
        ethanol: '2.4 ppm',
        status: t('story.stage_1_status') || 'Pristine Asian Bartlett Pear • Baseline Remaining Shelf-Life: 30 Days',
        badgeVariant: 'mint' as const,
        color: 'text-emerald-400 dark:text-emerald-400',
        borderColor: 'border-emerald-500/50',
      };
    } else if (p < 0.60) {
      const decayPct = Math.round(((p - 0.30) / 0.30) * 100);
      return {
        step: '02 / 05',
        label: t('story.stage_2_label') || 'THERMAL SPOILAGE',
        title: t('story.stage_2_title') || 'Thermal Abuse & Rot Active',
        bhi: `${Math.max(15, 100 - decayPct)}%`,
        temp: `+${(1.5 + (decayPct / 100) * 8.0).toFixed(1)}°C [CRITICAL HEAT]`,
        ethanol: `${(3.0 + (decayPct / 100) * 32.0).toFixed(1)} ppm`,
        status: `${t('story.stage_2_status') || 'Reefer Failure • Necrotic Lesions • Fungal Mold Spores'} (${decayPct}%)`,
        badgeVariant: 'danger' as const,
        color: 'text-rose-400 dark:text-rose-400',
        borderColor: 'border-rose-500/50',
      };
    } else if (p < 0.75) {
      const recPct = Math.round(((p - 0.60) / 0.15) * 100);
      return {
        step: '03 / 05',
        label: t('story.stage_3_label') || 'ARRHENIUS RECOVERY',
        title: t('story.stage_3_title') || 'Biological Digital Twin Restoration',
        bhi: `${Math.min(100, 45 + Math.round(recPct * 0.55))}% [RESTORING]`,
        temp: '+1.2°C [QUENCHED]',
        ethanol: '3.1 ppm',
        status: t('story.stage_3_status') || 'Arrhenius Kinetics Halted Decay • Respiration Quenched • Tissue Rehydrated',
        badgeVariant: 'purple' as const,
        color: 'text-cyan-400 dark:text-cyan-400',
        borderColor: 'border-cyan-500/50',
      };
    } else if (p < 0.90) {
      return {
        step: '04 / 05',
        label: t('story.stage_4_label') || 'SMART PACKAGING',
        title: t('story.stage_4_title') || 'Insulated Carton Encapsulation',
        bhi: '100.0%',
        temp: '+0.5°C [PULSE-COOLED]',
        ethanol: '2.1 ppm',
        status: t('story.stage_4_status') || 'Hermetic Silicone Gaskets • CA Nitrogen Atmosphere • IoT Sensor Puck Active',
        badgeVariant: 'mint' as const,
        color: 'text-emerald-400 dark:text-emerald-400',
        borderColor: 'border-emerald-500/50',
      };
    } else {
      return {
        step: '05 / 05',
        label: t('story.stage_5_label') || 'HIGHWAY DISPATCH',
        title: t('story.stage_5_title') || 'Reefer Semi-Trailer En Route',
        bhi: '100.0%',
        temp: '+1.0°C [DCSA MONITORED]',
        ethanol: '2.0 ppm',
        status: t('story.stage_5_status') || 'Dispatched via Trans-Caspian Silk Road • Transit Hub: Port Kuryk (Day 1 / 18)',
        badgeVariant: 'purple' as const,
        color: 'text-indigo-400 dark:text-indigo-400',
        borderColor: 'border-indigo-500/50',
      };
    }
  };

  const stageMeta = getStageMeta(scrollProgress);

  return (
    <div id="homepage-root" data-pear-canvas="true" className="relative w-full min-h-[480vh]">
      {/* 1. Full-Viewport Fixed 3D WebGL Canvas Layer */}
      <div 
        id="pear-scrollytelling-canvas"
        aria-hidden="true" 
        className="fixed inset-0 -z-10 w-screen h-screen overflow-hidden pointer-events-none"
      >
        <PearScrollytellingDynamic 
          scrollProgress={scrollProgress}
          onProgressChange={setScrollProgress}
        />
      </div>

      {/* 2. Contrast Scrim (Ensures WCAG AA Text Contrast across both themes) */}
      <div 
        aria-hidden="true" 
        className="fixed inset-0 -z-1 w-screen h-screen pointer-events-none bg-gradient-to-r from-slate-950/85 via-slate-950/50 to-transparent dark:block hidden"
      />
      <div 
        aria-hidden="true" 
        className="fixed inset-0 -z-1 w-screen h-screen pointer-events-none bg-gradient-to-r from-white/90 via-white/55 to-transparent dark:hidden block"
      />

      {/* 3. Narrative Scrollytelling Sections (Chapters 01 to 05) */}
      <div className="relative z-10 flex flex-col">
        
        {/* --- CHAPTER 01: 0% - 30% Harvest & Baseline Pristine Asset --- */}
        <section className="min-h-screen flex items-center py-20 px-4 sm:px-6 lg:px-8">
          <Container size="lg">
            <div className="max-w-2xl flex flex-col gap-6 text-left">
              <Badge variant="mint" size="md" dot>
                {t('hero.badge') || 'TRANSCASPIAN COLD-CHAIN DIGITAL TWIN'}
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                {t('hero.headline') || 'Active Biological Preservation for Eurasian Agri-Logistics'}
              </h1>

              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                {t('hero.subhead') || 'Eliminating transit food spoilage along Central Eurasia’s Trans-Caspian Middle Corridor by replacing passive temperature logging with active biological prediction.'}
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Button
                  href="/dashboard"
                  variant="primary"
                  size="lg"
                  rightIcon={<ArrowRight className="w-5 h-5" />}
                >
                  {t('nav.launch_dashboard') || 'Launch Fleet Dashboard'}
                </Button>
                <Button
                  href="/demo"
                  variant="secondary"
                  size="lg"
                  rightIcon={<Activity className="w-5 h-5" />}
                >
                  {t('hero.cta_demo') || 'Digital Twin Control Tower'}
                </Button>
                <Button
                  href="/dashboard/analytics"
                  variant="outline"
                  size="lg"
                >
                  {t('nav.analytics') || 'Analytics'}
                </Button>
              </div>

              {/* Frosted Glass Narrative Card */}
              <div className="mt-4 p-6 sm:p-7 rounded-2xl bg-white/90 dark:bg-slate-950/85 backdrop-blur-md border border-slate-200/90 dark:border-slate-800/80 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-mono font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                    {t('story.ch1_badge')}
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {t('story.ch1_baseline')}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {t('story.ch1_title')}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {t('story.ch1_desc')}
                </p>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{t('story.ch1_metric_health')}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base">99.8%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{t('story.ch1_metric_temp')}</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold text-base">+0.8°C</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{t('story.ch1_metric_ethanol')}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold text-base">2.4 ppm</span>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* --- CHAPTER 02: 30% - 60% The Bottleneck & Thermal Spoilage --- */}
        <section className="min-h-screen flex items-center py-20 px-4 sm:px-6 lg:px-8">
          <Container size="lg">
            <div className="max-w-2xl flex flex-col gap-6 text-left">
              <div className="p-6 sm:p-8 rounded-2xl bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border border-rose-300 dark:border-rose-900/60 shadow-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono font-bold tracking-wider text-rose-600 dark:text-rose-400 uppercase flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {t('story.ch2_badge')}
                  </span>
                  <span className="text-slate-400 dark:text-slate-600">•</span>
                  <span className="text-xs font-mono text-rose-600 dark:text-rose-400 font-semibold">
                    {t('story.ch2_status_badge')}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
                  {t('story.ch2_title')}
                </h2>

                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {t('story.ch2_desc')}
                </p>

                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 mb-4">
                  <h3 className="text-xs font-bold font-mono text-rose-700 dark:text-rose-300 uppercase mb-1">
                    {t('story.ch2_warning_title')}
                  </h3>
                  <p className="text-xs text-rose-900 dark:text-rose-200/90 leading-relaxed">
                    {t('story.ch2_warning_desc')}
                  </p>
                </div>

                {/* Telemetry Warning Gauges */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{t('story.ch2_metric_health')}</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold text-base">32.4%</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{t('story.ch2_metric_temp')}</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold text-base">+9.2°C</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{t('story.ch2_metric_gas')}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-bold text-base">36.8 ppm</span>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* --- CHAPTER 03: 60% - 75% AI Digital Twin Arrhenius Intervention --- */}
        <section className="min-h-screen flex items-center py-20 px-4 sm:px-6 lg:px-8">
          <Container size="lg">
            <div className="max-w-2xl flex flex-col gap-6 text-left">
              <div className="p-6 sm:p-8 rounded-2xl bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border border-cyan-300 dark:border-cyan-900/60 shadow-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono font-bold tracking-wider text-cyan-600 dark:text-cyan-400 uppercase flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5" />
                    {t('story.ch3_badge')}
                  </span>
                  <span className="text-slate-400 dark:text-slate-600">•</span>
                  <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
                    {t('story.ch3_status_badge')}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
                  {t('story.ch3_title')}
                </h2>

                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {t('story.ch3_desc')}
                </p>

                <div className="p-4 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/50 mb-4">
                  <h3 className="text-xs font-bold font-mono text-cyan-700 dark:text-cyan-300 uppercase mb-1">
                    {t('story.ch3_rescue_title')}
                  </h3>
                  <p className="text-xs text-cyan-900 dark:text-cyan-200/90 leading-relaxed">
                    {t('story.ch3_rescue_desc')}
                  </p>
                </div>

                {/* Saved Value Metrics */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{t('story.ch3_metric_saved')}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-base">$15,000</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{t('story.ch3_metric_window')}</span>
                    <span className="text-cyan-600 dark:text-cyan-400 font-bold text-base">14 Hours</span>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block text-[10px]">{t('story.ch3_metric_roi')}</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold text-base">1150%</span>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* --- CHAPTER 04: 75% - 90% Smart Carton Encapsulation --- */}
        <section className="min-h-screen flex items-center py-20 px-4 sm:px-6 lg:px-8">
          <Container size="lg">
            <div className="max-w-2xl flex flex-col gap-6 text-left">
              <div className="p-6 sm:p-8 rounded-2xl bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border border-emerald-300 dark:border-emerald-900/60 shadow-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono font-bold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase flex items-center gap-1.5">
                    <Box className="w-3.5 h-3.5" />
                    {t('story.ch4_badge')}
                  </span>
                  <span className="text-slate-400 dark:text-slate-600">•</span>
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {t('story.ch4_status_badge')}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
                  {t('story.ch4_title')}
                </h2>

                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {t('story.ch4_desc')}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block mb-1">{t('story.ch4_feat1_title')}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">{t('story.ch4_feat1_desc')}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block mb-1">{t('story.ch4_feat2_title')}</span>
                    <span className="text-xs text-slate-600 dark:text-slate-400">{t('story.ch4_feat2_desc')}</span>
                  </div>
                </div>

                {/* Container Status */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 font-mono text-xs">
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {t('story.ch4_sealed')}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {t('story.ch4_id')}
                  </span>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* --- CHAPTER 05: 90% - 100% Eurasian Reefer Dispatch --- */}
        <section className="min-h-screen flex items-center py-20 px-4 sm:px-6 lg:px-8">
          <Container size="lg">
            <div className="max-w-2xl flex flex-col gap-6 text-left">
              <div className="p-6 sm:p-8 rounded-2xl bg-white/95 dark:bg-slate-950/90 backdrop-blur-md border border-indigo-300 dark:border-indigo-900/60 shadow-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-mono font-bold tracking-wider text-indigo-600 dark:text-indigo-400 uppercase flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    {t('story.ch5_badge')}
                  </span>
                  <span className="text-slate-400 dark:text-slate-600">•</span>
                  <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                    {t('story.ch5_status_badge')}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-3">
                  {t('story.ch5_title')}
                </h2>

                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                  {t('story.ch5_desc')}
                </p>

                <div className="flex flex-wrap gap-3 mb-6">
                  <Button
                    href="/dashboard"
                    variant="primary"
                    size="md"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {t('story.ch5_btn_dashboard')}
                  </Button>
                  <Button
                    href="/demo"
                    variant="secondary"
                    size="md"
                    rightIcon={<Activity className="w-4 h-4" />}
                  >
                    {t('story.ch5_btn_demo')}
                  </Button>
                  <Button
                    href="/dashboard/shipment/FS-8821"
                    variant="glass"
                    size="md"
                    rightIcon={<Box className="w-4 h-4" />}
                  >
                    {t('story.ch5_btn_twin')}
                  </Button>
                  <Button
                    href="/dashboard/support"
                    variant="outline"
                    size="md"
                  >
                    {t('story.ch5_btn_support')}
                  </Button>
                </div>

                {/* Core Pillars Recap */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Radio className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{t('story.ch5_pillar_iot')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <Cpu className="w-4 h-4 text-purple-500 shrink-0" />
                    <span>{t('story.ch5_pillar_ai')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-cyan-500 shrink-0" />
                    <span>{t('story.ch5_pillar_dcsa')}</span>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

      </div>

      {/* 4. Persistent Bottom Chapter Navigation Pills & Scrubber HUD */}
      <aside 
        aria-label="Story chapter controls and telemetry HUD"
        className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6 z-20 pointer-events-auto max-w-4xl mx-auto"
      >
        <div className="p-4 sm:p-5 rounded-2xl bg-white/95 dark:bg-slate-950/90 backdrop-blur-xl border border-slate-300/80 dark:border-slate-800/80 shadow-2xl flex flex-col gap-3">
          
          {/* Header Row: Stage Metadata & Live Gauges */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase">
                {stageMeta.step}
              </span>
              <span className={`font-mono font-bold uppercase tracking-wider ${stageMeta.color}`}>
                {stageMeta.label}
              </span>
              <span className="text-slate-400 dark:text-slate-600 hidden sm:inline">•</span>
              <span className="text-slate-600 dark:text-slate-300 font-medium hidden sm:inline truncate max-w-xs">
                {stageMeta.title}
              </span>
            </div>

            {/* Gauges */}
            <div className="flex items-center gap-3 font-mono text-[11px]">
              <div>
                <span className="text-slate-500 dark:text-slate-400 mr-1.5">{t('story.hud_bhi_lbl')}:</span>
                <span className={`font-bold ${stageMeta.color}`}>{stageMeta.bhi}</span>
              </div>
              <div className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
              <div>
                <span className="text-slate-500 dark:text-slate-400 mr-1.5">{t('story.hud_temp_lbl')}:</span>
                <span className="text-cyan-600 dark:text-cyan-300 font-bold">{stageMeta.temp}</span>
              </div>
              <div className="w-px h-3 bg-slate-300 dark:bg-slate-700" />
              <div>
                <span className="text-slate-500 dark:text-slate-400 mr-1.5">{t('story.hud_ethanol_lbl')}:</span>
                <span className="text-amber-600 dark:text-amber-300 font-bold">{stageMeta.ethanol}</span>
              </div>
            </div>
          </div>

          {/* Timeline Range Scrubber */}
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="1"
              step="0.002"
              value={scrollProgress}
              onChange={(e) => handleScrollToProgress(parseFloat(e.target.value))}
              aria-label="3D Decay Scrollytelling Progress"
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
            />
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400 w-10 text-right">
              {Math.round(scrollProgress * 100)}%
            </span>
          </div>

          {/* 5-Stage Story Chapter Buttons */}
          <div className="grid grid-cols-5 text-[10px] sm:text-xs font-mono text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800/80">
            <button 
              type="button"
              onClick={() => handleScrollToProgress(0.05)}
              className={`text-left hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors ${scrollProgress < 0.30 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}
            >
              {t('story.scrubber_step_1')}
            </button>
            <button 
              type="button"
              onClick={() => handleScrollToProgress(0.45)}
              className={`text-center hover:text-rose-500 dark:hover:text-rose-400 transition-colors ${scrollProgress >= 0.30 && scrollProgress < 0.60 ? 'text-rose-600 dark:text-rose-400 font-bold' : ''}`}
            >
              {t('story.scrubber_step_2')}
            </button>
            <button 
              type="button"
              onClick={() => handleScrollToProgress(0.68)}
              className={`text-center hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors ${scrollProgress >= 0.60 && scrollProgress < 0.75 ? 'text-cyan-600 dark:text-cyan-400 font-bold' : ''}`}
            >
              {t('story.scrubber_step_3')}
            </button>
            <button 
              type="button"
              onClick={() => handleScrollToProgress(0.82)}
              className={`text-center hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors ${scrollProgress >= 0.75 && scrollProgress < 0.90 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : ''}`}
            >
              {t('story.scrubber_step_4')}
            </button>
            <button 
              type="button"
              onClick={() => handleScrollToProgress(0.98)}
              className={`text-right hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors ${scrollProgress >= 0.90 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : ''}`}
            >
              {t('story.scrubber_step_5')}
            </button>
          </div>

        </div>
      </aside>

    </div>
  );
}
