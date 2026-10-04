'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/lib/i18n/context';
import { ShipmentItem } from '@/types/shipment';
import { 
  AlertTriangle, 
  Flame, 
  MapPin, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Cpu, 
  Check 
} from 'lucide-react';

interface AlertsWidgetProps {
  shipments: ShipmentItem[];
}

export const AlertsWidget: React.FC<AlertsWidgetProps> = ({ shipments }) => {
  const { t } = useI18n();

  // Extract initial active alerts from shipments
  const activeAlerts = shipments.filter((s) => !!s.alert);
  const [acknowledgedIds, setAcknowledgedIds] = useState<string[]>([]);

  const handleAcknowledge = (id: string) => {
    setAcknowledgedIds((prev) => [...prev, id]);
  };

  const visibleAlerts = activeAlerts.filter((s) => !acknowledgedIds.includes(s.id));

  return (
    <GlassCard className="p-5 sm:p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-white">
                {t('dashboard.alerts_title')}
              </h3>
              {visibleAlerts.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                  {visibleAlerts.length}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {t('dashboard.alerts_subtitle')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
          <Cpu className="w-3.5 h-3.5 text-purple-400" />
          <span>Arrhenius & ML TinyML Watchdog</span>
        </div>
      </div>

      {/* Alert Feed */}
      {visibleAlerts.length === 0 ? (
        <div className="flex items-center justify-center p-8 text-center rounded-xl bg-emerald-950/10 border border-emerald-500/20">
          <div className="flex flex-col items-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              {t('dashboard.alerts_empty')}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleAlerts.map((shipment) => {
            const alert = shipment.alert!;
            const isCritical = alert.severity === 'CRITICAL';

            return (
              <div
                key={shipment.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCritical
                    ? 'bg-red-950/30 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                    : 'bg-amber-950/20 border-amber-500/30'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left: Metadata & Severity */}
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {isCritical ? (
                        <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
                          <Flame className="w-4 h-4 animate-bounce" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white">
                          {shipment.id}
                        </span>
                        <span className="text-xs text-slate-300">
                          ({shipment.cargoNameEn})
                        </span>
                        <Badge
                          variant={isCritical ? 'danger' : 'warning'}
                          size="sm"
                          dot
                        >
                          {alert.severity}
                        </Badge>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {alert.timestamp}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                        {alert.message}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 text-slate-300">
                          <MapPin className="w-3 h-3 text-emerald-400" />
                          {alert.location}
                        </span>
                        <span>•</span>
                        <span className="font-mono text-cyan-300">
                          Temp: {shipment.telemetry.temperature > 0 ? `+${shipment.telemetry.temperature}` : shipment.telemetry.temperature}°C
                        </span>
                        <span>•</span>
                        <span className={`font-mono ${shipment.telemetry.ethanol > 35 ? 'text-red-400 font-bold' : 'text-emerald-400'}`}>
                          C₂H₄: {shipment.telemetry.ethanol} ppm
                        </span>
                        <span>•</span>
                        <span className="text-purple-300 font-medium">
                          Prescribed: {alert.action}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0">
                    <button
                      type="button"
                      onClick={() => handleAcknowledge(shipment.id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-700/60 transition-colors flex items-center gap-1 cursor-pointer"
                      title={t('dashboard.alert_dismiss')}
                    >
                      <Check className="w-3.5 h-3.5 text-slate-400" />
                      <span>{t('dashboard.alert_dismiss')}</span>
                    </button>

                    <Button
                      href={`/dashboard/shipment/${shipment.id}`}
                      variant={isCritical ? 'primary' : 'glass'}
                      size="sm"
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                    >
                      {t('shipments.btn_inspect')}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </GlassCard>
  );
};
