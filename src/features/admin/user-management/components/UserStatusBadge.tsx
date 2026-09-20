import React from 'react';
import { CheckCircle2, AlertTriangle, TrendingDown, UserMinus, GraduationCap } from 'lucide-react';
import type { AcademicStatus } from '../../../../types';

interface UserStatusBadgeProps {
  status?: AcademicStatus | string;
  isArchived?: boolean;
  withdrawalReason?: string | null;
}

const statusStyles: Record<string, { bg: string; color: string; border: string; label: string }> = {
  active: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0', label: 'Active (Good Standing)' },
  probation: { bg: '#fffbeb', color: '#b45309', border: '#fde68a', label: 'Academic Probation' },
  repeating: { bg: '#fef3c7', color: '#b45309', border: '#fcd34d', label: 'Repeating / Retained' },
  withdrawn: { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5', label: 'Withdrawn' },
  suspended: { bg: '#fef2f2', color: '#991b1b', border: '#fecaca', label: 'Suspended' },
  graduated: { bg: '#ede9fe', color: '#6d28d9', border: '#ddd6fe', label: 'Graduated (Alumnus)' },
  deleted: { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1', label: 'Archived / Deleted' },
};

export const UserStatusBadge: React.FC<UserStatusBadgeProps> = ({ status = 'active', isArchived, withdrawalReason }) => {
  const normalized = (status || 'active').toLowerCase();
  const currentStyle = isArchived ? statusStyles.deleted : (statusStyles[normalized] || statusStyles.active);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 6,
        background: currentStyle.bg,
        color: currentStyle.color,
        border: `1px solid ${currentStyle.border}`,
        width: 'fit-content'
      }}>
        {normalized === 'graduated' && <GraduationCap size={12} />}
        {normalized === 'withdrawn' && <UserMinus size={12} />}
        {normalized === 'repeating' && <TrendingDown size={12} />}
        {normalized === 'active' && <CheckCircle2 size={12} />}
        {normalized === 'probation' && <AlertTriangle size={12} />}
        {currentStyle.label}
      </span>
      {withdrawalReason && normalized === 'withdrawn' && (
        <span style={{ fontSize: 10.5, color: '#dc2626', fontStyle: 'italic', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={withdrawalReason}>
          Reason: {withdrawalReason}
        </span>
      )}
    </div>
  );
};
