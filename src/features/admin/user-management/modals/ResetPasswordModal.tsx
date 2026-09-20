import React, { useState } from 'react';
import { Key, Loader2 } from 'lucide-react';
import { C } from '../../../../utils/theme';
import type { User } from '../../../../types';

interface ResetPasswordModalProps {
  target: User;
  onClose: () => void;
  onConfirm: (password?: string) => void;
  isPending: boolean;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  target,
  onClose,
  onConfirm,
  isPending,
}) => {
  const [customPassword, setCustomPassword] = useState('');

  const handleConfirm = () => {
    onConfirm(customPassword.trim() || undefined);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div style={{ background: '#fff', borderRadius: 18, padding: 26, width: 440, maxWidth: '100%', boxShadow: '0 12px 30px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.indigoL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Key size={18} color={C.indigo} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.slate9 }}>Reset Account Password</h3>
            <div style={{ fontSize: 12, color: C.slate5 }}>{target.email}</div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: C.slate7, lineHeight: 1.5, margin: '0 0 14px' }}>
          You can set an explicit temporary password or leave it blank to automatically reset it to <strong>Student@123</strong>.
        </p>

        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.slate7, marginBottom: 4 }}>
            New Password (Optional)
          </label>
          <input
            type="text"
            value={customPassword}
            onChange={e => setCustomPassword(e.target.value)}
            placeholder="Leave blank for Student@123"
            style={{ width: '100%', padding: '9px 12px', border: `1px solid ${C.slate2}`, borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '8px 16px', background: 'transparent', border: `1px solid ${C.slate2}`, borderRadius: 8, cursor: 'pointer', fontSize: 13, color: C.slate7 }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            style={{ padding: '8px 16px', background: C.indigo, color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
            {isPending ? 'Resetting...' : 'Confirm Reset'}
          </button>
        </div>
      </div>
    </div>
  );
};
