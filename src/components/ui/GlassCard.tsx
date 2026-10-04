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
    default: 'border-slate-800 hover:border-slate-700',
    'glow-mint': 'border-emerald-500/40 hover:border-emerald-500/70',
    'glow-purple': 'border-indigo-500/40 hover:border-indigo-500/70',
    danger: 'border-red-500/50 bg-red-950/20',
    interactive: 'border-slate-800 hover:border-slate-600 hover:bg-slate-900/95 cursor-pointer',
  };

  const hoverClasses = hoverEffect 
    ? 'hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200' 
    : 'transition-all duration-150';

  return (
    <div
      className={`relative rounded-xl backdrop-blur-md bg-slate-900/85 dark:bg-slate-900/85 light:bg-white/95 border text-slate-100 dark:text-slate-100 light:text-slate-900 shadow-sm ${variantStyles[variant]} ${hoverClasses} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
