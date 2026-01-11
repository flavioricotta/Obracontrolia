import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-bold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';
  
  const variants = {
    // Primary usa o Accent (#FF7500) com sombra da mesma cor
    primary: 'bg-accent text-white shadow-md shadow-accent/20 hover:brightness-105 focus:ring-accent',
    // Dark usa o Primary (#0D0D0D)
    dark: 'bg-primary text-white hover:bg-slate-800 focus:ring-slate-900',
    // Secondary usa a borda baseada no cinza da paleta
    secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-slate-200',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-200',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-4 text-base',
  };

  return (
    <button
      className={twMerge(
        clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )
      )}
      {...props}
    >
      {children}
    </button>
  );
};