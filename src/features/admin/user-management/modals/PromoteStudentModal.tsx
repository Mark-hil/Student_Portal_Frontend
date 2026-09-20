import React, { useState } from 'react';
import { TrendingUp, GraduationCap, Award, Loader2 } from 'lucide-react';
import { C } from '../../../../utils/theme';
import type { User } from '../../../../types';

interface PromoteStudentModalProps {
  target: User;
  onClose: () => void;
  onConfirm: (data: { academic_year: string; notes: string }) => void;
  isPending: boolean;
}

export const PromoteStudentModal: React.FC<PromoteStudentModalProps> = ({
  target,
  onClose,
  onConfirm,
  isPending,
}) => {
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [notes, setNotes] = useState('');
  const isFinalYear = target.class_name === '300';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ academic_year: academicYear, notes });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 520, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, borderBottom: `1px solid ${C.slate1}`, paddingBottom: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#e0e7ff', color: C.indigo, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {isFinalYear ? <GraduationCap size={22} /> : <TrendingUp size={22} />}
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.slate9 }}>
              {isFinalYear ? 'Graduate Final-Year Student' : 'Promote Student'}
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: C.slate5 }}>
              {target.first_name} {target.last_name} ({target.student_id || 'ID: Pending'})
            </p>
          </div>
        </div>

        {isFinalYear ? (
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Award size={20} color="#2563eb" style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.5 }}>
                <strong>Final Year Diploma Graduation:</strong> This student is currently at <strong>Level 300</strong>. Promoting will conclude their diploma program, assign academic status <strong>GRADUATED (Alumnus)</strong>, and record their graduation date.
              </div>
            </div>
          </div>
        ) : (
          <div style={{ background: '#f8fafc', border: `1px solid ${C.slate2}`, borderRadius: 12, padding: 14, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 12, color: C.slate5 }}>Current Level</span>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.slate8 }}>Level {target.class_name || '100'}</div>
              </div>
              <div style={{ fontSize: 18, color: C.indigo }}>➔</div>
              <div>
                <span style={{ fontSize: 12, color: C.slate5 }}>Next Level</span>
                <div style={{ fontSize: 15, fontWeight: 800, color: C.indigo }}>
                  Level {target.class_name === '100' ? '200' : '300'}
                </div>
              </div>
            </div>
          </div>
        )}

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
              Progression Remarks / Resolution (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Passed all Semester 2 prerequisites; approved by Academic Board."
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
              {isFinalYear ? 'Confirm Graduation' : 'Confirm Promotion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
