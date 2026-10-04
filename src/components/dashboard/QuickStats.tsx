'use client';

import React from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { useI18n } from '@/lib/i18n/context';
import { ShipmentItem } from '@/types/shipment';
import { 
  Truck, 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  DollarSign, 
  Activity 
} from 'lucide-react';

interface QuickStatsProps {
  shipments: ShipmentItem[];
}

export const QuickStats: React.FC<QuickStatsProps> = ({ shipments }) => {
  const { t } = useI18n();

  const totalActive = shipments.length;
  const optimalCount = shipments.filter((s) => s.status === 'OPTIMAL').length;
  const warningCount = shipments.filter((s) => s.status === 'WARNING').length;
  const criticalCount = shipments.filter((s) => s.status === 'CRITICAL').length;
  const totalValue = shipments.reduce((sum, s) => sum + s.assetValueUsd, 0);
  const avgBhi = shipments.length > 0 
    ? (shipments.reduce((sum, s) => sum + s.bhi, 0) / shipments.length).toFixed(1)
    : '0';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
      {/* 1. Total Active Shipments */}
      <GlassCard className="p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            {t('dashboard.stat_active')}
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Truck className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {totalActive}
          </div>
          <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center gap-1 font-mono">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>TMTM Transit</span>
          </div>
        </div>
      </GlassCard>

      {/* 2. Optimal / Healthy */}
      <GlassCard className="p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            {t('dashboard.stat_healthy')}
          </span>
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-400">
            {optimalCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {((optimalCount / (totalActive || 1)) * 100).toFixed(0)}% of fleet
          </div>
        </div>
      </GlassCard>

      {/* 3. At Risk (Warning) */}
      <GlassCard className="p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            {t('dashboard.stat_warning')}
          </span>
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">
            {warningCount}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Thermal drift
          </div>
        </div>
      </GlassCard>

      {/* 4. Critical Alerts */}
      <GlassCard className="p-4 flex flex-col justify-between border-red-500/30 bg-red-950/20">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-red-300">
            {t('dashboard.stat_critical')}
          </span>
          <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
            <Flame className="w-3.5 h-3.5 animate-pulse" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-red-400">
            {criticalCount}
          </div>
          <div className="text-[10px] text-red-400/90 mt-0.5 font-semibold">
            {t('dashboard.alert_action_required')}
          </div>
        </div>
      </GlassCard>

      {/* 5. Protected Cargo Value */}
      <GlassCard className="p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            {t('dashboard.stat_value')}
          </span>
          <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <DollarSign className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ${(totalValue / 1000).toFixed(0)}k
          </div>
          <div className="text-[10px] text-purple-400 mt-0.5 font-mono">
            USD Protected
          </div>
        </div>
      </GlassCard>

      {/* 6. Fleet Mean BHI */}
      <GlassCard className="p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider">
            {t('dashboard.stat_avg_bhi')}
          </span>
          <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Activity className="w-3.5 h-3.5" />
          </div>
        </div>
        <div>
          <div className="text-2xl sm:text-3xl font-black text-cyan-400">
            {avgBhi}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Bio-digital twin
          </div>
        </div>
      </GlassCard>
    </div>
  );
};
