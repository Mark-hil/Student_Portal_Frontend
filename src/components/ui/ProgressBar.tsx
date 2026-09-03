import React from 'react';

export function ProgressBar({
  value,
  color = 'var(--primary-600)',
  h = 6,
  className = '',
}: {
  value: number;
  color?: string;
  h?: number;
  className?: string;
}) {
  const safeVal = Math.min(Math.max(value, 0), 100);
  return (
    <div className={`ui-progress-track ${className}`.trim()} style={{ height: h }}>
      <div
        className="ui-progress-fill"
        style={{
          width: `${safeVal}%`,
          background: color,
        }}
      />
    </div>
  );
}
