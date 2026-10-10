'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Radio, 
  Cpu, 
  Zap,
  Sparkles,
  ShieldCheck,
  Truck,
  Box,
  Layers,
  Activity
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

  // Track window scroll progress for scrollytelling
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

  return (
    <div className="flex flex-col gap-16 md:gap-24 py-8 md:py-16">
      {/* 1. Hero Introduction */}
      <section className="relative">
        <Container size="lg">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto gap-6">
            {/* Eyebrow Badge */}
            <Badge variant="mint" size="md" dot>
              {t('hero.badge')}
            </Badge>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
              {t('hero.headline')}
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl leading-relaxed">
              {t('hero.subhead')}
            </p>

            {/* Quick Action CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button
                href="/dashboard"
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                {t('nav.launch_dashboard') || 'Launch Fleet Dashboard'}
              </Button>
              <Button
                href="/dashboard/shipment/FS-8821"
                variant="glass"
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
                {t('nav.analytics')}
              </Button>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. Interactive 3D Biological Twin Scrollytelling Showcase */}
      <section className="relative">
        <Container size="lg">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="mint" size="sm" dot>
                    REAL-TIME 3D BIOLOGICAL DIGITAL TWIN
                  </Badge>
                  <span className="text-xs font-mono text-slate-400">
                    Arrhenius Degradation & AI Time-Reversal Engine
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
                  From Orchard Harvest to Cold-Chain Dispatch
                </h2>
                <p className="text-sm sm:text-base text-slate-300 max-w-2xl mt-1 leading-relaxed">
                  Scroll down through the page or drag the timeline scrubber below to observe the perishable asset undergo thermal abuse, decay, AI time-reversal, smart crate encapsulation, and autonomous reefer truck dispatch.
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Hardware Accelerated WebGL • 60 FPS</span>
              </div>
            </div>

            {/* 3D WebGL Canvas Component */}
            <PearScrollytellingDynamic 
              scrollProgress={scrollProgress} 
              onProgressChange={(p) => setScrollProgress(p)}
            />
          </div>
        </Container>
      </section>

      {/* 3. Hero Metrics Badges */}
      <section>
        <Container size="lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <GlassCard variant="glow-mint" className="p-6 text-left">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 mb-1">
                {t('hero.metric_1_val')}
              </div>
              <div className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                {t('hero.metric_1_lbl')}
              </div>
              <div className="text-xs text-slate-400">
                {t('hero.metric_1_sub')}
              </div>
            </GlassCard>

            <GlassCard variant="glow-purple" className="p-6 text-left">
              <div className="text-3xl sm:text-4xl font-black text-purple-400 mb-1">
                {t('hero.metric_2_val')}
              </div>
              <div className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                {t('hero.metric_2_lbl')}
              </div>
              <div className="text-xs text-slate-400">
                {t('hero.metric_2_sub')}
              </div>
            </GlassCard>

            <GlassCard variant="glow-mint" className="p-6 text-left">
              <div className="text-3xl sm:text-4xl font-black text-cyan-400 mb-1">
                {t('hero.metric_3_val')}
              </div>
              <div className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                {t('hero.metric_3_lbl')}
              </div>
              <div className="text-xs text-slate-400">
                {t('hero.metric_3_sub')}
              </div>
            </GlassCard>
          </div>
        </Container>
      </section>

      {/* 4. Core Technology Pillars */}
      <section>
        <Container size="lg">
          <div className="flex flex-col items-center text-center gap-4 mb-12">
            <Badge variant="purple" size="md">
              {t('hero.core_innovations_badge')}
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              {t('hero.core_innovations_title')}
            </h2>
            <p className="text-sm sm:text-base text-slate-400 max-w-2xl">
              {t('hero.core_innovations_sub')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <GlassCard variant="interactive" className="p-8 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {t('hero.val_prop_1_title')}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t('hero.val_prop_1_desc')}
              </p>
            </GlassCard>

            <GlassCard variant="interactive" className="p-8 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {t('hero.val_prop_2_title')}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t('hero.val_prop_2_desc')}
              </p>
            </GlassCard>

            <GlassCard variant="interactive" className="p-8 flex flex-col gap-4">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                {t('hero.val_prop_3_title')}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t('hero.val_prop_3_desc')}
              </p>
            </GlassCard>
          </div>
        </Container>
      </section>

      {/* 5. Digital Twin Interactive Teaser Section */}
      <section>
        <Container size="lg">
          <GlassCard variant="glow-mint" className="p-8 md:p-12 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="flex flex-col gap-5">
                <Badge variant="mint" size="sm" dot>
                  {t('hero.teaser_badge')}
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-bold text-white">
                  {t('hero.teaser_title')}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed">
                  {t('hero.teaser_desc')}
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Button
                    href="/dashboard"
                    variant="primary"
                    size="md"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {t('nav.launch_dashboard') || 'Open Dashboard'}
                  </Button>
                  <Button
                    href="/dashboard/shipment/FS-8821"
                    variant="glass"
                    size="md"
                  >
                    {t('shipments.btn_inspect') || 'Control Tower →'}
                  </Button>
                </div>
              </div>

              {/* Simulated HUD Preview Card */}
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/80 p-6 flex flex-col gap-4 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-emerald-400 font-bold">CONTAINER: KZ-REEF-8942</span>
                  <span className="text-slate-400">WAYPOINT: Port Kuryk (Day 6 / 18)</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block mb-1">Temperature</span>
                    <span className="text-lg font-bold text-cyan-400">+2.4°C</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block mb-1">Ethanol (C₂H₄)</span>
                    <span className="text-lg font-bold text-emerald-400">4.2 ppm</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block mb-1">Health Index (BHI)</span>
                    <span className="text-lg font-bold text-emerald-400">96.8%</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                    <span className="text-slate-400 block mb-1">Shelf-Life (RSL)</span>
                    <span className="text-lg font-bold text-white">18.4 Days</span>
                  </div>
                </div>
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/80">
                  <span>DCSA Track & Trace 3.0 Connected</span>
                  <span className="text-emerald-400 font-sans font-semibold">● Protocol Active</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </Container>
      </section>
    </div>
  );
}
