'use client';

import React from 'react';

export type GlassCardVariant = 
  | 'default' 
  | 'glow-mint' 
  | 'glow-purple' 
  | 'danger' 
  | 'interactive';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: GlassCardVariant;
  glow?: boolean;
  hoverEffect?: boolean;
  className?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  glow = false,
  hoverEffect = false,
  className = '',
  ...props
}) => {
  const variantStyles: Record<GlassCardVariant, string> = {
    default: 'border-slate-800/80 hover:border-slate-700/80',
    'glow-mint': 'border-emerald-500/30 hover:border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.12)]',
    'glow-purple': 'border-purple-500/30 hover:border-purple-500/60 shadow-[0_0_20px_rgba(139,92,246,0.12)]',
    danger: 'border-red-500/40 bg-red-950/20 shadow-[0_0_25px_rgba(239,68,68,0.18)]',
    interactive: 'border-slate-800/80 hover:border-emerald-500/40 hover:shadow-[0_8px_32px_0_rgba(16,185,129,0.18)] cursor-pointer',
  };

  const hoverClasses = hoverEffect 
    ? 'hover:-translate-y-1 hover:shadow-2xl transition-all duration-300' 
    : 'transition-all duration-200';

  return (
    <div
      className={`relative rounded-2xl backdrop-blur-xl bg-slate-900/70 dark:bg-slate-900/70 light:bg-white/85 border text-slate-100 dark:text-slate-100 light:text-slate-900 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] ${variantStyles[variant]} ${hoverClasses} ${className}`}
      {...props}
    >
      {glow && (
        <div 
          aria-hidden="true" 
          className="absolute -inset-px rounded-2xl bg-gradient-to-r from-emerald-500/20 via-transparent to-purple-500/20 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10" 
        />
      )}
      {children}
    </div>
  );
};

export default GlassCard;
