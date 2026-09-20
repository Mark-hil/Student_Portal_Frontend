import React, { useState } from 'react';
import { GraduationCap, Loader2 } from 'lucide-react';
import { C } from '../../../../utils/theme';

interface BulkPromoteModalProps {
  selectedCount: number;
  onClose: () => void;
  onConfirm: (data: { academic_year: string; notes: string }) => void;
  isPending: boolean;
}

export const BulkPromoteModal: React.FC<BulkPromoteModalProps> = ({
  selectedCount,
  onClose,
  onConfirm,
  isPending,
}) => {
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ academic_year: academicYear, notes });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 540, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, borderBottom: `1px solid ${C.slate1}`, paddingBottom: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#e0e7ff', color: C.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.slate9 }}>
              Bulk Cohort Promotion
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: C.slate5 }}>
              Advancing {selectedCount} selected student(s) to their next academic level
            </p>
          </div>
        </div>

        <div style={{ background: '#f8fafc', border: `1px solid ${C.slate2}`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: C.slate7, lineHeight: 1.5 }}>
            Each selected student will be transitioned to their subsequent academic level (e.g. 100 ➔ 200, 200 ➔ 300, and final-year 300 ➔ GRADUATED). An immutable audit log entry will be recorded for every student.
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>
              Academic Year
            </label>
            <input
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
              placeholder="e.g. 2025/2026"
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>
              Batch Promotion Remarks (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. End-of-year annual cohort promotion approved by Academic Board."
              rows={3}
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 13.5, fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 12, borderTop: `1px solid ${C.slate1}`, paddingTop: 14 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '9px 18px', background: '#f1f5f9', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 600, color: C.slate6, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              style={{ padding: '9px 20px', background: C.indigo, color: '#fff', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              Promote {selectedCount} Students
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
