import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'dark';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', size = 'sm' }) => {
  const variantClasses = {
    primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800',
    secondary: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    info: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800',
    dark: 'bg-slate-900 text-slate-100 dark:bg-slate-100 dark:text-slate-900'
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 rounded-full font-medium',
    md: 'text-sm px-2.5 py-1 rounded-md font-medium'
  };

  return (
    <span className={`inline-flex items-center gap-1 ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {children}
    </span>
  );
};
