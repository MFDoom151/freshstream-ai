'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'glass' | 'outline' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  href?: string;
  className?: string;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  href,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 cursor-pointer';

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5 font-semibold',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.25)] hover:shadow-[0_0_25px_rgba(16,185,129,0.45)] border border-emerald-400/40',
    secondary: 'bg-purple-600 hover:bg-purple-500 text-white font-medium shadow-[0_0_15px_rgba(139,92,246,0.25)] hover:shadow-[0_0_25px_rgba(139,92,246,0.45)] border border-purple-400/40',
    glass: 'backdrop-blur-md bg-slate-800/70 hover:bg-slate-800/90 text-slate-100 border border-slate-700/80 hover:border-emerald-500/40 shadow-sm',
    outline: 'bg-transparent border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white',
    danger: 'bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.25)]',
  };

  const combinedClasses = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`;

  const content = (
    <>
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={combinedClasses}>
        {content}
      </Link>
    );
  }

  return (
    <button className={combinedClasses} disabled={disabled || isLoading} {...props}>
      {content}
    </button>
  );
};

export default Button;
