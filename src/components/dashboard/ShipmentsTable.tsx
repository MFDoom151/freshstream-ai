'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/lib/i18n/context';
import { ShipmentItem, ShipmentStatus } from '@/types/shipment';
import { 
  Search, 
  ArrowRight, 
  MapPin, 
  Activity, 
  Thermometer, 
  Droplets, 
  Wind, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Flame,
  ArrowUpDown
} from 'lucide-react';

interface ShipmentsTableProps {
  shipments: ShipmentItem[];
}

export const ShipmentsTable: React.FC<ShipmentsTableProps> = ({ shipments }) => {
  const { t } = useI18n();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ShipmentStatus>('ALL');

  const filteredShipments = useMemo(() => {
    return shipments.filter((item) => {
      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.id.toLowerCase().includes(q) ||
        item.cargoNameEn.toLowerCase().includes(q) ||
        item.exporter.toLowerCase().includes(q) ||
        item.origin.toLowerCase().includes(q) ||
        item.destination.toLowerCase().includes(q) ||
        item.waypointName.toLowerCase().includes(q)
      );
    });
  }, [shipments, statusFilter, searchQuery]);

  return (
    <div id="shipments" className="flex flex-col gap-4">
      {/* Table Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            {t('shipments.table_title')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {t('shipments.table_sub')}
          </p>
        </div>

        {/* Search & Status Filter Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('shipments.search_placeholder')}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('shipments.filter_status_all')}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('OPTIMAL')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'OPTIMAL'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('shipments.filter_optimal')}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('WARNING')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'WARNING'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('shipments.filter_warning')}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('CRITICAL')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'CRITICAL'
                  ? 'bg-red-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('shipments.filter_critical')}
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Surface */}
      <GlassCard className="p-0 overflow-hidden border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/60 text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4 font-semibold">{t('shipments.col_id')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('shipments.col_cargo')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('shipments.col_route')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('shipments.col_telemetry')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('shipments.col_bhi')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('shipments.col_eta')}</th>
                <th className="py-3.5 px-4 font-semibold">{t('shipments.col_status')}</th>
                <th className="py-3.5 px-4 font-semibold text-right">{t('shipments.col_action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-xs">
              {filteredShipments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="font-medium">{t('shipments.empty_search')}</p>
                  </td>
                </tr>
              ) : (
                filteredShipments.map((shipment) => {
                  const isOptimal = shipment.status === 'OPTIMAL';
                  const isWarning = shipment.status === 'WARNING';
                  const isCritical = shipment.status === 'CRITICAL';

                  return (
                    <tr
                      key={shipment.id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* 1. ID */}
                      <td className="py-4 px-4 font-mono font-bold text-white">
                        <Link 
                          href={`/dashboard/shipment/${shipment.id}`}
                          className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                        >
                          <span>{shipment.id}</span>
                        </Link>
                      </td>

                      {/* 2. Cargo & Exporter */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">
                            {shipment.cargoNameEn}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {shipment.exporter}
                          </span>
                        </div>
                      </td>

                      {/* 3. Corridor & Waypoint */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-200 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                            <span>{shipment.waypointName}</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {shipment.origin.split(',')[0]} → {shipment.destination.split(',')[0]}
                          </span>
                        </div>
                      </td>

                      {/* 4. Live Telemetry */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="flex items-center gap-1 text-cyan-300" title="Temperature">
                            <Thermometer className="w-3 h-3 text-cyan-400" />
                            {shipment.telemetry.temperature > 0 ? `+${shipment.telemetry.temperature}` : shipment.telemetry.temperature}°C
                          </span>
                          <span 
                            className={`flex items-center gap-1 font-bold ${
                              shipment.telemetry.ethanol > 35 
                                ? 'text-red-400 animate-pulse' 
                                : shipment.telemetry.ethanol > 15 
                                ? 'text-amber-400' 
                                : 'text-emerald-400'
                            }`}
                            title="Ethanol Volatiles"
                          >
                            <Wind className="w-3 h-3 text-slate-400" />
                            {shipment.telemetry.ethanol} ppm
                          </span>
                        </div>
                      </td>

                      {/* 5. Health Index (BHI) */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1 w-28">
                          <div className="flex items-center justify-between text-[11px] font-mono">
                            <span className="text-slate-300">BHI</span>
                            <span 
                              className={`font-bold ${
                                isCritical ? 'text-red-400' : isWarning ? 'text-amber-400' : 'text-emerald-400'
                              }`}
                            >
                              {shipment.bhi}%
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isCritical 
                                  ? 'bg-red-500' 
                                  : isWarning 
                                  ? 'bg-amber-500' 
                                  : 'bg-emerald-400'
                              }`}
                              style={{ width: `${shipment.bhi}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 6. ETA & Transit */}
                      <td className="py-4 px-4 text-slate-300">
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{shipment.eta}</span>
                        </div>
                      </td>

                      {/* 7. Status */}
                      <td className="py-4 px-4">
                        <Badge
                          variant={isCritical ? 'danger' : isWarning ? 'warning' : 'mint'}
                          size="sm"
                          dot
                        >
                          {shipment.status}
                        </Badge>
                      </td>

                      {/* 8. Action Drilldown */}
                      <td className="py-4 px-4 text-right">
                        <Button
                          href={`/dashboard/shipment/${shipment.id}`}
                          variant="glass"
                          size="sm"
                          rightIcon={<ArrowRight className="w-3 h-3" />}
                        >
                          {t('shipments.btn_inspect')}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};
