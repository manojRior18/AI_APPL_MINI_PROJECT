import React from 'react';

export default function Skeleton({ width = '100%', height = '1rem', rounded = 'md', className = '' }) {
  const roundings = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div 
      className={`skeleton ${roundings[rounded]} ${className}`} 
      style={{ width, height }}
    />
  );
}
