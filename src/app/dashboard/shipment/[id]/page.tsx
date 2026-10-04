'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Container } from '@/components/ui/Container';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ControlTower } from '@/components/simulator/ControlTower';
import { DigitalTwinMapDynamic } from '@/components/map/DigitalTwinMapDynamic';
import { getShipmentById, INITIAL_SHIPMENTS } from '@/lib/shipments-data';
import { useI18n } from '@/lib/i18n/context';
import { 
  ArrowLeft, 
  MapPin, 
  Truck, 
  Calendar, 
  DollarSign, 
  Cpu, 
  ShieldCheck, 
  Clock, 
  Activity,
  Layers
} from 'lucide-react';

interface ShipmentPageProps {
  params: Promise<{ id: string }>;
}

export default function ShipmentDetailPage({ params }: ShipmentPageProps) {
  const unwrappedParams = use(params);
  const shipmentId = unwrappedParams.id;
  const { t } = useI18n();

  // Find shipment from authentic dataset or fallback to first
  const shipment = getShipmentById(shipmentId) || INITIAL_SHIPMENTS[0];

  return (
    <div className="flex flex-col gap-6 py-6 sm:py-10">
      <Container size="lg">
        {/* Navigation Breadcrumbs & Back Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400">
            <Link 
              href="/dashboard" 
              className="hover:text-emerald-400 transition-colors font-medium"
            >
              {t('shipment_detail.breadcrumb_dash')}
            </Link>
            <span>/</span>
            <Link 
              href="/dashboard#shipments" 
              className="hover:text-emerald-400 transition-colors font-medium"
            >
              {t('shipment_detail.breadcrumb_shipments')}
            </Link>
            <span>/</span>
            <span className="text-white font-mono font-bold">{shipment.id}</span>
          </div>

          <Button
            href="/dashboard"
            variant="glass"
            size="sm"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
          >
            {t('shipment_detail.back_button')}
          </Button>
        </div>

        {/* Shipment High-Level Metadata Banner */}
        <div className="mt-6">
          <GlassCard className="p-5 sm:p-6 border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Col 1: Shipment ID & Commodity */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  {t('shipment_detail.meta_container')}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-mono font-black text-white">
                    {shipment.id}
                  </span>
                  <Badge
                    variant={
                      shipment.status === 'CRITICAL'
                        ? 'danger'
                        : shipment.status === 'WARNING'
                        ? 'warning'
                        : 'mint'
                    }
                    size="sm"
                    dot
                  >
                    {shipment.status}
                  </Badge>
                </div>
                <span className="text-xs text-emerald-400 font-semibold">
                  {shipment.cargoNameEn}
                </span>
                <span className="text-[11px] text-slate-400">
                  {shipment.exporter}
                </span>
              </div>

              {/* Col 2: Route & Current Waypoint */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Corridor Waypoint
                </span>
                <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{shipment.waypointName}</span>
                </div>
                <span className="text-xs text-slate-300">
                  {shipment.origin} → {shipment.destination}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Carrier: {shipment.carrier}
                </span>
              </div>

              {/* Col 3: Protected Asset Value & Dates */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  {t('shipment_detail.meta_cargo_value')} & ETA
                </span>
                <div className="flex items-center gap-1 text-lg font-bold text-white font-mono">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>{shipment.assetValueUsd.toLocaleString()} USD</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-300 font-mono">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>ETA: {shipment.eta}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Departed: {shipment.departureDate}
                </span>
              </div>

              {/* Col 4: Neural ML Model Status */}
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-purple-950/20 border border-purple-800/30">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-purple-300 uppercase tracking-wider font-bold">
                    {t('shipment_detail.ml_badge')}
                  </span>
                  <Cpu className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black font-mono text-purple-300">
                    {shipment.predictedRulHours}h
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Predicted RUL
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 leading-tight">
                  Health Index: <strong className="text-emerald-400 font-mono">{shipment.bhi}%</strong>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Real-World Digital Twin Map View for This Shipment */}
        <div className="mt-8 flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">
                Geospatial Asset Twin & Corridor Waypoints
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                LIVE GPS TRACE
              </span>
            </div>
            <span className="text-xs font-mono text-slate-400">
              Tracking: <strong className="text-white">{shipment.id}</strong> ({shipment.waypointName})
            </span>
          </div>

          <DigitalTwinMapDynamic 
            shipments={INITIAL_SHIPMENTS} 
            highlightShipmentId={shipment.id} 
            className="h-[480px] sm:h-[540px]" 
          />
        </div>

        {/* Relocated ControlTower Simulator for Detailed Telemetry & AI Conductor */}
        <div className="mt-8">
          <ControlTower
            shipmentId={shipment.id}
            initialTelemetry={{
              cargo: shipment.cargo,
              temperature: shipment.telemetry.temperature,
              ethanol: shipment.telemetry.ethanol,
              humidity: shipment.telemetry.humidity,
              vibration: shipment.telemetry.vibration,
              cargo_value_usd: shipment.assetValueUsd,
              waypoint: shipment.currentWaypoint,
            }}
          />
        </div>
      </Container>
    </div>
  );
}
