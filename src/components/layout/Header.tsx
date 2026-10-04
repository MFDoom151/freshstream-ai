'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Activity, 
  Menu, 
  X, 
  ArrowRight,
  ShieldCheck,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useI18n } from '@/lib/i18n/context';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeToggle from './ThemeToggle';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { t, locale, setLocale } = useI18n();
  const { data: session, status } = useSession();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: '/dashboard', label: t('nav.dashboard') || 'Dashboard', isLive: true },
    { href: '/dashboard#shipments', label: t('nav.shipments') || 'Shipments' },
    { href: '/dashboard/analytics', label: t('nav.analytics') || 'Analytics' },
    { href: '/dashboard/support', label: t('nav.support') || 'Support' },
  ];

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? 'backdrop-blur-2xl bg-slate-950/85 dark:bg-slate-950/85 light:bg-white/90 border-slate-800/80 shadow-lg'
          : 'backdrop-blur-xl bg-slate-950/70 dark:bg-slate-950/70 light:bg-white/80 border-slate-800/40'
      }`}
    >
      <Container size="lg">
        <div className="flex items-center justify-between h-20">
          {/* Brand Logo & Academic Badge */}
          <div className="flex items-center gap-3">
            <Link 
              href="/" 
              className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-lg p-1"
              aria-label="FreshStream AI Homepage"
            >
              <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-slate-900 border border-slate-700/80 group-hover:border-emerald-500/60 transition-colors">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-bold tracking-tight text-white dark:text-white light:text-slate-900">
                    FreshStream
                  </span>
                  <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                    TWIN-OS
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 tracking-wider font-mono hidden sm:block">
                  Trans-Caspian Bio-Digital Twin
                </span>
              </div>
            </Link>

            {/* Academic & Competition Partnership Badge (Hidden on mobile) */}
            <div className="hidden xl:flex items-center gap-1.5 ml-3 pl-3 border-l border-slate-800 text-[11px] text-slate-400 font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>GWU NVC × Satbayev Univ</span>
            </div>
          </div>

          {/* Desktop Navigation Links (>= 1024px) */}
          <nav 
            className="hidden lg:flex items-center gap-1"
            aria-label="Main Navigation"
          >
            {navLinks.map((link) => {
              const isActive = link.href === '/dashboard'
                ? (pathname === '/dashboard' || pathname.startsWith('/dashboard/shipment'))
                : pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-1.5 rounded-lg text-xs xl:text-sm font-medium transition-all duration-150 flex items-center gap-1.5 ${
                    isActive
                      ? 'text-emerald-400 bg-slate-900 border border-slate-700/80 font-semibold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60 light:text-slate-700 light:hover:text-slate-900 light:hover:bg-slate-100'
                  }`}
                >
                  {link.label}
                  {link.isLive && (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      LIVE
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Cluster: Language Switcher, Theme Toggle, CTA */}
          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <ThemeToggle />

            {/* User Session Info / Sign Out / Sign In (Desktop) */}
            {status === 'authenticated' && session?.user ? (
              <div className="hidden sm:flex items-center gap-2.5 pl-3 border-l border-slate-800">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-semibold text-white max-w-[130px] truncate">
                    {session.user.email}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono font-medium">
                    {session.user.role === 'ADMIN'
                      ? (t('auth.admin_role') || 'Admin')
                      : (t('auth.operator_role') || 'Dispatcher')}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
                  title={t('auth.sign_out') || 'Sign Out'}
                  aria-label={t('auth.sign_out') || 'Sign Out'}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="hidden sm:flex items-center pl-2 border-l border-slate-800">
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  {t('nav.sign_in') || 'Sign In'}
                </Link>
              </div>
            )}

            {/* Launch Dashboard CTA Button (Desktop >= 1024px) */}
            <div className="hidden lg:block">
              <Button
                href="/dashboard"
                variant="primary"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                {t('nav.launch_dashboard') || 'Open Dashboard'}
              </Button>
            </div>

            {/* Mobile Hamburger Menu Button (< 1024px) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800/70 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 cursor-pointer"
              aria-label={mobileMenuOpen ? t('nav.menu_close') : t('nav.menu_open')}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-emerald-400" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Navigation Drawer Overlay (< 1024px) */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Drawer Sheet */}
      <div
        className={`fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-slate-950/95 dark:bg-slate-950/95 light:bg-white/95 backdrop-blur-2xl border-l border-slate-800 p-6 z-50 shadow-2xl flex flex-col justify-between overflow-y-auto transform transition-transform duration-300 ease-in-out lg:hidden ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        <div className="flex flex-col gap-6">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span className="font-bold text-lg text-white dark:text-white light:text-slate-900">FreshStream AI</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 light:text-slate-600 light:hover:text-slate-900 light:hover:bg-slate-100 cursor-pointer"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Vertical Navigation Links */}
          <nav className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const isActive = link.href === '/dashboard'
                ? (pathname === '/dashboard' || pathname.startsWith('/dashboard/shipment'))
                : pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/60 light:text-slate-700 light:hover:text-slate-900 light:hover:bg-slate-100'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.isLive && (
                    <Badge variant="mint" size="sm" dot>
                      LIVE
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Drawer Footer Actions */}
        <div className="pt-6 border-t border-slate-800 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">{t('nav.select_lang')}</span>
            <div className="flex items-center gap-1">
              {(['en', 'ru', 'kz'] as const).map((code) => (
                <button
                  key={code}
                  onClick={() => setLocale(code)}
                  className={`px-2.5 py-1 text-xs rounded-lg uppercase font-mono font-bold transition-colors cursor-pointer ${
                    locale === code
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>

          {/* Mobile User Session Status */}
          {status === 'authenticated' && session?.user ? (
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-xs font-semibold text-white truncate">
                  {session.user.email}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {session.user.role === 'ADMIN' ? (t('auth.admin_role') || 'Admin') : (t('auth.operator_role') || 'Dispatcher')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut({ callbackUrl: '/login' });
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors shrink-0"
                title={t('auth.sign_out') || 'Sign Out'}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2 px-3 text-xs font-semibold text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 bg-emerald-500/10 rounded-xl transition-colors"
            >
              {t('nav.sign_in') || 'Sign In'}
            </Link>
          )}

          <Button
            href="/dashboard"
            variant="primary"
            size="md"
            className="w-full"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            onClick={() => setMobileMenuOpen(false)}
          >
            {t('nav.launch_dashboard') || 'Open Dashboard'}
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
