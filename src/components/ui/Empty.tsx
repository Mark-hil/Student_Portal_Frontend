import React from 'react';

export function Empty({
  icon: Icon,
  title,
  sub,
  className = '',
}: {
  icon: any;
  title: string;
  sub: string;
  className?: string;
}) {
  return (
    <div className={`ui-empty-state ${className}`.trim()}>
      <Icon size={40} className="ui-empty-icon" />
      <div className="ui-empty-title">{title}</div>
      <div className="ui-empty-sub">{sub}</div>
    </div>
  );
}
