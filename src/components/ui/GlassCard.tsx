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
    default: 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700',
    'glow-mint': 'border-emerald-600/30 dark:border-emerald-500/20 hover:border-emerald-500/40',
    'glow-purple': 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600',
    danger: 'border-red-500/40 bg-red-50/50 dark:bg-red-950/20',
    interactive: 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/95 cursor-pointer',
  };

  const hoverClasses = hoverEffect 
    ? 'hover:-translate-y-0.5 hover:shadow-md transition-all duration-200' 
    : 'transition-all duration-150';

  return (
    <div
      className={`relative rounded-xl backdrop-blur-md bg-white/90 dark:bg-slate-900/85 border text-slate-900 dark:text-slate-100 shadow-sm ${variantStyles[variant]} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
