'use client';

import React from 'react';

export type BadgeVariant = 'mint' | 'purple' | 'amber' | 'warning' | 'danger' | 'slate';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'mint',
  size = 'md',
  dot = false,
  children,
  className = '',
  ...props
}) => {
  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-[11px] px-2 py-0.5 font-medium tracking-wide',
    md: 'text-xs px-2.5 py-1 font-semibold tracking-wide',
  };

  const variantStyles: Record<BadgeVariant, string> = {
    mint: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_10px_rgba(139,92,246,0.15)]',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    danger: 'bg-red-500/15 text-red-400 border-red-500/30 animate-pulse',
    slate: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
  };

  const dotColor: Record<BadgeVariant, string> = {
    mint: 'bg-emerald-400',
    purple: 'bg-purple-400',
    amber: 'bg-amber-400',
    warning: 'bg-amber-400',
    danger: 'bg-red-400',
    slate: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColor[variant]}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${dotColor[variant]}`} />
        </span>
      )}
      {children}
    </span>
  );
};

export default Badge;
