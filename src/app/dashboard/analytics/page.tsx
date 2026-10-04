'use client';

import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/lib/i18n/context';
import { 
  TrendingUp, 
  Leaf, 
  DollarSign, 
  ShieldCheck, 
  MapPin, 
  Train, 
  Ship, 
  Truck, 
  Activity, 
  ArrowRight 
} from 'lucide-react';

export default function AnalyticsPage() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-8 py-8 sm:py-12">
      <Container size="lg">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 pb-4 border-b border-slate-800">
          <Link href="/dashboard" className="hover:text-emerald-400 transition-colors font-medium">
            {t('shipment_detail.breadcrumb_dash')}
          </Link>
          <span>/</span>
          <span className="text-white font-medium">{t('nav.analytics')}</span>
        </div>

        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-6">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="purple" size="sm" dot>
                {t('analytics.badge')}
              </Badge>
              <span className="text-xs font-mono text-slate-400">
                Trans-Caspian Middle Corridor (TMTM)
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {t('analytics.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              {t('analytics.subtitle')}
            </p>
          </div>

          <Button
            href="/dashboard"
            variant="glass"
            size="sm"
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            {t('nav.dashboard')}
          </Button>
        </div>

        {/* 4 Core ESG & Financial Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {/* Card 1: Spoilage Rate */}
          <GlassCard variant="glow-mint" className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {t('analytics.metric_spoilage_rate')}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-emerald-400">
                5.4%
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {t('analytics.metric_spoilage_baseline')}
              </div>
            </div>
          </GlassCard>

          {/* Card 2: Saved Capital */}
          <GlassCard variant="glow-purple" className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {t('analytics.metric_saved_capital')}
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-purple-300 font-mono">
                $428,000
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Across 32 piloted corridor voyages
              </div>
            </div>
          </GlassCard>

          {/* Card 3: Carbon Avoided */}
          <GlassCard variant="glow-mint" className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {t('analytics.metric_co2_avoided')}
              </span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Leaf className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-cyan-400 font-mono">
                184 MT
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Equivalent to 380 passenger flights
              </div>
            </div>
          </GlassCard>

          {/* Card 4: Shelf Life Retention */}
          <GlassCard className="p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                {t('analytics.metric_on_time_shelf')}
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-black text-white font-mono">
                92.4%
              </div>
              <div className="text-xs text-slate-400 mt-1">
                Mean biological index on delivery
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Section 2: Middle Corridor Waypoint Transit Integrity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Waypoint Integrity Breakdown (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <GlassCard className="p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">
                  {t('analytics.transit_integrity')}
                </h3>
                <span className="text-xs font-mono text-emerald-400">
                  96.8% Fleet Avg
                </span>
              </div>

              {/* Waypoint 1: Kazakhstan Rail */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Train className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Dostyk / Almaty → Port Kuryk (KTZ Rail)</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">98.2%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '98.2%' }} />
                </div>
              </div>

              {/* Waypoint 2: Port Kuryk Staging Buffer */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Ship className="w-3.5 h-3.5 text-purple-400" />
                    <span>Port Kuryk Ferry Buffer → Baku Alat (Caspian Sea)</span>
                  </span>
                  <span className="font-mono text-amber-400 font-bold">94.6%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: '94.6%' }} />
                </div>
              </div>

              {/* Waypoint 3: Azerbaijan & Georgia */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Train className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Baku Alat → Poti / Batumi Hub (ADY / Georgian Rail)</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">97.8%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '97.8%' }} />
                </div>
              </div>

              {/* Waypoint 4: Black Sea / Bosphorus */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 flex items-center gap-2">
                    <Ship className="w-3.5 h-3.5 text-purple-400" />
                    <span>Poti → Istanbul / Constanța (Black Sea Feeder)</span>
                  </span>
                  <span className="font-mono text-emerald-400 font-bold">96.5%</span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '96.5%' }} />
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Modal Breakdown (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <GlassCard className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white">
                  {t('analytics.modal_breakdown')}
                </h3>
                <Badge variant="mint" size="sm">
                  Corridor Mix
                </Badge>
              </div>

              <div className="flex flex-col gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Train className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Rail Transit (KTZ / ADY)</span>
                      <span className="text-[11px] text-slate-400">Sub-GHz mesh connected</span>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-emerald-400">54%</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                      <Ship className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Ro-Ro Marine Ferry</span>
                      <span className="text-[11px] text-slate-400">Caspian & Black Sea segments</span>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-purple-400">31%</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white block">Reefer Truck Last-Mile</span>
                      <span className="text-[11px] text-slate-400">Inland hub distribution</span>
                    </div>
                  </div>
                  <span className="font-mono text-sm font-bold text-cyan-400">15%</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </Container>
    </div>
  );
}
