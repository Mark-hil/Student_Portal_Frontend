import React, { useState } from 'react';
import { RotateCcw, Loader2 } from 'lucide-react';
import { C } from '../../../../utils/theme';
import type { User } from '../../../../types';

interface ReinstateStudentModalProps {
  target: User;
  onClose: () => void;
  onConfirm: (data: { target_level: string; notes: string }) => void;
  isPending: boolean;
}

export const ReinstateStudentModal: React.FC<ReinstateStudentModalProps> = ({
  target,
  onClose,
  onConfirm,
  isPending,
}) => {
  const [level, setLevel] = useState(target.class_name || '100');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({ target_level: level, notes });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 500, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, borderBottom: `1px solid ${C.slate1}`, paddingBottom: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#ecfdf5', color: '#047857', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RotateCcw size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.slate9 }}>
              Reinstate Withdrawn Student
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: C.slate5 }}>
              {target.first_name} {target.last_name} ({target.student_id || 'ID: Pending'})
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>
              Resume at Academic Level
            </label>
            <select
              value={level}
              onChange={e => setLevel(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, boxSizing: 'border-box', background: '#fff' }}
            >
              <option value="100">Level 100</option>
              <option value="200">Level 200</option>
              <option value="300">Level 300</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>
              Reinstatement Remarks (Optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Medical clearance approved; resuming clinical studies."
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
              style={{ padding: '9px 20px', background: '#047857', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              Reinstate Student
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
