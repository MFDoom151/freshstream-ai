'use client';

import React from 'react';
import { CargoType } from '@/types/arrhenius';
import { COMMODITY_PROFILES } from '@/lib/arrhenius';
import { Badge } from '@/components/ui/Badge';
import { Sparkles, Beef, Milk, Apple } from 'lucide-react';
import { useI18n } from '@/lib/i18n/context';

interface CargoSelectorProps {
  selectedCargo: CargoType;
  onSelectCargo: (cargo: CargoType) => void;
  disabled?: boolean;
}

const CARGO_ICONS: Record<CargoType, React.ElementType> = {
  pears: Apple,
  fruits: Apple,
  beef: Beef,
  berries: Sparkles,
  dairy: Milk,
};

export const CargoSelector: React.FC<CargoSelectorProps> = ({
  selectedCargo,
  onSelectCargo,
  disabled = false,
}) => {
  const { t } = useI18n();
  const cargos: CargoType[] = ['pears', 'fruits', 'beef', 'berries', 'dairy'];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-300 dark:text-slate-300 light:text-slate-700 uppercase tracking-wider">
          {t('demo.cargo_select_label')}
        </label>
        <span className="text-[11px] font-mono text-slate-400 dark:text-slate-400 light:text-slate-500">
          Arrhenius Parameters (Ea / A / Tref)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cargos.map((type) => {
          const profile = COMMODITY_PROFILES[type];
          const isSelected = selectedCargo === type;
          const Icon = CARGO_ICONS[type];

          return (
            <button
              key={type}
              type="button"
              disabled={disabled}
              onClick={() => onSelectCargo(type)}
              className={`flex flex-col p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-emerald-400 ${
                isSelected
                  ? 'bg-slate-900/90 dark:bg-slate-900/90 light:bg-emerald-50/80 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.22)] ring-1 ring-emerald-500/50'
                  : 'bg-slate-950/60 dark:bg-slate-950/60 light:bg-white/80 border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 hover:border-slate-700 hover:bg-slate-900/50 light:hover:bg-slate-100/70'
              }`}
            >
              {isSelected && (
                <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
                  <div className="w-full h-full bg-emerald-500 transform rotate-45 translate-x-4 -translate-y-4" />
                </div>
              )}

              <div className="flex items-center gap-2.5 mb-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-emerald-500/20 text-emerald-400 light:bg-emerald-500 light:text-white'
                      : 'bg-slate-800 dark:bg-slate-800 light:bg-slate-100 text-slate-400 dark:text-slate-400 light:text-slate-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-white dark:text-white light:text-slate-900 leading-tight truncate">
                    {profile.name}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-mono truncate">
                    {profile.regionalOrigin}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-2 border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200">
                <Badge variant={isSelected ? 'mint' : 'slate'} size="sm">
                  {profile.baselineDays}d base
                </Badge>
                <Badge variant="purple" size="sm">
                  {(profile.ea / 1000).toFixed(1)} kJ/mol
                </Badge>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CargoSelector;
