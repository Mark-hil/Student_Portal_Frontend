import React, { useState } from 'react';
import { TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { C } from '../../../../utils/theme';
import type { User } from '../../../../types';

interface DemoteStudentModalProps {
  target: User;
  onClose: () => void;
  onConfirm: (data: { target_level: string; reason: string }) => void;
  isPending: boolean;
}

export const DemoteStudentModal: React.FC<DemoteStudentModalProps> = ({
  target,
  onClose,
  onConfirm,
  isPending,
}) => {
  const [targetLevel, setTargetLevel] = useState(target.class_name || '100');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('A mandatory retention/demotion reason must be provided.');
      return;
    }
    onConfirm({ target_level: targetLevel, reason });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 520, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, borderBottom: `1px solid ${C.slate1}`, paddingBottom: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fef3c7', color: '#b45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingDown size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.slate9 }}>
              Demote or Retain Student
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: C.slate5 }}>
              {target.first_name} {target.last_name} ({target.student_id || 'ID: Pending'})
            </p>
          </div>
        </div>

        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <AlertTriangle size={18} color="#b45309" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12.5, color: '#92400e', lineHeight: 1.5 }}>
              This action marks the student as <strong>REPEATING</strong>. An official audit log will record the retention/demotion reason.
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>
              Target Academic Level
            </label>
            <select
              value={targetLevel}
              onChange={e => setTargetLevel(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, boxSizing: 'border-box', background: '#fff' }}
            >
              <option value={target.class_name || '100'}>Repeat Current Level ({target.class_name || '100'})</option>
              {target.class_name === '300' && <option value="200">Demote to Level 200</option>}
              {target.class_name === '200' && <option value="100">Demote to Level 100</option>}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>
              Mandatory Reason / Academic Board Decision <span style={{ color: C.rose }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Failed multiple clinical and core nursing courses (GPA < 1.5); retained to repeat coursework."
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
              style={{ padding: '9px 20px', background: '#b45309', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              Confirm Demotion / Retention
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
