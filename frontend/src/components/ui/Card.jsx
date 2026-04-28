import React from 'react';

export default function Card({ children, className = '', hover = false, padding = 'md' }) {
  const paddings = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    none: '',
  };

  const baseClasses = 'bg-white rounded-2xl border border-slate-200/80 shadow-[var(--shadow-card)]';
  const hoverClasses = hover ? 'hover:shadow-[var(--shadow-elevated)] hover:-translate-y-0.5 transition-all duration-300' : '';
  
  const classes = `${baseClasses} ${hoverClasses} ${paddings[padding]} ${className}`;

  return (
    <div className={classes}>
      {children}
    </div>
  );
}
