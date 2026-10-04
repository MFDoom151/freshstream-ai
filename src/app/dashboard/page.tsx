'use client';

import React, { useState, useEffect } from 'react';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { useI18n } from '@/lib/i18n/context';
import { INITIAL_SHIPMENTS } from '@/lib/shipments-data';
import { ShipmentItem } from '@/types/shipment';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { AlertsWidget } from '@/components/dashboard/AlertsWidget';
import { ShipmentsTable } from '@/components/dashboard/ShipmentsTable';
import { DigitalTwinMapDynamic } from '@/components/map/DigitalTwinMapDynamic';
import { Activity, ShieldCheck, Radio } from 'lucide-react';

export default function DashboardPage() {
  const { t } = useI18n();
  const [shipments, setShipments] = useState<ShipmentItem[]>(INITIAL_SHIPMENTS);

  useEffect(() => {
    let isMounted = true;
    async function loadShipments() {
      try {
        const res = await fetch('/api/shipments');
        if (res.ok) {
          const data = await res.json();
          if (isMounted && Array.isArray(data.shipments) && data.shipments.length > 0) {
            setShipments(data.shipments);
          }
        }
      } catch (err) {
        console.error('Failed to load shipments from /api/shipments, using initial state:', err);
      }
    }
    loadShipments();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-8 py-8 sm:py-12">
      <Container size="lg">
        {/* Dashboard Title & Top Telematics Badge Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="mint" size="sm" dot>
                Live Fleet Telematics
              </Badge>
              <span className="text-xs font-mono text-slate-400">
                Trans-Caspian Middle Corridor (TMTM)
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {t('dashboard.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              {t('dashboard.subtitle')}
            </p>
          </div>

          {/* Right Status Cluster */}
          <div className="flex items-center gap-2 self-start md:self-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="text-slate-300">Port Kuryk • Alat Gateway</span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-xs font-mono text-purple-300">
              <Activity className="w-3.5 h-3.5 text-purple-400" />
              <span>Bio-Twin Active</span>
            </div>
          </div>
        </div>

        {/* Section 1: KPI QuickStats */}
        <div className="mt-8">
          <QuickStats shipments={shipments} />
        </div>

        {/* Section 2: Real-World Digital Twin Geospatial Command Center */}
        <div className="mt-8 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Trans-Caspian Bio-Digital Twin Command Canvas
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  REAL GIS TELEMETRY
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                Active reefer rail & ro-pax vessels, critical temperature excursions, and bio-degradation events plotted over real geospatial terrain.
              </p>
            </div>
          </div>

          <DigitalTwinMapDynamic shipments={shipments} />
        </div>

        {/* Section 3: Real-Time Alerts Widget */}
        <div className="mt-8">
          <AlertsWidget shipments={shipments} />
        </div>

        {/* Section 3: Active Fleet Shipments Table */}
        <div className="mt-8">
          <ShipmentsTable shipments={shipments} />
        </div>
      </Container>
    </div>
  );
}
