'use client';

import React from 'react';
import { KineticsOutput } from '@/types/arrhenius';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Zap, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight, DollarSign } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface AIConductorBoxProps {
  kinetics: KineticsOutput;
  onDispatchCommand: () => void;
  disabled?: boolean;
}

export const AIConductorBox: React.FC<AIConductorBoxProps> = ({
  kinetics,
  onDispatchCommand,
  disabled = false,
}) => {
  const { t } = useI18n();
  const isCritical = kinetics.is_ethanol_critical || kinetics.alert_severity === 'CRITICAL';
  const isWarning = kinetics.alert_severity === 'WARNING';

  return (
    <GlassCard
      variant={isCritical ? 'danger' : isWarning ? 'glow-mint' : 'glow-purple'}
      className={`p-6 flex flex-col gap-4 transition-all duration-300 ${
        isCritical ? 'shadow-[0_0_30px_rgba(239,68,68,0.25)] border-red-500/60' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-3">
        <h3 className="font-bold text-white dark:text-white light:text-slate-900 flex items-center gap-2">
          <Zap className={`w-4 h-4 ${isCritical ? 'text-red-400 animate-pulse' : 'text-purple-400'}`} />
          <span>{t('demo.ai_box_title')}</span>
        </h3>
        <Badge
          variant={isCritical ? 'danger' : isWarning ? 'amber' : 'mint'}
          size="sm"
          dot
        >
          {isCritical ? 'CRITICAL ALERT' : isWarning ? 'AUTONOMOUS ACTIVE' : 'AUTONOMOUS NORMAL'}
        </Badge>
      </div>

      {/* Critical 14-Hour Rescue Window Pill */}
      {kinetics.rescue_window_hours && (
        <div className="p-3 rounded-xl bg-red-950/60 dark:bg-red-950/60 light:bg-red-100 border border-red-500/80 text-xs flex items-center justify-between shadow-[0_0_15px_rgba(239,68,68,0.3)] animate-pulse">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 dark:text-red-400 light:text-red-600" />
            <span className="font-bold text-red-200 dark:text-red-200 light:text-red-900 uppercase tracking-wide">
              14-Hour Rescue Window:
            </span>
          </div>
          <span className="font-mono font-black text-red-400 dark:text-red-400 light:text-red-700 text-sm">
            {kinetics.rescue_window_hours.toFixed(1)}h Remaining
          </span>
        </div>
      )}

      {/* Alert Content Box */}
      <div className="p-4 rounded-xl bg-slate-950/80 dark:bg-slate-950/80 light:bg-white/90 border border-slate-800 dark:border-slate-800 light:border-slate-200 text-xs flex flex-col gap-3">
        <div className="flex items-start gap-2">
          {isCritical ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="flex flex-col">
            <span className={`font-bold uppercase text-[11px] tracking-wider ${
              isCritical
                ? 'text-red-400 dark:text-red-400 light:text-red-600'
                : isWarning
                ? 'text-amber-400 dark:text-amber-400 light:text-amber-600'
                : 'text-emerald-400 dark:text-emerald-400 light:text-emerald-600'
            }`}>
              {kinetics.alert_title}
            </span>
            <p className="text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed mt-1 text-[11px]">
              {kinetics.alert_description}
            </p>
          </div>
        </div>

        {/* Prescribed Autonomous Interventions */}
        <div className="pt-2 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 flex flex-col gap-1.5">
          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-400 light:text-slate-500 uppercase tracking-wider font-semibold">
            {t('demo.ai_action_label')}
          </span>
          {kinetics.recommended_actions.map((act, idx) => (
            <div key={idx} className="flex items-start gap-2 text-slate-200 dark:text-slate-200 light:text-slate-800 text-[11px]">
              <span className={`font-bold ${isCritical ? 'text-red-400' : 'text-emerald-400'}`}>•</span>
              <span className="leading-snug">{act}</span>
            </div>
          ))}
        </div>

        {/* Preserved Cargo Asset Value */}
        <div className="pt-2 border-t border-slate-800 dark:border-slate-800 light:border-slate-200 flex justify-between items-center font-mono text-[11px]">
          <span className="text-slate-400 dark:text-slate-400 light:text-slate-600 flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            {t('demo.ai_saved_label')}
          </span>
          <span className="text-emerald-400 dark:text-emerald-400 light:text-emerald-600 font-extrabold text-sm">
            {kinetics.saved_value_usd > 0
              ? `$${kinetics.saved_value_usd.toLocaleString()} USD Saved`
              : '$0 (Nominal Hold)'}
          </span>
        </div>
      </div>

      {/* Action Dispatch Button */}
      <Button
        variant={isCritical ? 'primary' : 'glass'}
        size="sm"
        className="w-full flex items-center justify-center gap-2"
        disabled={disabled}
        onClick={onDispatchCommand}
      >
        <span>{t('demo.ai_btn_dispatch')}</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </GlassCard>
  );
};

export default AIConductorBox;
