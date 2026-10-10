'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, ShieldCheck, Mail, MapPin, ExternalLink, Cpu } from 'lucide-react';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { useI18n } from '@/lib/i18n/context';

export const Footer: React.FC = () => {
  const { t } = useI18n();

  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950/90 dark:bg-slate-950/90 light:bg-slate-50/90 text-slate-400 text-sm transition-colors duration-300">
      <Container size="lg" className="py-14">
        {/* 4-Column Master Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Column 1: Identity & Partnerships */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                <Activity className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white dark:text-white light:text-slate-900 tracking-tight">FreshStream AI</span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {t('footer.brand_desc')}
            </p>

            <div className="flex flex-col gap-2 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{t('footer.cert_iso')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                <ShieldCheck className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{t('footer.cert_iot')}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Platform Routes */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-white dark:text-white light:text-slate-900 uppercase tracking-wider">{t('footer.links_title')}</h4>
            <ul className="flex flex-col gap-2 text-xs">
              <li>
                <Link href="/" className="hover:text-emerald-400 transition-colors">
                  {t('nav.home')}
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span>{t('nav.dashboard')}</span>
                  <Badge variant="mint" size="sm" dot>LIVE</Badge>
                </Link>
              </li>
              <li>
                <Link href="/dashboard#shipments" className="hover:text-emerald-400 transition-colors">
                  {t('nav.shipments')}
                </Link>
              </li>
              <li>
                <Link href="/dashboard/analytics" className="hover:text-emerald-400 transition-colors">
                  {t('nav.analytics')}
                </Link>
              </li>
              <li>
                <Link href="/dashboard/support" className="hover:text-emerald-400 transition-colors">
                  {t('nav.support')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Corridors & Scientific Architecture */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-white dark:text-white light:text-slate-900 uppercase tracking-wider">{t('footer.technology_title')}</h4>
            <ul className="flex flex-col gap-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-purple-400" />
                <span>Modified Arrhenius Kinetics (PIML)</span>
              </li>
              <li className="text-slate-400">Volatile Ethanol Sensing (C₂H₄, 0–100 ppm)</li>
              <li className="text-slate-400">Sub-GHz LoRaWAN 868 MHz Ferry Mesh</li>
              <li className="text-slate-400">Choke-Point: Port Kuryk & Port of Baku</li>
              <li>
                <Link 
                  href="/api/arrhenius" 
                  target="_blank"
                  className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-mono text-[11px] pt-1"
                >
                  <span>REST API: /api/arrhenius</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Locations */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold text-white dark:text-white light:text-slate-900 uppercase tracking-wider">{t('footer.inquiries_title')}</h4>
            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-300 font-medium">Almaty R&D Lab:</p>
                  <p className="text-slate-400">{t('footer.address')}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-300 font-medium">Global Operations:</p>
                  <p className="text-slate-400">Trans-Caspian International Transport Corridor Hub</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <a href={`mailto:${t('footer.email_pilots')}`} className="hover:text-emerald-400 transition-colors">
                  {t('footer.email_pilots')}
                </a>
                <span className="text-slate-600">•</span>
                <a href={`mailto:${t('footer.email_invest')}`} className="hover:text-emerald-400 transition-colors">
                  {t('footer.email_invest')}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Telemetry Status */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 {t('footer.rights')}</p>
          <div className="flex items-center gap-3">
            <Badge variant="mint" size="sm" dot>
              Conductor Agent: Online
            </Badge>
            <span className="font-mono text-[11px] text-slate-400">Mesh: 868 MHz Active</span>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
