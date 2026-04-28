import React from 'react';

export default function Badge({ variant = 'neutral', dot = false, children, className = '' }) {
  const variants = {
    success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    danger: 'bg-rose-100 text-rose-800 border border-rose-200',
    warning: 'bg-amber-100 text-amber-800 border border-amber-200',
    info: 'bg-sky-100 text-sky-800 border border-sky-200',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
  };

  const dotColors = {
    success: 'bg-emerald-500',
    danger: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-500',
  };

  const classes = `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`;

  return (
    <span className={classes}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}
