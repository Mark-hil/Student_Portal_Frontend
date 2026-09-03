import React from 'react';
import { C } from '../../utils/theme';

export function Badge({
  label,
  color = C.slate1,
  text = C.slate6,
  dot = false,
  className = '',
}: {
  label: string;
  color?: string;
  text?: string;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`ui-badge ${className}`.trim()}
      style={{
        background: color,
        color: text,
      }}
    >
      {dot && (
        <span
          className="ui-badge-dot"
          style={{
            background: text,
          }}
        />
      )}
      {label}
    </span>
  );
}
