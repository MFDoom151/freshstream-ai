'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';
import { useI18n } from '@/lib/i18n/context';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import {
  Lock,
  Mail,
  Shield,
  AlertTriangle,
  ArrowRight,
  Activity,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { t } = useI18n();

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const [email, setEmail] = useState('operator@freshstream.ai');
  const [password, setPassword] = useState('Password123!');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect to callbackUrl or dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn('credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl,
      });

      if (res?.error) {
        setErrorMessage(t('auth.invalid_credentials'));
      } else if (res?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setErrorMessage(t('auth.invalid_credentials'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Container size="sm" className="w-full max-w-md">
        {/* Glow ambient background behind the card */}
        <div className="relative">
          <div
            aria-hidden="true"
            className="absolute -inset-1.5 bg-gradient-to-r from-emerald-500/30 via-purple-500/20 to-emerald-500/30 rounded-3xl blur-xl opacity-70 pointer-events-none"
          />

          <GlassCard variant="glow-mint" className="relative p-8 md:p-10 shadow-2xl border-slate-800">
            {/* Header / Brand */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                <Shield className="w-8 h-8 text-emerald-400" />
              </div>

              <div className="flex items-center justify-center gap-2 mb-2">
                <Badge variant="mint" size="sm" dot>
                  TITR CORRIDOR FLEET OPS
                </Badge>
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-white">
                {t('auth.sign_in_title')}
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                {t('auth.sign_in_subtitle')}
              </p>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3 animate-shake">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  {t('auth.email_label')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.email_placeholder')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                  {t('auth.password_label')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.password_placeholder')}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all font-mono"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full py-3 mt-2"
              >
                {isLoading ? t('auth.signing_in') : t('auth.sign_in_button')}
              </Button>
            </form>

            {/* Demo Quick-Fill Section */}
            <div className="mt-8 pt-6 border-t border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                  {t('auth.demo_credentials_title')}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">Password: Password123!</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickFill('operator@freshstream.ai')}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col gap-1 ${
                    email === 'operator@freshstream.ai'
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold">{t('auth.demo_operator_btn')}</span>
                    {email === 'operator@freshstream.ai' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono truncate">
                    operator@freshstream.ai
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickFill('admin@freshstream.ai')}
                  className={`p-2.5 rounded-xl border text-left transition-all text-xs flex flex-col gap-1 ${
                    email === 'admin@freshstream.ai'
                      ? 'bg-purple-500/15 border-purple-500/50 text-purple-300'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold">{t('auth.demo_admin_btn')}</span>
                    {email === 'admin@freshstream.ai' && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono truncate">
                    admin@freshstream.ai
                  </span>
                </button>
              </div>
            </div>

            {/* Footer security badge */}
            <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <Activity className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span>Physics-Informed Biological Protection Active</span>
            </div>
          </GlassCard>
        </div>
      </Container>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
