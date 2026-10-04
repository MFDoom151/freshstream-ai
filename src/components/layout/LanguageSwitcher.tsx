'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/lib/i18n/context';
import { Locale, SUPPORTED_LOCALES } from '@/types/i18n';
import { Globe, ChevronDown, Check } from 'lucide-react';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeOption = SUPPORTED_LOCALES.find((l) => l.code === locale) || SUPPORTED_LOCALES[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('nav.select_lang')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                   bg-slate-900/60 hover:bg-slate-800/80 dark:bg-slate-900/60 dark:hover:bg-slate-800/80
                   light:bg-white light:hover:bg-slate-100 light:text-slate-800
                   text-slate-200 border border-slate-700/60 dark:border-slate-700/60 light:border-slate-300
                   backdrop-blur-md transition-all duration-200 shadow-sm
                   focus:outline-none focus:ring-2 focus:ring-emerald-500/50 cursor-pointer"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-400" />
        <span className="uppercase tracking-wider font-mono">{activeOption.code}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-emerald-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-48 rounded-2xl
                     bg-slate-950/95 dark:bg-slate-950/95 light:bg-white/95
                     border border-slate-800 dark:border-slate-800 light:border-slate-200
                     shadow-[0_10px_30px_rgba(0,0,0,0.5)] backdrop-blur-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
        >
          {SUPPORTED_LOCALES.map((option) => {
            const isSelected = option.code === locale;
            return (
              <button
                key={option.code}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setLocale(option.code as Locale);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/15 text-emerald-400 font-semibold'
                    : 'text-slate-300 dark:text-slate-300 light:text-slate-700 hover:bg-slate-800/60 dark:hover:bg-slate-800/60 light:hover:bg-slate-100 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{option.flag}</span>
                  <span>{option.nativeLabel}</span>
                  <span className="text-[10px] uppercase font-mono text-slate-400">({option.code})</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { LanguageSwitcher };
