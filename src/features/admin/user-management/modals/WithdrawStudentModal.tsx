import React, { useState } from 'react';
import { UserMinus, ShieldAlert, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { C } from '../../../../utils/theme';
import type { User } from '../../../../types';

interface WithdrawStudentModalProps {
  target: User;
  onClose: () => void;
  onConfirm: (data: { reason: string; category: string }) => void;
  isPending: boolean;
}

export const WithdrawStudentModal: React.FC<WithdrawStudentModalProps> = ({
  target,
  onClose,
  onConfirm,
  isPending,
}) => {
  const [category, setCategory] = useState('PERSONAL');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please specify a reason for student withdrawal.');
      return;
    }
    onConfirm({ reason, category });
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 110, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: 540, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, borderBottom: `1px solid ${C.slate1}`, paddingBottom: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: '#fee2e2', color: '#b91c1c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UserMinus size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.slate9 }}>
              Formal Student Withdrawal
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: C.slate5 }}>
              {target.first_name} {target.last_name} ({target.student_id || 'ID: Pending'})
            </p>
          </div>
        </div>

        <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 12, padding: 14, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <ShieldAlert size={20} color="#be123c" style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12.5, color: '#9f1239', lineHeight: 1.5 }}>
              <strong>Grade & Enrollment Safeguards:</strong> In-progress course registrations will be gracefully marked as <strong>DROPPED</strong> with grade <strong>"W"</strong> so the student's cumulative GPA is not penalized. Historic completed courses and financial records remain permanently preserved.
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>
              Withdrawal Category
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', border: `1px solid ${C.slate2}`, borderRadius: 10, fontSize: 14, boxSizing: 'border-box', background: '#fff' }}
            >
              <option value="PERSONAL">Personal / Family Reasons</option>
              <option value="MEDICAL">Medical Condition / Health</option>
              <option value="FINANCIAL">Financial Constraints</option>
              <option value="ACADEMIC">Academic Difficulties / Transfer</option>
              <option value="DISCIPLINARY">Disciplinary Dismissal</option>
              <option value="OTHER">Other / Institutional Decision</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.slate7, marginBottom: 6 }}>
              Withdrawal Reason / Official Documentation <span style={{ color: C.rose }}>*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Provide explicit context or letter reference regarding this withdrawal..."
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
              style={{ padding: '9px 20px', background: '#be123c', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {isPending && <Loader2 size={16} className="animate-spin" />}
              Confirm Withdrawal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
