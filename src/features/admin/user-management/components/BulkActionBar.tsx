import React from 'react';
import { CheckSquare, GraduationCap } from 'lucide-react';
import { C } from '../../../../utils/theme';

interface BulkActionBarProps {
  selectedCount: number;
  onBulkPromote: () => void;
  onClearSelection: () => void;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onBulkPromote,
  onClearSelection,
}) => {
  if (selectedCount === 0) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 18px',
      background: '#eff6ff',
      border: '1px solid #bfdbfe',
      borderRadius: 14,
      flexWrap: 'wrap',
      gap: 12,
      boxShadow: '0 2px 8px rgba(37,99,235,0.08)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: '#dbeafe',
          color: '#1d4ed8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <CheckSquare size={16} />
        </div>
        <div>
          <span style={{ fontSize: 13.5, fontWeight: 800, color: '#1e40af' }}>
            {selectedCount} student{selectedCount > 1 ? 's' : ''} selected
          </span>
          <span style={{ fontSize: 12, color: '#3b82f6', marginLeft: 8 }}>
            Ready for cohort progression
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          type="button"
          onClick={onBulkPromote}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            background: C.indigo,
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(79,70,229,0.25)'
          }}
        >
          <GraduationCap size={15} /> Promote Cohort
        </button>
        <button
          type="button"
          onClick={onClearSelection}
          style={{
            padding: '8px 14px',
            background: '#fff',
            color: C.slate6,
            border: `1px solid ${C.slate3}`,
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
};
