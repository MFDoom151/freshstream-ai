'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { Locale, TranslationDictionary } from '@/types/i18n';
import { translations } from './translations';

export interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (keyPath: string, params?: Record<string, string | number>) => string;
  locales: Locale[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'freshstream_lang';
const DEFAULT_LOCALE: Locale = 'en';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored && (stored === 'en' || stored === 'ru' || stored === 'kz')) {
        setLocaleState(stored);
      }
    } catch {
      // Fallback silently if localStorage is blocked
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
      document.cookie = `${STORAGE_KEY}=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // ignore
    }
  };

  /**
   * Helper to resolve nested keys like "hero.headline" or "demo.bhi_title"
   */
  const t = useMemo(() => {
    return (keyPath: string, params?: Record<string, string | number>): string => {
      const dict = translations[locale] || translations[DEFAULT_LOCALE];
      const keys = keyPath.split('.');

      let current: unknown = dict;
      for (const k of keys) {
        if (current && typeof current === 'object' && k in (current as Record<string, unknown>)) {
          current = (current as Record<string, unknown>)[k];
        } else {
          // Fallback to English dictionary if key missing in target language
          let fallback: unknown = translations[DEFAULT_LOCALE];
          for (const fbKey of keys) {
            if (fallback && typeof fallback === 'object' && fbKey in (fallback as Record<string, unknown>)) {
              fallback = (fallback as Record<string, unknown>)[fbKey];
            } else {
              fallback = undefined;
              break;
            }
          }
          current = fallback !== undefined ? fallback : keyPath;
          break;
        }
      }

      let result = typeof current === 'string' ? current : keyPath;

      if (params) {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          result = result.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
        });
      }

      return result;
    };
  }, [locale]);

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        locales: ['en', 'ru', 'kz'],
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export type { Locale };
