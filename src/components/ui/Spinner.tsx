import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const sizeClass = size === 'sm' ? 'ui-spinner-sm' : size === 'lg' ? 'ui-spinner-lg' : '';
  return <div className={`ui-spinner ${sizeClass} ${className}`.trim()} aria-label="Loading" />;
}
