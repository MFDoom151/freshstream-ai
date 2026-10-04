'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/lib/i18n/context';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  PhoneCall, 
  Clock, 
  LifeBuoy, 
  ArrowLeft 
} from 'lucide-react';

export default function SupportPage() {
  const { t } = useI18n();
  const [inquiryType, setInquiryType] = useState<'pilot' | 'investor' | 'academic'>('pilot');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <div className="flex flex-col gap-10 py-8 sm:py-12">
      <Container size="lg">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-400 pb-4 border-b border-slate-800">
          <Link href="/dashboard" className="hover:text-emerald-400 transition-colors font-medium">
            {t('shipment_detail.breadcrumb_dash')}
          </Link>
          <span>/</span>
          <span className="text-white font-medium">{t('nav.support')}</span>
        </div>

        {/* Title Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-4 mt-6">
          <Badge variant="mint" size="md" dot>
            {t('support.badge')}
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            {t('support.title')}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            {t('support.subtitle')}
          </p>
        </div>

        {/* Emergency Alert Banner */}
        <div className="mt-8 p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {t('support.emergency_title')}
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed max-w-2xl mt-0.5">
                {t('support.emergency_desc')}
              </p>
            </div>
          </div>
          <Button
            href="/dashboard#shipments"
            variant="glass"
            size="sm"
            className="shrink-0"
          >
            {t('shipments.filter_critical')}
          </Button>
        </div>

        {/* Main 2-Column Form & Campus Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
          {/* Left: Operations Form (7 cols) */}
          <div className="lg:col-span-7">
            <GlassCard className="p-6 sm:p-8">
              {/* Inquiry Type Tabs */}
              <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-slate-950/80 border border-slate-800 mb-6 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setInquiryType('pilot')}
                  className={`py-2 rounded-lg transition-colors cursor-pointer ${
                    inquiryType === 'pilot'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('contact.tab_pilot')}
                </button>
                <button
                  type="button"
                  onClick={() => setInquiryType('investor')}
                  className={`py-2 rounded-lg transition-colors cursor-pointer ${
                    inquiryType === 'investor'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('contact.tab_investor')}
                </button>
                <button
                  type="button"
                  onClick={() => setInquiryType('academic')}
                  className={`py-2 rounded-lg transition-colors cursor-pointer ${
                    inquiryType === 'academic'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t('contact.tab_academic')}
                </button>
              </div>

              {submitted ? (
                <div className="flex flex-col items-center justify-center text-center p-8 gap-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                  <CheckCircle2 className="w-12 h-12 text-emerald-400 animate-bounce" />
                  <h3 className="text-xl font-bold text-white">
                    {t('support.ticket_success_title')}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-300 max-w-md">
                    {t('support.ticket_success_desc')}
                  </p>
                  <Button variant="glass" size="sm" onClick={() => setSubmitted(false)}>
                    {t('contact.btn_reset')}
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        {t('contact.fn_name')}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t('contact.placeholder_name')}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        {t('contact.fn_email')}
                      </label>
                      <input
                        type="email"
                        required
                        placeholder={t('contact.placeholder_email')}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        {t('contact.fn_company')}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t('contact.placeholder_company')}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-300">
                        {t('contact.fn_fleet')}
                      </label>
                      <select className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400">
                        <option>{t('contact.opt_fleet_1')}</option>
                        <option>{t('contact.opt_fleet_2')}</option>
                        <option>{t('contact.opt_fleet_3')}</option>
                        <option>{t('contact.opt_fleet_4')}</option>
                        <option>{t('contact.opt_fleet_na')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      {t('contact.fn_corridor')}
                    </label>
                    <select className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400">
                      <option>{t('contact.opt_corridor_middle')}</option>
                      <option>{t('contact.opt_corridor_china')}</option>
                      <option>{t('contact.opt_corridor_eu')}</option>
                      <option>{t('contact.opt_corridor_domestic')}</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      {t('contact.fn_message')}
                    </label>
                    <textarea
                      required
                      rows={4}
                      placeholder={t('contact.placeholder_message')}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={submitting}
                    rightIcon={<Send className="w-4 h-4" />}
                    className="mt-2"
                  >
                    {submitting ? t('contact.btn_submitting') : t('contact.btn_submit')}
                  </Button>
                </form>
              )}
            </GlassCard>
          </div>

          {/* Right: Operational Details & Campus Credentials (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <GlassCard variant="glow-purple" className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>Academic & Logistics Partnership</span>
              </div>
              <div className="flex flex-col gap-3 text-xs text-slate-300">
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="font-bold text-white block mb-1">
                    {t('contact.info_hq_title')}
                  </span>
                  <p className="text-slate-400 leading-relaxed">
                    {t('contact.info_hq_address')}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="font-bold text-white block mb-1">
                    {t('contact.info_us_title')}
                  </span>
                  <p className="text-slate-400 leading-relaxed">
                    {t('contact.info_us_address')}
                  </p>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 flex flex-col gap-3 text-xs">
              <span className="font-semibold text-white uppercase tracking-wider">
                {t('contact.info_contacts_title')}
              </span>
              <div className="flex flex-col gap-2 text-slate-300 font-mono">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span>{t('footer.email_pilots')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-purple-400" />
                  <span>{t('footer.email_invest')}</span>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </Container>
    </div>
  );
}
