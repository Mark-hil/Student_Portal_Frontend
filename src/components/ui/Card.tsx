import React from 'react';

export function Card({
  children,
  style = {},
  onClick,
  hoverable = false,
  className = '',
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
  hoverable?: boolean;
  className?: string;
}) {
  const isInteractive = hoverable || Boolean(onClick);
  return (
    <div
      onClick={onClick}
      className={`ui-card ${isInteractive ? 'ui-card--hoverable' : ''} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}
