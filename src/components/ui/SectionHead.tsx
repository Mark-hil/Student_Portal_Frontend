import React from 'react';

export function SectionHead({
  title,
  sub,
  action,
  className = '',
}: {
  title: string;
  sub?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`ui-section-head ${className}`.trim()}>
      <div>
        <h2 className="ui-section-title">{title}</h2>
        {sub && <p className="ui-section-sub">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
