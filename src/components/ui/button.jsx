import React from 'react'

export function Button({ children, variant = 'default', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 transition-colors focus-visible:outline-none disabled:opacity-50 border';
  const variants = {
    default: 'bg-primary text-primary-foreground hover:opacity-90',
    outline: 'bg-transparent',
    destructive: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'bg-transparent hover:bg-accent',
  };
  const cls = [base, variants[variant] || variants.default, className].join(' ');
  return (
    <button className={cls} {...props}>{children}</button>
  );
} 