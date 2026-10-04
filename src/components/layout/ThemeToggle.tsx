'use client';

import React from 'react';
import { useTheme } from '@/lib/theme/context';
import { useI18n } from '@/lib/i18n/context';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={t('nav.theme_toggle')}
      title={t('nav.theme_toggle')}
      className="p-2 rounded-xl border border-slate-700/60 dark:border-slate-700/60 light:border-slate-300
                 bg-slate-900/60 hover:bg-slate-800/80 dark:bg-slate-900/60 dark:hover:bg-slate-800/80
                 light:bg-white light:hover:bg-slate-100
                 text-amber-400 dark:text-amber-400 light:text-slate-700
                 backdrop-blur-md transition-all duration-200 shadow-sm
                 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
    >
      {isDark ? (
        <Sun className="w-4 h-4 transition-transform duration-300 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 transition-transform duration-300 hover:-rotate-12" />
      )}
    </button>
  );
}

export { ThemeToggle };
